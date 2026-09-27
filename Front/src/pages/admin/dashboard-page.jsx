import { AdminLayout } from '../../layouts/admin-layout';
import { DashboardOverviewWidget } from '../../components/dashboard/dashboard-overview';
import { PlayfulGreeting } from '../../components/dashboard/playful-greeting';
import { BentoGrid, BentoCell, unlockBadge } from '../../components/ui';
import { route } from 'preact-router';
import { useEffect } from 'preact/hooks';
import { useDesignTheme } from '../../hooks/useDesignTheme';
import { HiOutlineUserPlus, HiOutlineBookOpen, HiOutlineChartBar } from 'react-icons/hi2';

const colorTextMap = {
  primary: 'text-oasis-primary',
  success: 'text-oasis-success',
  accent: 'text-oasis-warning',
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
        <BentoCell id="dashboard-activity" span={2} class="!p-0 overflow-hidden">
          <div class={`flex items-center justify-between px-6 py-4 ${isNeo ? 'border-b-2 border-black' : 'border-b border-zinc-100'}`}>
            <h3 class="text-lg font-semibold text-zinc-900">กิจกรรมล่าสุด</h3>
            <button class="text-sm font-medium text-oasis-primary hover:text-oasis-primary-dark transition-colors">
              ดูทั้งหมด
            </button>
          </div>
          <div class="p-6">
            <p class="text-sm text-zinc-500">ยังไม่มี API สำหรับกิจกรรมล่าสุด จึงยังไม่แสดงข้อมูลตัวอย่าง</p>
          </div>
        </BentoCell>

        {/* Top Courses */}
        <BentoCell id="dashboard-top-courses">
          <h3 class="text-lg font-semibold mb-4 text-zinc-900">คอร์สยอดนิยม</h3>
          <p class="text-sm text-zinc-500">ยังไม่มี API สำหรับจัดอันดับคอร์ส จึงยังไม่แสดงตัวเลขสมมติ</p>
        </BentoCell>

        {/* Quick Actions */}
        <BentoCell id="dashboard-quick-actions">
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


