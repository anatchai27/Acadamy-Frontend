import { useState, useEffect } from 'preact/hooks';
import { AdminLayout } from '../../layouts/admin-layout';
import { ScannerCamera, StatusBadge, showToast, BentoGrid } from '../../components/ui';
import { attendanceService } from '../../services';
import { useAbortController } from '../../hooks';
import { useDesignTheme } from '../../hooks/useDesignTheme';

export function AttendancePage({ path }) {
  const [mode, setMode] = useState('scan');
  const [scannerMode, setScannerMode] = useState('check-in');
  const [pendingScan, setPendingScan] = useState(null);
  const [offline, setOffline] = useState(typeof navigator !== 'undefined' && !navigator.onLine);
  const [recentScans, setRecentScans] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState('');
  const [pickupStudent, setPickupStudent] = useState(null);
  const [pickupOptions, setPickupOptions] = useState([]);
  const [pickupLoading, setPickupLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [scanSubmitting, setScanSubmitting] = useState(false);
  const [manualLoadingId, setManualLoadingId] = useState(null);
  const getSignal = useAbortController();
  const { designTheme } = useDesignTheme();
  const isNeo = designTheme === 'neobrutalism';

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

  useEffect(() => {
    const handleOnline = () => {
      setOffline(false);
      attendanceService.syncPendingAttendance().catch(() => {});
    };
    const handleOffline = () => setOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleScan = (qrData) => {
    if (scanSubmitting) return;
    if (!sessionId) {
      showToast('กรุณาเลือก session ก่อนสแกน', 'error');
      return;
    }
    setPendingScan({ qrToken: qrData, sessionId: Number(sessionId) });
  };

  const confirmScan = async () => {
    if (!pendingScan || scanSubmitting) return;
    const qrData = pendingScan.qrToken;
    setScanSubmitting(true);
    setPendingScan(null);
    try {
      const response = await attendanceService.scanAttendance(pendingScan);
      const queued = response.offlineQueued;
      const scanData = response.data?.data || {};
      setRecentScans((prev) => [{
        qrData,
        name: scanData.studentName || qrData,
        status: queued ? 'pending' : scanData.status || 'present',
        sessionsRemaining: scanData.sessionsRemaining,
        time: new Date().toLocaleTimeString('th-TH'),
      }, ...prev]);
      showToast(queued ? 'บันทึกไว้ในคิวออฟไลน์แล้ว จะซิงค์เมื่อออนไลน์' : 'เช็คชื่อสำเร็จ', queued ? 'warning' : 'success');
    } catch (err) {
      const code = err?.data?.errorCode || err?.data?.ErrorCode;
      const messages = {
        DUPLICATE_SCAN: 'นักเรียนเช็คชื่อแล้ว',
        INVALID_QR: 'QR ไม่ถูกต้องหรือหมดอายุ',
        NO_QUOTA: 'โควต้าไม่เพียงพอ',
        SESSION_NOT_FOUND: 'ไม่พบ session นี้',
        FORBIDDEN: 'คุณไม่มีสิทธิ์ทำรายการนี้',
        ALREADY_CHECKED_OUT: 'นักเรียนบันทึกรับกลับแล้ว',
      };
      showToast(messages[code] || err?.data?.message || 'สแกนไม่สำเร็จ กรุณาลองใหม่', 'error');
    } finally {
      setScanSubmitting(false);
    }
  };

  const handleScanError = () => {
    showToast('ไม่สามารถเปิดกล้องได้ กรุณาพิมพ์รหัสแทน', 'warning');
  };

  const handleManualStatus = async (studentId, newStatus) => {
    if (!sessionId) {
      showToast('ไม่พบข้อมูลคลาสเรียน', 'error');
      return;
    }

    if (manualLoadingId === studentId) return;
    setManualLoadingId(studentId);

    try {
      await attendanceService.submitManualAttendance({ sessionId: Number(sessionId), studentId, status: newStatus });
      setStudents((prev) => prev.map((s) => (s.studentId === studentId ? { ...s, status: newStatus } : s)));
      showToast('บันทึกสถานะเรียบร้อย', 'success');
    } catch (err) {
      const msg = err?.data?.message || err?.data?.error || 'บันทึกไม่สำเร็จ';
      showToast(msg, 'error');
    } finally {
      setManualLoadingId(null);
    }
  };

  const openPickupPanel = async (student) => {
    if (!student.attendanceId || !student.checkinAt) {
      showToast('นักเรียนยังไม่มีเวลาเช็คเข้าเรียน', 'warning');
      return;
    }

    setPickupStudent(student);
    setPickupOptions([]);
    setPickupLoading(true);
    try {
      const response = await attendanceService.getPickupAuthorizations(student.studentId);
      const data = response.data?.data || response.data || [];
      setPickupOptions(Array.isArray(data) ? data.filter(option => option.isActive !== false) : []);
    } catch (err) {
      showToast(err?.data?.message || err?.data?.error || 'โหลดรายชื่อผู้รับเด็กไม่สำเร็จ', 'error');
    } finally {
      setPickupLoading(false);
    }
  };

  const handleCheckout = async (authorization) => {
    if (!pickupStudent) return;
    setCheckoutLoading(true);
    try {
      const response = await attendanceService.checkoutAttendance(pickupStudent.attendanceId, {
        pickupAuthorizationId: authorization.id,
      });
      const checkout = response.data?.data || response.data || {};
      setStudents(prev => prev.map(student => student.attendanceId === pickupStudent.attendanceId
        ? { ...student, checkoutAt: checkout.checkoutAt, pickedUpBy: checkout.pickedUpBy || authorization.fullName, pickupAuthorizationId: checkout.pickupAuthorizationId || authorization.id, checkoutAudit: checkout.audit }
        : student));
      showToast(`บันทึกผู้รับเด็ก: ${authorization.fullName}`, 'success');
      setPickupStudent(null);
    } catch (err) {
      showToast(err?.data?.message || err?.data?.error || 'บันทึกการรับเด็กไม่สำเร็จ', 'error');
    } finally {
      setCheckoutLoading(false);
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

      <div class={`${isNeo ? 'neo-tab-group p-0 mb-6' : 'inline-flex rounded-xl bg-zinc-100 p-1 mb-6'}`}>
           <button
          type="button"
          onClick={() => setMode('scan')}
          class={'px-5 py-2 text-sm font-medium rounded-lg transition-all ' + (isNeo ? 'neo-btn ' : '') + (mode === 'scan' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700')}
        >
          สแกน QR Code
        </button>
        <button
          type="button"
          onClick={() => setMode('manual')}
          class={'px-5 py-2 text-sm font-medium rounded-lg transition-all ' + (isNeo ? 'neo-btn ' : '') + (mode === 'manual' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700')}
        >
          เช็คชื่อด้วยมือ
        </button>
      </div>

       <div class="mb-4 flex flex-wrap items-center gap-2">
        {['check-in', 'check-out'].map(value => (
          <button type="button" key={value} onClick={() => { setScannerMode(value); setPendingScan(null); }} class={`rounded-lg px-4 py-2 text-sm font-semibold ${scannerMode === value ? 'bg-oasis-primary text-white' : 'bg-zinc-100 text-zinc-600'}`}>
            {value === 'check-in' ? 'เช็คเข้า' : 'เช็คออก'}
          </button>
        ))}
        {offline && <span class="rounded-lg bg-oasis-warning-light px-3 py-2 text-xs font-semibold text-zinc-700">ออฟไลน์: รายการใหม่จะเข้าคิว</span>}
      </div>

      {mode === 'scan' ? (
        <BentoGrid>
          <div class="lg:col-span-3">
             {scannerMode === 'check-in' ? <ScannerCamera active={!pendingScan && !scanSubmitting} onScan={handleScan} onError={handleScanError} /> : (
              <div class="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
                <p class="text-sm font-semibold text-zinc-800">เลือกนักเรียนที่เช็คเข้าแล้วเพื่อบันทึกการรับกลับ</p>
                <div class="mt-4 grid gap-2 sm:grid-cols-2">
                  {students.filter(student => student.checkinAt && !student.checkoutAt).map(student => <button type="button" key={student.attendanceId} onClick={() => openPickupPanel(student)} class="rounded-xl border border-zinc-200 bg-white p-3 text-left hover:border-oasis-primary"><span class="block text-sm font-semibold">{student.fullName}</span><span class="text-xs text-zinc-500">{new Date(student.checkinAt).toLocaleTimeString('th-TH')}</span></button>)}
                </div>
              </div>
            )}
            {pendingScan && <div class="mt-4 flex items-center justify-between rounded-xl border border-oasis-primary/20 bg-white p-4 shadow-sm"><div><p class="text-xs text-zinc-500">ยืนยัน QR</p><p class="mt-1 max-w-[16rem] truncate text-sm font-semibold text-zinc-900">{pendingScan.qrToken}</p><p class="mt-1 text-xs text-zinc-500">ขั้นตอนสุดท้ายก่อนบันทึก</p></div><div class="flex gap-2"><button type="button" disabled={scanSubmitting} onClick={() => setPendingScan(null)} class="rounded-lg px-3 py-2 text-sm text-zinc-500 disabled:opacity-50">ยกเลิก</button><button type="button" disabled={scanSubmitting} onClick={confirmScan} class="rounded-lg bg-oasis-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{scanSubmitting ? 'กำลังบันทึก...' : 'ยืนยันเช็คเข้า'}</button></div></div>}
          </div>

          <div class={`${isNeo ? 'neo-card bg-white p-4' : 'bg-zinc-50 rounded-2xl border border-zinc-100 p-4'} max-h-[600px] overflow-y-auto`}>
            <h3 class="text-sm font-semibold text-zinc-700 mb-3 sticky top-0 bg-white pb-2">
              สแกนล่าสุด ({recentScans.length})
            </h3>
            {recentScans.length === 0 ? (
              <p class="text-sm text-zinc-400 text-center py-8">ยังไม่มีการสแกน</p>
            ) : (
              <div class="space-y-2">
                {recentScans.map((scan) => (
                  <div
                    key={scan.qrData + scan.time}
                    class={'flex items-center justify-between p-2.5 rounded-xl ' + (scan.status === 'present' ? 'bg-oasis-success-light/50' : 'bg-oasis-danger-light/50')}
                  >
                    <div class="min-w-0">
                      <p class="text-sm font-medium text-zinc-800 truncate">{scan.name}</p>
                      <p class="text-xs text-zinc-500">{scan.time}{scan.sessionsRemaining !== undefined && scan.sessionsRemaining !== null ? ` · เหลือ ${scan.sessionsRemaining} ครั้ง` : ''}</p>
                    </div>
                    <StatusBadge status={scan.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </BentoGrid>
      ) : (
        <>
        <div class={`${isNeo ? 'neo-card bg-white' : 'bg-zinc-50 rounded-2xl border border-zinc-100'} overflow-hidden`}>
          <div class="px-3 sm:px-6 py-4 border-b border-zinc-100">
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
                <div key={student.studentId} class="flex items-center justify-between px-3 sm:px-6 py-3 hover:bg-zinc-50 transition-colors">
                  <div class="flex items-center gap-3 min-w-0">
                    <span class="text-sm font-medium text-zinc-900">{student.fullName || '-'}</span>
                    {student.status && <StatusBadge status={student.status} />}
                  </div>
                  <div class="flex items-center gap-2 shrink-0">
                    {student.checkoutAt ? (
                      <span class="rounded-lg bg-oasis-success-light px-2.5 py-1.5 text-xs font-semibold text-oasis-success">
                        รับแล้ว: {student.pickedUpBy || '-'} · {student.checkoutAudit?.createdAt ? new Date(student.checkoutAudit.createdAt).toLocaleTimeString('th-TH') : new Date(student.checkoutAt).toLocaleTimeString('th-TH')}
                        {student.checkoutAudit?.userId ? ` · โดย #${student.checkoutAudit.userId}` : ''}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openPickupPanel(student)}
                        disabled={!student.checkinAt}
                        class="rounded-lg border border-oasis-primary/30 bg-white px-2.5 py-1.5 text-xs font-semibold text-oasis-primary transition hover:bg-oasis-primary-light disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        รับเด็กกลับ
                      </button>
                    )}
                    <div class="inline-flex rounded-xl bg-zinc-100 p-0.5">
                    {statusOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                         disabled={manualLoadingId === student.studentId}
                         onClick={() => handleManualStatus(student.studentId, opt.value)}
                         class={'px-3 py-1.5 text-xs font-medium rounded-lg transition-all disabled:cursor-wait disabled:opacity-50 ' + (student.status === opt.value ? opt.activeClass : 'text-zinc-500 hover:text-zinc-700')}
                      >
                        {opt.label}
                      </button>
                    ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        {pickupStudent && (
          <div class={`${isNeo ? 'neo-card' : 'rounded-2xl border border-oasis-primary/20'} mt-4 bg-white p-5 shadow-sm`}>
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="text-sm font-semibold text-zinc-500">บันทึกการรับกลับ</p>
                <h3 class="mt-1 text-lg font-semibold text-zinc-900">{pickupStudent.fullName}</h3>
                <p class="mt-1 text-xs text-zinc-500">เช็คเข้า {new Date(pickupStudent.checkinAt).toLocaleTimeString('th-TH')}</p>
              </div>
              <button type="button" onClick={() => setPickupStudent(null)} class="text-sm text-zinc-500 hover:text-zinc-900">ปิด</button>
            </div>
            {pickupLoading ? (
              <p class="py-6 text-center text-sm text-zinc-500">กำลังโหลดรายชื่อผู้มีสิทธิ์รับเด็ก...</p>
            ) : pickupOptions.length === 0 ? (
              <div class="mt-4 rounded-xl bg-oasis-warning-light p-4 text-sm text-zinc-700">
                ยังไม่มีรายชื่อผู้มีสิทธิ์รับเด็กที่ active กรุณาเพิ่มในโปรไฟล์นักเรียนก่อน
              </div>
            ) : (
              <div class="mt-4 grid gap-2 sm:grid-cols-2">
                {pickupOptions.map(option => (
                  <button
                    key={option.id}
                    type="button"
                    disabled={checkoutLoading}
                    onClick={() => handleCheckout(option)}
                    class="flex items-center justify-between rounded-xl border border-zinc-200 px-4 py-3 text-left transition hover:border-oasis-primary hover:bg-oasis-primary-light disabled:opacity-50"
                  >
                    <span><span class="block text-sm font-semibold text-zinc-900">{option.fullName}</span><span class="mt-0.5 block text-xs text-zinc-500">{option.relationship || 'ผู้รับที่ได้รับอนุญาต'} {option.phone ? `· ${option.phone}` : ''}</span></span>
                    <span class="text-xs font-semibold text-oasis-primary">{checkoutLoading ? 'กำลังบันทึก' : 'เลือก'}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        </>
      )}
    </AdminLayout>
  );
}
