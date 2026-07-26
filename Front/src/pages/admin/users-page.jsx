import { useState, useEffect, useRef } from 'preact/hooks';
import { AdminLayout } from '../../layouts/admin-layout';
import { Button, showToast, showConfirm, SolidInput } from '../../components/ui';
import { userService } from '../../services';
import { useAbortController } from '../../hooks';
import { BentoGrid } from '../../components/ui/bento-grid';
import { useDesignTheme } from '../../hooks/useDesignTheme';
import { HiOutlineUserGroup, HiOutlineAcademicCap, HiOutlineShieldCheck, HiOutlineMagnifyingGlass, HiOutlinePencil, HiOutlineTrash, HiOutlineUsers, HiOutlineBookOpen, HiOutlinePlus, HiOutlineXMark } from 'react-icons/hi2';

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
  { label: 'ผู้ใช้ทั้งหมด', key: 'total', icon: HiOutlineUsers, accent: 'from-oasis-primary to-oasis-primary-dark' },
  { label: 'ผู้สอน', key: 'teacher', icon: HiOutlineBookOpen, accent: 'from-oasis-warning to-oasis-warning-dark' },
  { label: 'ผู้เรียน', key: 'student', icon: HiOutlineAcademicCap, accent: 'from-oasis-success to-oasis-success-dark' },
  { label: 'ผู้ดูแล', key: 'admin', icon: HiOutlineShieldCheck, accent: 'from-cyan-500 to-cyan-600' },
];

export function UsersPage({ path }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', role: 'admin' });
  const debounceRef = useRef(null);
  const getSignal = useAbortController();
  const { designTheme } = useDesignTheme();
  const isNeo = designTheme === 'neobrutalism';

  const updateForm = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

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

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!form.email.trim() || !form.password.trim()) {
      showToast('กรุณากรอกอีเมลและรหัสผ่าน', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await userService.createUser({ email: form.email, password: form.password, role: form.role });
      showToast('เพิ่มผู้ใช้สำเร็จ', 'success');
      setShowForm(false);
      setForm({ email: '', password: '', role: 'admin' });
      fetchUsers();
    } catch (err) {
      showToast(err?.data?.message || 'เพิ่มผู้ใช้ไม่สำเร็จ', 'error');
    } finally {
      setSubmitting(false);
    }
  };

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
              <HiOutlineUsers class="h-5 w-5 text-white" />
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
              <HiOutlineMagnifyingGlass class="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                placeholder="ค้นหาชื่อหรืออีเมล..."
                value={search}
                onInput={handleSearch}
                class="w-full sm:w-56 lg:w-64 pl-10 pr-4 py-2.5 text-sm border border-zinc-200 rounded-xl bg-white text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-oasis-primary/20 focus:border-oasis-primary transition-all"
              />
            </div>
            <Button variant="primary" size="md" onClick={() => setShowForm(true)}>
              <span class="flex items-center gap-1.5">
                <HiOutlinePlus class="h-4 w-4" />
                เพิ่มผู้ดูแล
              </span>
            </Button>
          </div>
        </div>
      </div>

      <BentoGrid class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 md:mb-8">
        {statCards.map((stat) => (
          <div key={stat.key} class={`group relative overflow-hidden ${isNeo ? 'neo-card bg-white p-4 md:p-5' : 'bg-white rounded-2xl p-4 md:p-5 shadow-sm border border-zinc-200/80 hover:shadow-md'} transition-shadow duration-300`}>
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
      </BentoGrid>

      {showForm && (
        <div class="fixed inset-0 z-50 flex items-center justify-center">
          <div class="absolute inset-0 bg-black/50 backdrop-blur-lg" onClick={() => setShowForm(false)} />
          <div class={`relative w-full max-w-md mx-4 ${isNeo ? 'neo-card bg-white p-6' : 'bg-white rounded-2xl p-6 shadow-xl'}`}>
            <div class="flex items-center justify-between mb-5">
              <h3 class="text-lg font-semibold text-zinc-900">เพิ่มผู้ดูแลระบบ</h3>
              <button type="button" onClick={() => setShowForm(false)} class="p-1 text-zinc-400 hover:text-zinc-600 transition-colors">
                <HiOutlineXMark class="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateUser} class="flex flex-col gap-4">
              <SolidInput label="อีเมล" type="email" placeholder="อีเมลสำหรับเข้าสู่ระบบ" value={form.email} onInput={updateForm('email')} required />
              <SolidInput label="รหัสผ่าน" type="password" placeholder="ตั้งรหัสผ่าน" value={form.password} onInput={updateForm('password')} required />
              <div class="flex gap-3 mt-2">
                <Button variant="secondary" size="md" type="button" onClick={() => setShowForm(false)}>ยกเลิก</Button>
                <Button variant="primary" size="md" type="submit" loading={submitting} disabled={submitting}>เพิ่มผู้ดูแล</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div class={`${isNeo ? 'neo-card bg-white p-5' : 'bg-zinc-50 rounded-2xl border border-zinc-100'} overflow-hidden`}>
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
                            <HiOutlinePencil class="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDelete(user)} class="p-1.5 md:p-2 text-zinc-400 hover:text-oasis-danger rounded-xl hover:bg-oasis-danger/5 transition-all">
                            <HiOutlineTrash class="h-4 w-4" />
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

