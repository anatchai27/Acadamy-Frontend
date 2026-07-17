import { useState, useEffect } from 'preact/hooks';
import { route } from 'preact-router';
import { QRCode } from 'react-qr-code';
import { AdminLayout } from '../../layouts/admin-layout';
import { Button, showToast } from '../../components/ui';
import { studentService } from '../../services';
import { useAbortController } from '../../hooks';

const relationshipLabels = {
  'แม่': 'มารดา',
  'พ่อ': 'บิดา',
  'ผู้ปกครอง': 'ผู้ปกครอง',
  'อื่นๆ': 'อื่นๆ',
};

function formatDate(iso) {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

export function StudentProfilePage({ path, id }) {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [qrToken, setQrToken] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  const getSignal = useAbortController();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    studentService.getStudentById(id, { signal: getSignal() })
      .then((res) => setStudent(res.data?.data || res.data))
      .catch((err) => {
        if (err?.status === 404) {
          setError('ไม่พบข้อมูลนักเรียน');
        } else {
          setError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleGenerateQR = async () => {
    if (!id) return;
    setQrLoading(true);
    try {
      const res = await studentService.getStudentQR(id);
      const data = res.data?.data || res.data || {};
      setQrToken(data);
      showToast('สร้าง QR Token สำเร็จ', 'success');
    } catch (err) {
      const msg = err?.data?.message || err?.data?.error || 'ไม่สามารถสร้าง QR ได้';
      showToast(msg, 'error');
    } finally {
      setQrLoading(false);
    }
  };

  const handleBack = () => route('/admin/students');
  const handleEdit = () => route(`/admin/students/${id}?edit=1`);

  if (loading) {
    return (
      <AdminLayout path={path}>
        <div class="flex flex-col items-center justify-center py-20 gap-3">
          <div class="flex h-10 w-10 rounded-full border-2 border-oasis-primary border-t-transparent animate-spin" />
          <span class="text-zinc-400">กำลังโหลดข้อมูล...</span>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout path={path}>
        <div class="text-center py-20">
          <div class="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-zinc-100">
            <UserXIcon class="h-10 w-10 text-zinc-300" />
          </div>
          <h3 class="text-lg font-semibold text-zinc-700 mb-1">{error}</h3>
          <Button variant="outline" size="md" onClick={handleBack}>กลับไปหน้านักเรียน</Button>
        </div>
      </AdminLayout>
    );
  }

  if (!student) return null;

  return (
    <AdminLayout path={path}>
      {/* Breadcrumb + Header */}
      <div class="mb-8">
        <button
          type="button"
          onClick={handleBack}
          class="text-sm text-zinc-500 hover:text-zinc-800 transition-colors flex items-center gap-1 mb-2"
        >
          <ChevronLeftIcon class="h-4 w-4" />
          กลับไปหน้านักเรียน
        </button>

        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div class="flex items-center gap-4">
            <div class="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-oasis-primary/5 text-oasis-primary text-2xl font-bold">
              {student.nickname?.[0] || student.fullName?.[0] || '?'}
            </div>
            <div>
              <h2 class="text-2xl font-semibold text-zinc-900 tracking-tight">
                {student.fullName || '-'}
              </h2>
              <div class="flex items-center gap-2 mt-1">
                {student.nickname && (
                  <span class="inline-flex items-center gap-1 text-sm text-zinc-500">
                    <TagIcon class="h-3.5 w-3.5" />
                    {student.nickname}
                  </span>
                )}
                {student.grade && (
                  <span class="inline-flex items-center rounded-md bg-oasis-primary/5 px-2.5 py-0.5 text-xs font-medium text-oasis-primary">
                    {student.grade}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleEdit}>
              <span class="flex items-center gap-1.5">
                <EditIcon class="h-4 w-4" />
                แก้ไข
              </span>
            </Button>
            <Button variant="primary" size="sm" onClick={handleGenerateQR} loading={qrLoading} disabled={qrLoading}>
              <span class="flex items-center gap-1.5">
                <QrIcon class="h-4 w-4" />
                สร้าง QR
              </span>
            </Button>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column — Student Details */}
        <div class="lg:col-span-2 space-y-6">
          {/* Personal Info Card */}
          <div class="bg-white rounded-xl border border-zinc-200/80 overflow-hidden">
            <div class="px-6 py-4 border-b border-zinc-100">
              <h3 class="text-base font-semibold text-zinc-900">ข้อมูลส่วนตัว</h3>
            </div>
            <div class="p-6">
              <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                <InfoField label="ชื่อเล่น" value={student.nickname} />
                <InfoField label="ระดับชั้น" value={student.grade} />
                <InfoField label="โรงเรียน" value={student.school} />
                <InfoField label="วันที่สร้างข้อมูล" value={formatDate(student.createdAt)} />
              </dl>
              {student.medicalInfo && (
                <div class="mt-5 pt-5 border-t border-slate-100 dark:border-slate-700">
                  <dt class="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">ข้อมูลทางการแพทย์</dt>
                  <dd class="text-sm text-slate-900 dark:text-white">{student.medicalInfo}</dd>
                </div>
              )}
            </div>
          </div>

          {/* Parents Card */}
          <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div class="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h3 class="text-base font-semibold text-slate-900 dark:text-white">ผู้ปกครอง</h3>
              {student.parents && student.parents.length > 0 && (
                <span class="text-xs text-slate-400">{student.parents.length} คน</span>
              )}
            </div>
            <div class="p-6">
              {student.parents && student.parents.length > 0 ? (
                <div class="space-y-4">
                  {student.parents.map((p, i) => (
                    <div key={p.id || i} class="flex items-start gap-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-700/40">
                      <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-sm font-bold">
                        {p.fullName?.[0] || '?'}
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2">
                          <p class="text-sm font-semibold text-slate-900 dark:text-white">{p.fullName || '-'}</p>
                          <span class="inline-flex items-center rounded-md bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 text-xs font-medium text-blue-600 dark:text-blue-400">
                            {relationshipLabels[p.relationship] || p.relationship || 'ผู้ปกครอง'}
                          </span>
                        </div>
                        <div class="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                          {p.phone && (
                            <span class="inline-flex items-center gap-1">
                              <PhoneIcon class="h-3 w-3" />
                              {p.phone}
                            </span>
                          )}
                          {p.lineUserId && (
                            <span class="inline-flex items-center gap-1">
                              <LineIcon class="h-3 w-3" />
                              {p.lineUserId}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p class="text-sm text-slate-400 text-center py-4">ไม่มีข้อมูลผู้ปกครอง</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column — QR Code */}
        <div class="space-y-6">
          <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 text-center">
            <h3 class="text-base font-semibold text-slate-900 dark:text-white mb-1">บัตร QR Code</h3>
            <p class="text-xs text-slate-400 mb-4">ใช้สำหรับเช็คชื่อเข้าเรียน</p>

            <div class="w-48 h-48 mx-auto bg-white dark:bg-slate-700 rounded-xl flex items-center justify-center mb-4 p-2">
              {qrToken ? (
                <div class="flex flex-col items-center gap-2">
                  <QRCode
                    value={qrToken.qrToken || String(qrToken)}
                    size={160}
                    bgColor="transparent"
                    fgColor="#1e293b"
                  />
                  {qrToken.expiresAt && (
                    <p class="text-xs text-slate-400 mt-2">
                      หมดอายุ {formatDate(qrToken.expiresAt)}
                    </p>
                  )}
                </div>
              ) : (
                <div class="text-center">
                  <QrLargeIcon class="h-16 w-16 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                  <p class="text-xs text-slate-400">ยังไม่มีการสร้าง QR</p>
                </div>
              )}
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={handleGenerateQR}
              loading={qrLoading}
              disabled={qrLoading}
              class="w-full"
            >
              {qrToken ? 'สร้าง QR ใหม่' : 'สร้าง QR Code'}
            </Button>
          </div>

          {/* Quick Info Card */}
          <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <h3 class="text-base font-semibold text-slate-900 dark:text-white mb-4">ข้อมูลระบบ</h3>
            <dl class="space-y-3 text-sm">
              <InfoFieldSmall label="รหัสนักเรียน" value={student.id} mono />
              <InfoFieldSmall label="สร้างเมื่อ" value={formatDate(student.createdAt)} />
            </dl>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

/* ─── Reusable Sub-Components ─── */

function InfoField({ label, value }) {
  return (
    <div>
      <dt class="text-xs font-medium text-slate-500 dark:text-slate-400 mb-0.5">{label}</dt>
      <dd class="text-sm text-slate-900 dark:text-white font-medium">{value || '-'}</dd>
    </div>
  );
}

function InfoFieldSmall({ label, value, mono }) {
  return (
    <div class="flex items-center justify-between">
      <dt class="text-xs text-slate-500 dark:text-slate-400">{label}</dt>
      <dd class={`text-sm font-medium text-slate-900 dark:text-white ${mono ? 'font-mono' : ''}`}>
        {value || '-'}
      </dd>
    </div>
  );
}

/* ─── SVG Icons ─── */

function ChevronLeftIcon({ class: className }) {
  return (
    <svg class={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function EditIcon({ class: className }) {
  return (
    <svg class={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}

function QrIcon({ class: className }) {
  return (
    <svg class={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v1m6 11h2m-6 0h-2m4 0h-2m4 0v-2m0 0h-2m2 0V9m0 4V5m0 2h-2M4 7h1m4 0h1m4 0h1M4 11h1m4 0h1m4 0h1M4 15h1m4 0h1m4 0h1M4 19h1m4 0h1m4 0h1" />
    </svg>
  );
}

function QrLargeIcon({ class: className }) {
  return (
    <svg class={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v1m6 11h2m-6 0h-2m4 0h-2m4 0v-2m0 0h-2m2 0V9m0 4V5m0 2h-2M4 7h1m4 0h1m4 0h1M4 11h1m4 0h1m4 0h1M4 15h1m4 0h1m4 0h1M4 19h1m4 0h1m4 0h1" />
    </svg>
  );
}

function TagIcon({ class: className }) {
  return (
    <svg class={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    </svg>
  );
}

function PhoneIcon({ class: className }) {
  return (
    <svg class={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  );
}

function LineIcon({ class: className }) {
  return (
    <svg class={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
    </svg>
  );
}

function UserXIcon({ class: className }) {
  return (
    <svg class={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      <path stroke-linecap="round" stroke-linejoin="round" d="M19 4l-6 6m6 0l-6-6" />
    </svg>
  );
}
