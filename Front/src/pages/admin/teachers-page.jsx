import { useState, useEffect, useRef } from 'preact/hooks';
import { AdminLayout } from '../../layouts/admin-layout';
import { SolidInput, Button, showToast, showConfirm, ImageUpload, BentoGrid } from '../../components/ui';
import { teacherService, uploadService } from '../../services';
import { useAbortController } from '../../hooks';
import { useDesignTheme } from '../../hooks/useDesignTheme';
import { HiOutlinePlus, HiOutlineMagnifyingGlass, HiOutlineEye, HiOutlinePencil, HiOutlineTrash, HiOutlineXMark, HiOutlineArrowLeft, HiOutlineArrowRight, HiOutlineCheck, HiOutlineExclamationCircle, HiOutlinePhone, HiOutlineEnvelope, HiOutlineUserGroup, HiOutlineAcademicCap, HiOutlineCalendarDays, HiOutlineTag, HiOutlineEllipsisVertical, HiOutlineChevronDown, HiOutlineChevronUp, HiOutlineChevronLeft, HiOutlineChevronRight, HiOutlineAdjustmentsHorizontal, HiOutlineBars3, HiOutlineSquares2X2, HiOutlineListBullet, HiOutlineStar, HiOutlineSparkles, HiOutlineGlobeAlt, HiOutlineMapPin, HiOutlineLink, HiOutlinePaperClip, HiOutlinePaperAirplane, HiOutlineShieldCheck, HiOutlineExclamationTriangle, HiOutlineHandThumbUp, HiOutlineHandThumbDown, HiOutlineChartBar, HiOutlinePresentationChartBar, HiOutlineCalendar, HiOutlineArrowPath, HiOutlineRectangleGroup, HiOutlineHome, HiOutlineUser, HiOutlineCog6Tooth, HiOutlineArrowRightOnRectangle, HiOutlineBell, HiOutlineQrCode, HiOutlineBookOpen, HiOutlineDocumentText, HiOutlineLightBulb, HiOutlineBanknotes, HiOutlineCube, HiOutlineUsers, HiOutlineClipboardDocumentCheck, HiOutlineClipboardDocumentList, HiOutlineCamera, HiOutlinePhoto, HiOutlineClock, HiOutlineMinus, HiOutlineArrowUp, HiOutlineArrowDown, HiOutlineHeart, HiOutlineInformationCircle } from 'react-icons/hi2';

const formatCurrency = (n) =>
  n ? `฿${Number(n).toLocaleString()}` : '-';

const emptyForm = {
  fullName: '',
  specialization: '',
  bio: '',
  hourlyRate: '',
};

export function TeachersPage({ path }) {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [viewing, setViewing] = useState(null);
  const debounceRef = useRef(null);
  const getSignal = useAbortController();
  const { designTheme } = useDesignTheme();
  const isNeo = designTheme === 'neobrutalism';

  const fetchTeachers = async (query = '') => {
    setLoading(true);
    try {
      const params = {};
      if (query.trim()) params.search = query.trim();
      const res = await teacherService.getTeachers(params, { signal: getSignal() });
      setTeachers(Array.isArray(res.data) ? res.data : res.data?.data || []);
    } catch {
      showToast('ไม่สามารถโหลดข้อมูลครูผู้สอนได้', 'error');
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTeachers(); }, []);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearch(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchTeachers(value), 300);
  };

  const updateField = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setPhotoFile(null);
    setPhotoPreview(null);
    setShowForm(true);
  };

  const openEdit = (teacher) => {
    setEditingId(teacher.id);
    setForm({
      fullName: teacher.fullName || '',
      specialization: teacher.specialization || '',
      bio: teacher.bio || '',
      hourlyRate: teacher.hourlyRate ? String(teacher.hourlyRate) : '',
    });
    setPhotoPreview(teacher.photoUrl || null);
    setPhotoFile(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fullName.trim()) {
      showToast('กรุณากรอกชื่อ-นามสกุล', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        fullName: form.fullName.trim(),
        specialization: form.specialization.trim() || undefined,
        bio: form.bio.trim() || undefined,
        hourlyRate: form.hourlyRate ? Number(form.hourlyRate) : 0,
        photoUrl: undefined,
      };

      if (editingId) {
        await teacherService.updateTeacher(editingId, payload);
        if (photoFile) {
          await uploadService.uploadTeacherPhoto(photoFile, editingId);
        }
        showToast('แก้ไขข้อมูลครูสำเร็จ', 'success');
      } else {
        const res = await teacherService.createTeacher(payload);
        const teacherId = res.data?.data?.id || res.data?.id;
        if (photoFile && teacherId) {
          await uploadService.uploadTeacherPhoto(photoFile, teacherId);
        }
        showToast('เพิ่มครูผู้สอนสำเร็จ', 'success');
      }
      closeForm();
      fetchTeachers();
    } catch (err) {
      const msg = err?.data?.message || err?.data?.error || 'ดำเนินการไม่สำเร็จ';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (teacher) => {
    const ok = await showConfirm({
      title: 'ลบครูผู้สอน',
      message: `แน่ใจว่าต้องการลบ "${teacher.fullName}"? การดำเนินการนี้ไม่สามารถย้อนกลับได้`,
      yesLabel: 'ลบ',
      cancelLabel: 'ยกเลิก',
    });
    if (!ok) return;
    try {
      await teacherService.deleteTeacher(teacher.id);
      showToast('ลบครูผู้สอนสำเร็จ', 'success');
      setViewing(null);
      fetchTeachers();
    } catch (err) {
      showToast(err?.data?.message || 'ลบไม่สำเร็จ', 'error');
    }
  };

  const handleView = (teacher) => {
    setViewing(teacher);
    setShowForm(false);
  };

  if (viewing) {
    return (
      <AdminLayout path={path}>
        <div class="mb-8">
          <button
            type="button"
            onClick={() => setViewing(null)}
            class="text-sm text-zinc-500 hover:text-zinc-800 transition-colors flex items-center gap-1 mb-2"
          >
            <HiOutlineChevronLeft class="h-4 w-4" />
            กลับไปรายการครู
          </button>
          <div class="flex items-start gap-4">
            <div class="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-oasis-primary/5 text-oasis-primary text-2xl font-semibold overflow-hidden">
              {viewing.photoUrl ? (
                <img src={viewing.photoUrl} alt={viewing.fullName} class="w-full h-full object-cover" />
              ) : (
                viewing.fullName?.[0] || '?'
              )}
            </div>
            <div class="flex-1 min-w-0">
              <h2 class="text-2xl font-semibold text-zinc-900 tracking-tight">{viewing.fullName}</h2>
              <div class="flex flex-wrap items-center gap-2 mt-1">
                {viewing.specialization && (
                  <span class="inline-flex items-center rounded-md bg-oasis-primary/5 px-2.5 py-0.5 text-xs font-medium text-oasis-primary">
                    {viewing.specialization}
                  </span>
                )}
                {viewing.userEmail && (
                  <span class="text-sm text-zinc-500">{viewing.userEmail}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2 space-y-6">
            <div class={`${isNeo ? 'neo-card bg-white overflow-hidden' : 'bg-white rounded-2xl border border-zinc-200/80 overflow-hidden'}`}>
              <div class="px-6 py-4 border-b border-zinc-100">
                <h3 class="text-base font-semibold text-zinc-900">ข้อมูลส่วนตัว</h3>
              </div>
              <div class="p-6">
                <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                  <InfoField label="ชื่อ-นามสกุล" value={viewing.fullName} />
                  <InfoField label="ความเชี่ยวชาญ" value={viewing.specialization} />
                  <InfoField label="ค่าสอน/ชั่วโมง" value={viewing.hourlyRate != null ? formatCurrency(viewing.hourlyRate) : '-'} />
                  {viewing.bio && (
                    <div class="sm:col-span-2">
                      <dt class="text-xs font-medium text-zinc-500 mb-0.5">ประวัติ</dt>
                      <dd class="text-sm text-zinc-900">{viewing.bio}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          </div>
          <div class="space-y-4">
            <Button variant="primary" size="md" onClick={() => { openEdit(viewing); setViewing(null); }}>
              แก้ไขข้อมูล
            </Button>
            <Button variant="outline" size="md" class="w-full !border-oasis-danger/30 !text-oasis-danger hover:!bg-oasis-danger/5" onClick={() => handleDelete(viewing)}>
              ลบครูผู้สอน
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout path={path}>
      <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 class="text-2xl font-semibold text-zinc-900 tracking-tight">ครูผู้สอน</h2>
          <p class="text-sm text-zinc-500 mt-1">จัดการข้อมูลครูผู้สอนในสถาบัน</p>
        </div>
        <Button variant="primary" size="md" onClick={openAdd}>
          <span class="flex items-center gap-1.5">
            <HiOutlinePlus class="h-4 w-4" />
            เพิ่มครูผู้สอน
          </span>
        </Button>
      </div>

      {/* Search */}
      <div class="mb-6">
        <SolidInput type="text" placeholder="ค้นหาชื่อครู..." value={search} onInput={handleSearch} />
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div class={`${isNeo ? 'neo-card bg-white p-6 mb-6' : 'bg-white rounded-2xl border border-zinc-200/80 p-6 mb-6'}`}>
          <h3 class="text-base font-semibold text-zinc-900 mb-4">
            {editingId ? 'แก้ไขข้อมูลครูผู้สอน' : 'เพิ่มครูผู้สอนใหม่'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SolidInput
                label="ชื่อ-นามสกุล *"
                placeholder="ชื่อจริง นามสกุล"
                required
                value={form.fullName}
                onInput={updateField('fullName')}
              />
              <SolidInput
                label="ความเชี่ยวชาญ"
                placeholder="เช่น คณิตศาสตร์, วิทยาศาสตร์"
                value={form.specialization}
                onInput={updateField('specialization')}
              />
              <SolidInput
                label="ค่าสอน/ชั่วโมง (บาท)"
                type="number"
                placeholder="500"
                min="0"
                step="0.01"
                value={form.hourlyRate}
                onInput={updateField('hourlyRate')}
              />
              <ImageUpload
                label="รูปภาพครู"
                preview={photoPreview}
                onChange={(base64, file) => {
                  setPhotoPreview(base64);
                  setPhotoFile(file);
                }}
              />
              <div class="md:col-span-2">
                <label class={`text-sm font-medium mb-1.5 block ${isNeo ? 'text-black' : 'text-slate-700'}`}>ประวัติ / ข้อมูลเพิ่มเติม</label>
                <textarea
                  value={form.bio}
                  onInput={updateField('bio')}
                  placeholder="ประสบการณ์สอน หรือข้อมูลเพิ่มเติม"
                  rows={3}
                  class={`w-full px-4 py-2.5 bg-white text-sm focus:outline-none text-zinc-800 placeholder:text-zinc-400 resize-none transition-colors ${isNeo ? 'neo-input' : 'border border-zinc-200 rounded-xl focus:border-oasis-primary focus:ring-2 focus:ring-oasis-primary/10'}`}
                />
              </div>
            </div>
            <div class="flex gap-3 mt-4 pt-4 border-t border-zinc-100">
              <Button variant="primary" size="md" type="submit" loading={submitting} disabled={submitting}>
                {editingId ? 'บันทึกการแก้ไข' : 'บันทึก'}
              </Button>
              <Button variant="outline" size="md" type="button" onClick={closeForm}>ยกเลิก</Button>
            </div>
          </form>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div class="text-center py-16">
          <div class="mx-auto mb-4 h-10 w-10 rounded-full border-2 border-oasis-primary border-t-transparent animate-spin" />
          <p class="text-sm text-zinc-400">กำลังโหลดข้อมูล...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && teachers.length === 0 && (
        <div class="text-center py-16">
          <div class="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-zinc-100">
            <HiOutlineUserGroup class="h-10 w-10 text-zinc-300" />
          </div>
          <h3 class="text-lg font-semibold text-zinc-700 mb-1">ไม่พบข้อมูลครูผู้สอน</h3>
          <p class="text-sm text-zinc-400 mb-6">
            {search ? 'ลองเปลี่ยนคำค้นหา' : 'ยังไม่มีครูผู้สอนในสถาบัน'}
          </p>
          {!search && (
<Button variant="primary" size="md" onClick={openAdd}>
              + เพิ่มครูผู้สอนคนแรก
            </Button>
          )}
        </div>
      )}

      {/* Teacher Cards Grid */}
      {!loading && teachers.length > 0 && (
        <BentoGrid>
          {teachers.map((teacher) => (
            <div
              key={teacher.id}
              class={`${isNeo ? 'neo-card bg-white p-0 overflow-hidden' : 'bg-white rounded-2xl border border-zinc-200/80 hover:border-oasis-primary/30 hover:shadow-md transition-all duration-200 overflow-hidden'} group`}
            >
              <div class="p-5 cursor-pointer" onClick={() => handleView(teacher)}>
                <div class="flex items-start gap-4">
                  <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-oasis-primary/5 text-oasis-primary text-xl font-semibold overflow-hidden">
                    {teacher.photoUrl ? (
                      <img src={teacher.photoUrl} alt={teacher.fullName} class="w-full h-full object-cover" />
                    ) : (
                      teacher.fullName?.[0] || '?'
                    )}
                  </div>
                  <div class="flex-1 min-w-0">
                    <h3 class="text-base font-semibold text-zinc-900 truncate group-hover:text-oasis-primary transition-colors">
                      {teacher.fullName || '-'}
                    </h3>
                    {teacher.userEmail && (
                      <p class="text-xs text-zinc-500 mt-0.5 truncate">{teacher.userEmail}</p>
                    )}
                    {teacher.specialization && (
                      <span class="mt-2 inline-flex items-center rounded-md bg-oasis-primary/5 px-2 py-0.5 text-xs font-medium text-oasis-primary">
                        {teacher.specialization}
                      </span>
                    )}
                  </div>
                </div>
                {teacher.bio && (
                  <p class="mt-3 text-sm text-zinc-500 line-clamp-2">{teacher.bio}</p>
                )}
                {teacher.hourlyRate != null && (
                  <div class="mt-3 flex items-center gap-2 text-sm">
                    <span class="text-xs font-medium text-zinc-500">ค่าสอน/ชม.</span>
                    <span class="font-semibold text-oasis-primary">{formatCurrency(teacher.hourlyRate)}</span>
                  </div>
                )}
              </div>
              <div class="border-t border-zinc-100 flex items-stretch">
                <button
                  type="button"
                  onClick={() => { openEdit(teacher); }}
                  class="flex-1 px-4 py-2.5 text-sm font-medium text-oasis-primary hover:bg-oasis-primary/5 transition-colors flex items-center justify-center gap-1.5"
                >
                  <HiOutlinePencil class="h-4 w-4" />
                  แก้ไข
                </button>
                <div class="w-px bg-zinc-100" />
                <button
                  type="button"
                  onClick={() => handleDelete(teacher)}
                  class="flex-1 px-4 py-2.5 text-sm font-medium text-oasis-danger hover:bg-oasis-danger/5 transition-colors flex items-center justify-center gap-1.5"
                >
                  <HiOutlineTrash class="h-4 w-4" />
                  ลบ
                </button>
              </div>
            </div>
          ))}
        </BentoGrid>
      )}
    </AdminLayout>
  );
}

/* ─── Sub-components ─── */

function InfoField({ label, value }) {
  return (
    <div>
      <dt class="text-xs font-medium text-zinc-500 mb-0.5">{label}</dt>
      <dd class="text-sm text-zinc-900 font-medium">{value || '-'}</dd>
    </div>
  );
}