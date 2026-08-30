import { useState, useEffect } from 'preact/hooks';
import { route } from 'preact-router';
import { QRCode } from 'react-qr-code';
import { AdminLayout } from '../../layouts/admin-layout';
import { Button, showToast } from '../../components/ui';
import { studentService } from '../../services';
import { useAbortController } from '../../hooks';
import { useDesignTheme } from '../../hooks/useDesignTheme';
import { BentoGrid } from '../../components/ui/bento-grid';
import { HiOutlineChevronLeft, HiOutlinePencil, HiOutlineTag, HiOutlinePhone, HiOutlineQrCode, HiOutlineUserMinus, HiOutlineChatBubbleLeftRight } from 'react-icons/hi2';

const relationshipLabels = {
  'แม่': 'มารดา',
  'พ่อ': 'บิดา',
  'ผู้ปกครอง': 'ผู้ปกครอง',
  'อื่นๆ': 'อื่นๆ',
};

const formatDate = (iso = '') => {
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
};

export const StudentProfilePage = ({ path, id }) => {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [qrToken, setQrToken] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  const getSignal = useAbortController();
  const { designTheme } = useDesignTheme();
  const isNeo = designTheme === 'neobrutalism';

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    studentService.getStudentById(id, { signal: getSignal() })
      .then(({ data }) => setStudent(data?.data || data))
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
      const { data } = await studentService.getStudentQR(id);
      const tokenData = data?.data || data || {};
      setQrToken(tokenData);
      showToast('สร้าง QR Token สำเร็จ', 'success');
    } catch (err) {
      const msg = err?.data?.message || err?.data?.error || 'ไม่สามารถสร้าง QR ได้';
      showToast(msg, 'error');
    } finally {
      setQrLoading(false);
    }
  };

  const handleBack = () => route('/admin/students');
  const handleEdit = () => route(`/admin/students/${id}/edit`);

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
            <HiOutlineUserMinus class="h-10 w-10 text-zinc-300" />
          </div>
          <h3 class="text-lg font-semibold text-zinc-700 mb-1">{error}</h3>
          <Button variant="outline" size="md" onClick={handleBack}>กลับไปหน้านักเรียน</Button>
        </div>
      </AdminLayout>
    );
  }

  if (!student) return null;

  const {
    id: studentId,
    photoUrl,
    fullName,
    nickname,
    grade,
    school,
    createdAt,
    medicalInfo,
    parents = [],
  } = student;

  return (
    <AdminLayout path={path}>
      {/* Breadcrumb + Header */}
      <div class="mb-8">
        <button
          type="button"
          onClick={handleBack}
          class="text-sm text-zinc-500 hover:text-zinc-800 transition-colors flex items-center gap-1 mb-2"
        >
          <HiOutlineChevronLeft class="h-4 w-4" />
          กลับไปหน้านักเรียน
        </button>

        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div class="flex items-center gap-4">
            <div class="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-oasis-primary/5 text-oasis-primary text-2xl font-semibold overflow-hidden">
              {photoUrl ? (
                <img src={photoUrl} alt={fullName} class="w-full h-full object-cover" />
              ) : (
                nickname?.[0] || fullName?.[0] || '?'
              )}
            </div>
            <div>
              <h2 class="text-2xl font-semibold text-zinc-900 tracking-tight">
                {fullName || '-'}
              </h2>
              <div class="flex items-center gap-2 mt-1">
                {nickname && (
                  <span class="inline-flex items-center gap-1 text-sm text-zinc-500">
                    <HiOutlineTag class="h-3.5 w-3.5" />
                    {nickname}
                  </span>
                )}
                {grade && (
                  <span class="inline-flex items-center rounded-md bg-oasis-primary/5 px-2.5 py-0.5 text-xs font-medium text-oasis-primary">
                    {grade}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleEdit}>
              <span class="flex items-center gap-1.5">
                <HiOutlinePencil class="h-4 w-4" />
                แก้ไข
              </span>
            </Button>
            <Button variant="primary" size="sm" onClick={handleGenerateQR} loading={qrLoading} disabled={qrLoading}>
              <span class="flex items-center gap-1.5">
                <HiOutlineQrCode class="h-4 w-4" />
                สร้าง QR
              </span>
            </Button>
          </div>
        </div>
      </div>

      <BentoGrid class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column — Student Details */}
        <div class="lg:col-span-2 space-y-6">
          {/* Personal Info Card */}
          <div class={`${isNeo ? 'neo-card bg-white p-5' : 'bg-white rounded-2xl border border-zinc-200/80'} overflow-hidden`}>
            <div class="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
              <h3 class="text-base font-semibold text-zinc-900">ข้อมูลส่วนตัว</h3>
            </div>
            <div class="p-6">
              <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                <InfoField label="ชื่อเล่น" value={nickname} />
                <InfoField label="ระดับชั้น" value={grade} />
                <InfoField label="โรงเรียน" value={school} />
                <InfoField label="วันที่สร้างข้อมูล" value={formatDate(createdAt)} />
              </dl>
              {medicalInfo && (
                <div class="mt-5 pt-5 border-t border-zinc-100">
                  <dt class="text-xs font-medium text-zinc-500 mb-1">ข้อมูลทางการแพทย์</dt>
                  <dd class="text-sm text-zinc-900">{medicalInfo}</dd>
                </div>
              )}
            </div>
          </div>

          {/* Parents Card */}
          <div class={`${isNeo ? 'neo-card bg-white p-5' : 'bg-white rounded-2xl border border-zinc-200/80'} overflow-hidden`}>
            <div class="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
              <h3 class="text-base font-semibold text-zinc-900">ผู้ปกครอง</h3>
              {parents.length > 0 && (
                <span class="text-xs text-zinc-400">{parents.length} คน</span>
              )}
            </div>
            <div class="p-6">
              {parents.length > 0 ? (
                <div class="space-y-4">
                  {parents.map((p, i) => (
                    <div key={p.id || i} class="flex items-start gap-4 p-4 rounded-xl bg-zinc-50">
                      <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-oasis-primary/5 text-oasis-primary text-sm font-semibold">
                        {p.fullName?.[0] || '?'}
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2">
                          <p class="text-sm font-semibold text-zinc-900">{p.fullName || '-'}</p>
                          <span class="inline-flex items-center rounded-md bg-oasis-primary/5 px-2 py-0.5 text-xs font-medium text-oasis-primary">
                            {relationshipLabels[p.relationship] || p.relationship || 'ผู้ปกครอง'} 
                          </span>
                        </div>
                        <div class="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-zinc-500">
                          {p.phone && (
                            <span class="inline-flex items-center gap-1">
                              <HiOutlinePhone class="h-3 w-3" />
                              {p.phone}
                            </span>
                          )}
                          {p.lineUserId && (
                            <span class="inline-flex items-center gap-1">
                              <HiOutlineChatBubbleLeftRight class="h-3 w-3" />
                              {p.lineUserId}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p class="text-sm text-zinc-400 text-center py-4">ไม่มีข้อมูลผู้ปกครอง</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column — QR Code */}
        <div class="space-y-6">
          <div class={`${isNeo ? 'neo-card bg-white' : 'bg-white rounded-2xl border border-zinc-200/80'} p-6 text-center`}>
            <h3 class="text-base font-semibold text-zinc-900 mb-1">บัตร QR Code</h3>
            <p class="text-xs text-zinc-400 mb-4">ใช้สำหรับเช็คชื่อเข้าเรียน</p>

            <div class={`w-48 h-48 mx-auto mb-4 p-2 flex items-center justify-center ${isNeo ? 'neo-card bg-white' : 'bg-white rounded-xl border border-zinc-200'}`}>
              {qrToken ? (
                <div class="flex flex-col items-center gap-2">
                  <QRCode
                    value={qrToken.qrToken || String(qrToken)}
                    size={160}
                    bgColor="transparent"
                    fgColor="#1e293b"
                  />
                  {qrToken.expiresAt && (
                    <p class="text-xs text-zinc-400 mt-2">
                      หมดอายุ {formatDate(qrToken.expiresAt)}
                    </p>
                  )}
                </div>
              ) : (
                <div class="text-center">
                  <HiOutlineQrCode class="h-16 w-16 mx-auto text-zinc-300 mb-2" />
                  <p class="text-xs text-zinc-400">ยังไม่มีการสร้าง QR</p>
                </div>
              )}
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={handleGenerateQR}
              loading={qrLoading}
              disabled={qrLoading}
            >
              {qrToken ? 'สร้าง QR ใหม่' : 'สร้าง QR Code'}
            </Button>
          </div>

          {/* Quick Info Card */}
          <div class={`${isNeo ? 'neo-card bg-white' : 'bg-white rounded-2xl border border-zinc-200/80'} p-6`}>
            <h3 class="text-base font-semibold text-zinc-900 mb-4">ข้อมูลระบบ</h3>
            <dl class="space-y-3 text-sm">
              <InfoFieldSmall label="รหัสนักเรียน" value={studentId} mono />
              <InfoFieldSmall label="สร้างเมื่อ" value={formatDate(createdAt)} />
            </dl>
          </div>
        </div>
      </BentoGrid>
    </AdminLayout>
  );
};

/* ─── Reusable Sub-Components ─── */

const InfoField = ({ label, value = '-' }) => {
  return (
    <div>
      <dt class="text-xs font-medium text-zinc-500 mb-0.5">{label}</dt>
      <dd class="text-sm text-zinc-900 font-medium">{value}</dd>
    </div>
  );
};

const InfoFieldSmall = ({ label, value = '-', mono = false }) => {
  return (
    <div class="flex items-center justify-between">
      <dt class="text-xs text-zinc-500">{label}</dt>
      <dd class={`text-sm font-medium text-zinc-900 ${mono ? 'font-mono' : ''}`}>
        {value}
      </dd>
    </div>
  );
};


