import { useState, useEffect, useRef } from 'preact/hooks';
import { AdminLayout } from '../../layouts/admin-layout';
import { SolidInput, Button, showToast, showConfirm, ImageUpload } from '../../components/ui';
import { teacherService, uploadService } from '../../services';
import { useAbortController } from '../../hooks';

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
            <ChevronLeftIcon class="h-4 w-4" />
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
            <div class="bg-white rounded-2xl border border-zinc-200/80 overflow-hidden">
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
            <Button variant="primary" size="md" class="w-full" onClick={() => { openEdit(viewing); setViewing(null); }}>
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
            <PlusIcon class="h-4 w-4" />
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
        <div class="bg-white rounded-2xl border border-zinc-200/80 p-6 mb-6">
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
                <label class="text-sm font-medium text-zinc-800 mb-1.5 block">ประวัติ / ข้อมูลเพิ่มเติม</label>
                <textarea
                  value={form.bio}
                  onInput={updateField('bio')}
                  placeholder="ประสบการณ์สอน หรือข้อมูลเพิ่มเติม"
                  rows={3}
                  class="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-none focus:border-oasis-primary focus:ring-2 focus:ring-oasis-primary/10 text-zinc-800 placeholder:text-zinc-400 resize-none transition-colors"
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
            <UserGroupIcon class="h-10 w-10 text-zinc-300" />
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
        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {teachers.map((teacher) => (
            <div
              key={teacher.id}
              class="bg-white rounded-2xl border border-zinc-200/80 overflow-hidden group"
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
                  <EditIcon class="h-4 w-4" />
                  แก้ไข
                </button>
                <div class="w-px bg-zinc-100" />
                <button
                  type="button"
                  onClick={() => handleDelete(teacher)}
                  class="flex-1 px-4 py-2.5 text-sm font-medium text-oasis-danger hover:bg-oasis-danger/5 transition-colors flex items-center justify-center gap-1.5"
                >
                  <TrashIcon class="h-4 w-4" />
                  ลบ
                </button>
              </div>
            </div>
          ))}
        </div>
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

/* ─── SVG Icons ─── */

function ChevronLeftIcon({ class: className }) {
  return (
    <svg class={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function PlusIcon({ class: className }) {
  return (
    <svg class={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
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

function TrashIcon({ class: className }) {
  return (
    <svg class={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

function UserGroupIcon({ class: className }) {
  return (
    <svg class={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}