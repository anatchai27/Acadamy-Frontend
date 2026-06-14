import { AdminLayout } from '../../layouts/admin-layout';

const users = [
  { id: 1, name: 'สมชาย ใจดี', email: 'somchai@email.com', role: 'ผู้สอน', status: 'active', joinDate: '12 ม.ค. 2025' },
  { id: 2, name: 'สมหญิง รักเรียน', email: 'somying@email.com', role: 'ผู้เรียน', status: 'active', joinDate: '3 ก.พ. 2025' },
  { id: 3, name: 'วิชัย เก่งกาจ', email: 'wichai@email.com', role: 'ผู้สอน', status: 'inactive', joinDate: '28 ธ.ค. 2024' },
  { id: 4, name: 'นภา สว่างจิต', email: 'napa@email.com', role: 'ผู้เรียน', status: 'active', joinDate: '15 มี.ค. 2025' },
];

const statusBadge = {
  active: 'bg-tiwhub-success/10 text-tiwhub-success dark:bg-tiwhub-success/15 dark:text-tiwhub-success',
  inactive: 'bg-tiwhub-border/30 text-tiwhub-body dark:bg-tiwhub-border/20 dark:text-tiwhub-muted',
};

const statusLabel = {
  active: 'เปิดใช้งาน',
  inactive: 'ระงับ',
};

const roleBadge = {
  ผู้สอน: 'bg-tiwhub-primary/10 text-tiwhub-primary dark:bg-tiwhub-primary/15 dark:text-tiwhub-primary-light',
  ผู้เรียน: 'bg-tiwhub-accent/10 text-tiwhub-accent-dark dark:bg-tiwhub-accent/15 dark:text-tiwhub-accent-light',
};

export function UsersPage({ path }) {
  return (
    <AdminLayout path={path}>
      {/* Header */}
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h2 class="text-2xl font-bold text-tiwhub-heading dark:text-white">จัดการผู้ใช้</h2>
          <p class="text-sm text-tiwhub-muted dark:text-tiwhub-muted/70 mt-1">จัดการบัญชีผู้ใช้ทั้งหมดในระบบ</p>
        </div>
        <div class="flex items-center gap-3">
          <div class="relative">
            <SearchIcon class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-tiwhub-muted" />
            <input
              type="text"
              placeholder="ค้นหาผู้ใช้..."
              class="pl-9 pr-4 py-2 text-sm border border-tiwhub-border-light dark:border-tiwhub-border/20 rounded-xl bg-tiwhub-surface dark:bg-tiwhub-heading/50 text-tiwhub-heading dark:text-white placeholder-tiwhub-muted focus:outline-none focus:ring-2 focus:ring-tiwhub-primary/20 focus:border-tiwhub-primary w-48 transition-all"
            />
          </div>
          <button class="inline-flex items-center gap-2 bg-tiwhub-primary hover:bg-tiwhub-primary-dark text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98]">
            <PlusIcon class="h-4 w-4" />
            เพิ่มผู้ใช้
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'ผู้ใช้ทั้งหมด', value: users.length },
          { label: 'ผู้สอน', value: users.filter((u) => u.role === 'ผู้สอน').length },
          { label: 'ผู้เรียน', value: users.filter((u) => u.role === 'ผู้เรียน').length },
          { label: 'เปิดใช้งาน', value: users.filter((u) => u.status === 'active').length },
        ].map((stat) => (
          <div key={stat.label} class="bg-tiwhub-surface dark:bg-tiwhub-heading/80 rounded-2xl p-4 shadow-sm border border-tiwhub-border-light dark:border-tiwhub-border/20">
            <p class="text-xs font-medium text-tiwhub-muted dark:text-tiwhub-muted/60">{stat.label}</p>
            <p class="text-xl font-bold text-tiwhub-heading dark:text-white mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div class="bg-tiwhub-surface dark:bg-tiwhub-heading/80 rounded-2xl shadow-sm border border-tiwhub-border-light dark:border-tiwhub-border/20 overflow-hidden">
        {/* Table Header */}
        <div class="flex items-center justify-between px-6 py-4 border-b border-tiwhub-border-light dark:border-tiwhub-border/20">
          <h3 class="text-lg font-semibold text-tiwhub-heading dark:text-white">รายชื่อผู้ใช้ทั้งหมด</h3>
          <div class="flex items-center gap-2">
            <button class="p-2 text-tiwhub-muted hover:text-tiwhub-body dark:hover:text-tiwhub-bg/80 rounded-lg hover:bg-tiwhub-surface-hover dark:hover:bg-tiwhub-heading/40 transition-colors">
              <FilterIcon class="h-4 w-4" />
            </button>
            <button class="p-2 text-tiwhub-muted hover:text-tiwhub-body dark:hover:text-tiwhub-bg/80 rounded-lg hover:bg-tiwhub-surface-hover dark:hover:bg-tiwhub-heading/40 transition-colors">
              <DotsIcon class="h-4 w-4" />
            </button>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="bg-tiwhub-bg/50 dark:bg-tiwhub-heading/40">
                <th class="text-left px-6 py-3 text-xs font-semibold text-tiwhub-muted dark:text-tiwhub-muted/60 uppercase tracking-wider">ผู้ใช้</th>
                <th class="text-left px-6 py-3 text-xs font-semibold text-tiwhub-muted dark:text-tiwhub-muted/60 uppercase tracking-wider hidden md:table-cell">อีเมล</th>
                <th class="text-left px-6 py-3 text-xs font-semibold text-tiwhub-muted dark:text-tiwhub-muted/60 uppercase tracking-wider hidden sm:table-cell">บทบาท</th>
                <th class="text-left px-6 py-3 text-xs font-semibold text-tiwhub-muted dark:text-tiwhub-muted/60 uppercase tracking-wider hidden lg:table-cell">วันที่สมัคร</th>
                <th class="text-left px-6 py-3 text-xs font-semibold text-tiwhub-muted dark:text-tiwhub-muted/60 uppercase tracking-wider">สถานะ</th>
                <th class="text-right px-6 py-3 text-xs font-semibold text-tiwhub-muted dark:text-tiwhub-muted/60 uppercase tracking-wider">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  class="border-b border-tiwhub-border-light dark:border-tiwhub-border/20 last:border-0 hover:bg-tiwhub-surface-hover dark:hover:bg-tiwhub-heading/40 transition-colors"
                >
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                      <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-tiwhub-primary/10 dark:bg-tiwhub-primary/15 text-tiwhub-primary dark:text-tiwhub-primary-light text-sm font-semibold">
                        {user.name.charAt(0)}
                      </div>
                      <div class="min-w-0">
                        <p class="text-sm font-semibold text-tiwhub-heading dark:text-white truncate">{user.name}</p>
                        <p class="text-xs text-tiwhub-muted dark:text-tiwhub-muted/60 md:hidden truncate">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 text-sm text-tiwhub-body dark:text-tiwhub-bg/80 hidden md:table-cell">{user.email}</td>
                  <td class="px-6 py-4 hidden sm:table-cell">
                    <span class={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${roleBadge[user.role]}`}>
                      {user.role}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-sm text-tiwhub-muted dark:text-tiwhub-muted/60 hidden lg:table-cell">{user.joinDate}</td>
                  <td class="px-6 py-4">
                    <span class={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full ${statusBadge[user.status]}`}>
                      <span class={`h-1.5 w-1.5 rounded-full ${user.status === 'active' ? 'bg-tiwhub-success' : 'bg-tiwhub-muted'}`} />
                      {statusLabel[user.status]}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <div class="flex items-center justify-end gap-1">
                      <button class="p-1.5 text-tiwhub-muted hover:text-tiwhub-primary dark:hover:text-tiwhub-primary-light rounded-lg hover:bg-tiwhub-surface-hover dark:hover:bg-tiwhub-heading/40 transition-colors">
                        <EditIcon class="h-4 w-4" />
                      </button>
                      <button class="p-1.5 text-tiwhub-muted hover:text-tiwhub-danger dark:hover:text-tiwhub-danger rounded-lg hover:bg-tiwhub-danger/10 dark:hover:bg-tiwhub-danger/10 transition-colors">
                        <TrashIcon class="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div class="flex items-center justify-between px-6 py-4 border-t border-tiwhub-border-light dark:border-tiwhub-border/20">
          <p class="text-sm text-tiwhub-muted dark:text-tiwhub-muted/60">
            แสดง 1-{users.length} จาก {users.length} รายการ
          </p>
          <div class="flex items-center gap-1">
            <button class="p-2 text-tiwhub-muted rounded-lg hover:bg-tiwhub-surface-hover dark:hover:bg-tiwhub-heading/40 transition-colors disabled:opacity-40" disabled>
              <ChevronLeftIcon class="h-4 w-4" />
            </button>
            <button class="px-3 py-1.5 text-sm font-medium text-white bg-tiwhub-primary rounded-lg">1</button>
            <button class="p-2 text-tiwhub-muted rounded-lg hover:bg-tiwhub-surface-hover dark:hover:bg-tiwhub-heading/40 transition-colors disabled:opacity-40" disabled>
              <ChevronRightIcon class="h-4 w-4" />
            </button>
          </div>
        </div>
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

function FilterIcon({ class: className }) {
  return (
    <svg class={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    </svg>
  );
}

function DotsIcon({ class: className }) {
  return (
    <svg class={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
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

function TrashIcon({ class: className }) {
  return (
    <svg class={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

function ChevronLeftIcon({ class: className }) {
  return (
    <svg class={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ChevronRightIcon({ class: className }) {
  return (
    <svg class={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}
