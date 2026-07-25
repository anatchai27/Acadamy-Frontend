import { useState, useEffect, useRef } from 'preact/hooks';
import { route } from 'preact-router';
import { AdminLayout } from '../../layouts/admin-layout';
import { SolidInput, Button, showToast } from '../../components/ui';
import { BentoGrid, BentoCell } from '../../components/ui/bento-grid';
import { useDesignTheme } from '../../hooks/useDesignTheme';
import { courseService, teacherService } from '../../services';
import { useAbortController } from '../../hooks';
import { HiOutlinePlus, HiOutlineBookOpen, HiOutlineUser, HiOutlineClock, HiOutlineCalendarDays, HiOutlinePencil } from 'react-icons/hi2';

const courseTypeLabels = {
    group: 'กลุ่ม',
    private: 'เดี่ยว',
    subscription: 'บุฟเฟต์',
    video: 'วิดีโอ',
    credit: 'เครดิต',
  };

  const formatCurrency = (n) =>
  n != null ? `฿${Number(n).toLocaleString()}` : '-';

const emptyForm = {
  name: '',
  subject: '',
  courseType: 'group',
  totalSessions: '20',
  price: '',
  teacherId: '',
  expiresInDays: '',
  requireComputer: false,
  creditCost: '',
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
  const getSignal = useAbortController();
  const debounceRef = useRef(null);
  const { designTheme } = useDesignTheme();
  const isNeo = designTheme === 'neobrutalism';

  const fetchCourses = async (query = '') => {
    setLoading(true);
    try {
      const params = {};
      if (query.trim()) params.search = query.trim();
      const res = await courseService.getCourses(params, { signal: getSignal() });
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
    fetchCourses(search);
    fetchTeachers();
  }, []);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearch(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchCourses(value), 300);
  };

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
      courseType: course.courseType || 'group',
      totalSessions: String(course.totalSessions || '20'),
      price: course.price != null ? String(course.price) : '',
      teacherId: course.teacherId != null ? String(course.teacherId) : '',
      expiresInDays: course.expiresInDays != null ? String(course.expiresInDays) : '',
      requireComputer: course.requireComputer ?? false,
      creditCost: course.creditCost != null ? String(course.creditCost) : '',
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
        courseType: form.courseType,
        totalSessions: form.courseType === 'group' || form.courseType === 'private' ? (Number(form.totalSessions) || 20) : 0,
        price: form.price ? Number(form.price) : 0,
        teacherId: form.teacherId ? Number(form.teacherId) : undefined,
        expiresInDays: form.courseType === 'subscription' ? (Number(form.expiresInDays) || 30) : undefined,
        requireComputer: form.courseType === 'private' ? form.requireComputer : undefined,
        creditCost: form.courseType === 'credit' ? (Number(form.creditCost) || 1) : undefined,
      };

      if (editingId) {
        await courseService.updateCourse(editingId, payload);
        showToast('อัปเดตคอร์สเรียนสำเร็จ', 'success');
      } else {
        await courseService.createCourse(payload);
        showToast('เพิ่มคอร์สเรียนสำเร็จ', 'success');
      }

      closeForm();
      fetchCourses(search);
    } catch (err) {
      const msg = err?.data?.message || err?.data?.error || 'บันทึกไม่สำเร็จ กรุณาลองใหม่';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCourses(search);
  };

  const activeCount = courses.filter((c) => c.totalSessions > 0).length;

  return (
    <AdminLayout path={path}>
      {/* Header */}
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
        <div>
          <h2 class="text-2xl font-semibold text-zinc-900 tracking-tight">คอร์สเรียน</h2>
          <p class="text-sm text-zinc-500 mt-1">
            {courses.length > 0
              ? `ทั้งหมด ${courses.length} คอร์ส · เปิดสอน ${activeCount}`
              : 'จัดการคอร์สเรียนทั้งหมด'}
          </p>
        </div>
        <Button variant="primary" size="md" onClick={openCreate}>
          <span class="flex items-center gap-1.5">
            <HiOutlinePlus class="h-4 w-4" />
            เพิ่มคอร์สเรียน
          </span>
        </Button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div class={`${isNeo ? 'neo-card bg-white p-6' : 'bg-white rounded-2xl border border-zinc-200/80 p-6'} mb-6`}>
          <h3 class="text-base font-semibold text-zinc-900 mb-4">
            {editingId ? 'แก้ไขคอร์สเรียน' : 'เพิ่มคอร์สเรียนใหม่'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="flex flex-col gap-1.5">
                <label class={`text-sm font-medium ${isNeo ? 'text-black' : 'text-zinc-800'}`}>
                  รูปแบบคอร์สเรียน *
                </label>
                <select
                  value={form.courseType}
                  onChange={updateField('courseType')}
                  class={`w-full px-4 py-2.5 bg-white text-sm focus:outline-none text-zinc-800 ${isNeo ? 'neo-select' : 'border border-zinc-200 rounded-xl focus:border-oasis-primary focus:ring-2 focus:ring-oasis-primary/10'}`}
                >
                  <option value="group">1. คอร์สกลุ่ม (Fixed Group)</option>
                  <option value="private">2. คอร์สเดี่ยว (Flexible Private)</option>
                  <option value="subscription">3. คอร์สบุฟเฟต์ / เหมาเดือน (Subscription)</option>
                  <option value="video">4. คอร์สวิดีโอ (Video On-Demand)</option>
                  <option value="credit">5. แพ็กเกจเครดิตกลาง (Credit Wallet)</option>
                </select>
              </div>
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

              {/* Group / Private */}
              {(form.courseType === 'group' || form.courseType === 'private') && (
                <SolidInput
                  label="จำนวนคาบทั้งหมด"
                  type="number"
                  placeholder="20"
                  min="1"
                  value={form.totalSessions}
                  onInput={updateField('totalSessions')}
                />
              )}

              {/* Subscription */}
              {form.courseType === 'subscription' && (
                <SolidInput
                  label="จำนวนวันที่ใช้งานได้"
                  type="number"
                  placeholder="30"
                  min="1"
                  value={form.expiresInDays}
                  onInput={updateField('expiresInDays')}
                />
              )}

              {/* Credit */}
              {form.courseType === 'credit' && (
                <SolidInput
                  label="เครดิตที่ใช้ต่อครั้ง"
                  type="number"
                  placeholder="1"
                  min="1"
                  value={form.creditCost}
                  onInput={updateField('creditCost')}
                />
              )}

              <SolidInput
                label="ราคา (บาท)"
                type="number"
                placeholder="5000"
                min="0"
                step="0.01"
                value={form.price}
                onInput={updateField('price')}
              />

              {/* Private: require computer toggle */}
              {form.courseType === 'private' && (
                <div class="flex items-center gap-3">
                  <label class="text-sm font-medium text-zinc-800">
                    ต้องใช้คอมพิวเตอร์
                  </label>
                  <input
                    type="checkbox"
                    checked={form.requireComputer}
                    onChange={(e) => setForm((prev) => ({ ...prev, requireComputer: e.target.checked }))}
                    class="h-5 w-5 rounded border-zinc-300 text-oasis-primary focus:ring-oasis-primary/30"
                  />
                </div>
              )}

              <div class="flex flex-col gap-1.5">
                <label class={`text-sm font-medium ${isNeo ? 'text-black' : 'text-zinc-800'}`}>
                  ครูผู้สอน
                </label>
                <select
                  value={form.teacherId}
                  onChange={updateField('teacherId')}
                  class={`w-full px-4 py-2.5 bg-white text-sm focus:outline-none text-zinc-800 ${isNeo ? 'neo-select' : 'border border-zinc-200 rounded-xl focus:border-oasis-primary focus:ring-2 focus:ring-oasis-primary/10'}`}
                >
                  <option value="">เลือกครูผู้สอน</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.fullName}</option>
                  ))}
                </select>
              </div>
            </div>
            <div class="flex gap-3 mt-4 pt-4 border-t border-zinc-100">
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
      <form class="mb-6">
        <SolidInput
          type="text"
          placeholder="ค้นหาชื่อคอร์สหรือวิชา..."
          value={search}
          onInput={handleSearch}
        />
      </form>

      {/* Loading */}
      {loading && (
        <div class="text-center py-16">
          <div class="mx-auto mb-4 h-10 w-10 rounded-full border-2 border-oasis-primary border-t-transparent animate-spin" />
          <p class="text-sm text-zinc-400">กำลังโหลดข้อมูล...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && courses.length === 0 && (
        <div class="text-center py-16">
          <div class="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-zinc-100">
            <HiOutlineBookOpen class="h-10 w-10 text-zinc-300" />
          </div>
          <h3 class="text-lg font-semibold text-zinc-700 mb-1">ไม่พบคอร์สเรียน</h3>
          <p class="text-sm text-zinc-400 mb-6">
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
        <BentoGrid>
          {courses.map((course) => (
            <div
              key={course.id}
              class={`${
                isNeo
                  ? 'neo-card bg-white p-0 overflow-hidden'
                  : 'bg-white rounded-2xl border border-zinc-200/80 hover:border-oasis-primary/30 hover:shadow-md transition-all duration-200 overflow-hidden'
              }`}
            >
              <div class="p-5">
                <div class="flex items-start justify-between gap-2 mb-3">
                  <h3 class="text-base font-semibold text-zinc-900 truncate">
                    {course.name || '-'}
                  </h3>
                  <div class="shrink-0 flex items-center gap-1.5">
                    <span class="inline-flex items-center rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                      {courseTypeLabels[course.courseType] || course.courseType || 'กลุ่ม'}
                    </span>
                    <span class="inline-flex items-center rounded-md bg-oasis-primary/5 px-2 py-0.5 text-xs font-medium text-oasis-primary">
                      {course.subject || '-'}
                    </span>
                  </div>
                </div>

                <div class="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-zinc-500">
                  {course.teacherName && (
                    <span class="inline-flex items-center gap-1">
                      <HiOutlineUser class="h-3 w-3" />
                      {course.teacherName}
                    </span>
                  )}
                  {(course.courseType === 'group' || course.courseType === 'private' || !course.courseType) && course.totalSessions != null && (
                    <span class="inline-flex items-center gap-1">
                      <HiOutlineClock class="h-3 w-3" />
                      {course.totalSessions} คาบ
                    </span>
                  )}
                  {course.courseType === 'subscription' && course.expiresInDays != null && (
                    <span class="inline-flex items-center gap-1">
                      <HiOutlineClock class="h-3 w-3" />
                      {course.expiresInDays} วัน
                    </span>
                  )}
                  {course.courseType === 'credit' && course.creditCost != null && (
                    <span class="inline-flex items-center gap-1">
                      <HiOutlineClock class="h-3 w-3" />
                      {course.creditCost} เครดิต/ครั้ง
                    </span>
                  )}
                  {course.price != null && (
                    <span class="font-semibold text-oasis-primary">
                      {formatCurrency(course.price)}
                    </span>
                  )}
                </div>
              </div>

              <div class="border-t border-zinc-100 flex items-stretch">
                <button
                  type="button"
                  onClick={() => route(`/admin/courses/${course.id}/sessions`)}
                  class="flex-1 px-4 py-3 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors flex items-center justify-center gap-1.5"
                >
                  <HiOutlineCalendarDays class="h-4 w-4" />
                  ตารางสอน
                </button>
                <div class="w-px bg-zinc-100" />
                <button
                  type="button"
                  onClick={() => openEdit(course)}
                  class="flex-1 px-4 py-3 text-sm font-medium text-oasis-primary hover:bg-oasis-primary/5 transition-colors flex items-center justify-center gap-1.5"
                >
                  <HiOutlinePencil class="h-4 w-4" />
                  แก้ไข
                </button>
              </div>
            </div>
          ))}
        </BentoGrid>
      )}
    </AdminLayout>
  );
}


