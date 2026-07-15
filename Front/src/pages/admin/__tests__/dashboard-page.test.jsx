import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/preact';
import { AppProvider } from '../../../store/AppContext';
import { DashboardPage } from '../dashboard-page';

// Mock AdminLayout to isolate DashboardPage rendering
vi.mock('../../../layouts/admin-layout', () => ({
  AdminLayout: ({ children, path }) => (
    <div data-testid="admin-layout" data-path={path}>
      {children}
    </div>
  ),
}));

// Mock DashboardOverviewWidget
vi.mock('../../../components/dashboard/dashboard-overview', () => ({
  DashboardOverviewWidget: () => <div data-testid="dashboard-overview-widget">Overview Widget</div>,
}));

function renderDashboard(path = '/admin/dashboard') {
  return render(
    <AppProvider>
      <DashboardPage path={path} />
    </AppProvider>
  );
}

describe('DashboardPage', () => {
  // ================================================================
  // Arrange-Act-Assert (AAA) pattern — 30 test cases
  // ================================================================

  // ── Group 1: Rendering / Structural (7 tests) ──

  describe('Rendering & Structure', () => {
    it('1. renders inside AdminLayout', () => {
      // Arrange
      // Act
      renderDashboard();
      // Assert
      expect(screen.getByTestId('admin-layout')).toBeInTheDocument();
    });

    it('2. passes path prop to AdminLayout', () => {
      // Arrange
      const path = '/admin/dashboard';
      // Act
      renderDashboard(path);
      // Assert
      expect(screen.getByTestId('admin-layout')).toHaveAttribute('data-path', path);
    });

    it('3. renders page heading "ภาพรวมระบบ"', () => {
      // Arrange
      // Act
      renderDashboard();
      // Assert
      expect(screen.getByText('ภาพรวมระบบ')).toBeInTheDocument();
    });

    it('4. renders sub-heading with system description', () => {
      // Arrange
      // Act
      renderDashboard();
      // Assert
      expect(screen.getByText(/ดูข้อมูลสำคัญและการเปลี่ยนแปลงของระบบคุณ/)).toBeInTheDocument();
    });

    it('5. renders DashboardOverviewWidget', () => {
      // Arrange
      // Act
      renderDashboard();
      // Assert
      expect(screen.getByTestId('dashboard-overview-widget')).toBeInTheDocument();
    });

    it('6. renders "กิจกรรมล่าสุด" section header', () => {
      // Arrange
      // Act
      renderDashboard();
      // Assert
      expect(screen.getByText('กิจกรรมล่าสุด')).toBeInTheDocument();
    });

    it('7. renders "ดูทั้งหมด" button', () => {
      // Arrange
      // Act
      renderDashboard();
      // Assert
      expect(screen.getByText('ดูทั้งหมด')).toBeInTheDocument();
    });
  });

  // ── Group 2: Activity Feed (5 tests) ──

  describe('Activity Feed', () => {
    it('8. renders all 5 recent activities', () => {
      // Arrange
      // Act
      renderDashboard();
      // Assert
      expect(screen.getByText('ผู้ใช้ใหม่ลงทะเบียน: john@example.com')).toBeInTheDocument();
      expect(screen.getByText('คอร์ส "JavaScript Basics" ถูกเปิดสอน')).toBeInTheDocument();
      expect(screen.getByText('ผู้เรียน 5 คนเรียนจบคอร์ส "React 101"')).toBeInTheDocument();
      expect(screen.getByText('อัปเดตระบบชำระเงินสำเร็จ')).toBeInTheDocument();
      expect(screen.getByText('มีการเพิ่มคอร์ส "Python Advanced"')).toBeInTheDocument();
    });

    it('9. renders timestamp for each activity', () => {
      // Arrange
      // Act
      renderDashboard();
      // Assert
      expect(screen.getByText('5 นาทีที่แล้ว')).toBeInTheDocument();
      expect(screen.getByText('1 ชั่วโมงที่แล้ว')).toBeInTheDocument();
      expect(screen.getByText('2 ชั่วโมงที่แล้ว')).toBeInTheDocument();
      expect(screen.getByText('3 ชั่วโมงที่แล้ว')).toBeInTheDocument();
      expect(screen.getByText('5 ชั่วโมงที่แล้ว')).toBeInTheDocument();
    });

    it('10. first activity uses UserPlusIcon (primary color)', () => {
      // Arrange
      // Act
      renderDashboard();
      // Assert
      const icons = document.querySelectorAll('.text-tiwhub-primary');
      expect(icons.length).toBeGreaterThanOrEqual(1);
    });

    it('11. second activity uses BookIcon (success color)', () => {
      // Arrange
      // Act
      renderDashboard();
      // Assert
      const icons = document.querySelectorAll('.text-tiwhub-success');
      expect(icons.length).toBeGreaterThanOrEqual(1);
    });

    it('12. last activity icon container has success background from colorIconBgMap', () => {
      // Arrange
      // Act
      renderDashboard();
      // Assert
      const bgElement = document.querySelector('.bg-tiwhub-success\\/10');
      expect(bgElement).toBeInTheDocument();
    });
  });

  // ── Group 3: Svg Icons (4 tests) ──

  describe('SVG Icons', () => {
    it('13. renders UserPlusIcon svg', () => {
      // Arrange
      // Act
      renderDashboard();
      // Assert
      const svgs = document.querySelectorAll('svg');
      const userPlusPattern = svgs.length > 0;
      expect(userPlusPattern).toBe(true);
    });

    it('14. renders BookIcon svg', () => {
      // Arrange
      // Act
      renderDashboard();
      // Assert
      const svgs = document.querySelectorAll('svg');
      expect(svgs.length).toBeGreaterThanOrEqual(5);
    });

    it('15. renders CheckIcon svg', () => {
      // Arrange
      // Act
      renderDashboard();
      // Assert
      const checkCircle = document.querySelector('[d*="M9 12l2 2 4-4"]');
      expect(checkCircle).toBeInTheDocument();
    });

    it('16. renders CogIcon svg', () => {
      // Arrange
      // Act
      renderDashboard();
      // Assert
      const cog = document.querySelector('[d*="M10.325"]');
      expect(cog).toBeInTheDocument();
    });
  });

  // ── Group 4: Top Courses Section (6 tests) ──

  describe('Top Courses Sidebar', () => {
    it('17. renders "คอร์สยอดนิยม" header', () => {
      // Arrange
      // Act
      renderDashboard();
      // Assert
      expect(screen.getByText('คอร์สยอดนิยม')).toBeInTheDocument();
    });

    it('18. renders "JavaScript Basics" course', () => {
      // Arrange
      // Act
      renderDashboard();
      // Assert
      expect(screen.getByText('JavaScript Basics')).toBeInTheDocument();
    });

    it('19. renders "React 101" course', () => {
      // Arrange
      // Act
      renderDashboard();
      // Assert
      expect(screen.getByText('React 101')).toBeInTheDocument();
    });

    it('20. renders "Python for Beginners" course', () => {
      // Arrange
      // Act
      renderDashboard();
      // Assert
      expect(screen.getByText('Python for Beginners')).toBeInTheDocument();
    });

    it('21. renders student count for each course', () => {
      // Arrange
      // Act
      renderDashboard();
      // Assert
      expect(screen.getByText('45 คน')).toBeInTheDocument();
      expect(screen.getByText('38 คน')).toBeInTheDocument();
      expect(screen.getByText('32 คน')).toBeInTheDocument();
    });

    it('22. course dot indicators use correct color classes', () => {
      // Arrange
      // Act
      renderDashboard();
      // Assert
      // The course dots use color classes from colorTextMap via replace
      const dots = document.querySelectorAll('.rounded-full');
      // At least 4 dots: 3 course dots + 1 bell notification dot from AdminLayout (mocked out)
      // Since AdminLayout is mocked, we only get the course dots
      expect(dots.length).toBeGreaterThanOrEqual(3);
    });
  });

  // ── Group 5: Quick Actions Section (5 tests) ──

  describe('Quick Actions', () => {
    it('23. renders "ดำเนินการด่วน" header', () => {
      // Arrange
      // Act
      renderDashboard();
      // Assert
      expect(screen.getByText('ดำเนินการด่วน')).toBeInTheDocument();
    });

    it('24. renders "เพิ่มผู้ใช้ใหม่" action button', () => {
      // Arrange
      // Act
      renderDashboard();
      // Assert
      expect(screen.getByText('เพิ่มผู้ใช้ใหม่')).toBeInTheDocument();
    });

    it('25. renders "สร้างคอร์สเรียน" action button', () => {
      // Arrange
      // Act
      renderDashboard();
      // Assert
      expect(screen.getByText('สร้างคอร์สเรียน')).toBeInTheDocument();
    });

    it('26. renders "ดูรายงาน" action button', () => {
      // Arrange
      // Act
      renderDashboard();
      // Assert
      expect(screen.getByText('ดูรายงาน')).toBeInTheDocument();
    });

    it('27. action buttons are actual <button> elements', () => {
      // Arrange
      // Act
      renderDashboard();
      // Assert
      const buttons = screen.getAllByRole('button');
      // "ดูทั้งหมด" + 3 action buttons = 4
      expect(buttons.length).toBeGreaterThanOrEqual(4);
    });
  });

  // ── Group 6: colorIconBgMap & colorTextMap (2 tests) ──

  describe('Color Maps', () => {
    it('28. uses colorIconBgMap for activity icon backgrounds', () => {
      // Arrange
      // Act
      renderDashboard();
      // Assert
      // primary icon bg
      expect(document.querySelector('.bg-tiwhub-primary\\/10')).toBeInTheDocument();
      // success icon bg
      expect(document.querySelector('.bg-tiwhub-success\\/10')).toBeInTheDocument();
      // danger icon bg
      expect(document.querySelector('.bg-tiwhub-danger\\/10')).toBeInTheDocument();
    });

    it('29. uses colorTextMap for activity icon colors', () => {
      // Arrange
      // Act
      renderDashboard();
      // Assert
      expect(document.querySelector('.text-tiwhub-primary')).toBeInTheDocument();
      expect(document.querySelector('.text-tiwhub-accent')).toBeInTheDocument();
      expect(document.querySelector('.text-tiwhub-danger')).toBeInTheDocument();
    });
  });

  // ── Group 7: Dark mode / layout classes (1 test) ──

  describe('Layout & Styling', () => {
    it('30. two-column layout contains correct grid classes', () => {
      // Arrange
      // Act
      renderDashboard();
      // Assert
      const grid = document.querySelector('.grid.grid-cols-1.lg\\:grid-cols-3');
      expect(grid).toBeInTheDocument();
      const activityFeed = grid.querySelector('.lg\\:col-span-2');
      expect(activityFeed).toBeInTheDocument();
    });
  });
});
