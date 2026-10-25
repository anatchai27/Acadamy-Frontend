import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/preact';
import { DashboardPage, getAvailableDashboardActions } from '../dashboard-page';

vi.mock('../../../store/AppContext', () => ({
  useAppContext: () => ({ state: { user: { role: 'admin' } }, dispatch: vi.fn() }),
}));
vi.mock('../../../hooks/useDesignTheme', () => ({ useDesignTheme: () => ({ designTheme: 'neobrutalism' }) }));
vi.mock('../../../layouts/admin-layout', () => ({ AdminLayout: ({ children }) => <div>{children}</div> }));
vi.mock('../../../components/dashboard/dashboard-overview', () => ({ DashboardOverviewWidget: () => <div>Overview Widget</div> }));
vi.mock('../../../components/dashboard/playful-greeting', () => ({ PlayfulGreeting: () => <div>สวัสดีตอนเช้า</div> }));
vi.mock('../../../components/ui', () => ({
  unlockBadge: vi.fn(),
}));
vi.mock('react-icons/hi2', () => ({
  HiOutlineArrowRight: () => <svg />,
  HiOutlineBanknotes: () => <svg />,
  HiOutlineBookOpen: () => <svg />,
  HiOutlineClipboardDocumentCheck: () => <svg />,
  HiOutlineQrCode: () => <svg />,
  HiOutlineShoppingBag: () => <svg />,
  HiOutlineUserGroup: () => <svg />,
}));

describe('Owner dashboard', () => {
  it('prioritizes useful shortcuts and does not show unavailable sample-data sections', () => {
    render(<DashboardPage path="/admin/dashboard" />);
    expect(screen.getByRole('button', { name: /เช็คชื่อเข้าเรียน/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ค้นหานักเรียน/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ตรวจคำร้อง/ })).toBeInTheDocument();
    expect(screen.queryByText(/ยังไม่มี API/)).not.toBeInTheDocument();
    expect(screen.queryByText('JavaScript Basics')).not.toBeInTheDocument();
  });

  it('only shows shortcuts the current role can access', () => {
    render(<DashboardPage path="/admin/dashboard" />);
    expect(screen.getByRole('button', { name: /ดูแลการเงิน/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /จัดการสินค้า/ })).not.toBeInTheDocument();
    const teacherActions = getAvailableDashboardActions('teacher').map(({ path }) => path);
    expect(teacherActions).toContain('/admin/attendance');
    expect(teacherActions).toContain('/admin/requests');
    expect(teacherActions).not.toContain('/admin/finance');
    expect(teacherActions).not.toContain('/admin/products');
  });
});
