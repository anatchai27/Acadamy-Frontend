import { useState, useEffect, useRef } from 'preact/hooks';
import { route } from 'preact-router';
import { AdminLayout } from '../../layouts/admin-layout';
import { SolidInput, Button, showToast } from '../../components/ui';
import { useDesignTheme } from '../../hooks/useDesignTheme';
import { courseService, teacherService, studentService, enrollmentService } from '../../services';
import { useAbortController } from '../../hooks';
import {
  HiOutlinePlus,
  HiOutlineBookOpen,
  HiOutlineClock,
  HiOutlinePencil,
  HiOutlineArrowUpRight,
  HiOutlineTag,
  HiOutlineUserPlus,
  HiOutlineMagnifyingGlass,
  HiOutlineCheckCircle,
  HiOutlineXMark,
} from 'react-icons/hi2';

const courseTypeLabels = {
  group: 'กลุ่ม',
  private: 'เดี่ยว',
  subscription: 'บุฟเฟต์',
  video: 'วิดีโอ',
  credit: 'เครดิต',
};

const courseTypeDescriptions = {
  group: 'เรียนพร้อมผู้เรียนหลายคนตามตารางสอนของสถาบัน เหมาะกับคลาสที่จัดรอบแน่นอน',
  private: 'เรียนตัวต่อตัวกับครูผู้สอน สามารถจัดวันและเวลาให้เหมาะกับผู้เรียนได้',
  subscription: 'สมัครใช้งานเป็นช่วงเวลา เช่น รายเดือน และจองคลาสที่เปิดสอนได้ภายในช่วงนั้น',
  video: 'เรียนจากวิดีโอที่บันทึกไว้ ไม่ต้องจัดตารางคาบเรียนแบบสด',
  credit: 'ซื้อเครดิตไว้ล่วงหน้า แล้วใช้เครดิตต่อการเรียนแต่ละครั้ง',
};

const formatCurrency = (n) => (n != null ? `฿${Number(n).toLocaleString()}` : '-');

const getCourseCover = (course) =>
  course.coverImage ||
  course.imageUrl ||
  course.thumbnailUrl ||
  `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 540">
    <defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#dbeafe"/><stop offset="1" stop-color="#fef3c7"/></linearGradient></defs>
    <rect width="960" height="540" fill="url(#g)"/>
    <circle cx="790" cy="100" r="130" fill="#ffffff" opacity=".35"/>
    <text x="56" y="420" fill="#29436e" font-family="Arial,sans-serif" font-size="42" font-weight="700">${course.name || 'Course'}</text>
  </svg>
`)}`;

const getOriginalPrice = (course) => course.originalPrice ?? course.listPrice ?? course.fullPrice;

const emptyForm = {
  name: '',
  nameEn: '',
  subject: '',
  subjectEn: '',
  courseType: 'group',
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
  const [showEnrollment, setShowEnrollment] = useState(false);
  const [enrollmentSearch, setEnrollmentSearch] = useState('');
  const [enrollmentStudents, setEnrollmentStudents] = useState([]);
  const [enrollmentStudentsLoading, setEnrollmentStudentsLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentEnrollments, setStudentEnrollments] = useState([]);
  const [studentEnrollmentsLoading, setStudentEnrollmentsLoading] = useState(false);
  const [studentEnrollmentsLoaded, setStudentEnrollmentsLoaded] = useState(false);
  const [courseSearch, setCourseSearch] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [enrollmentSubmitting, setEnrollmentSubmitting] = useState(false);
  const getSignal = useAbortController();
  const debounceRef = useRef(null);
  const enrollmentSearchRef = useRef(null);
  const enrollmentStudentRequestRef = useRef(0);
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
    } catch {
      /* silent */
    }
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
      nameEn: course.nameEn || '',
      subject: course.subject || '',
      subjectEn: course.subjectEn || '',
      courseType: course.courseType || 'group',
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
        nameEn: form.nameEn.trim(),
        subject: form.subject.trim(),
        subjectEn: form.subjectEn.trim(),
        courseType: form.courseType,
        price: form.price ? Number(form.price) : 0,
        teacherId: form.teacherId ? Number(form.teacherId) : undefined,
        expiresInDays: form.courseType === 'subscription' ? Number(form.expiresInDays) || 30 : undefined,
        requireComputer: form.courseType === 'private' ? form.requireComputer : undefined,
        creditCost: form.courseType === 'credit' ? Number(form.creditCost) || 1 : undefined,
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

  const searchEnrollmentStudents = async (query = '') => {
    const requestId = ++enrollmentStudentRequestRef.current;
    setEnrollmentStudentsLoading(true);
    try {
      const res = await studentService.getStudents({ page: 1, limit: 8, ...(query.trim() ? { search: query.trim() } : {}) });
      if (requestId !== enrollmentStudentRequestRef.current) return;
      const payload = res.data?.data || res.data || {};
      setEnrollmentStudents(payload.students || []);
    } catch {
      if (requestId === enrollmentStudentRequestRef.current) {
        setEnrollmentStudents([]);
        showToast('ค้นหารายชื่อนักเรียนไม่สำเร็จ', 'error');
      }
    } finally {
      if (requestId === enrollmentStudentRequestRef.current) setEnrollmentStudentsLoading(false);
    }
  };

  const openEnrollment = (course = null) => {
    setShowEnrollment(true);
    setEnrollmentSearch('');
    setEnrollmentStudents([]);
    setSelectedStudent(null);
    setStudentEnrollments([]);
    setStudentEnrollmentsLoaded(false);
    setSelectedCourseId(course && Number(course.totalSessions) > 0 ? String(course.id) : '');
    setCourseSearch('');
    searchEnrollmentStudents();
  };

  const closeEnrollment = () => {
    if (enrollmentSubmitting) return;
    setShowEnrollment(false);
    setSelectedStudent(null);
    setSelectedCourseId('');
    setStudentEnrollments([]);
    setStudentEnrollmentsLoaded(false);
  };

  const handleEnrollmentSearch = (event) => {
    const value = event.target.value;
    setEnrollmentSearch(value);
    clearTimeout(enrollmentSearchRef.current);
    enrollmentSearchRef.current = setTimeout(() => searchEnrollmentStudents(value), 250);
  };

  const selectEnrollmentStudent = async (student) => {
    setSelectedStudent(student);
    setStudentEnrollments([]);
    setStudentEnrollmentsLoaded(false);
    setStudentEnrollmentsLoading(true);
    try {
      const res = await enrollmentService.getEnrollments(student.id);
      const payload = res.data?.data || res.data || {};
      setStudentEnrollments(payload.enrollments || []);
      setStudentEnrollmentsLoaded(true);
    } catch {
      setStudentEnrollments([]);
      setStudentEnrollmentsLoaded(true);
      showToast('โหลดประวัติลงทะเบียนของนักเรียนไม่สำเร็จ', 'error');
    } finally {
      setStudentEnrollmentsLoading(false);
    }
  };

  const handleEnrollmentSubmit = async () => {
    if (!selectedStudent || !selectedCourseId || !studentEnrollmentsLoaded) return;
    setEnrollmentSubmitting(true);
    try {
      const res = await enrollmentService.enrollStudent({
        studentId: Number(selectedStudent.id),
        courseId: Number(selectedCourseId),
      });
      const data = res.data?.data || res.data || {};
      showToast(`${res.data?.message || 'ลงทะเบียนสำเร็จ'} · ${data.sessionsRemaining ?? 0} ครั้ง`, 'success');
      setShowEnrollment(false);
      setSelectedStudent(null);
      setSelectedCourseId('');
    } catch (error) {
      showToast(error?.response?.data?.message || error?.data?.message || 'ลงทะเบียนไม่สำเร็จ กรุณาลองใหม่', 'error');
    } finally {
      setEnrollmentSubmitting(false);
    }
  };

  const eligibleCourses = courses.filter((course) => Number(course.totalSessions) > 0);
  const visibleEnrollmentCourses = eligibleCourses.filter((course) =>
    `${course.name || ''} ${course.subject || ''}`.toLowerCase().includes(courseSearch.trim().toLowerCase()),
  );
  const activeCourseIds = new Set(studentEnrollments.filter((item) => Number(item.sessionsRemaining) > 0).map((item) => String(item.courseId)));
  const selectedEnrollmentCourse = eligibleCourses.find((course) => String(course.id) === selectedCourseId);
  const pricePerSession = selectedEnrollmentCourse && Number(selectedEnrollmentCourse.totalSessions) > 0
    ? Number(selectedEnrollmentCourse.price || 0) / Number(selectedEnrollmentCourse.totalSessions)
    : 0;

  const activeCount = courses.filter((c) => c.totalSessions > 0).length;

  return (
    <AdminLayout path={path}>
      {/* Header */}
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
        <div>
          <h2 class="text-2xl font-semibold text-zinc-900 tracking-tight">รายละเอียดวิชา</h2>
          <p class="text-sm text-zinc-500 mt-1">
            {courses.length > 0 ? 'ข้อมูลวิชาและคอร์สเรียนที่เปิดให้ลงทะเบียน' : 'จัดการรายละเอียดวิชาและคอร์สเรียน'}
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <Button variant="primary" size="md" onClick={() => openEnrollment()}>
            <span class="flex items-center gap-1.5">
              <HiOutlineUserPlus class="h-4 w-4" />
              ลงทะเบียนนักเรียน
            </span>
          </Button>
          <Button variant="outline" size="md" onClick={openCreate}>
          <span class="flex items-center gap-1.5">
            <HiOutlinePlus class="h-4 w-4" />
            เพิ่มคอร์สเรียน
          </span>
          </Button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div class={`${isNeo ? 'neo-card bg-white p-6' : 'bg-white rounded-2xl border border-zinc-200/80 p-6'} mb-6`}>
          <h3 class="text-base font-semibold text-zinc-900 mb-4">
            {editingId ? 'แก้ไขรายละเอียดวิชา' : 'เพิ่มรายละเอียดวิชา'}
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
                  <option value="group">คอร์สกลุ่ม</option>
                  <option value="private">คอร์สตัวต่อตัว</option>
                  <option value="subscription" disabled>
                    คอร์สสมาชิก / รายเดือน (ยังไม่เปิดใช้งาน)
                  </option>
                  <option value="video" disabled>
                    คอร์สวิดีโอ (ยังไม่เปิดใช้งาน)
                  </option>
                  <option value="credit" disabled>
                    แพ็กเกจเครดิต (ยังไม่เปิดใช้งาน)
                  </option>
                </select>
                <p class="text-xs leading-relaxed text-zinc-500">{courseTypeDescriptions[form.courseType]}</p>
              </div>
              <SolidInput
                label="ชื่อวิชา / ชื่อคอร์ส (ไทย) *"
                placeholder="เช่น คณิตศาสตร์ ม.1 เทอม 1"
                required
                value={form.name}
                onInput={updateField('name')}
              />
              <SolidInput
                label="ชื่อวิชา / ชื่อคอร์ส (English)"
                placeholder="e.g. Mathematics Grade 7"
                value={form.nameEn}
                onInput={updateField('nameEn')}
              />
              <div class="flex flex-col gap-1.5 md:col-span-2">
                <label class={`text-sm font-medium ${isNeo ? 'text-black' : 'text-zinc-800'}`}>
                  รายละเอียดวิชา (ไทย) *
                </label>
                <textarea
                  placeholder="เช่น เนื้อหาที่เรียน เป้าหมาย ระดับชั้น หรือรายละเอียดเพิ่มเติม"
                  required
                  maxLength="1000"
                  rows="4"
                  value={form.subject}
                  onInput={updateField('subject')}
                  class={`w-full resize-y px-4 py-3 text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none ${isNeo ? 'neo-input' : 'rounded-xl border border-zinc-200 focus:border-oasis-primary focus:ring-2 focus:ring-oasis-primary/10'}`}
                />
                <span class="text-xs text-zinc-400">ใส่รายละเอียดได้สูงสุด 1,000 ตัวอักษร</span>
              </div>
              <div class="flex flex-col gap-1.5 md:col-span-2">
                <label class={`text-sm font-medium ${isNeo ? 'text-black' : 'text-zinc-800'}`}>
                  รายละเอียดวิชา (English)
                </label>
                <textarea
                  placeholder="Course content, goals, grade level, or other details"
                  maxLength="1000"
                  rows="4"
                  value={form.subjectEn}
                  onInput={updateField('subjectEn')}
                  class={`w-full resize-y px-4 py-3 text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none ${isNeo ? 'neo-input' : 'rounded-xl border border-zinc-200 focus:border-oasis-primary focus:ring-2 focus:ring-oasis-primary/10'}`}
                />
                <span class="text-xs text-zinc-400">Optional, up to 1,000 characters</span>
              </div>

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
                  <label class="text-sm font-medium text-zinc-800">ต้องใช้คอมพิวเตอร์</label>
                  <input
                    type="checkbox"
                    checked={form.requireComputer}
                    onChange={(e) => setForm((prev) => ({ ...prev, requireComputer: e.target.checked }))}
                    class="h-5 w-5 rounded border-zinc-300 text-oasis-primary focus:ring-oasis-primary/30"
                  />
                </div>
              )}

              <div class="flex flex-col gap-1.5">
                <label class={`text-sm font-medium ${isNeo ? 'text-black' : 'text-zinc-800'}`}>ครูผู้สอน</label>
                <select
                  value={form.teacherId}
                  onChange={updateField('teacherId')}
                  class={`w-full px-4 py-2.5 bg-white text-sm focus:outline-none text-zinc-800 ${isNeo ? 'neo-select' : 'border border-zinc-200 rounded-xl focus:border-oasis-primary focus:ring-2 focus:ring-oasis-primary/10'}`}
                >
                  <option value="">เลือกครูผู้สอน</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.fullName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div class="flex gap-3 mt-4 pt-4 border-t border-zinc-100">
              <Button variant="primary" size="md" type="submit" loading={submitting} disabled={submitting}>
                {editingId ? 'อัปเดตรายละเอียด' : 'บันทึกรายละเอียด'}
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
        <SolidInput type="text" placeholder="ค้นหาชื่อคอร์สหรือวิชา..." value={search} onInput={handleSearch} />
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
          <p class="text-sm text-zinc-400 mb-6">{search ? 'ลองเปลี่ยนคำค้นหา' : 'ยังไม่มีคอร์สเรียนในสถาบัน'}</p>
          {!search && (
            <Button variant="primary" size="md" onClick={openCreate}>
              + เพิ่มคอร์สเรียนแรก
            </Button>
          )}
        </div>
      )}

      {/* Courses Grid */}
      {!loading && courses.length > 0 && (
        <>
          <div class="mb-4">
            <h3 class="font-semibold text-zinc-900">รายละเอียดวิชาและการสอน</h3>
            <p class="mt-1 text-xs text-zinc-500">เลือกการ์ดเพื่อดูรายละเอียดการสอนและกำหนดวัน เวลา และสถานที่เรียน</p>
          </div>
          <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <article
                key={course.id}
                role="link"
                tabIndex="0"
                onClick={() => route(`/admin/courses/${course.id}/sessions`)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    route(`/admin/courses/${course.id}/sessions`);
                  }
                }}
                class={`${
                  isNeo
                    ? 'neo-card bg-white'
                    : 'rounded-2xl border border-zinc-200/80 bg-white shadow-sm hover:-translate-y-0.5 hover:border-oasis-primary/30 hover:shadow-lg'
                } group cursor-pointer overflow-hidden transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-oasis-primary/30`}
              >
                <div class="relative aspect-[16/9] overflow-hidden bg-slate-100">
                  <img
                    src={getCourseCover(course)}
                    alt=""
                    class="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = getCourseCover({
                        ...course,
                        coverImage: undefined,
                        imageUrl: undefined,
                        thumbnailUrl: undefined,
                      });
                    }}
                  />
                  <div class="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                  <span class="absolute left-3 bottom-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-zinc-700 backdrop-blur-sm">
                    <HiOutlineTag class="h-3.5 w-3.5" />
                    {courseTypeLabels[course.courseType] || course.courseType || 'กลุ่ม'}
                  </span>
                  <button
                    type="button"
                    aria-label={`แก้ไข ${course.name || 'คอร์สเรียน'}`}
                    title="แก้ไขคอร์สเรียน"
                    onClick={(event) => {
                      event.stopPropagation();
                      openEdit(course);
                    }}
                    class="absolute right-3 top-3 rounded-full bg-white/95 p-2 text-zinc-600 shadow-sm transition hover:bg-white hover:text-oasis-primary"
                  >
                    <HiOutlinePencil class="h-4 w-4" />
                  </button>
                </div>

                <div class="flex min-h-[190px] flex-col p-4">
                  <div class="min-w-0">
                    <h3 class="line-clamp-2 text-lg font-bold leading-snug text-zinc-900">{course.name || '-'}</h3>
                    <p class="mt-1.5 flex items-center gap-1.5 text-sm text-zinc-500">
                      <span class="inline-block h-1.5 w-1.5 rounded-full bg-oasis-primary/60" />
                      <span class="truncate">{course.teacherName || 'ยังไม่กำหนดผู้สอน'}</span>
                    </p>
                    <p class="mt-3 line-clamp-2 text-xs leading-relaxed text-zinc-400">
                      {course.subject || 'ยังไม่ได้ระบุรายละเอียดวิชา'}
                    </p>
                  </div>

                  <div class="mt-auto flex items-end justify-between gap-3 border-t border-zinc-100 pt-3">
                    <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-zinc-400">
                      {(course.courseType === 'group' || course.courseType === 'private' || !course.courseType) &&
                        course.totalSessions != null && (
                          <span class="inline-flex items-center gap-1" title="คาบเรียนในอนาคตตามตาราง">
                            <HiOutlineClock class="h-3 w-3" />
                            {course.totalSessions} คาบในตาราง
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
                      <span>#{course.id}</span>
                    </div>
                    <div class="shrink-0 text-right">
                      {getOriginalPrice(course) > Number(course.price) && (
                        <div class="text-xs text-zinc-400 line-through">{formatCurrency(getOriginalPrice(course))}</div>
                      )}
                      <div class="text-xl font-extrabold tracking-tight text-orange-600">
                        {formatCurrency(course.price)}
                      </div>
                    </div>
                  </div>
                  <span class="mt-2 flex items-center justify-end gap-1 text-[11px] font-medium text-oasis-primary opacity-0 transition-opacity group-hover:opacity-100">
                    ดูรายละเอียด <HiOutlineArrowUpRight class="h-3.5 w-3.5" />
                  </span>
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      {showEnrollment && (
        <div class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6" role="presentation">
          <button type="button" aria-label="ปิดหน้าต่าง" class="absolute inset-0 bg-zinc-950/55 backdrop-blur-sm" onClick={closeEnrollment} />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="enrollment-dialog-title"
            class={`relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden ${isNeo ? 'neo-card bg-white' : 'rounded-2xl bg-white shadow-2xl'}`}
          >
            <header class="flex items-start justify-between border-b border-zinc-100 px-5 py-4 sm:px-6">
              <div>
                <p class="text-xs font-semibold uppercase tracking-[0.14em] text-oasis-primary">เริ่มเรียนได้ในไม่กี่ขั้นตอน</p>
                <h2 id="enrollment-dialog-title" class="mt-1 text-xl font-bold text-zinc-900">ลงทะเบียนเรียน</h2>
                <p class="mt-1 text-sm text-zinc-500">เลือกนักเรียนและคอร์ส ระบบจะสรุปค่าเรียนให้ก่อนยืนยัน</p>
              </div>
              <button type="button" aria-label="ปิด" onClick={closeEnrollment} class="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700">
                <HiOutlineXMark class="h-5 w-5" />
              </button>
            </header>

            <div class="overflow-y-auto px-5 py-5 sm:px-6">
              <div class="grid gap-5 md:grid-cols-[0.9fr_1.1fr]">
                <section>
                  <label for="enrollment-student-search" class="text-sm font-semibold text-zinc-800">1. เลือกนักเรียน</label>
                  {selectedStudent ? (
                    <div class="mt-2 flex items-center justify-between rounded-xl border border-oasis-primary/25 bg-oasis-primary/5 p-3">
                      <div class="flex min-w-0 items-center gap-3">
                        <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-oasis-primary">
                          {selectedStudent.nickname?.[0] || selectedStudent.fullName?.[0] || '?'}
                        </span>
                        <div class="min-w-0">
                          <p class="truncate text-sm font-semibold text-zinc-900">{selectedStudent.fullName}</p>
                          <p class="truncate text-xs text-zinc-500">{selectedStudent.grade || 'ไม่ระบุชั้นเรียน'}{selectedStudent.nickname ? ` · ${selectedStudent.nickname}` : ''}</p>
                        </div>
                      </div>
                      <button type="button" onClick={() => { setSelectedStudent(null); setStudentEnrollmentsLoaded(false); setSelectedCourseId(''); }} class="shrink-0 text-xs font-semibold text-oasis-primary hover:underline">เปลี่ยน</button>
                    </div>
                  ) : (
                    <>
                      <div class="relative mt-2">
                        <HiOutlineMagnifyingGlass class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                        <input
                          id="enrollment-student-search"
                          type="search"
                          autoFocus
                          value={enrollmentSearch}
                          onInput={handleEnrollmentSearch}
                          placeholder="ค้นหาชื่อหรือเบอร์โทร"
                          class="w-full rounded-xl border border-zinc-200 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-oasis-primary focus:ring-2 focus:ring-oasis-primary/10"
                        />
                      </div>
                      <div class="mt-2 max-h-52 space-y-1 overflow-y-auto">
                        {enrollmentStudentsLoading ? (
                          <p class="py-6 text-center text-sm text-zinc-400">กำลังค้นหา...</p>
                        ) : enrollmentStudents.length ? enrollmentStudents.map((student) => (
                          <button
                            key={student.id}
                            type="button"
                            onClick={() => selectEnrollmentStudent(student)}
                            class="flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition hover:bg-zinc-50"
                          >
                            <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-sm font-semibold text-zinc-600">
                              {student.nickname?.[0] || student.fullName?.[0] || '?'}
                            </span>
                            <span class="min-w-0">
                              <span class="block truncate text-sm font-semibold text-zinc-800">{student.fullName}</span>
                              <span class="block truncate text-xs text-zinc-500">{student.grade || 'ไม่ระบุชั้นเรียน'}{student.primaryParentPhone ? ` · ${student.primaryParentPhone}` : ''}</span>
                            </span>
                          </button>
                        )) : (
                          <p class="py-6 text-center text-sm text-zinc-400">ไม่พบนักเรียน ลองค้นหาด้วยชื่อหรือเบอร์โทร</p>
                        )}
                      </div>
                    </>
                  )}
                </section>

                <section>
                  <label for="enrollment-course-search" class="text-sm font-semibold text-zinc-800">2. เลือกคอร์ส</label>
                  <div class="relative mt-2">
                    <HiOutlineMagnifyingGlass class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                    <input
                      id="enrollment-course-search"
                      type="search"
                      value={courseSearch}
                      onInput={(event) => setCourseSearch(event.target.value)}
                      placeholder="ค้นหาชื่อคอร์สหรือวิชา"
                      class="w-full rounded-xl border border-zinc-200 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-oasis-primary focus:ring-2 focus:ring-oasis-primary/10"
                    />
                  </div>
                  <div class="mt-2 max-h-52 space-y-2 overflow-y-auto">
                    {visibleEnrollmentCourses.map((course) => {
                      const isAlreadyEnrolled = activeCourseIds.has(String(course.id));
                      const isSelected = String(course.id) === selectedCourseId;
                      return (
                        <button
                          key={course.id}
                          type="button"
                          disabled={!selectedStudent || studentEnrollmentsLoading || !studentEnrollmentsLoaded || isAlreadyEnrolled}
                          onClick={() => setSelectedCourseId(String(course.id))}
                          class={`flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-55 ${isSelected ? 'border-oasis-primary bg-oasis-primary/5 ring-2 ring-oasis-primary/10' : 'border-zinc-200 hover:border-zinc-300'}`}
                        >
                          <span class="min-w-0">
                            <span class="block truncate text-sm font-semibold text-zinc-900">{course.name}</span>
                            <span class="mt-0.5 block text-xs text-zinc-500">{Number(course.totalSessions)} คาบในตาราง · ฿{Number(course.price || 0).toLocaleString()}</span>
                            {isAlreadyEnrolled && <span class="mt-1 block text-xs font-medium text-amber-700">ลงทะเบียนแล้ว · เหลือ {studentEnrollments.find((item) => String(item.courseId) === String(course.id))?.sessionsRemaining || 0} คาบ</span>}
                          </span>
                          {isSelected && <HiOutlineCheckCircle class="h-5 w-5 shrink-0 text-oasis-primary" />}
                        </button>
                      );
                    })}
                    {visibleEnrollmentCourses.length === 0 && (
                      <p class="py-6 text-center text-sm text-zinc-400">
                        {eligibleCourses.length === 0
                          ? 'ยังไม่มีคาบเรียนในอนาคต กรุณาจัดตารางเรียนของคอร์สก่อน'
                          : 'ไม่พบคอร์สที่ตรงกับคำค้นหา'}
                      </p>
                    )}
                    {selectedStudent && studentEnrollmentsLoading && <p class="text-xs text-zinc-400">กำลังตรวจสอบคอร์สที่นักเรียนลงทะเบียนไว้...</p>}
                  </div>
                </section>
              </div>

              {selectedEnrollmentCourse && (
                <div class="mt-5 rounded-2xl bg-zinc-50 p-4 sm:p-5">
                  <div class="flex items-start justify-between gap-3">
                    <div>
                      <p class="text-xs font-semibold uppercase tracking-wide text-zinc-500">สรุปก่อนลงทะเบียน</p>
                      <p class="mt-1 font-bold text-zinc-900">{selectedEnrollmentCourse.name}</p>
                    </div>
                    <div class="text-right">
                      <p class="text-xs text-zinc-500">ค่าเรียนทั้งคอร์ส</p>
                      <p class="text-xl font-extrabold text-orange-600">฿{Number(selectedEnrollmentCourse.price || 0).toLocaleString()}</p>
                    </div>
                  </div>
                  <div class="mt-4 grid grid-cols-2 gap-3 border-t border-zinc-200 pt-3 text-sm">
                    <div><p class="text-xs text-zinc-500">คาบที่ยังไม่ถึงวันเรียน</p><p class="mt-0.5 font-semibold text-zinc-800">{Number(selectedEnrollmentCourse.totalSessions)} คาบ</p></div>
                    <div><p class="text-xs text-zinc-500">เฉลี่ยต่อคาบที่เหลือ</p><p class="mt-0.5 font-semibold text-zinc-800">฿{pricePerSession.toLocaleString('th-TH', { maximumFractionDigits: 2 })}</p></div>
                  </div>
                </div>
              )}
              <p class="mt-4 text-xs leading-relaxed text-zinc-500">การลงทะเบียนจะเพิ่มสิทธิ์เรียนให้ {selectedStudent?.fullName || 'นักเรียน'} แต่ยังไม่บันทึกการชำระเงิน สามารถบันทึกรับเงินได้ที่เมนูการเงิน</p>
            </div>

            <footer class="flex flex-col-reverse gap-2 border-t border-zinc-100 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <span class="text-xs text-zinc-400">ไม่มีค่าใช้จ่ายใดถูกบันทึกในขั้นตอนนี้</span>
              <div class="flex justify-end gap-2">
                <Button variant="outline" size="md" onClick={closeEnrollment}>ยกเลิก</Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleEnrollmentSubmit}
                  loading={enrollmentSubmitting}
                  disabled={!selectedStudent || !selectedCourseId || !studentEnrollmentsLoaded || studentEnrollmentsLoading || enrollmentSubmitting}
                >
                  ยืนยันลงทะเบียน
                </Button>
              </div>
            </footer>
          </section>
        </div>
      )}
    </AdminLayout>
  );
}
