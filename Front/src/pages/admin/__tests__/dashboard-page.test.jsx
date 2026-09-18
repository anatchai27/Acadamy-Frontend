import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/preact';
import { DashboardPage } from '../dashboard-page';

vi.mock('../../../store/AppContext', () => ({
  useAppContext: () => ({ state: { designTheme: 'bento' }, dispatch: vi.fn() }),
}));
vi.mock('../../../hooks/useDesignTheme', () => ({ useDesignTheme: () => ({ designTheme: 'bento' }) }));
vi.mock('../../../layouts/admin-layout', () => ({ AdminLayout: ({ children }) => <div>{children}</div> }));
vi.mock('../../../components/dashboard/dashboard-overview', () => ({ DashboardOverviewWidget: () => <div>Overview Widget</div> }));
vi.mock('../../../components/dashboard/playful-greeting', () => ({ PlayfulGreeting: () => <div>สวัสดีตอนเช้า</div> }));
vi.mock('../../../components/ui', () => ({
  BentoGrid: ({ children }) => <div>{children}</div>,
  BentoCell: ({ children }) => <div>{children}</div>,
  unlockBadge: vi.fn(),
}));
vi.mock('react-icons/hi2', () => ({
  HiOutlineUserPlus: () => <svg />,
  HiOutlineBookOpen: () => <svg />,
  HiOutlineChartBar: () => <svg />,
}));

describe('Owner dashboard', () => {
  it('shows real-data empty states instead of hardcoded activity/course data', () => {
    render(<DashboardPage path="/admin/dashboard" />);
    expect(screen.getByText('ยังไม่มี API สำหรับกิจกรรมล่าสุด จึงยังไม่แสดงข้อมูลตัวอย่าง')).toBeInTheDocument();
    expect(screen.getByText('ยังไม่มี API สำหรับจัดอันดับคอร์ส จึงยังไม่แสดงตัวเลขสมมติ')).toBeInTheDocument();
    expect(screen.queryByText('JavaScript Basics')).not.toBeInTheDocument();
  });
});
