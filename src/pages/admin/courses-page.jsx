import { AdminLayout } from '../../layouts/admin-layout';

const courses = [
  {
    id: 1,
    title: 'JavaScript Basics',
    description: 'เรียนรู้พื้นฐาน JavaScript สำหรับผู้เริ่มต้น',
    students: 45,
    lessons: 12,
    progress: 75,
    status: 'active',
    color: 'primary',
  },
  {
    id: 2,
    title: 'React 101',
    description: 'สร้าง Web Application ด้วย React',
    students: 32,
    lessons: 8,
    progress: 60,
    status: 'active',
    color: 'success',
  },
  {
    id: 3,
    title: 'Node.js Advanced',
    description: 'พัฒนา Backend ด้วย Node.js ขั้นสูง',
    students: 28,
    lessons: 15,
    progress: 40,
    status: 'draft',
    color: 'accent',
  },
  {
    id: 4,
    title: 'Python for Beginners',
    description: 'พื้นฐานการเขียนโปรแกรมด้วย Python',
    students: 67,
    lessons: 10,
    progress: 90,
    status: 'active',
    color: 'danger',
  },
];

const colorBarMap = {
  primary: 'bg-tiwhub-primary dark:bg-tiwhub-primary-light',
  success: 'bg-tiwhub-success dark:bg-tiwhub-success',
  accent: 'bg-tiwhub-accent dark:bg-tiwhub-accent-light',
  danger: 'bg-tiwhub-danger dark:bg-tiwhub-danger',
};

const colorBorderMap = {
  primary: 'border-l-tiwhub-primary',
  success: 'border-l-tiwhub-success',
  accent: 'border-l-tiwhub-accent',
  danger: 'border-l-tiwhub-danger',
};

export function CoursesPage({ path }) {
  return (
    <AdminLayout path={path}>
      {/* Header */}
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h2 class="text-2xl font-bold text-tiwhub-heading dark:text-white">จัดการคอร์สเรียน</h2>
          <p class="text-sm text-tiwhub-muted dark:text-tiwhub-muted/70 mt-1">จัดการคอร์สเรียนทั้งหมดในระบบ</p>
        </div>
        <div class="flex items-center gap-3">
          <div class="relative">
            <SearchIcon class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-tiwhub-muted" />
            <input
              type="text"
              placeholder="ค้นหาคอร์ส..."
              class="pl-9 pr-4 py-2 text-sm border border-tiwhub-border-light dark:border-tiwhub-border/20 rounded-xl bg-tiwhub-surface dark:bg-tiwhub-heading/50 text-tiwhub-heading dark:text-white placeholder-tiwhub-muted focus:outline-none focus:ring-2 focus:ring-tiwhub-primary/20 focus:border-tiwhub-primary w-48 transition-all"
            />
          </div>
          <button class="inline-flex items-center gap-2 bg-tiwhub-primary hover:bg-tiwhub-primary-dark text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98]">
            <PlusIcon class="h-4 w-4" />
            เพิ่มคอร์ส
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'ทั้งหมด', value: courses.length, color: 'primary' },
          { label: 'เปิดสอน', value: courses.filter((c) => c.status === 'active').length, color: 'success' },
          { label: 'ฉบับร่าง', value: courses.filter((c) => c.status === 'draft').length, color: 'accent' },
          { label: 'ผู้เรียนทั้งหมด', value: courses.reduce((s, c) => s + c.students, 0), color: 'danger' },
        ].map((stat) => (
          <div key={stat.label} class="bg-tiwhub-surface dark:bg-tiwhub-heading/80 rounded-2xl p-4 shadow-sm border border-tiwhub-border-light dark:border-tiwhub-border/20">
            <p class="text-xs font-medium text-tiwhub-muted dark:text-tiwhub-muted/60">{stat.label}</p>
            <p class="text-xl font-bold text-tiwhub-heading dark:text-white mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Course Grid */}
      <div class="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {courses.map((course) => (
          <div
            key={course.id}
            class={`group bg-tiwhub-surface dark:bg-tiwhub-heading/80 rounded-2xl overflow-hidden shadow-sm border-l-4 ${colorBorderMap[course.color]} border-t border-r border-b border-tiwhub-border-light dark:border-tiwhub-border/20 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300`}
          >
            {/* Card Header with gradient */}
            <div class={`h-2 ${colorBarMap[course.color]}`} />

            <div class="p-5">
              <div class="flex items-start justify-between mb-3">
                <div class="flex-1 min-w-0">
                  <h3 class="text-base font-semibold text-tiwhub-heading dark:text-white truncate">
                    {course.title}
                  </h3>
                  <p class="text-sm text-tiwhub-muted dark:text-tiwhub-muted/70 mt-0.5 line-clamp-2">
                    {course.description}
                  </p>
                </div>
                {course.status === 'draft' && (
                  <span class="ml-2 shrink-0 inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-tiwhub-accent/10 text-tiwhub-accent-dark dark:bg-tiwhub-accent/15 dark:text-tiwhub-accent-light">
                    ฉบับร่าง
                  </span>
                )}
              </div>

              {/* Meta */}
              <div class="flex items-center gap-4 text-xs text-tiwhub-muted dark:text-tiwhub-muted/60 mb-4">
                <span class="inline-flex items-center gap-1">
                  <UserIcon class="h-3.5 w-3.5" />
                  {course.students} คน
                </span>
                <span class="inline-flex items-center gap-1">
                  <LessonIcon class="h-3.5 w-3.5" />
                  {course.lessons} บทเรียน
                </span>
              </div>

              {/* Progress */}
              <div class="mb-4">
                <div class="flex items-center justify-between text-xs mb-1.5">
                  <span class="text-tiwhub-muted dark:text-tiwhub-muted/60">ความคืบหน้า</span>
                  <span class={`font-semibold text-tiwhub-heading dark:text-white`}>
                    {course.progress}%
                  </span>
                </div>
                <div class="w-full bg-tiwhub-border-light dark:bg-tiwhub-border/20 rounded-full h-1.5 overflow-hidden">
                  <div
                    class={`h-full rounded-full ${colorBarMap[course.color]} transition-all duration-500`}
                    style={`width: ${course.progress}%`}
                  />
                </div>
              </div>

              {/* Actions */}
              <div class="flex items-center gap-2 pt-3 border-t border-tiwhub-border-light dark:border-tiwhub-border/20">
                <button class="flex-1 text-center text-sm font-medium text-tiwhub-body dark:text-tiwhub-muted hover:text-tiwhub-heading dark:hover:text-white py-1.5 rounded-lg hover:bg-tiwhub-surface-hover dark:hover:bg-tiwhub-heading/40 transition-colors">
                  แก้ไข
                </button>
                <button class="flex-1 text-center text-sm font-medium text-tiwhub-body dark:text-tiwhub-muted hover:text-tiwhub-danger dark:hover:text-tiwhub-danger py-1.5 rounded-lg hover:bg-tiwhub-danger/10 dark:hover:bg-tiwhub-danger/10 transition-colors">
                  ลบ
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Add New Course Card */}
        <button class="group bg-tiwhub-surface dark:bg-tiwhub-heading/80 rounded-2xl border-2 border-dashed border-tiwhub-border dark:border-tiwhub-border/30 hover:border-tiwhub-primary dark:hover:border-tiwhub-primary-light transition-all duration-300 flex flex-col items-center justify-center p-8 min-h-[200px] hover:bg-tiwhub-primary/5 dark:hover:bg-tiwhub-primary/5">
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-tiwhub-surface-hover dark:bg-tiwhub-heading/40 group-hover:bg-tiwhub-primary/10 dark:group-hover:bg-tiwhub-primary/15 transition-colors mb-3">
            <PlusIcon class="h-6 w-6 text-tiwhub-muted group-hover:text-tiwhub-primary dark:group-hover:text-tiwhub-primary-light transition-colors" />
          </div>
          <span class="text-sm font-medium text-tiwhub-muted group-hover:text-tiwhub-primary dark:group-hover:text-tiwhub-primary-light transition-colors">
            เพิ่มคอร์สใหม่
          </span>
        </button>
      </div>
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

function SearchIcon({ class: className }) {
  return (
    <svg class={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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

function LessonIcon({ class: className }) {
  return (
    <svg class={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}
