import { useEffect, useState } from 'preact/hooks';
import { AdminLayout } from '../../layouts/admin-layout';
import { Button, showToast } from '../../components/ui';
import { userService } from '../../services';
import { useDesignTheme } from '../../hooks/useDesignTheme';
import { PAGE_PERMISSIONS, getPagePermission, setRolePermissions } from '../../config/permissions';
import { HiOutlineShieldCheck } from 'react-icons/hi2';

const roles = [
  { value: 'admin', label: 'ผู้ดูแล (Admin)' },
  { value: 'teacher', label: 'ผู้สอน (Teacher)' },
  { value: 'staff', label: 'พนักงาน (Staff)' },
  { value: 'parent', label: 'ผู้ปกครอง (Parent)' },
  { value: 'student', label: 'ผู้เรียน (Student)' },
];

const loadPermissionDraft = role => Object.fromEntries(
  Object.keys(PAGE_PERMISSIONS).map(page => [page, { ...getPagePermission(role, page) }]),
);

export function PermissionsPage({ path }) {
  const [permissionRole, setPermissionRole] = useState('teacher');
  const [permissionDraft, setPermissionDraft] = useState(() => loadPermissionDraft('teacher'));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { designTheme } = useDesignTheme();
  const isNeo = designTheme === 'neobrutalism';

  const loadPermissions = async role => {
    setPermissionRole(role);
    setPermissionDraft(loadPermissionDraft(role));
    setLoading(true);
    try {
      const response = await userService.getRolePermissions(role);
      if (response.data?.permissions) setPermissionDraft(response.data.permissions);
    } catch {
      // Use the local/default policy when the server has no saved policy yet.
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPermissions('teacher'); }, []);

  const isAllPermissionChecked = action => Object.keys(PAGE_PERMISSIONS)
    .every(page => permissionDraft[page]?.[action]);

  const toggleAllPermissions = action => {
    const checked = !isAllPermissionChecked(action);
    setPermissionDraft(previous => Object.fromEntries(
      Object.keys(PAGE_PERMISSIONS).map(page => [page, { ...previous[page], [action]: checked }]),
    ));
  };

  const togglePermission = (page, action) => {
    setPermissionDraft(previous => ({
      ...previous,
      [page]: { ...previous[page], [action]: !previous[page]?.[action] },
    }));
  };

  const savePermissions = async () => {
    setSaving(true);
    try {
      await userService.updateRolePermissions(permissionRole, permissionDraft);
      setRolePermissions(permissionRole, permissionDraft);
      showToast(`บันทึกสิทธิ์ ${permissionRole} สำเร็จ`, 'success');
    } catch (err) {
      showToast(err?.data?.message || err?.data?.error || 'บันทึก permission ไม่สำเร็จ', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout path={path}>
      <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex items-center gap-3">
          <div class={`flex h-11 w-11 items-center justify-center ${isNeo ? 'border-2 border-black bg-cyan-100' : 'rounded-xl bg-oasis-primary/10 text-oasis-primary'}`}>
            <HiOutlineShieldCheck class="h-5 w-5" />
          </div>
          <div>
            <h2 class="text-2xl font-semibold tracking-tight text-zinc-900">สิทธิ์การใช้งาน</h2>
            <p class="mt-1 text-sm text-zinc-500">กำหนดสิทธิ์การอ่าน แก้ไข และลบข้อมูลแยกตาม Role</p>
          </div>
        </div>
        <label class="flex items-center gap-2 text-sm font-medium text-zinc-700">
          เลือก Role
          <select value={permissionRole} onChange={event => loadPermissions(event.target.value)} class="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm">
            {roles.map(role => <option value={role.value} key={role.value}>{role.label}</option>)}
          </select>
        </label>
      </div>

      <section class={`${isNeo ? 'neo-card bg-white' : 'rounded-2xl border border-zinc-200/80 bg-white shadow-sm'} overflow-hidden`}>
        <div class="overflow-x-auto">
          <table class="w-full min-w-[680px] text-sm">
            <thead class="bg-zinc-50 text-zinc-500">
              <tr>
                <th class="px-4 py-3 text-left font-semibold">หน้า</th>
                <th class="px-4 py-3 text-left font-semibold">Path</th>
                {['read', 'edit', 'delete'].map(action => <th key={action} class="px-4 py-3 text-center font-semibold">
                  <label class="inline-flex cursor-pointer items-center justify-center gap-1.5">
                    <input type="checkbox" checked={isAllPermissionChecked(action)} onChange={() => toggleAllPermissions(action)} aria-label={`เลือกทั้งหมด ${action}`} class="h-4 w-4 rounded border-zinc-300 text-oasis-primary focus:ring-oasis-primary" />
                    {action.charAt(0).toUpperCase() + action.slice(1)}
                  </label>
                </th>)}
              </tr>
            </thead>
            <tbody class="divide-y divide-zinc-100">
              {Object.entries(PAGE_PERMISSIONS).map(([page, config]) => <tr key={page} class={loading ? 'opacity-60' : ''}>
                <td class="px-4 py-3 font-medium text-zinc-800">{config.label}</td>
                <td class="px-4 py-3 font-mono text-xs text-zinc-400">{page}</td>
                {['read', 'edit', 'delete'].map(action => <td key={action} class="px-4 py-3 text-center">
                  <input type="checkbox" checked={permissionDraft[page]?.[action] || false} onChange={() => togglePermission(page, action)} aria-label={`${config.label} ${action}`} class="h-4 w-4 rounded border-zinc-300 text-oasis-primary focus:ring-oasis-primary" />
                </td>)}
              </tr>)}
            </tbody>
          </table>
        </div>
        <div class="flex flex-col gap-3 border-t border-zinc-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p class="text-xs text-zinc-500">สิทธิ์ชุดนี้เป็น policy กลางของ Role และใช้ร่วมกันกับผู้ใช้ทุกคนที่มี Role เดียวกัน</p>
          <Button variant="primary" size="sm" onClick={savePermissions} loading={saving} disabled={saving}>บันทึกสิทธิ์</Button>
        </div>
      </section>
    </AdminLayout>
  );
}
