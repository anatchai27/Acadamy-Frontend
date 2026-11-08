import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/preact';
import i18n from '../../../i18n';
import { HelpPage } from '../help-page';

const { mockRole, mockRoute } = vi.hoisted(() => ({
  mockRole: { value: 'teacher' },
  mockRoute: vi.fn(),
}));

vi.mock('../../../store/AppContext', () => ({
  useAppContext: () => ({ state: { user: { role: mockRole.value } } }),
}));
vi.mock('../../../layouts/admin-layout', () => ({ AdminLayout: ({ children }) => <div>{children}</div> }));
vi.mock('preact-router', () => ({ route: mockRoute }));
vi.mock('react-icons/hi2', () => ({
  HiOutlineArrowTopRightOnSquare: () => <span aria-hidden="true" />,
  HiOutlineBookOpen: () => <span aria-hidden="true" />,
  HiOutlineShieldCheck: () => <span aria-hidden="true" />,
}));

describe('HelpPage', () => {
  beforeEach(async () => {
    mockRole.value = 'teacher';
    mockRoute.mockClear();
    await i18n.changeLanguage('th');
  });

  it('shows practical guidance and only links to pages available to teachers', () => {
    render(<HelpPage path="/admin/help" />);

    expect(screen.getByRole('heading', { name: 'คู่มือการใช้งาน' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'เชื่อมบัญชี LINE ของผู้ปกครอง' })).toBeInTheDocument();
    expect(screen.getByText(/รหัสใช้ได้ครั้งเดียวและหมดอายุใน 5 วัน/)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'การเงิน' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'ผู้ใช้และการตั้งค่าสถาบัน' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'การเงิน' })).not.toBeInTheDocument();
  });

  it('shows admin topics and navigates to the linked app page', () => {
    mockRole.value = 'admin';
    render(<HelpPage path="/admin/help" />);

    expect(screen.getByRole('heading', { name: 'การเงิน' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'ผู้ใช้และการตั้งค่าสถาบัน' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('link', { name: 'จัดการผู้เรียน' }));
    expect(mockRoute).toHaveBeenCalledWith('/admin/students');
  });
});
