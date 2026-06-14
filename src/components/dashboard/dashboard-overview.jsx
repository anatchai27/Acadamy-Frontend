import { StatCard } from './stat-card';

const mockData = {
  students: {
    title: 'นักเรียน (Active)',
    value: '847',
    trendText: '+12%',
    trendDirection: 'up',
    isAlertState: false,
  },
  attendance: {
    title: 'เช็คชื่อวันนี้',
    value: '89/100',
    trendText: 'มาแล้ว 89/100',
    trendDirection: 'neutral',
    isAlertState: false,
  },
  requests: {
    title: 'คำขอลา/ชดเชย',
    value: '3',
    trendText: 'รอตรวจสอบ',
    trendDirection: 'neutral',
    isAlertState: true,
  },
  revenue: {
    title: 'รายได้ (เดือนนี้)',
    value: '฿45,678',
    trendText: '+8%',
    trendDirection: 'up',
    isAlertState: false,
  },
};

export function DashboardOverviewWidget() {
  return (
    <div class="grid grid-cols-2 gap-4 mb-8">
      <StatCard
        id="students"
        title={mockData.students.title}
        value={mockData.students.value}
        trendText={mockData.students.trendText}
        trendDirection={mockData.students.trendDirection}
        isAlertState={mockData.students.isAlertState}
        icon={<UsersGroupIcon class="h-5 w-5" />}
      />

      <StatCard
        id="attendance"
        title={mockData.attendance.title}
        value={mockData.attendance.value}
        trendText={mockData.attendance.trendText}
        trendDirection={mockData.attendance.trendDirection}
        isAlertState={mockData.attendance.isAlertState}
        icon={<QrCheckIcon class="h-5 w-5" />}
      />

      <StatCard
        id="requests"
        title={mockData.requests.title}
        value={mockData.requests.value}
        trendText={mockData.requests.trendText}
        trendDirection={mockData.requests.trendDirection}
        isAlertState={mockData.requests.isAlertState}
        icon={<ClipboardDocIcon class="h-5 w-5" />}
      />

      <StatCard
        id="revenue"
        title={mockData.revenue.title}
        value={mockData.revenue.value}
        trendText={mockData.revenue.trendText}
        trendDirection={mockData.revenue.trendDirection}
        isAlertState={mockData.revenue.isAlertState}
        icon={<BanknotesIcon class="h-5 w-5" />}
      />
    </div>
  );
}

function UsersGroupIcon({ class: className }) {
  return (
    <svg class={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

function QrCheckIcon({ class: className }) {
  return (
    <svg class={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v1m6 11h2m-6 0h-2m4 0h-2m4 0v-2m0 0h-2m2 0V9m0 4V9m0 0h-2m2 0V7m0 2V5m0 2h-2m2 0h2M7 4h1m4 0h1M4 7h1m0 4h1m0 4h1m0 4h1M4 11h1m0 4h1m0 4h1M4 15h1m0 4h1m0 4h1M4 19h1M9 7h1m4 0h1M9 11h1m4 0h1M9 15h1m4 0h1M9 19h1m4 0h1M14 19h1m4 0h1" />
      <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l3 3 8-8" />
    </svg>
  );
}

function ClipboardDocIcon({ class: className }) {
  return (
    <svg class={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  );
}

function BanknotesIcon({ class: className }) {
  return (
    <svg class={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
    </svg>
  );
}
