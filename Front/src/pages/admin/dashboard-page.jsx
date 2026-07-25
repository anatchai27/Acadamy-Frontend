import { AdminLayout } from '../../layouts/admin-layout';
import { DashboardOverviewWidget } from '../../components/dashboard/dashboard-overview';
import { PlayfulGreeting } from '../../components/dashboard/playful-greeting';
import { BentoGrid, BentoCell, BadgeSticker, unlockBadge } from '../../components/ui';
import { route } from 'preact-router';
import { useEffect } from 'preact/hooks';
import { useDesignTheme } from '../../hooks/useDesignTheme';
import { HiOutlineUserPlus, HiOutlineBookOpen, HiOutlineCheckCircle, HiOutlineCog6Tooth, HiOutlineChartBar } from 'react-icons/hi2';

const recentActivities = [
  { text: 'ผู้ใช้ใหม่ลงทะเบียน: john@example.com', time: '5 นาทีที่แล้ว', icon: HiOutlineUserPlus, color: 'primary' },
  { text: 'คอร์ส "JavaScript Basics" ถูกเปิดสอน', time: '1 ชั่วโมงที่แล้ว', icon: HiOutlineBookOpen, color: 'success' },
  { text: 'ผู้เรียน 5 คนเรียนจบคอร์ส "React 101"', time: '2 ชั่วโมงที่แล้ว', icon: HiOutlineCheckCircle, color: 'accent' },
  { text: 'อัปเดตระบบชำระเงินสำเร็จ', time: '3 ชั่วโมงที่แล้ว', icon: HiOutlineCog6Tooth, color: 'danger' },
  { text: 'มีการเพิ่มคอร์ส "Python Advanced"', time: '5 ชั่วโมงที่แล้ว', icon: HiOutlineBookOpen, color: 'success' },
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
  const { designTheme } = useDesignTheme();
  const isNeo = designTheme === 'neobrutalism';

  useEffect(() => {
    unlockBadge('first_login');
  }, []);

  return (
    <AdminLayout path={path}>
      {/* Playful Greeting — เปลี่ยนทุกวัน */}
      <PlayfulGreeting />

      {/* Bento Grid Dashboard Overview */}
      <DashboardOverviewWidget />

      {/* Bento Grid — กิจกรรมล่าสุด + Sidebar */}
      <BentoGrid>
        {/* Activity Feed — 2 คอลัมน์ */}
        <BentoCell span={2} class="!p-0 overflow-hidden">
          <div class={`flex items-center justify-between px-6 py-4 ${isNeo ? 'border-b-2 border-black' : 'border-b border-zinc-100'}`}>
            <h3 class="text-lg font-semibold text-zinc-900">กิจกรรมล่าสุด</h3>
            <button class="text-sm font-medium text-oasis-primary hover:text-oasis-primary-dark transition-colors">
              ดูทั้งหมด
            </button>
          </div>
          <div class="p-6 space-y-0">
            {recentActivities.map((activity, i) => (
              <div
                key={activity.text}
                class={`flex items-start gap-4 py-3 ${
                  isNeo
                    ? i < recentActivities.length - 1 ? 'border-b-2 border-black' : ''
                    : i < recentActivities.length - 1 ? 'border-b border-zinc-100' : ''
                }`}
              >
                <div class={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${colorIconBgMap[activity.color]}`}>
                  <activity.icon class={`h-4 w-4 ${colorTextMap[activity.color]}`} />
                </div>
                <div class="flex-1 min-w-0 flex items-center justify-between gap-4">
                  <span class="text-sm text-zinc-500 truncate">{activity.text}</span>
                  <span class="text-xs text-zinc-400 whitespace-nowrap">{activity.time}</span>
                </div>
              </div>
            ))}
          </div>
        </BentoCell>

        {/* Top Courses */}
        <BentoCell>
          <h3 class="text-lg font-semibold mb-4 text-zinc-900">คอร์สยอดนิยม</h3>
          <div class="space-y-4">
            {[
              { title: 'JavaScript Basics', students: 45, color: 'primary' },
              { title: 'React 101', students: 38, color: 'success' },
              { title: 'Python for Beginners', students: 32, color: 'accent' },
            ].map((course) => (
              <div key={course.title} class="flex items-center gap-3">
                <div class={`h-2 w-2 rounded-full ${colorTextMap[course.color].replace('text-', 'bg-')}`} />
                <span class="flex-1 text-sm text-zinc-500 truncate">{course.title}</span>
                <span class="text-xs font-medium text-zinc-400">{course.students} คน</span>
              </div>
            ))}
          </div>
        </BentoCell>

        {/* Quick Actions */}
        <BentoCell>
          <h3 class="text-lg font-semibold mb-4 text-zinc-900">ดำเนินการด่วน</h3>
          <div class="space-y-2">
            {[
              { label: 'เพิ่มผู้ใช้ใหม่', icon: HiOutlineUserPlus, color: 'primary', onClick: () => route('/admin/users') },
              { label: 'สร้างคอร์สเรียน', icon: HiOutlineBookOpen, color: 'success', onClick: () => route('/admin/courses') },
              { label: 'ดูรายงาน', icon: HiOutlineChartBar, color: 'accent', onClick: () => route('/admin/finance') },
            ].map((action) => (
              <button
                key={action.label}
                onClick={action.onClick}
                class={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors text-zinc-500 ${isNeo ? 'neo-btn' : 'hover:bg-zinc-50'}`}
              >
                <action.icon class={`h-4 w-4 ${colorTextMap[action.color]}`} />
                {action.label}
              </button>
            ))}
          </div>
        </BentoCell>
      </BentoGrid>
    </AdminLayout>
  );
}


