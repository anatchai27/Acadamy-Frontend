import { useState, useEffect, useRef } from 'preact/hooks';
import { AdminLayout } from '../../layouts/admin-layout';
import { showToast, showConfirm } from '../../components/ui';
import { userService } from '../../services';
import { useAbortController } from '../../hooks';

const roleConfig = {
  admin: { label: 'ผู้ดูแล', bg: 'bg-oasis-primary/5', text: 'text-oasis-primary', dot: 'bg-oasis-primary' },
  teacher: { label: 'ผู้สอน', bg: 'bg-oasis-warning-light', text: 'text-oasis-warning-dark', dot: 'bg-oasis-warning' },
  parent: { label: 'ผู้ปกครอง', bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
  student: { label: 'ผู้เรียน', bg: 'bg-oasis-success-light', text: 'text-oasis-success-dark', dot: 'bg-oasis-success' },
};

function getRoleConfig(role) {
  return roleConfig[role] ?? { label: role, bg: 'bg-zinc-100', text: 'text-zinc-600', dot: 'bg-zinc-400' };
}

const avatarColors = [
  'bg-oasis-primary', 'bg-oasis-success', 'bg-oasis-warning', 'bg-purple-500',
  'bg-rose-500', 'bg-cyan-500',
];

function getAvatarColor(i) {
  return avatarColors[i % avatarColors.length];
}

const statCards = [
  { label: 'ผู้ใช้ทั้งหมด', key: 'total', icon: UsersOutline, accent: 'from-oasis-primary to-oasis-primary-dark' },
  { label: 'ผู้สอน', key: 'teacher', icon: TeacherOutline, accent: 'from-oasis-warning to-oasis-warning-dark' },
  { label: 'ผู้เรียน', key: 'student', icon: StudentOutline, accent: 'from-oasis-success to-oasis-success-dark' },
  { label: 'ผู้ดูแล', key: 'admin', icon: ShieldCheck, accent: 'from-cyan-500 to-cyan-600' },
];

export function UsersPage({ path }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debounceRef = useRef(null);
  const getSignal = useAbortController();

  const fetchUsers = async (query = '') => {
    setLoading(true);
    try {
      const params = {};
      if (query.trim()) params.search = query.trim();
      const res = await userService.getUsers(params, { signal: getSignal() });
      setUsers(Array.isArray(res.data) ? res.data : res.data?.data || []);
    } catch (err) {
      showToast(err?.data?.message || 'ไม่สามารถโหลดข้อมูลผู้ใช้ได้', 'error');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearch(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchUsers(value), 300);
  };

  const stats = {
    total: users.length,
    admin: users.filter((u) => u.role === 'admin').length,
    teacher: users.filter((u) => u.role === 'teacher').length,
    student: users.filter((u) => u.role === 'student').length,
  };

  const handleDelete = async (user) => {
    const confirmed = await showConfirm({
      title: 'ลบผู้ใช้',
      message: `คุณแน่ใจว่าต้องการลบผู้ใช้ "${user.email}"?`,
      yesLabel: 'ลบ',
      cancelLabel: 'ยกเลิก',
    });
    if (!confirmed) return;
    showToast('ฟังก์ชันลบผู้ใช้ยังไม่พร้อมใช้งาน', 'info');
  };

  return (
    <AdminLayout path={path}>
      <div class="mb-6 md:mb-8">
        <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div class="flex items-center gap-3">
            <div class="hidden sm:flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-oasis-primary to-oasis-primary-dark shadow-md shadow-oasis-primary/25">
              <UsersIcon class="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 class="text-xl md:text-2xl font-semibold text-zinc-900 tracking-tight">จัดการผู้ใช้</h2>
              <p class="text-sm text-zinc-500 mt-0.5">
                จัดการบัญชีผู้ใช้ทั้งหมดในระบบ
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2.5">
            <div class="relative flex-1 sm:flex-none">
              <SearchOutline class="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                placeholder="ค้นหาชื่อหรืออีเมล..."
                value={search}
                onInput={handleSearch}
                class="w-full sm:w-56 lg:w-64 pl-10 pr-4 py-2.5 text-sm border border-zinc-200 rounded-xl bg-white text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-oasis-primary/20 focus:border-oasis-primary transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 md:mb-8">
        {statCards.map((stat) => (
          <div key={stat.key} class="group relative overflow-hidden bg-white rounded-2xl p-4 md:p-5 shadow-sm border border-zinc-200/80 hover:shadow-md transition-shadow duration-300">
            <div class="flex items-start justify-between">
              <div class="space-y-1.5">
                <p class="text-xs font-medium text-zinc-400 tracking-wide uppercase">{stat.label}</p>
                <p class="text-2xl md:text-3xl font-semibold text-zinc-900 tracking-tight tracking-tight">
                  {loading ? '-' : stats[stat.key]}
                </p>
              </div>
              <div class={`flex h-10 w-10 md:h-11 md:w-11 items-center justify-center rounded-xl bg-gradient-to-br ${stat.accent} shadow-sm group-hover:scale-105 transition-transform duration-300`}>
                <stat.icon class="h-5 w-5 text-white" />
              </div>
            </div>
            <div class={`absolute -bottom-3 -right-3 h-16 w-16 rounded-full bg-gradient-to-br ${stat.accent} opacity-[0.06]`} />
          </div>
        ))}
      </div>

      <div class="bg-zinc-50 rounded-2xl border border-zinc-100 overflow-hidden">
        <div class="flex items-center justify-between px-5 md:px-6 py-3.5 border-b border-zinc-100">
          <div class="flex items-center gap-2">
            <span class="text-sm font-semibold text-zinc-900">รายชื่อผู้ใช้ทั้งหมด</span>
            <span class="text-xs font-medium text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full">
              {users.length}
            </span>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-zinc-100 bg-zinc-50/50">
                <th class="text-left px-5 md:px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider w-[40%]">ผู้ใช้</th>
                <th class="text-left px-5 md:px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider hidden md:table-cell">อีเมล</th>
                <th class="text-left px-5 md:px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider hidden sm:table-cell">บทบาท</th>
                <th class="text-left px-5 md:px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider hidden xl:table-cell">วันที่สมัคร</th>
                <th class="text-right px-5 md:px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider"><span class="sr-only">จัดการ</span></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-zinc-100">
              {loading ? (
                <tr>
                  <td colspan="5" class="px-6 py-16 text-center">
                    <div class="mx-auto mb-3 h-8 w-8 rounded-full border-2 border-oasis-primary border-t-transparent animate-spin" />
                    <p class="text-sm text-zinc-400">กำลังโหลดข้อมูล...</p>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colspan="5" class="px-6 py-16 text-center">
                    <p class="text-sm text-zinc-400">{search ? 'ไม่พบผู้ใช้ที่ค้นหา' : 'ไม่มีผู้ใช้ในระบบ'}</p>
                  </td>
                </tr>
              ) : (
                users.map((user, i) => {
                  const role = getRoleConfig(user.role);
                  return (
                    <tr key={user.id} class="group hover:bg-oasis-primary/5 transition-colors duration-150">
                      <td class="px-5 md:px-6 py-3.5">
                        <div class="flex items-center gap-3.5 min-w-0">
                          <div class={`flex h-9 w-9 md:h-10 md:w-10 shrink-0 items-center justify-center rounded-full ${getAvatarColor(i)} text-white text-sm font-bold shadow-sm ring-2 ring-white`}>
                            {(user.email || '?').charAt(0).toUpperCase()}
                          </div>
                          <div class="min-w-0">
                            <p class="text-sm font-semibold text-zinc-900 truncate">
                              {user.email}
                            </p>
                            <p class="text-xs text-zinc-400 truncate md:hidden">{user.email}</p>
                            <div class="sm:hidden mt-1">
                              <span class={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-md ${role.bg} ${role.text}`}>
                                <span class={`h-1.5 w-1.5 rounded-full ${role.dot}`} />
                                {role.label}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td class="px-5 md:px-6 py-3.5 text-sm text-zinc-600 hidden md:table-cell">
                        <span class="truncate max-w-[200px] block">{user.email}</span>
                      </td>
                      <td class="px-5 md:px-6 py-3.5 hidden sm:table-cell">
                        <span class={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg ${role.bg} ${role.text}`}>
                          <span class={`h-1.5 w-1.5 rounded-full ${role.dot}`} />
                          {role.label}
                        </span>
                      </td>
                      <td class="px-5 md:px-6 py-3.5 text-sm text-zinc-400 hidden xl:table-cell whitespace-nowrap">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString('th-TH') : '-'}
                      </td>
                      <td class="px-5 md:px-6 py-3.5 text-right">
                        <div class="flex items-center justify-end gap-1">
                          <button class="p-1.5 md:p-2 text-zinc-400 hover:text-oasis-primary rounded-xl hover:bg-oasis-primary/5 transition-all">
                            <EditOutline class="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDelete(user)} class="p-1.5 md:p-2 text-zinc-400 hover:text-oasis-danger rounded-xl hover:bg-oasis-danger/5 transition-all">
                            <TrashOutline class="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div class="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 md:px-6 py-3.5 border-t border-zinc-100">
          <p class="text-sm text-zinc-400 order-2 sm:order-1">
            แสดงทั้งหมด {users.length} รายการ
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}

/* ─── SVG Icons ─── */

function UsersIcon({ class: className }) {
  return (
    <svg class={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

function UsersOutline({ class: className }) {
  return (
    <svg class={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function TeacherOutline({ class: className }) {
  return (
    <svg class={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /><path stroke-linecap="round" stroke-linejoin="round" d="M10.25 10.25L9 8.5M13.75 10.25L15 8.5" />
    </svg>
  );
}

function StudentOutline({ class: className }) {
  return (
    <svg class={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path d="M12 14l9-5-9-5-9 5 9 5z" /><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /><path stroke-linecap="round" stroke-linejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
    </svg>
  );
}

function ShieldCheck({ class: className }) {
  return (
    <svg class={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

function SearchOutline({ class: className }) {
  return (
    <svg class={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function EditOutline({ class: className }) {
  return (
    <svg class={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}

function TrashOutline({ class: className }) {
  return (
    <svg class={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}