import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { UsersPage } from '../users-page';
import { userService } from '../../../services';
import { showToast } from '../../../components/ui';

const copy = {
  'users.title': 'จัดการผู้ใช้',
  'users.subtitle': 'จัดการบัญชีผู้ใช้ทั้งหมดในระบบ',
  'users.searchPlaceholder': 'ค้นหาชื่อหรืออีเมล...',
  'users.addUser': 'เพิ่มผู้ใช้',
  'users.listTitle': 'รายชื่อผู้ใช้ทั้งหมด',
  'users.form.title': 'เพิ่มผู้ใช้',
  'users.form.fullName': 'ชื่อผู้ใช้',
  'users.form.fullNamePlaceholder': 'ชื่อ-นามสกุล',
  'users.form.email': 'อีเมล',
  'users.form.emailPlaceholder': 'อีเมลสำหรับเข้าสู่ระบบ',
  'users.form.phone': 'เบอร์โทรศัพท์',
  'users.form.phonePlaceholder': '08xxxxxxxx',
  'users.form.password': 'รหัสผ่าน',
  'users.form.passwordPlaceholder': 'ตั้งรหัสผ่าน',
  'users.form.role': 'บทบาท',
  'users.form.roleAdmin': 'ผู้ดูแลระบบ',
  'users.form.adminRoleWarning': 'บัญชีใหม่นี้จะได้สิทธิ์ผู้ดูแลระบบ',
  'users.form.cancel': 'ยกเลิก',
  'users.form.submit': 'เพิ่มผู้ใช้',
  'users.form.success': 'เพิ่มผู้ใช้สำเร็จ',
  'users.form.error': 'เพิ่มผู้ใช้ไม่สำเร็จ',
  'users.edit.title': 'จัดการบัญชีผู้ใช้',
  'users.edit.role': 'บทบาท / สิทธิ์',
  'users.edit.roleTeacher': 'ผู้สอน',
  'users.edit.roleAdmin': 'ผู้ดูแล',
  'users.edit.roleStaff': 'พนักงาน',
  'users.edit.roleParent': 'ผู้ปกครอง',
  'users.edit.roleStudent': 'ผู้เรียน',
  'users.edit.newPassword': 'รหัสผ่านใหม่ (เว้นว่างถ้าไม่เปลี่ยน)',
  'users.edit.passwordPlaceholder': 'อย่างน้อย 8 ตัวอักษร',
  'users.edit.passwordNote': 'ระบบจะไม่แสดงรหัสผ่านเดิม เพื่อความปลอดภัย',
  'users.edit.permissions.page': 'หน้า',
  'users.edit.permissions.read': 'อ่าน',
  'users.edit.permissions.edit': 'แก้ไข',
  'users.edit.permissions.delete': 'ลบ',
  'users.edit.cancel': 'ยกเลิก',
  'users.edit.submit': 'บันทึก',
  'users.edit.success': 'อัปเดตข้อมูลผู้ใช้สำเร็จ',
  'users.edit.error': 'อัปเดตข้อมูลผู้ใช้ไม่สำเร็จ',
  'users.edit.partialError': 'เปลี่ยนบทบาทแล้ว แต่เปลี่ยนรหัสผ่านไม่สำเร็จ',
  'users.loadError': 'ไม่สามารถโหลดข้อมูลผู้ใช้ได้',
  'users.loadErrorEmpty': 'โหลดรายชื่อไม่สำเร็จ',
  'users.loadErrorShowingPrevious': 'ยังแสดงข้อมูลชุดก่อนหน้าอยู่',
  'users.retry': 'ลองโหลดอีกครั้ง',
  'users.retryLoading': 'กำลังโหลด...',
  'users.empty.loading': 'กำลังโหลดข้อมูล...',
  'users.empty.noResults': 'ไม่พบผู้ใช้ที่ค้นหา',
  'users.empty.noUsers': 'ไม่มีผู้ใช้ในระบบ',
  'users.showing': 'แสดงทั้งหมด {{count}} รายการ',
  'users.stats.total': 'ผู้ใช้ทั้งหมด',
  'users.stats.teacher': 'ผู้สอน',
  'users.stats.student': 'ผู้เรียน',
  'users.stats.admin': 'ผู้ดูแล',
  'users.table.user': 'ผู้ใช้',
  'users.table.email': 'อีเมล',
  'users.table.role': 'บทบาท',
  'users.table.joinedDate': 'วันที่สมัคร',
  'users.table.actions': 'จัดการ',
  'users.roles.admin': 'ผู้ดูแล',
  'users.roles.teacher': 'ผู้สอน',
  'users.roles.staff': 'พนักงาน',
  'users.roles.parent': 'ผู้ปกครอง',
  'users.roles.student': 'ผู้เรียน',
  'common.delete': 'ลบ',
  'users.delete.notReady': 'ฟังก์ชันลบผู้ใช้ยังไม่พร้อมใช้งาน',
};

vi.mock('../../../layouts/admin-layout', () => ({ AdminLayout: ({ children }) => <main>{children}</main> }));
vi.mock('../../../hooks', () => ({
  useAbortController: () => () => ({ aborted: false }),
  useTranslation: () => ({ t: (key, options = {}) => {
    const value = copy[key] ?? options.defaultValue ?? key;
    return typeof value === 'string' ? value.replace('{{count}}', String(options.count ?? '')) : value;
  }, currentLanguage: 'th' }),
}));
vi.mock('../../../hooks/useDesignTheme', () => ({ useDesignTheme: () => ({ designTheme: 'bento' }) }));
vi.mock('../../../services', () => ({
  userService: {
    getUsers: vi.fn(),
    createStaff: vi.fn(),
    updateUserRole: vi.fn(),
    updateUserPassword: vi.fn(),
  },
}));
vi.mock('../../../components/ui', () => ({
  Button: ({ children, loading, ...props }) => <button {...props}>{loading ? 'กำลังดำเนินการ...' : children}</button>,
  SolidInput: ({ label, id, ...props }) => <label for={id}>{label}<input id={id} {...props} /></label>,
  showToast: vi.fn(),
}));
vi.mock('../../../components/ui/bento-grid', () => ({ BentoGrid: ({ children }) => <div>{children}</div> }));
vi.mock('react-icons/hi2', () => ({
  HiOutlineUserGroup: () => <span aria-hidden="true" />,
  HiOutlineAcademicCap: () => <span aria-hidden="true" />,
  HiOutlineShieldCheck: () => <span aria-hidden="true" />,
  HiOutlineMagnifyingGlass: () => <span aria-hidden="true" />,
  HiOutlinePencil: () => <span aria-hidden="true" />,
  HiOutlineTrash: () => <span aria-hidden="true" />,
  HiOutlineUsers: () => <span aria-hidden="true" />,
  HiOutlineBookOpen: () => <span aria-hidden="true" />,
  HiOutlinePlus: () => <span aria-hidden="true" />,
  HiOutlineXMark: () => <span aria-hidden="true" />,
  HiOutlineArrowPath: () => <span aria-hidden="true" />,
}));

const account = { id: 3, email: 'teacher@example.com', fullName: 'คุณครูทดสอบ', role: 'teacher' };

beforeEach(() => vi.clearAllMocks());

describe('UsersPage', () => {
  it('shows a retry state instead of an empty list when loading fails', async () => {
    userService.getUsers.mockRejectedValueOnce(new Error('network')).mockResolvedValueOnce({ data: [account] });
    render(<UsersPage path="/admin/users" />);

    expect(await screen.findByRole('alert')).toHaveTextContent('ไม่สามารถโหลดข้อมูลผู้ใช้ได้');
    expect(screen.queryByText('ไม่มีผู้ใช้ในระบบ')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'ลองโหลดอีกครั้ง' }));
    expect(await screen.findByText('คุณครูทดสอบ')).toBeInTheDocument();
  });

  it('warns clearly that new accounts are created as administrators', async () => {
    userService.getUsers.mockResolvedValue({ data: [] });
    render(<UsersPage path="/admin/users" />);
    fireEvent.click(await screen.findByRole('button', { name: 'เพิ่มผู้ใช้' }));

    expect(screen.getByRole('dialog', { name: 'เพิ่มผู้ใช้' })).toBeInTheDocument();
    expect(screen.getByText('บัญชีใหม่นี้จะได้สิทธิ์ผู้ดูแลระบบ')).toBeInTheDocument();
    expect(screen.getByLabelText('ชื่อผู้ใช้')).toBeRequired();
  });

  it('reports partial success when the role changes but the password update fails', async () => {
    userService.getUsers.mockResolvedValue({ data: [account] });
    userService.updateUserRole.mockResolvedValue({});
    userService.updateUserPassword.mockRejectedValue(new Error('password rejected'));
    render(<UsersPage path="/admin/users" />);
    fireEvent.click(await screen.findByRole('button', { name: 'จัดการบัญชีผู้ใช้: teacher@example.com' }));
    fireEvent.change(screen.getByLabelText('บทบาท / สิทธิ์'), { target: { value: 'staff' } });
    fireEvent.input(screen.getByLabelText('รหัสผ่านใหม่ (เว้นว่างถ้าไม่เปลี่ยน)'), { target: { value: 'newPass123' } });
    fireEvent.click(screen.getByRole('button', { name: 'บันทึก' }));

    await waitFor(() => expect(showToast).toHaveBeenCalledWith(expect.stringContaining('เปลี่ยนบทบาทแล้ว'), 'warning'));
    expect(userService.updateUserRole).toHaveBeenCalledWith(3, 'staff');
    expect(userService.updateUserPassword).toHaveBeenCalledWith(3, 'newPass123');
    expect(screen.getByRole('dialog', { name: 'จัดการบัญชีผู้ใช้' })).toBeInTheDocument();
  });

  it('does not expose deletion as an active action before it is implemented', async () => {
    userService.getUsers.mockResolvedValue({ data: [account] });
    render(<UsersPage path="/admin/users" />);
    const deleteButton = await screen.findByRole('button', { name: /ลบ: teacher@example.com/ });

    expect(deleteButton).toBeDisabled();
  });
});
