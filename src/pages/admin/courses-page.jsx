import { AdminLayout } from '../../layouts/admin-layout';

export function CoursesPage({ path }) {
  const courses = [
    { id: 1, title: 'JavaScript Basics', students: 45, lessons: 12, progress: 75 },
    { id: 2, title: 'React 101', students: 32, lessons: 8, progress: 60 },
    { id: 3, title: 'Node.js Advanced', students: 28, lessons: 15, progress: 40 },
    { id: 4, title: 'Python for Beginners', students: 67, lessons: 10, progress: 90 },
  ];

  return (
    <AdminLayout path={path}>
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">จัดการคอร์สเรียน</h1>
        <button class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          เพิ่มคอร์ส
        </button>
      </div>

      <div class="grid gap-4 md:grid-cols-2">
        {courses.map((course) => (
          <div key={course.id} class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{course.title}</h3>
            <div class="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
              <span>ผู้เรียน: {course.students} คน</span>
              <span>บทเรียน: {course.lessons} บท</span>
            </div>
            <div class="mt-3">
              <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                <span>ความคืบหน้า</span>
                <span>{course.progress}%</span>
              </div>
              <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  class="bg-blue-600 h-2 rounded-full transition-all"
                  style={`width: ${course.progress}%`}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
