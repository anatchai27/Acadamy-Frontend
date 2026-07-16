import { useState, useEffect } from 'preact/hooks';
import { AdminLayout } from '../../layouts/admin-layout';
import { ScannerCamera, StatusBadge, Button, showToast } from '../../components/ui';
import { attendanceService } from '../../services';
import { useAbortController } from '../../hooks';

export function AttendancePage({ path }) {
  const [mode, setMode] = useState('scan');
  const [recentScans, setRecentScans] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState('');
  const getSignal = useAbortController();

  useEffect(() => {
    attendanceService.getDailyAttendance({}, { signal: getSignal() })
      .then((res) => {
        const data = res.data?.data || res.data || {};
        setStudents(data.attendances || []);
        if (data.sessionInfo?.id) {
          setSessionId(String(data.sessionInfo.id));
        }
      })
      .catch(() => {
        showToast('ไม่สามารถโหลดข้อมูลการเช็คชื่อได้', 'error');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleScan = async (qrData) => {
    const existing = recentScans.find((s) => s.qrData === qrData);
    if (existing) {
      showToast('นักเรียนนี้เช็คชื่อไปแล้ว', 'error');
      return;
    }

    if (!sessionId) {
      showToast('ไม่พบข้อมูลคลาสเรียน กรุณาลองใหม่', 'error');
      return;
    }

    try {
      const res = await attendanceService.scanAttendance({ qrToken: qrData, sessionId: Number(sessionId) });
      const scanResult = res.data?.data || {};
      const entry = {
        qrData,
        name: scanResult.studentName || `นักเรียน #${qrData}`,
        time: new Date().toLocaleTimeString('th-TH'),
        status: scanResult.status || 'present',
      };
      setRecentScans((prev) => [entry, ...prev]);
      showToast(`เช็คชื่อ ${entry.name} สำเร็จ`, 'success');
    } catch (err) {
      const msg = err?.data?.message || err?.data?.error || 'สแกนไม่สำเร็จ กรุณาลองใหม่';
      showToast(msg, 'error');
    }
  };

  const handleScanError = () => {
    showToast('ไม่สามารถเปิดกล้องได้ กรุณาพิมพ์รหัสแทน', 'warning');
  };

  const handleManualStatus = async (studentId, status) => {
    if (!sessionId) {
      showToast('ไม่พบข้อมูลคลาสเรียน', 'error');
      return;
    }

    setStudents((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, status: s.status === status ? null : status } : s))
    );

    try {
      await attendanceService.submitManualAttendance({ sessionId: Number(sessionId), studentId, status });
      showToast('บันทึกสถานะเรียบร้อย', 'success');
    } catch (err) {
      const msg = err?.data?.message || err?.data?.error || 'บันทึกไม่สำเร็จ';
      showToast(msg, 'error');
      setStudents((prev) =>
        prev.map((s) => (s.studentId === studentId ? { ...s, status: s.status === status ? null : status } : s))
      );
    }
  };

  const statusOptions = [
    { value: 'present', label: 'มา', activeClass: 'bg-oasis-success text-white shadow-sm' },
    { value: 'late', label: 'สาย', activeClass: 'bg-oasis-warning text-white shadow-sm' },
    { value: 'leave', label: 'ลา', activeClass: 'bg-zinc-500 text-white shadow-sm' },
    { value: 'absent', label: 'ขาด', activeClass: 'bg-oasis-danger text-white shadow-sm' },
  ];

  if (loading) {
    return (
      <AdminLayout path={path}>
        <div class="flex items-center justify-center py-20">
          <span class="text-zinc-400">กำลังโหลดข้อมูล...</span>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout path={path}>
      <div class="mb-8">
        <h2 class="text-2xl font-semibold text-zinc-900 tracking-tight">เช็คชื่อ</h2>
        <p class="text-sm text-zinc-500 mt-1">บันทึกการเข้าเรียนของนักเรียน</p>
      </div>

      <div class="inline-flex rounded-xl bg-zinc-100 p-1 mb-6">
        <button
          type="button"
          onClick={() => setMode('scan')}
          class={`px-5 py-2 text-sm font-medium rounded-lg transition-all ${
            mode === 'scan'
              ? 'bg-white text-zinc-900 shadow-sm'
              : 'text-zinc-500 hover:text-zinc-700'
          }`}
        >
          สแกน QR Code
        </button>
        <button
          type="button"
          onClick={() => setMode('manual')}
          class={`px-5 py-2 text-sm font-medium rounded-lg transition-all ${
            mode === 'manual'
              ? 'bg-white text-zinc-900 shadow-sm'
              : 'text-zinc-500 hover:text-zinc-700'
          }`}
        >
          เช็คชื่อด้วยมือ
        </button>
      </div>

      {mode === 'scan' ? (
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2">
            <ScannerCamera onScan={handleScan} onError={handleScanError} />
          </div>

          <div class="bg-white rounded-2xl border border-zinc-200/80 p-4 max-h-[600px] overflow-y-auto shadow-sm">
            <h3 class="text-sm font-semibold text-zinc-700 mb-3 sticky top-0 bg-white pb-2">
              สแกนล่าสุด ({recentScans.length})
            </h3>
            {recentScans.length === 0 ? (
              <p class="text-sm text-zinc-400 text-center py-8">ยังไม่มีการสแกน</p>
            ) : (
              <div class="space-y-2">
                {recentScans.map((scan) => (
                  <div
                    key={`${scan.qrData}_${scan.time}`}
                    class={`flex items-center justify-between p-2.5 rounded-xl ${
                      scan.status === 'present' ? 'bg-oasis-success-light/50' : 'bg-oasis-danger-light/50'
                    }`}
                  >
                    <div class="min-w-0">
                      <p class="text-sm font-medium text-zinc-800 truncate">
                        {scan.name}
                      </p>
                      <p class="text-xs text-zinc-500">{scan.time}</p>
                    </div>
                    <StatusBadge status={scan.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div class="bg-white rounded-2xl border border-zinc-200/80 overflow-hidden shadow-sm">
          <div class="px-6 py-4 border-b border-zinc-100">
            <p class="text-sm text-zinc-600">
              ทั้งหมด {students.length} คน &middot; 
              มา {students.filter((s) => s.status === 'present').length} &middot;
              สาย {students.filter((s) => s.status === 'late').length} &middot;
              ลา {students.filter((s) => s.status === 'leave').length} &middot;
              ขาด {students.filter((s) => s.status === 'absent').length}
            </p>
          </div>
          <div class="divide-y divide-zinc-100">
            {students.length === 0 ? (
              <p class="text-sm text-zinc-400 text-center py-8">ยังไม่มีข้อมูลการเข้าเรียนวันนี้</p>
            ) : (
              students.map((student) => (
                <div key={student.studentId} class="flex items-center justify-between px-6 py-3 hover:bg-zinc-50 transition-colors">
                  <div class="flex items-center gap-3 min-w-0">
                    <span class="text-sm font-medium text-zinc-900">
                      {student.fullName || '-'}
                    </span>
                    {student.status && <StatusBadge status={student.status} />}
                  </div>
                  <div class="inline-flex rounded-xl bg-zinc-100 p-0.5 shrink-0">
                    {statusOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleManualStatus(student.studentId, opt.value)}
                        class={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                          student.status === opt.value
                            ? opt.activeClass
                            : 'text-zinc-500 hover:text-zinc-700'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
