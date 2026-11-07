import { AdminLayout } from '../../layouts/admin-layout';
import { DashboardOverviewWidget } from '../../components/dashboard/dashboard-overview';
import { DashboardOperations } from '../../components/dashboard/dashboard-operations';
import { PlayfulGreeting } from '../../components/dashboard/playful-greeting';
import { unlockBadge } from '../../components/ui';
import { useEffect } from 'preact/hooks';
import { useAppContext } from '../../store/AppContext';
import { getPagePermission } from '../../config/permissions';
import {
  HiOutlineBanknotes,
  HiOutlineBookOpen,
  HiOutlineClipboardDocumentCheck,
  HiOutlineQrCode,
  HiOutlineUserGroup,
} from 'react-icons/hi2';

const dashboardActions = [
  { path: '/admin/attendance', label: 'dashboard.quickActionsList.checkAttendance', description: 'dashboard.quickActionsList.checkAttendanceDescription', icon: HiOutlineQrCode },
  { path: '/admin/students', label: 'dashboard.quickActionsList.manageStudents', description: 'dashboard.quickActionsList.manageStudentsDescription', icon: HiOutlineUserGroup },
  { path: '/admin/requests', label: 'dashboard.quickActionsList.reviewRequests', description: 'dashboard.quickActionsList.reviewRequestsDescription', icon: HiOutlineClipboardDocumentCheck },
  { path: '/admin/finance', label: 'dashboard.quickActionsList.finance', description: 'dashboard.quickActionsList.financeDescription', icon: HiOutlineBanknotes },
  { path: '/admin/courses', label: 'dashboard.quickActionsList.manageCourses', description: 'dashboard.quickActionsList.manageCoursesDescription', icon: HiOutlineBookOpen },
];

export const getAvailableDashboardActions = (role) =>
  dashboardActions.filter((action) => getPagePermission(role, action.path).read);

export function DashboardPage({ path }) {
  const { state } = useAppContext();
  const role = state.userProfile?.role || state.user?.role;
  const userName = state.userProfile?.profile?.fullName || state.userProfile?.fullName || '';
  const availableActions = getAvailableDashboardActions(role);

  useEffect(() => {
    unlockBadge('first_login');
  }, []);

  return (
    <AdminLayout path={path}>
      {/* Template dashboard lead-in; keep all figures sourced from the live overview APIs. */}
      <PlayfulGreeting userName={userName} showPriorityLink={role === 'admin'} />

      <DashboardOverviewWidget />
      <div class="mt-6">
        <DashboardOperations role={role} actions={availableActions} />
      </div>

    </AdminLayout>
  );
}


