import { useState, useEffect, useRef } from 'preact/hooks';
import { AdminLayout } from '../../layouts/admin-layout';
import { SolidInput, Button, showToast, showConfirm, ImageUpload } from '../../components/ui';
import { teacherService, uploadService } from '../../services';
import { useAbortController } from '../../hooks';
import { useDesignTheme } from '../../hooks/useDesignTheme';
import {
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineChevronLeft,
  HiOutlineUserGroup,
  HiOutlinePhoto,
  HiOutlineXMark,
  HiOutlineEye,
} from 'react-icons/hi2';

const formatCurrency = (n) => (n != null ? `฿${Number(n).toLocaleString()}` : '-');

const emptyForm = {
  fullName: '',
  specialization: '',
  specializationEn: '',
  bio: '',
  bioEn: '',
  hourlyRate: '',
  userEmail: '',
  userPassword: '',
  userRole: 'teacher',
};

function Avatar({ src, name, size = 'md' }) {
  const [broken, setBroken] = useState(false);
  const sizeMap = { sm: 'h-10 w-10 text-base', md: 'h-14 w-14 text-xl', lg: 'h-20 w-20 text-2xl' };
  const cls = `${sizeMap[size] || sizeMap.md} shrink-0 flex items-center justify-center rounded-full bg-oasis-primary/5 text-oasis-primary font-semibold overflow-hidden`;

  if (src && !broken) {
    return (
      <img
        src={src}
        alt={name || 'avatar'}
        loading="lazy"
        onError={() => setBroken(true)}
        class={`${sizeMap[size] || sizeMap.md} shrink-0 rounded-full object-cover`}
      />
    );
  }

  return <div class={cls}>{(name || '?').charAt(0).toUpperCase()}</div>;
}

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
  const [formErrors, setFormErrors] = useState({});
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
      setTeachers(res.data?.data ?? []);
    } catch {
      showToast('ไม่สามารถโหลดข้อมูลครูผู้สอนได้', 'error');
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearch(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchTeachers(value), 300);
  };

  const updateField = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setFormErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setPhotoFile(null);
    setPhotoPreview(null);
    setFormErrors({});
    setShowForm(true);
  };

  const openEdit = (teacher) => {
    setEditingId(teacher.id);
    setForm({
      fullName: teacher.fullName || '',
      specialization: teacher.specialization || '',
      specializationEn: teacher.specializationEn || '',
      bio: teacher.bio || '',
      bioEn: teacher.bioEn || '',
      hourlyRate: teacher.hourlyRate ? String(teacher.hourlyRate) : '',
    });
    setPhotoPreview(teacher.photoUrl || null);
    setPhotoFile(null);
    setFormErrors({});
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setPhotoFile(null);
    setPhotoPreview(null);
    setFormErrors({});
  };

  const validate = () => {
    const errs = {};
    if (!form.fullName.trim()) errs.fullName = 'กรุณากรอกชื่อ-นามสกุล';
    if (!editingId && form.userEmail && !form.userPassword) errs.userPassword = 'กรุณากรอกรหัสผ่านหากระบุอีเมล';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = {
        fullName: form.fullName.trim(),
        specialization: form.specialization.trim() || undefined,
        specializationEn: form.specializationEn.trim(),
        bio: form.bio.trim() || undefined,
        bioEn: form.bioEn.trim(),
        hourlyRate: form.hourlyRate ? Number(form.hourlyRate) : undefined,
      };

      if (editingId) {
        await teacherService.patchTeacher(editingId, payload);
        if (photoFile) {
          await uploadService.uploadTeacherPhoto(photoFile, editingId);
        }
        showToast('แก้ไขข้อมูลครูสำเร็จ', 'success');
      } else {
        const res = await teacherService.createTeacher({
          ...payload,
          userEmail: form.userEmail.trim() || undefined,
          userPassword: form.userPassword || undefined,
          userRole: 'teacher',
        });
        const teacherId = res.data?.data?.id;
        if (photoFile && teacherId) {
          await uploadService.uploadTeacherPhoto(photoFile, teacherId);
        }
        showToast('เพิ่มครูผู้สอนสำเร็จ', 'success');
      }
      closeForm();
      fetchTeachers();
    } catch (err) {
      const msg =
        err?.data?.message ||
        err?.data?.Message ||
        err?.data?.error ||
        err?.data?.detail ||
        err?.data?.Detail ||
        'ดำเนินการไม่สำเร็จ';
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

          {/* Profile header */}
          <div
            class={`${isNeo ? 'neo-card bg-white p-6' : 'bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-sm'}`}
          >
            <div class="flex flex-col sm:flex-row items-start gap-5">
              <Avatar src={viewing.photoUrl} name={viewing.fullName} size="lg" />
              <div class="flex-1 min-w-0">
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h2 class="text-2xl font-semibold text-zinc-900 tracking-tight">{viewing.fullName}</h2>
                    <div class="flex flex-wrap items-center gap-2 mt-1.5">
                      {viewing.specialization && (
                        <span class="inline-flex items-center rounded-md bg-oasis-primary/5 px-2.5 py-0.5 text-xs font-medium text-oasis-primary">
                          {viewing.specialization}
                        </span>
                      )}
                      {viewing.userEmail && <span class="text-sm text-zinc-500">{viewing.userEmail}</span>}
                    </div>
                  </div>
                  <div class="flex gap-2 shrink-0">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        openEdit(viewing);
                        setViewing(null);
                      }}
                    >
                      แก้ไขข้อมูล
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      class="!border-oasis-danger/30 !text-oasis-danger hover:!bg-oasis-danger/5"
                      onClick={() => handleDelete(viewing)}
                    >
                      ลบ
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detail info */}
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2">
            <div
              class={`${isNeo ? 'neo-card bg-white overflow-hidden' : 'bg-white rounded-2xl border border-zinc-200/80 overflow-hidden shadow-sm'}`}
            >
              <div class={`px-6 py-4 ${isNeo ? 'border-b-2 border-black' : 'border-b border-zinc-100'}`}>
                <h3 class="text-base font-semibold text-zinc-900">ข้อมูลส่วนตัว</h3>
              </div>
              <div class="p-6">
                <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                  <InfoField label="ชื่อ-นามสกุล" value={viewing.fullName} isNeo={isNeo} />
                  <InfoField label="ความเชี่ยวชาญ" value={viewing.specialization} isNeo={isNeo} />
                  <InfoField
                    label="ค่าสอน/ชั่วโมง"
                    value={viewing.hourlyRate != null ? formatCurrency(viewing.hourlyRate) : '-'}
                    isNeo={isNeo}
                  />
                  {viewing.bio && (
                    <div class="sm:col-span-2">
                      <dt class="text-xs font-medium text-zinc-500 mb-1">ประวัติ</dt>
                      <dd class="text-sm text-zinc-900 leading-relaxed">{viewing.bio}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          </div>

          {/* Quick stats sidebar */}
          <div class="space-y-4">
            <div
              class={`${isNeo ? 'neo-card bg-white p-5' : 'bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-sm'}`}
            >
              <h4 class="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-3">สถิติ</h4>
              <div class="space-y-3">
                <div class="flex items-center justify-between text-sm">
                  <span class="text-zinc-500">จำนวนคอร์ส</span>
                  <span class="font-semibold text-zinc-900">—</span>
                </div>
                <div class="flex items-center justify-between text-sm">
                  <span class="text-zinc-500">จำนวนนักเรียน</span>
                  <span class="font-semibold text-zinc-900">—</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout path={path}>
      {/* Header */}
      <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 class={`text-2xl font-semibold tracking-tight ${isNeo ? 'text-black' : 'text-zinc-900'}`}>ครูผู้สอน</h2>
          <p class="text-sm text-zinc-500 mt-1">
            {loading ? 'กำลังโหลดรายชื่อครู...' : `พบครู ${teachers.length} คน · จัดการข้อมูลครูผู้สอนในสถาบัน`}
          </p>
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
        <div
          class={`${isNeo ? 'neo-card bg-white p-6 mb-6' : 'bg-white rounded-2xl border border-zinc-200/80 p-6 mb-6 shadow-sm'}`}
        >
          <div class="flex items-center justify-between mb-5">
            <h3 class={`text-base font-semibold ${isNeo ? 'text-black' : 'text-zinc-900'}`}>
              {editingId ? 'แก้ไขข้อมูลครูผู้สอน' : 'เพิ่มครูผู้สอนใหม่'}
            </h3>
            <button type="button" onClick={closeForm} class="text-zinc-400 hover:text-zinc-600 transition-colors p-1">
              <HiOutlineXMark class="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <SolidInput
                label="ชื่อ-นามสกุล"
                placeholder="ชื่อจริง นามสกุล"
                required
                value={form.fullName}
                onInput={updateField('fullName')}
                error={formErrors.fullName}
              />
              <SolidInput
                label="ความเชี่ยวชาญ (ไทย)"
                placeholder="เช่น คณิตศาสตร์, วิทยาศาสตร์"
                value={form.specialization}
                onInput={updateField('specialization')}
              />
              <SolidInput
                label="ความเชี่ยวชาญ (English)"
                placeholder="e.g. Mathematics, Science"
                value={form.specializationEn}
                onInput={updateField('specializationEn')}
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

              {/* Bio — full width */}
              <div class="md:col-span-2">
                <label class={`text-sm font-medium mb-1.5 block ${isNeo ? 'text-black' : 'text-zinc-800'}`}>
                  ประวัติ / ข้อมูลเพิ่มเติม (ไทย)
                </label>
                <textarea
                  value={form.bio}
                  onInput={updateField('bio')}
                  placeholder="ประสบการณ์สอน หรือข้อมูลเพิ่มเติม"
                  rows={3}
                  class={`w-full px-4 py-2.5 bg-white text-sm focus:outline-none text-zinc-800 placeholder:text-zinc-400 resize-none transition-colors ${isNeo ? 'neo-input' : 'border border-zinc-200 rounded-xl focus:border-oasis-primary focus:ring-2 focus:ring-oasis-primary/10'}`}
                />
              </div>
              <div class="md:col-span-2">
                <label class={`text-sm font-medium mb-1.5 block ${isNeo ? 'text-black' : 'text-zinc-800'}`}>
                  ประวัติ / ข้อมูลเพิ่มเติม (English)
                </label>
                <textarea
                  value={form.bioEn}
                  onInput={updateField('bioEn')}
                  placeholder="Teaching experience or additional information"
                  rows={3}
                  class={`w-full px-4 py-2.5 bg-white text-sm focus:outline-none text-zinc-800 placeholder:text-zinc-400 resize-none transition-colors ${isNeo ? 'neo-input' : 'border border-zinc-200 rounded-xl focus:border-oasis-primary focus:ring-2 focus:ring-oasis-primary/10'}`}
                />
              </div>

              {/* Account creation — only when adding a new teacher */}
              {!editingId && (
                <div class="md:col-span-2">
                  <div
                    class={`${isNeo ? 'border-2 border-black p-5' : 'bg-amber-50/50 border border-amber-200 rounded-xl p-5'}`}
                  >
                    <p class={`text-sm font-medium mb-3 ${isNeo ? 'text-black' : 'text-amber-800'}`}>
                      บัญชีผู้ใช้สำหรับเข้าสู่ระบบ <span class="font-normal text-zinc-400">(ไม่บังคับ)</span>
                    </p>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <SolidInput
                        label="อีเมล"
                        type="email"
                        placeholder="สำหรับเข้าสู่ระบบ"
                        value={form.userEmail}
                        onInput={updateField('userEmail')}
                      />
                      <SolidInput
                        label="รหัสผ่าน"
                        type="password"
                        placeholder="ตั้งรหัสผ่าน"
                        value={form.userPassword}
                        onInput={updateField('userPassword')}
                        error={formErrors.userPassword}
                      />
                      <div
                        class={`flex items-center min-h-[46px] px-4 text-sm ${isNeo ? 'neo-card bg-cyan-100 border-2' : 'rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-700'}`}
                      >
                        บัญชีนี้จะเข้าใช้งานในบทบาท <strong class="ml-1">ผู้สอน</strong> เท่านั้น
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div class={`flex gap-3 mt-6 pt-5 ${isNeo ? 'border-t-2 border-black' : 'border-t border-zinc-100'}`}>
              <Button variant="primary" size="md" type="submit" loading={submitting} disabled={submitting}>
                {editingId ? 'บันทึกการแก้ไข' : 'บันทึก'}
              </Button>
              <Button variant="outline" size="md" type="button" onClick={closeForm}>
                ยกเลิก
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              class={`${isNeo ? 'neo-card bg-white' : 'bg-white rounded-2xl border border-zinc-200/80'} animate-pulse overflow-hidden`}
            >
              <div class="flex items-start gap-4">
                <div class="h-14 w-14 rounded-full bg-zinc-200" />
                <div class="flex-1 space-y-2">
                  <div class="h-4 bg-zinc-200 rounded w-3/4" />
                  <div class="h-3 bg-zinc-100 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && teachers.length === 0 && (
        <div class="text-center py-20">
          <div
            class={`mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full ${isNeo ? 'bg-black/5 border-2 border-black' : 'bg-zinc-100'}`}
          >
            <HiOutlineUserGroup class={`h-10 w-10 ${isNeo ? 'text-black/40' : 'text-zinc-300'}`} />
          </div>
          <h3 class={`text-lg font-semibold mb-1 ${isNeo ? 'text-black' : 'text-zinc-700'}`}>ไม่พบข้อมูลครูผู้สอน</h3>
          <p class="text-sm text-zinc-400 mb-6">{search ? 'ลองเปลี่ยนคำค้นหา' : 'ยังไม่มีครูผู้สอนในสถาบัน'}</p>
          {!search && (
            <Button variant="primary" size="md" onClick={openAdd}>
              <span class="flex items-center gap-1.5">
                <HiOutlinePlus class="h-4 w-4" />
                เพิ่มครูผู้สอนคนแรก
              </span>
            </Button>
          )}
        </div>
      )}

      {/* Teacher Cards Grid */}
      {!loading && teachers.length > 0 && (
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {teachers.map((teacher) => (
            <article
              key={teacher.id}
              class={`${isNeo ? 'neo-card bg-white' : 'bg-white rounded-2xl border border-zinc-200/80 hover:border-oasis-primary/30 hover:shadow-lg'} group flex min-h-[290px] flex-col overflow-hidden transition-all duration-200`}
            >
              <button
                type="button"
                onClick={() => handleView(teacher)}
                class="flex flex-1 flex-col p-5 text-left transition-colors hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-oasis-primary"
              >
                <div class="flex w-full items-center gap-3">
                  <Avatar src={teacher.photoUrl} name={teacher.fullName} size="lg" />
                  <div class="min-w-0 flex-1">
                    <p class="mb-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">ครูผู้สอน</p>
                    <h3 class={`line-clamp-2 text-base font-bold leading-snug ${isNeo ? 'text-black' : 'text-zinc-900 group-hover:text-oasis-primary'}`}>
                      {teacher.fullName || '-'}
                    </h3>
                    {teacher.specialization && (
                      <span class="mt-1.5 inline-flex max-w-full truncate rounded-full bg-oasis-primary/10 px-2.5 py-1 text-xs font-semibold text-oasis-primary">
                        {teacher.specialization}
                      </span>
                    )}
                  </div>
                </div>

                {teacher.userEmail && <p class="mt-4 truncate text-xs text-zinc-500">{teacher.userEmail}</p>}
                <p class="mt-3 line-clamp-3 min-h-[3.75rem] text-sm leading-relaxed text-zinc-500">
                  {teacher.bio || 'ยังไม่มีข้อมูลประวัติการสอน'}
                </p>

                <div class="mt-auto flex w-full items-end justify-between gap-3 border-t border-zinc-100 pt-3">
                  <div>
                    <p class="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">ค่าสอนต่อชั่วโมง</p>
                    <p class={`mt-0.5 text-lg font-extrabold ${isNeo ? 'text-black' : 'text-oasis-primary'}`}>
                      {formatCurrency(teacher.hourlyRate)}
                    </p>
                  </div>
                  <span class="inline-flex items-center gap-1 text-xs font-semibold text-oasis-primary">
                    <HiOutlineEye class="h-4 w-4" />ดูโปรไฟล์
                  </span>
                </div>
              </button>

              {/* Action buttons */}
              <div class={`flex items-stretch ${isNeo ? 'border-t-2 border-black' : 'border-t border-zinc-100'}`}>
                <button
                  type="button"
                  onClick={() => openEdit(teacher)}
                  class="flex-1 px-4 py-2.5 text-sm font-medium text-oasis-primary hover:bg-oasis-primary/5 transition-colors flex items-center justify-center gap-1.5"
                >
                  <HiOutlinePencil class="h-4 w-4" />
                  แก้ไข
                </button>
                <div class={`w-px ${isNeo ? 'bg-black' : 'bg-zinc-100'}`} />
                <button
                  type="button"
                  onClick={() => handleDelete(teacher)}
                  class="flex-1 px-4 py-2.5 text-sm font-medium text-oasis-danger hover:bg-oasis-danger/5 transition-colors flex items-center justify-center gap-1.5"
                >
                  <HiOutlineTrash class="h-4 w-4" />
                  ลบ
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}

/* ─── Sub-components ─── */

function InfoField({ label, value, isNeo }) {
  return (
    <div>
      <dt class={`text-xs font-medium mb-0.5 ${isNeo ? 'text-black/60' : 'text-zinc-500'}`}>{label}</dt>
      <dd class={`text-sm font-medium ${isNeo ? 'text-black' : 'text-zinc-900'}`}>{value || '-'}</dd>
    </div>
  );
}
