import { AdminLayout } from '../../layouts/admin-layout';
import { DashboardOverviewWidget } from '../../components/dashboard/dashboard-overview';
import { PlayfulGreeting } from '../../components/dashboard/playful-greeting';
import { unlockBadge } from '../../components/ui';
import { route } from 'preact-router';
import { useEffect } from 'preact/hooks';
import { useDesignTheme } from '../../hooks/useDesignTheme';
import { useTranslation } from '../../hooks';
import { useAppContext } from '../../store/AppContext';
import { getPagePermission } from '../../config/permissions';
import {
  HiOutlineArrowRight,
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
  const { designTheme } = useDesignTheme();
  const { state } = useAppContext();
  const { t } = useTranslation();
  const isNeo = designTheme === 'neobrutalism';
  const role = state.userProfile?.role || state.user?.role;
  const availableActions = getAvailableDashboardActions(role);

  useEffect(() => {
    unlockBadge('first_login');
  }, []);

  return (
    <AdminLayout path={path}>
      {/* Playful Greeting — เปลี่ยนทุกวัน */}
      <PlayfulGreeting />

      <section
        id="dashboard-quick-actions"
        aria-labelledby="dashboard-quick-actions-title"
        class={`mb-6 p-5 sm:p-6 ${isNeo ? 'border-2 border-slate-900 bg-white shadow-[3px_3px_0px_#0f172a]' : 'rounded-2xl border border-slate-200 bg-white shadow-sm'}`}
      >
        <div class="mb-4">
          <h2 id="dashboard-quick-actions-title" class="text-lg font-semibold text-oasis-heading">
            {t('dashboard.quickActions')}
          </h2>
          <p class="mt-1 text-sm text-oasis-body">{t('dashboard.quickActionsDescription')}</p>
        </div>
        {availableActions.length > 0 ? (
          <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {availableActions.map((action) => (
              <button
                key={action.path}
                type="button"
                onClick={() => route(action.path)}
                class="group flex min-h-16 items-center gap-3 rounded-lg border border-slate-200 px-3 py-3 text-left transition-colors hover:border-oasis-primary/40 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oasis-primary focus-visible:ring-offset-2"
              >
                <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-oasis-primary">
                  <action.icon class="h-5 w-5" aria-hidden="true" />
                </span>
                <span class="min-w-0 flex-1">
                  <span class="block font-semibold text-oasis-heading">{t(action.label)}</span>
                  <span class="mt-0.5 block text-sm text-oasis-body">{t(action.description)}</span>
                </span>
                <HiOutlineArrowRight class="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-oasis-primary" aria-hidden="true" />
              </button>
            ))}
          </div>
        ) : (
          <p class="rounded-lg bg-slate-50 px-4 py-3 text-sm text-oasis-body">{t('dashboard.noQuickActions')}</p>
        )}
      </section>

      {/* Bento Grid Dashboard Overview */}
      <DashboardOverviewWidget />
    </AdminLayout>
  );
}


