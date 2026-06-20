import { useState } from 'preact/hooks';
import { AdminLayout } from '../../layouts/admin-layout';
import { ScannerCamera, StatusBadge, Button, showToast } from '../../components/ui';
import { attendanceService } from '../../services';

const mockStudents = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  name: i % 2 === 0 ? `เด็กชาย${['สมชาย','วิชัย','กรกฎ','ณัฐวุฒิ','ภาณุ','พิชัย','นเรศ','ธนากร','กิตติ','บุญมี'][i/2]}` : `เด็กหญิง${['สมศรี','นภา','มณี','สุพัตรา','พิมพ์ใจ','วราภรณ์','กัญจนา','อรัญญา','นฤมล','รุ่งนภา'][(i-1)/2]}`,
  status: null,
}));

export function AttendancePage({ path }) {
  const [mode, setMode] = useState('scan'); // 'scan' | 'manual'
  const [recentScans, setRecentScans] = useState([]);
  const [students, setStudents] = useState(mockStudents);

  const handleScan = async (qrData) => {
    const existing = recentScans.find((s) => s.qrData === qrData);
    if (existing) {
      showToast('นักเรียนนี้เช็คชื่อไปแล้ว', 'error');
      return;
    }

    try {
      await attendanceService.scanAttendance(qrData);
      const entry = { qrData, name: `นักเรียน #${qrData}`, time: new Date().toLocaleTimeString('th-TH'), status: 'present' };
      setRecentScans((prev) => [entry, ...prev]);
      showToast(`เช็คชื่อ ${entry.name} สำเร็จ`, 'success');
    } catch {
      showToast('สแกนไม่สำเร็จ กรุณาลองใหม่', 'error');
    }
  };

  const handleScanError = () => {
    showToast('ไม่สามารถเปิดกล้องได้ กรุณาพิมพ์รหัสแทน', 'warning');
  };

  const handleManualStatus = async (studentId, status) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, status: s.status === status ? null : status } : s))
    );

    try {
      await attendanceService.submitManualAttendance({ studentId, status });
      showToast('บันทึกสถานะเรียบร้อย', 'success');
    } catch {
      showToast('บันทึกไม่สำเร็จ', 'error');
    }
  };

  const statusOptions = [
    { value: 'present', label: 'มา', activeClass: 'bg-emerald-500 text-white' },
    { value: 'late', label: 'สาย', activeClass: 'bg-amber-500 text-white' },
    { value: 'leave', label: 'ลา', activeClass: 'bg-slate-500 text-white' },
    { value: 'absent', label: 'ขาด', activeClass: 'bg-red-500 text-white' },
  ];

  return (
    <AdminLayout path={path}>
      <div class="mb-8">
        <h2 class="text-2xl font-bold text-tiwhub-heading dark:text-white">เช็คชื่อ</h2>
        <p class="text-sm text-tiwhub-muted dark:text-tiwhub-muted/70 mt-1">บันทึกการเข้าเรียนของนักเรียน</p>
      </div>

      {/* Mode Switcher */}
      <div class="inline-flex rounded-sm border border-slate-300 dark:border-slate-600 overflow-hidden mb-6">
        <button
          type="button"
          onClick={() => setMode('scan')}
          class={`px-5 py-2.5 text-sm font-medium transition-colors ${
            mode === 'scan'
              ? 'bg-amber-500 text-white'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
          }`}
        >
          สแกน QR Code
        </button>
        <button
          type="button"
          onClick={() => setMode('manual')}
          class={`px-5 py-2.5 text-sm font-medium transition-colors ${
            mode === 'manual'
              ? 'bg-amber-500 text-white'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
          }`}
        >
          เช็คชื่อด้วยมือ
        </button>
      </div>

      {mode === 'scan' ? (
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Viewfinder */}
          <div class="lg:col-span-2">
            <ScannerCamera onScan={handleScan} onError={handleScanError} />
          </div>

          {/* Recent Scans Log */}
          <div class="bg-white dark:bg-slate-800 rounded-sm border border-slate-300 dark:border-slate-700 p-4 max-h-[600px] overflow-y-auto">
            <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3 sticky top-0 bg-white dark:bg-slate-800 pb-2">
              สแกนล่าสุด ({recentScans.length})
            </h3>
            {recentScans.length === 0 ? (
              <p class="text-sm text-slate-400 text-center py-8">ยังไม่มีการสแกน</p>
            ) : (
              <div class="space-y-2">
                {recentScans.map((scan, i) => (
                  <div
                    key={i}
                    class={`flex items-center justify-between p-2.5 rounded-sm ${
                      scan.status === 'present' ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-red-50 dark:bg-red-900/20'
                    }`}
                  >
                    <div class="min-w-0">
                      <p class="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                        {scan.name}
                      </p>
                      <p class="text-xs text-slate-500">{scan.time}</p>
                    </div>
                    <StatusBadge status={scan.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Manual Mode */
        <div class="bg-white dark:bg-slate-800 rounded-sm border border-slate-300 dark:border-slate-700 overflow-hidden">
          <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <p class="text-sm text-slate-600 dark:text-slate-300">
              ทั้งหมด {students.length} คน &middot; 
              มา {students.filter((s) => s.status === 'present').length} &middot;
              สาย {students.filter((s) => s.status === 'late').length} &middot;
              ลา {students.filter((s) => s.status === 'leave').length} &middot;
              ขาด {students.filter((s) => s.status === 'absent').length}
            </p>
          </div>
          <div class="divide-y divide-slate-200 dark:divide-slate-700">
            {students.map((student) => (
              <div key={student.id} class="flex items-center justify-between px-6 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <div class="flex items-center gap-3 min-w-0">
                  <span class="text-sm font-medium text-slate-900 dark:text-white">
                    {student.name}
                  </span>
                  {student.status && <StatusBadge status={student.status} />}
                </div>
                <div class="inline-flex rounded-sm border border-slate-300 dark:border-slate-600 overflow-hidden shrink-0">
                  {statusOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleManualStatus(student.id, opt.value)}
                      class={`px-3 py-1.5 text-xs font-medium transition-colors ${
                        student.status === opt.value
                          ? opt.activeClass
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
