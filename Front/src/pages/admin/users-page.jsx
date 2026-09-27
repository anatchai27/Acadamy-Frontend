import { useState, useEffect, useRef } from 'preact/hooks';
import { AdminLayout } from '../../layouts/admin-layout';
import { Button, showToast, showConfirm, SolidInput } from '../../components/ui';
import { userService } from '../../services';
import { useAbortController } from '../../hooks';
import { BentoGrid } from '../../components/ui/bento-grid';
import { useDesignTheme } from '../../hooks/useDesignTheme';
import { PAGE_PERMISSIONS, getPagePermission, setRolePermissions } from '../../config/permissions';
import { HiOutlineUserGroup, HiOutlineAcademicCap, HiOutlineShieldCheck, HiOutlineMagnifyingGlass, HiOutlinePencil, HiOutlineTrash, HiOutlineUsers, HiOutlineBookOpen, HiOutlinePlus, HiOutlineXMark } from 'react-icons/hi2';

const roleConfig = {
  admin: { label: 'ผู้ดูแล', bg: 'bg-oasis-primary/5', text: 'text-oasis-primary', dot: 'bg-oasis-primary' },
  teacher: { label: 'ผู้สอน', bg: 'bg-oasis-warning-light', text: 'text-oasis-warning-dark', dot: 'bg-oasis-warning' },
  staff: { label: 'พนักงาน', bg: 'bg-cyan-50', text: 'text-cyan-700', dot: 'bg-cyan-500' },
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
  const [form, setForm] = useState({ email: '', password: '', phone: '', fullName: '' });
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ role: 'teacher', newPassword: '' });
  const [showPermissionManagement, setShowPermissionManagement] = useState(false);
  const [permissionRole, setPermissionRole] = useState('teacher');
  const [permissionDraft, setPermissionDraft] = useState({});
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
      if (!form.fullName.trim()) {
        showToast('กรุณากรอกชื่อผู้ใช้', 'error');
        return;
      }
      await userService.createStaff({
        email: form.email.trim(),
        password: form.password,
        phone: form.phone.trim() || null,
        role: 'admin',
        fullName: form.fullName.trim(),
      });
      showToast('เพิ่มผู้ใช้สำเร็จ', 'success');
      setShowForm(false);
      setForm({ email: '', password: '', phone: '', fullName: '' });
      fetchUsers();
    } catch (err) {
      showToast(err?.data?.message || err?.data?.Message || err?.data?.error || 'เพิ่มผู้ใช้ไม่สำเร็จ', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (user) => {
    setEditingUser(user);
    setEditForm({ role: user.role || 'teacher', newPassword: '' });
  };

  const loadPermissionDraft = (role) => Object.fromEntries(
    Object.keys(PAGE_PERMISSIONS).map((page) => [page, { ...getPagePermission(role, page) }]),
  );

  const openPermissionManagement = async () => {
    setPermissionRole('teacher');
    setPermissionDraft(loadPermissionDraft('teacher'));
    setShowPermissionManagement(true);
    try {
      const response = await userService.getRolePermissions('teacher');
      if (response.data?.permissions) setPermissionDraft(response.data.permissions);
    } catch {
      // Use the local/default policy when the server has no saved policy yet.
    }
  };

  const changePermissionRole = async (role) => {
    setPermissionRole(role);
    setPermissionDraft(loadPermissionDraft(role));
    try {
      const response = await userService.getRolePermissions(role);
      if (response.data?.permissions) setPermissionDraft(response.data.permissions);
    } catch {
      // Use the local/default policy when the server has no saved policy yet.
    }
  };

  const togglePermission = (page, action) => {
    setPermissionDraft((previous) => ({
      ...previous,
      [page]: { ...previous[page], [action]: !previous[page]?.[action] },
    }));
  };

  const isAllPermissionChecked = (action) => Object.keys(PAGE_PERMISSIONS)
    .every((page) => permissionDraft[page]?.[action]);

  const toggleAllPermissions = (action) => {
    const checked = !isAllPermissionChecked(action);
    setPermissionDraft((previous) => Object.fromEntries(
      Object.keys(PAGE_PERMISSIONS).map((page) => [
        page,
        { ...previous[page], [action]: checked },
      ]),
    ));
  };

  const savePermissions = async () => {
    try {
      await userService.updateRolePermissions(permissionRole, permissionDraft);
      setRolePermissions(permissionRole, permissionDraft);
      showToast(`บันทึกสิทธิ์ ${permissionRole} สำเร็จ`, 'success');
    } catch (err) {
      showToast(err?.data?.message || err?.data?.error || 'บันทึก permission ไม่สำเร็จ', 'error');
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await userService.updateUserRole(editingUser.id, editForm.role);
      if (editForm.newPassword.trim()) await userService.updateUserPassword(editingUser.id, editForm.newPassword);
      showToast('อัปเดตข้อมูลผู้ใช้สำเร็จ', 'success');
      setEditingUser(null);
      fetchUsers(search);
    } catch (err) {
      showToast(err?.data?.message || err?.data?.error || 'อัปเดตข้อมูลผู้ใช้ไม่สำเร็จ', 'error');
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
            <Button variant="outline" size="md" onClick={openPermissionManagement}>
              <span class="flex items-center gap-1.5">
                <HiOutlineShieldCheck class="h-4 w-4" />
                Permission Management
              </span>
            </Button>
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
                เพิ่มผู้ใช้
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
              <h3 class="text-lg font-semibold text-zinc-900">เพิ่มผู้ใช้</h3>
              <button type="button" onClick={() => setShowForm(false)} class="p-1 text-zinc-400 hover:text-zinc-600 transition-colors">
                <HiOutlineXMark class="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateUser} class="flex flex-col gap-4">
              <SolidInput label="ชื่อผู้ใช้" placeholder="ชื่อ-นามสกุล" value={form.fullName} onInput={updateForm('fullName')} required />
              <SolidInput label="อีเมล" type="email" placeholder="อีเมลสำหรับเข้าสู่ระบบ" value={form.email} onInput={updateForm('email')} required />
              <SolidInput label="เบอร์โทรศัพท์" type="tel" placeholder="08xxxxxxxx" value={form.phone} onInput={updateForm('phone')} />
              <SolidInput label="รหัสผ่าน" type="password" placeholder="ตั้งรหัสผ่าน" value={form.password} onInput={updateForm('password')} required />
              <div class="rounded-xl border border-cyan-100 bg-cyan-50 px-4 py-3 text-sm text-cyan-800">
                บทบาท: ผู้ดูแลระบบ
              </div>
              <div class="flex gap-3 mt-2">
                <Button variant="secondary" size="md" type="button" onClick={() => setShowForm(false)}>ยกเลิก</Button>
                <Button variant="primary" size="md" type="submit" loading={submitting} disabled={submitting}>เพิ่มผู้ใช้</Button>
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
                              {user.fullName || user.email}
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
                          <button onClick={() => openEdit(user)} title="แก้ไขสิทธิ์และรหัสผ่าน" class="p-1.5 md:p-2 text-zinc-400 hover:text-oasis-primary rounded-xl hover:bg-oasis-primary/5 transition-all">
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

      {editingUser && (
        <div class="fixed inset-0 z-50 flex items-center justify-center">
          <div class="absolute inset-0 bg-black/50 backdrop-blur-lg" onClick={() => setEditingUser(null)} />
          <div class={`relative w-full max-w-md mx-4 ${isNeo ? 'neo-card bg-white p-6' : 'bg-white rounded-2xl p-6 shadow-xl'}`}>
            <div class="flex items-center justify-between mb-5">
              <div>
                <h3 class="text-lg font-semibold text-zinc-900">จัดการบัญชีผู้ใช้</h3>
                <p class="text-sm text-zinc-500 mt-1">{editingUser.email}</p>
              </div>
              <button type="button" onClick={() => setEditingUser(null)} class="p-1 text-zinc-400 hover:text-zinc-600">
                <HiOutlineXMark class="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleEditUser} class="flex flex-col gap-4">
              <label class="flex flex-col gap-1.5 text-sm font-medium text-zinc-800">
                บทบาท / สิทธิ์
                <select value={editForm.role} onChange={(e) => setEditForm((prev) => ({ ...prev, role: e.target.value }))} class="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm">
                  <option value="admin">ผู้ดูแล</option>
                  <option value="teacher">ผู้สอน</option>
                  <option value="staff">พนักงาน</option>
                  <option value="parent">ผู้ปกครอง</option>
                  <option value="student">ผู้เรียน</option>
                </select>
              </label>
              <SolidInput label="รหัสผ่านใหม่ (เว้นว่างถ้าไม่เปลี่ยน)" type="password" placeholder="อย่างน้อย 8 ตัวอักษร" value={editForm.newPassword} onInput={(e) => setEditForm((prev) => ({ ...prev, newPassword: e.target.value }))} />
              <p class="text-xs text-zinc-500">ระบบจะไม่แสดงรหัสผ่านเดิม เพื่อความปลอดภัย</p>
              <div class="overflow-x-auto rounded-xl border border-zinc-200">
                <table class="w-full text-xs">
                  <thead class="bg-zinc-50 text-zinc-500">
                    <tr>
                      <th class="px-3 py-2 text-left font-semibold">หน้า</th>
                      <th class="px-3 py-2 text-center font-semibold">Read</th>
                      <th class="px-3 py-2 text-center font-semibold">Edit</th>
                      <th class="px-3 py-2 text-center font-semibold">Delete</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-zinc-100">
                    {Object.entries(PAGE_PERMISSIONS).map(([page, config]) => {
                      const permission = getPagePermission(editForm.role, page);
                      return <tr key={page}>
                        <td class="px-3 py-2 text-zinc-700 whitespace-nowrap">{config.label}</td>
                        <td class={`px-3 py-2 text-center font-bold ${permission.read ? 'text-emerald-600' : 'text-zinc-300'}`}>{permission.read ? '✓' : '-'}</td>
                        <td class={`px-3 py-2 text-center font-bold ${permission.edit ? 'text-amber-600' : 'text-zinc-300'}`}>{permission.edit ? '✓' : '-'}</td>
                        <td class={`px-3 py-2 text-center font-bold ${permission.delete ? 'text-red-600' : 'text-zinc-300'}`}>{permission.delete ? '✓' : '-'}</td>
                      </tr>;
                    })}
                  </tbody>
                </table>
              </div>
              <div class="flex gap-3 mt-2">
                <Button variant="secondary" size="md" type="button" onClick={() => setEditingUser(null)}>ยกเลิก</Button>
                <Button variant="primary" size="md" type="submit" loading={submitting} disabled={submitting}>บันทึก</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPermissionManagement && (
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/50 backdrop-blur-lg" onClick={() => setShowPermissionManagement(false)} />
          <div class={`relative flex max-h-[90vh] w-full max-w-4xl flex-col ${isNeo ? 'neo-card bg-white p-6' : 'rounded-2xl bg-white p-6 shadow-xl'}`}>
            <div class="flex items-start justify-between gap-4 border-b border-zinc-100 pb-4">
              <div>
                <h3 class="text-lg font-semibold text-zinc-900">Permission Management</h3>
                <p class="mt-1 text-sm text-zinc-500">กำหนดสิทธิ์การอ่าน แก้ไข และลบข้อมูลแยกตาม role</p>
              </div>
              <button type="button" onClick={() => setShowPermissionManagement(false)} class="p-1 text-zinc-400 hover:text-zinc-600">
                <HiOutlineXMark class="h-5 w-5" />
              </button>
            </div>
            <div class="flex flex-col gap-4 overflow-y-auto pt-5">
              <label class="flex max-w-xs flex-col gap-1.5 text-sm font-medium text-zinc-800">
                เลือก Role
                <select value={permissionRole} onChange={(e) => changePermissionRole(e.target.value)} class="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm">
                  <option value="admin">ผู้ดูแล (Admin)</option>
                  <option value="teacher">ผู้สอน (Teacher)</option>
                  <option value="staff">พนักงาน (Staff)</option>
                  <option value="parent">ผู้ปกครอง (Parent)</option>
                  <option value="student">ผู้เรียน (Student)</option>
                </select>
              </label>
              <div class="overflow-x-auto rounded-xl border border-zinc-200">
                <table class="w-full min-w-[620px] text-sm">
                  <thead class="bg-zinc-50 text-zinc-500">
                    <tr>
                      <th class="px-4 py-3 text-left font-semibold">หน้า</th>
                      <th class="px-4 py-3 text-left font-semibold">Path</th>
                      {['read', 'edit', 'delete'].map((action) => <th key={action} class="px-4 py-3 text-center font-semibold">
                        <label class="inline-flex cursor-pointer items-center justify-center gap-1.5">
                          <input
                            type="checkbox"
                            checked={isAllPermissionChecked(action)}
                            onChange={() => toggleAllPermissions(action)}
                            aria-label={`เลือกทั้งหมด ${action}`}
                            class="h-4 w-4 rounded border-zinc-300 text-oasis-primary focus:ring-oasis-primary"
                          />
                          {action.charAt(0).toUpperCase() + action.slice(1)}
                        </label>
                      </th>)}
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-zinc-100">
                    {Object.entries(PAGE_PERMISSIONS).map(([page, config]) => {
                      return <tr key={page}>
                        <td class="px-4 py-3 font-medium text-zinc-800">{config.label}</td>
                        <td class="px-4 py-3 font-mono text-xs text-zinc-400">{page}</td>
                        {['read', 'edit', 'delete'].map((action) => <td key={action} class="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={permissionDraft[page]?.[action] || false}
                            onChange={() => togglePermission(page, action)}
                            aria-label={`${config.label} ${action}`}
                            class="h-4 w-4 rounded border-zinc-300 text-oasis-primary focus:ring-oasis-primary"
                          />
                        </td>)}
                      </tr>;
                    })}
                  </tbody>
                </table>
              </div>
              <div class="flex items-center justify-between gap-4">
                <p class="text-xs text-zinc-500">สิทธิ์ชุดนี้เป็น policy กลางของ role ระบบจะใช้ร่วมกันกับผู้ใช้ทุกคนที่มี role เดียวกัน</p>
                <Button variant="primary" size="sm" onClick={savePermissions}>บันทึกสิทธิ์</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

