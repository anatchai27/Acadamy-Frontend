import { useState, useEffect } from 'preact/hooks';
import { route } from 'preact-router';
import { AdminLayout } from '../../layouts/admin-layout';
import { SolidInput, Button, showToast } from '../../components/ui';
import { courseService, teacherService } from '../../services';

const formatCurrency = (n) =>
  n != null ? `฿${Number(n).toLocaleString()}` : '-';

const emptyForm = {
  name: '',
  subject: '',
  totalSessions: '20',
  price: '',
  teacherId: '',
};

export function CoursesPage({ path }) {
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      const res = await courseService.getCourses(params);
      const payload = res.data?.data || res.data || {};
      setCourses(payload.courses || (Array.isArray(payload) ? payload : []));
    } catch {
      showToast('ไม่สามารถโหลดข้อมูลคอร์สเรียนได้', 'error');
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const res = await teacherService.getTeachers();
      setTeachers(Array.isArray(res.data) ? res.data : res.data?.data || []);
    } catch { /* silent */ }
  };

  useEffect(() => {
    fetchCourses();
    fetchTeachers();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (course) => {
    setEditingId(course.id);
    setForm({
      name: course.name || '',
      subject: course.subject || '',
      totalSessions: String(course.totalSessions || '20'),
      price: course.price != null ? String(course.price) : '',
      teacherId: course.teacherId != null ? String(course.teacherId) : '',
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const updateField = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.subject.trim()) {
      showToast('กรุณากรอกชื่อคอร์สและวิชา', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        subject: form.subject.trim(),
        totalSessions: Number(form.totalSessions) || 20,
        price: form.price ? Number(form.price) : 0,
        teacherId: form.teacherId ? Number(form.teacherId) : undefined,
      };

      if (editingId) {
        await courseService.updateCourse(editingId, payload);
        showToast('อัปเดตคอร์สเรียนสำเร็จ', 'success');
      } else {
        await courseService.createCourse(payload);
        showToast('เพิ่มคอร์สเรียนสำเร็จ', 'success');
      }

      closeForm();
      fetchCourses();
    } catch (err) {
      const msg = err?.data?.message || err?.data?.error || 'บันทึกไม่สำเร็จ กรุณาลองใหม่';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCourses();
  };

  const activeCount = courses.filter((c) => c.totalSessions > 0).length;

  return (
    <AdminLayout path={path}>
      {/* Header */}
      <div class="mb-8 flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold text-tiwhub-heading dark:text-white">คอร์สเรียน</h2>
          <p class="text-sm text-tiwhub-muted dark:text-tiwhub-muted/70 mt-1">
            {courses.length > 0
              ? `ทั้งหมด ${courses.length} คอร์ส · เปิดสอน ${activeCount}`
              : 'จัดการคอร์สเรียนทั้งหมด'}
          </p>
        </div>
        <Button variant="primary" size="md" onClick={openCreate}>
          <span class="flex items-center gap-1.5">
            <PlusIcon class="h-4 w-4" />
            เพิ่มคอร์สเรียน
          </span>
        </Button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 mb-6">
          <h3 class="text-base font-semibold text-slate-900 dark:text-white mb-4">
            {editingId ? 'แก้ไขคอร์สเรียน' : 'เพิ่มคอร์สเรียนใหม่'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SolidInput
                label="ชื่อคอร์ส *"
                placeholder="เช่น คณิตศาสตร์ ม.1 เทอม 1"
                required
                value={form.name}
                onInput={updateField('name')}
              />
              <SolidInput
                label="วิชา *"
                placeholder="เช่น คณิตศาสตร์"
                required
                value={form.subject}
                onInput={updateField('subject')}
              />
              <SolidInput
                label="จำนวนคาบทั้งหมด"
                type="number"
                placeholder="20"
                min="1"
                value={form.totalSessions}
                onInput={updateField('totalSessions')}
              />
              <SolidInput
                label="ราคา (บาท)"
                type="number"
                placeholder="5000"
                min="0"
                step="0.01"
                value={form.price}
                onInput={updateField('price')}
              />
              <div class="flex flex-col gap-1.5">
                <label class="text-sm font-medium text-slate-900 dark:text-slate-200">
                  ครูผู้สอน
                </label>
                <select
                  value={form.teacherId}
                  onChange={updateField('teacherId')}
                  class="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 focus:ring-1 focus:ring-amber-500 text-slate-900 dark:text-white"
                >
                  <option value="">เลือกครูผู้สอน</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.fullName}</option>
                  ))}
                </select>
              </div>
            </div>
            <div class="flex gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
              <Button variant="primary" size="md" type="submit" loading={submitting} disabled={submitting}>
                {editingId ? 'อัปเดตคอร์ส' : 'บันทึกคอร์ส'}
              </Button>
              <Button variant="outline" size="md" type="button" onClick={closeForm}>
                ยกเลิก
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <form onSubmit={handleSearchSubmit} class="mb-6 flex gap-2">
        <div class="flex-1">
          <SolidInput
            type="text"
            placeholder="ค้นหาชื่อคอร์สหรือวิชา..."
            value={search}
            onInput={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" size="md" type="submit">ค้นหา</Button>
      </form>

      {/* Loading */}
      {loading && (
        <div class="text-center py-16">
          <div class="mx-auto mb-4 h-10 w-10 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
          <p class="text-sm text-slate-400">กำลังโหลดข้อมูล...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && courses.length === 0 && (
        <div class="text-center py-16">
          <div class="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
            <BookIcon class="h-10 w-10 text-slate-300 dark:text-slate-600" />
          </div>
          <h3 class="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-1">ไม่พบคอร์สเรียน</h3>
          <p class="text-sm text-slate-400 mb-6">
            {search ? 'ลองเปลี่ยนคำค้นหา' : 'ยังไม่มีคอร์สเรียนในสถาบัน'}
          </p>
          {!search && (
            <Button variant="primary" size="md" onClick={openCreate}>
              + เพิ่มคอร์สเรียนแรก
            </Button>
          )}
        </div>
      )}

      {/* Courses Grid */}
      {!loading && courses.length > 0 && (
        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {courses.map((course) => (
            <div
              key={course.id}
              class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-600 hover:shadow-md transition-all duration-200 overflow-hidden"
            >
              <div class="p-5">
                <div class="flex items-start justify-between gap-2 mb-3">
                  <h3 class="text-base font-semibold text-slate-900 dark:text-white truncate">
                    {course.name || '-'}
                  </h3>
                  <span class="shrink-0 inline-flex items-center rounded-md bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 text-xs font-medium text-blue-600 dark:text-blue-400">
                    {course.subject || '-'}
                  </span>
                </div>

                <div class="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                  {course.teacherName && (
                    <span class="inline-flex items-center gap-1">
                      <UserIcon class="h-3 w-3" />
                      {course.teacherName}
                    </span>
                  )}
                  {course.totalSessions != null && (
                    <span class="inline-flex items-center gap-1">
                      <ClockIcon class="h-3 w-3" />
                      {course.totalSessions} คาบ
                    </span>
                  )}
                  {course.price != null && (
                    <span class="font-bold text-amber-600 dark:text-amber-400">
                      {formatCurrency(course.price)}
                    </span>
                  )}
                </div>
              </div>

              <div class="border-t border-slate-100 dark:border-slate-700 flex items-stretch">
                <button
                  type="button"
                  onClick={() => route(`/admin/courses/${course.id}/sessions`)}
                  class="flex-1 px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1.5"
                >
                  <CalendarIcon class="h-4 w-4" />
                  ตารางสอน
                </button>
                <div class="w-px bg-slate-100 dark:bg-slate-700" />
                <button
                  type="button"
                  onClick={() => openEdit(course)}
                  class="flex-1 px-4 py-3 text-sm font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors flex items-center justify-center gap-1.5"
                >
                  <EditIcon class="h-4 w-4" />
                  แก้ไข
                </button>
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

function BookIcon({ class: className }) {
  return (
    <svg class={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
}

function UserIcon({ class: className }) {
  return (
    <svg class={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function ClockIcon({ class: className }) {
  return (
    <svg class={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function CalendarIcon({ class: className }) {
  return (
    <svg class={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
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
