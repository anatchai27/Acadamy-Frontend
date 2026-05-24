import { AdminLayout } from '../../layouts/admin-layout';

export function DashboardPage({ path }) {
  const stats = [
    { label: 'ผู้ใช้ทั้งหมด', value: '1,234', change: '+12%' },
    { label: 'คอร์สเรียน', value: '56', change: '+3%' },
    { label: 'ผู้เรียนออนไลน์', value: '89', change: '+24%' },
    { label: 'รายได้เดือนนี้', value: '฿45,678', change: '+8%' },
  ];

  return (
    <AdminLayout path={path}>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">แดชบอร์ด</h1>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <p class="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
            <span class="text-xs text-green-600 dark:text-green-400">{stat.change}</span>
          </div>
        ))}
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">กิจกรรมล่าสุด</h2>
        <div class="space-y-3">
          {[
            { text: 'ผู้ใช้ใหม่ลงทะเบียน: john@example.com', time: '5 นาทีที่แล้ว' },
            { text: 'คอร์ส "JavaScript Basics" ถูกเปิดสอน', time: '1 ชั่วโมงที่แล้ว' },
            { text: 'ผู้เรียน 5 คนเรียนจบคอร์ส "React 101"', time: '2 ชั่วโมงที่แล้ว' },
            { text: 'อัปเดตระบบชำระเงินสำเร็จ', time: '3 ชั่วโมงที่แล้ว' },
          ].map((activity, i) => (
            <div key={i} class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
              <span class="text-sm text-gray-700 dark:text-gray-300">{activity.text}</span>
              <span class="text-xs text-gray-400 whitespace-nowrap ml-4">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
