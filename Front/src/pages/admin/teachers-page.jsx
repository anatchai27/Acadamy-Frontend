import { useState, useEffect, useRef } from 'preact/hooks';
import { AdminLayout } from '../../layouts/admin-layout';
import { SolidInput, Button, showToast } from '../../components/ui';
import { teacherService } from '../../services';
import { useAbortController } from '../../hooks';

const formatCurrency = (n) =>
  n ? `฿${Number(n).toLocaleString()}` : '-';

const emptyForm = {
  fullName: '',
  specialization: '',
  bio: '',
  hourlyRate: '',
  photoUrl: '',
};

export function TeachersPage({ path }) {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
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
  };

  const handleSubmitTeacher = async (e) => {
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
        photoUrl: form.photoUrl.trim() || undefined,
      };

      await teacherService.createTeacher(payload);
      showToast('เพิ่มครูผู้สอนสำเร็จ', 'success');
      setForm(emptyForm);
      setShowForm(false);
      fetchTeachers(search);
    } catch (err) {
      const msg = err?.data?.message || err?.data?.error || 'เพิ่มครูผู้สอนไม่สำเร็จ กรุณาลองใหม่';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout path={path}>
      {/* Header */}
      <div class="mb-8 flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-semibold text-zinc-900 tracking-tight">ครูผู้สอน</h2>
          <p class="text-sm text-zinc-500 mt-1">
            {teachers.length > 0 ? `ทั้งหมด ${teachers.length} คน` : 'จัดการข้อมูลครูผู้สอน'}
          </p>
        </div>
        <Button variant="primary" size="md" onClick={() => setShowForm(!showForm)}>
          <span class="flex items-center gap-1.5">
            {showForm ? <XIcon class="h-4 w-4" /> : <PlusIcon class="h-4 w-4" />}
            {showForm ? 'ปิดฟอร์ม' : 'เพิ่มครูผู้สอน'}
          </span>
        </Button>
      </div>

      {/* Add Teacher Form */}
      {showForm && (
        <div class="bg-white rounded-xl border border-zinc-200/80 p-6 mb-6">
          <h3 class="text-base font-semibold text-zinc-900 mb-4">เพิ่มครูผู้สอนใหม่</h3>
          <form onSubmit={handleSubmitTeacher}>
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
              <SolidInput
                label="ลิงก์รูปภาพ"
                placeholder="URL รูปโปรไฟล์ (ถ้ามี)"
                value={form.photoUrl}
                onInput={updateField('photoUrl')}
              />
              <div class="md:col-span-2">
                <label class="text-sm font-medium text-zinc-800 mb-1.5 block">
                  ประวัติ / ข้อมูลเพิ่มเติม
                </label>
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
                บันทึก
              </Button>
              <Button variant="outline" size="md" type="button" onClick={() => { setShowForm(false); setForm(emptyForm); }}>
                ยกเลิก
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div class="mb-6">
        <SolidInput
          type="text"
          placeholder="ค้นหาชื่อครู..."
          value={search}
          onInput={handleSearch}
        />
      </div>

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
            <Button variant="primary" size="md" onClick={() => setShowForm(true)}>
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
              class="bg-white rounded-xl border border-zinc-200/80 hover:shadow-md transition-shadow overflow-hidden"
            >
              <div class="p-5">
                <div class="flex items-start gap-4">
                  <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-oasis-primary/5 text-oasis-primary text-xl font-bold">
                    {teacher.fullName?.[0] || '?'}
                  </div>
                  <div class="flex-1 min-w-0">
                    <h3 class="text-base font-semibold text-zinc-900 truncate">
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
                  <p class="mt-3 text-sm text-zinc-600 line-clamp-2">{teacher.bio}</p>
                )}

                {teacher.hourlyRate != null && (
                  <div class="mt-3 flex items-center gap-2 text-sm">
                    <span class="text-xs font-medium text-zinc-500">ค่าสอน/ชม.</span>
                    <span class="font-bold text-oasis-primary">{formatCurrency(teacher.hourlyRate)}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}

/* ─── SVG Icons ─── */

function PlusIcon({ class: className }) {
  return (
    <svg class={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

function XIcon({ class: className }) {
  return (
    <svg class={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
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
