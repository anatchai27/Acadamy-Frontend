import { AdminLayout } from '../../layouts/admin-layout';
import { DashboardOverviewWidget } from '../../components/dashboard/dashboard-overview';
import { route } from 'preact-router';

const recentActivities = [
  { text: 'ผู้ใช้ใหม่ลงทะเบียน: john@example.com', time: '5 นาทีที่แล้ว', icon: UserPlusIcon, color: 'primary' },
  { text: 'คอร์ส "JavaScript Basics" ถูกเปิดสอน', time: '1 ชั่วโมงที่แล้ว', icon: BookIcon, color: 'success' },
  { text: 'ผู้เรียน 5 คนเรียนจบคอร์ส "React 101"', time: '2 ชั่วโมงที่แล้ว', icon: CheckIcon, color: 'accent' },
  { text: 'อัปเดตระบบชำระเงินสำเร็จ', time: '3 ชั่วโมงที่แล้ว', icon: CogIcon, color: 'danger' },
  { text: 'มีการเพิ่มคอร์ส "Python Advanced"', time: '5 ชั่วโมงที่แล้ว', icon: BookIcon, color: 'success' },
];

const colorIconBgMap = {
  primary: 'bg-oasis-primary/5',
  success: 'bg-oasis-success/5',
  accent: 'bg-oasis-warning/5',
  danger: 'bg-oasis-danger/5',
};

const colorTextMap = {
  primary: 'text-oasis-primary',
  success: 'text-oasis-success',
  accent: 'text-oasis-warning',
  danger: 'text-oasis-danger',
};

export function DashboardPage({ path }) {
  return (
    <AdminLayout path={path}>
      {/* Welcome */}
      <div class="mb-8">
        <h2 class="text-2xl font-semibold text-zinc-900 tracking-tight">ภาพรวมระบบ</h2>
        <p class="text-sm text-zinc-500 mt-1">ดูข้อมูลสำคัญและการเปลี่ยนแปลงของระบบคุณ</p>
      </div>

      {/* Dashboard Overview Widget - Grid 2x2 */}
      <DashboardOverviewWidget />

      {/* Two Column Layout */}
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-15">
        {/* Activity Feed */}
        <div class="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-zinc-200/80">
          <div class="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
            <h3 class="text-lg font-semibold text-zinc-900">กิจกรรมล่าสุด</h3>
            <button class="text-sm font-medium text-oasis-primary hover:text-oasis-primary-dark transition-colors">
              ดูทั้งหมด
            </button>
          </div>
          <div class="p-6 space-y-0">
            {recentActivities.map((activity, i) => (
              <div
                key={i}
                class={`flex items-start gap-4 py-3 ${
                  i < recentActivities.length - 1 ? 'border-b border-zinc-100' : ''
                }`}
              >
                <div class={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${colorIconBgMap[activity.color]}`}>
                  <activity.icon class={`h-4 w-4 ${colorTextMap[activity.color]}`} />
                </div>
                <div class="flex-1 min-w-0 flex items-center justify-between gap-4">
                  <span class="text-sm text-zinc-600 truncate">{activity.text}</span>
                  <span class="text-xs text-zinc-400 whitespace-nowrap">{activity.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats Sidebar */}
        <div class="space-y-6">
          {/* Top Courses */}
          <div class="bg-white rounded-2xl shadow-sm border border-zinc-200/80 p-6">
            <h3 class="text-lg font-semibold text-zinc-900 mb-4">คอร์สยอดนิยม</h3>
            <div class="space-y-4">
              {[
                { title: 'JavaScript Basics', students: 45, color: 'primary' },
                { title: 'React 101', students: 38, color: 'success' },
                { title: 'Python for Beginners', students: 32, color: 'accent' },
              ].map((course) => (
                <div key={course.title} class="flex items-center gap-3">
                  <div class={`h-2 w-2 rounded-full ${colorTextMap[course.color].replace('text-', 'bg-')}`} />
                  <span class="flex-1 text-sm text-zinc-600 truncate">{course.title}</span>
                  <span class="text-xs font-medium text-zinc-400">{course.students} คน</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div class="bg-white rounded-2xl shadow-sm border border-zinc-200/80 p-6">
            <h3 class="text-lg font-semibold text-zinc-900 mb-4">ดำเนินการด่วน</h3>
            <div class="space-y-2">
              {[
                { label: 'เพิ่มผู้ใช้ใหม่', icon: UserPlusIcon, color: 'primary', onClick: () => route('/admin/users') },
                { label: 'สร้างคอร์สเรียน', icon: BookIcon, color: 'success', onClick: () => route('/admin/courses') },
                { label: 'ดูรายงาน', icon: ChartIcon, color: 'accent', onClick: () => route('/admin/finance') },
              ].map((action) => (
                <button
                  key={action.label}
                  onClick={action.onClick}
                  class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
                >
                  <action.icon class={`h-4 w-4 ${colorTextMap[action.color]}`} />
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

/* ─── SVG Icons ─── */

function UserPlusIcon({ class: className }) {
  return (
    <svg class={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
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

function CheckIcon({ class: className }) {
  return (
    <svg class={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function CogIcon({ class: className }) {
  return (
    <svg class={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function ChartIcon({ class: className }) {
  return (
    <svg class={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}
