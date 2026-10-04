import { useState, useEffect, useRef } from 'preact/hooks';
import { AdminLayout } from '../../layouts/admin-layout';
import { Button, showToast, showConfirm, SolidInput } from '../../components/ui';
import { userService } from '../../services';
import { useAbortController, useTranslation } from '../../hooks';
import { BentoGrid } from '../../components/ui/bento-grid';
import { useDesignTheme } from '../../hooks/useDesignTheme';
import { PAGE_PERMISSIONS, getPagePermission } from '../../config/permissions';
import { HiOutlineUserGroup, HiOutlineAcademicCap, HiOutlineShieldCheck, HiOutlineMagnifyingGlass, HiOutlinePencil, HiOutlineTrash, HiOutlineUsers, HiOutlineBookOpen, HiOutlinePlus, HiOutlineXMark } from 'react-icons/hi2';

const roleConfig = {
  admin: { bg: 'bg-oasis-primary/5', text: 'text-oasis-primary', dot: 'bg-oasis-primary' },
  teacher: { bg: 'bg-oasis-warning-light', text: 'text-oasis-warning-dark', dot: 'bg-oasis-warning' },
  staff: { bg: 'bg-cyan-50', text: 'text-cyan-700', dot: 'bg-cyan-500' },
  parent: { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
  student: { bg: 'bg-oasis-success-light', text: 'text-oasis-success-dark', dot: 'bg-oasis-success' },
};

function getRoleConfig(role, t) {
  return {
    ...(roleConfig[role] ?? { bg: 'bg-zinc-100', text: 'text-zinc-600', dot: 'bg-zinc-400' }),
    label: t(`users.roles.${role}`, { defaultValue: role }),
  };
}

const avatarColors = [
  'bg-oasis-primary', 'bg-oasis-success', 'bg-oasis-warning', 'bg-purple-500',
  'bg-rose-500', 'bg-cyan-500',
];

function getAvatarColor(i) {
  return avatarColors[i % avatarColors.length];
}

const statCards = [
  { key: 'total', icon: HiOutlineUsers, accent: 'from-oasis-primary to-oasis-primary-dark' },
  { key: 'teacher', icon: HiOutlineBookOpen, accent: 'from-oasis-warning to-oasis-warning-dark' },
  { key: 'student', icon: HiOutlineAcademicCap, accent: 'from-oasis-success to-oasis-success-dark' },
  { key: 'admin', icon: HiOutlineShieldCheck, accent: 'from-cyan-500 to-cyan-600' },
];

const permissionPageKeys = {
  '/admin/dashboard': 'dashboard', '/admin/students': 'students', '/admin/teachers': 'teachers',
  '/admin/courses': 'courses', '/admin/attendance': 'attendance', '/admin/leads': 'leads',
  '/admin/makeup-slots': 'makeupSlots', '/admin/requests': 'requests', '/admin/academics': 'academics',
  '/admin/finance': 'finance', '/admin/products': 'products', '/admin/users': 'users',
  '/admin/permissions': 'permissions', '/admin/settings': 'settings', '/admin/rooms': 'rooms',
};

export function UsersPage({ path }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', phone: '', fullName: '' });
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ role: 'teacher', newPassword: '' });
  const debounceRef = useRef(null);
  const getSignal = useAbortController();
  const { designTheme } = useDesignTheme();
  const { t, currentLanguage } = useTranslation();
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
      showToast(err?.data?.message || t('users.loadError'), 'error');
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
      showToast(t('users.form.requiredEmailPassword'), 'error');
      return;
    }
    setSubmitting(true);
    try {
      if (!form.fullName.trim()) {
        showToast(t('users.form.requiredFullName'), 'error');
        return;
      }
      await userService.createStaff({
        email: form.email.trim(),
        password: form.password,
        phone: form.phone.trim() || null,
        role: 'admin',
        fullName: form.fullName.trim(),
      });
      showToast(t('users.form.success'), 'success');
      setShowForm(false);
      setForm({ email: '', password: '', phone: '', fullName: '' });
      fetchUsers();
    } catch (err) {
      showToast(err?.data?.message || err?.data?.Message || err?.data?.error || t('users.form.error'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (user) => {
    setEditingUser(user);
    setEditForm({ role: user.role || 'teacher', newPassword: '' });
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await userService.updateUserRole(editingUser.id, editForm.role);
      if (editForm.newPassword.trim()) await userService.updateUserPassword(editingUser.id, editForm.newPassword);
      showToast(t('users.edit.success'), 'success');
      setEditingUser(null);
      fetchUsers(search);
    } catch (err) {
      showToast(err?.data?.message || err?.data?.error || t('users.edit.error'), 'error');
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
      title: t('users.delete.title'),
      message: t('users.delete.message', { email: user.email }),
      yesLabel: t('users.delete.yes'),
      cancelLabel: t('users.delete.cancel'),
    });
    if (!confirmed) return;
    showToast(t('users.delete.notReady'), 'info');
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
              <h2 class="text-xl md:text-2xl font-semibold text-zinc-900 tracking-tight">{t('users.title')}</h2>
              <p class="text-sm text-zinc-500 mt-0.5">
                {t('users.subtitle')}
              </p>
            </div>
          </div>
            <div class="flex items-center gap-2.5">
            <div class="relative flex-1 sm:flex-none">
              <HiOutlineMagnifyingGlass class="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                placeholder={t('users.searchPlaceholder')}
                value={search}
                onInput={handleSearch}
                class="w-full sm:w-56 lg:w-64 pl-10 pr-4 py-2.5 text-sm border border-zinc-200 rounded-xl bg-white text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-oasis-primary/20 focus:border-oasis-primary transition-all"
              />
            </div>
            <Button variant="primary" size="md" onClick={() => setShowForm(true)}>
              <span class="flex items-center gap-1.5">
                <HiOutlinePlus class="h-4 w-4" />
                {t('users.addUser')}
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
                <p class="text-xs font-medium text-zinc-400 tracking-wide uppercase">{t(`users.stats.${stat.key}`)}</p>
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
              <h3 class="text-lg font-semibold text-zinc-900">{t('users.form.title')}</h3>
              <button type="button" onClick={() => setShowForm(false)} class="p-1 text-zinc-400 hover:text-zinc-600 transition-colors">
                <HiOutlineXMark class="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateUser} class="flex flex-col gap-4">
              <SolidInput label={t('users.form.fullName')} placeholder={t('users.form.fullNamePlaceholder')} value={form.fullName} onInput={updateForm('fullName')} required />
              <SolidInput label={t('users.form.email')} type="email" placeholder={t('users.form.emailPlaceholder')} value={form.email} onInput={updateForm('email')} required />
              <SolidInput label={t('users.form.phone')} type="tel" placeholder={t('users.form.phonePlaceholder')} value={form.phone} onInput={updateForm('phone')} />
              <SolidInput label={t('users.form.password')} type="password" placeholder={t('users.form.passwordPlaceholder')} value={form.password} onInput={updateForm('password')} required />
              <div class="rounded-xl border border-cyan-100 bg-cyan-50 px-4 py-3 text-sm text-cyan-800">
                {t('users.form.role')}: {t('users.form.roleAdmin')}
              </div>
              <div class="flex gap-3 mt-2">
                <Button variant="secondary" size="md" type="button" onClick={() => setShowForm(false)}>{t('users.form.cancel')}</Button>
                <Button variant="primary" size="md" type="submit" loading={submitting} disabled={submitting}>{t('users.form.submit')}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div class={`${isNeo ? 'neo-card bg-white p-5' : 'bg-zinc-50 rounded-2xl border border-zinc-100'} overflow-hidden`}>
        <div class="flex items-center justify-between px-5 md:px-6 py-3.5 border-b border-zinc-100">
          <div class="flex items-center gap-2">
            <span class="text-sm font-semibold text-zinc-900">{t('users.listTitle')}</span>
            <span class="text-xs font-medium text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full">
              {users.length}
            </span>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-zinc-100 bg-zinc-50/50">
                <th class="text-left px-5 md:px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider w-[40%]">{t('users.table.user')}</th>
                <th class="text-left px-5 md:px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider hidden md:table-cell">{t('users.table.email')}</th>
                <th class="text-left px-5 md:px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider hidden sm:table-cell">{t('users.table.role')}</th>
                <th class="text-left px-5 md:px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider hidden xl:table-cell">{t('users.table.joinedDate')}</th>
                <th class="text-right px-5 md:px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider"><span class="sr-only">{t('users.table.actions')}</span></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-zinc-100">
              {loading ? (
                <tr>
                  <td colspan="5" class="px-6 py-16 text-center">
                    <div class="mx-auto mb-3 h-8 w-8 rounded-full border-2 border-oasis-primary border-t-transparent animate-spin" />
                    <p class="text-sm text-zinc-400">{t('users.empty.loading')}</p>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colspan="5" class="px-6 py-16 text-center">
                    <p class="text-sm text-zinc-400">{search ? t('users.empty.noResults') : t('users.empty.noUsers')}</p>
                  </td>
                </tr>
              ) : (
                users.map((user, i) => {
                  const role = getRoleConfig(user.role, t);
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
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString(currentLanguage === 'th' ? 'th-TH' : 'en-US') : '-'}
                      </td>
                      <td class="px-5 md:px-6 py-3.5 text-right">
                        <div class="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(user)} title={t('users.edit.title')} class="p-1.5 md:p-2 text-zinc-400 hover:text-oasis-primary rounded-xl hover:bg-oasis-primary/5 transition-all">
                            <HiOutlinePencil class="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDelete(user)} title={t('common.delete')} class="p-1.5 md:p-2 text-zinc-400 hover:text-oasis-danger rounded-xl hover:bg-oasis-danger/5 transition-all">
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
            {t('users.showing', { count: users.length })}
          </p>
        </div>
      </div>

      {editingUser && (
        <div class="fixed inset-0 z-50 flex items-center justify-center">
          <div class="absolute inset-0 bg-black/50 backdrop-blur-lg" onClick={() => setEditingUser(null)} />
          <div class={`relative w-full max-w-md mx-4 ${isNeo ? 'neo-card bg-white p-6' : 'bg-white rounded-2xl p-6 shadow-xl'}`}>
            <div class="flex items-center justify-between mb-5">
              <div>
                <h3 class="text-lg font-semibold text-zinc-900">{t('users.edit.title')}</h3>
                <p class="text-sm text-zinc-500 mt-1">{editingUser.email}</p>
              </div>
              <button type="button" onClick={() => setEditingUser(null)} class="p-1 text-zinc-400 hover:text-zinc-600">
                <HiOutlineXMark class="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleEditUser} class="flex flex-col gap-4">
              <label class="flex flex-col gap-1.5 text-sm font-medium text-zinc-800">
                {t('users.edit.role')}
                <select value={editForm.role} onChange={(e) => setEditForm((prev) => ({ ...prev, role: e.target.value }))} class="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm">
                  <option value="admin">{t('users.edit.roleAdmin')}</option>
                  <option value="teacher">{t('users.edit.roleTeacher')}</option>
                  <option value="staff">{t('users.edit.roleStaff')}</option>
                  <option value="parent">{t('users.edit.roleParent')}</option>
                  <option value="student">{t('users.edit.roleStudent')}</option>
                </select>
              </label>
              <SolidInput label={t('users.edit.newPassword')} type="password" placeholder={t('users.edit.passwordPlaceholder')} value={editForm.newPassword} onInput={(e) => setEditForm((prev) => ({ ...prev, newPassword: e.target.value }))} />
              <p class="text-xs text-zinc-500">{t('users.edit.passwordNote')}</p>
              <div class="overflow-x-auto rounded-xl border border-zinc-200">
                <table class="w-full text-xs">
                  <thead class="bg-zinc-50 text-zinc-500">
                    <tr>
                      <th class="px-3 py-2 text-left font-semibold">{t('users.edit.permissions.page')}</th>
                      <th class="px-3 py-2 text-center font-semibold">{t('users.edit.permissions.read')}</th>
                      <th class="px-3 py-2 text-center font-semibold">{t('users.edit.permissions.edit')}</th>
                      <th class="px-3 py-2 text-center font-semibold">{t('users.edit.permissions.delete')}</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-zinc-100">
                    {Object.entries(PAGE_PERMISSIONS).map(([page, config]) => {
                      const permission = getPagePermission(editForm.role, page);
                      return <tr key={page}>
                        <td class="px-3 py-2 text-zinc-700 whitespace-nowrap">{t(`navigation.${permissionPageKeys[page]}`, { defaultValue: config.label })}</td>
                        <td class={`px-3 py-2 text-center font-bold ${permission.read ? 'text-emerald-600' : 'text-zinc-300'}`}>{permission.read ? '✓' : '-'}</td>
                        <td class={`px-3 py-2 text-center font-bold ${permission.edit ? 'text-amber-600' : 'text-zinc-300'}`}>{permission.edit ? '✓' : '-'}</td>
                        <td class={`px-3 py-2 text-center font-bold ${permission.delete ? 'text-red-600' : 'text-zinc-300'}`}>{permission.delete ? '✓' : '-'}</td>
                      </tr>;
                    })}
                  </tbody>
                </table>
              </div>
              <div class="flex gap-3 mt-2">
                <Button variant="secondary" size="md" type="button" onClick={() => setEditingUser(null)}>{t('users.edit.cancel')}</Button>
                <Button variant="primary" size="md" type="submit" loading={submitting} disabled={submitting}>{t('users.edit.submit')}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </AdminLayout>
  );
}

