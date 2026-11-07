import { route } from 'preact-router';
import { useState, useEffect } from 'preact/hooks';
import { useAppContext } from '../store/AppContext';
import { logout, clearAuthStorage, setAuthStorage, switchInstitute } from '../services/auth-service';
import { showConfirm, showToast, BadgeSticker } from '../components/ui';
import { unlockBadge, useBadges } from '../components/ui/badge-sticker';
import { DashboardIcon, StudentIcon, TeacherIcon, CourseIcon, AttendanceIcon, RequestIcon, LeadIcon, MakeupIcon, RoomIcon, AcademicsIcon, FinanceIcon, UsersMenuIcon, PermissionsIcon, SettingsIcon, QrScanIcon, ChevronDownIcon, LogoutIcon, CalendarIcon, ClockIcon, PlusIcon } from '../components/ui/icons';
import { startAdminInactivityTimer } from '../services/admin-session-timeout';
import { canReadPage, canEditPage } from '../config/permissions';
import { useTranslation } from '../hooks';
import { LanguageSwitcher } from '../components/ui/language-switcher';
import { PaymentSlipNotificationBell } from '../components/ui/payment-slip-notification-bell';
const menuGroups = [{
  key: 'primary',
  label: 'ข้อมูลหลัก',
  items: [{
    path: '/admin/dashboard',
    label: 'หน้าหลัก',
    icon: DashboardIcon,
    roles: ['admin', 'teacher', 'staff']
  }, {
    path: '/admin/students',
    label: 'นักเรียน',
    icon: StudentIcon,
    roles: ['admin', 'teacher', 'staff']
  }, {
    path: '/admin/teachers',
    label: 'ครูผู้สอน',
    icon: TeacherIcon,
     roles: ['admin']
  }, {
    path: '/admin/courses',
    label: 'คอร์สเรียน',
    icon: CourseIcon,
    roles: ['admin', 'teacher']
  }]
}, {
  key: 'operations',
  label: 'การดำเนินงาน',
  items: [{
    path: '/admin/attendance',
    label: 'เช็คชื่อ',
    icon: AttendanceIcon,
    roles: ['admin', 'teacher']
  }, {
    path: '/admin/leads',
    label: 'ผู้สนใจทดลองเรียน',
    icon: LeadIcon,
     roles: ['admin']
  }, {
    path: '/admin/makeup-slots',
    label: 'เรียนชดเชย',
    icon: MakeupIcon,
    roles: ['admin', 'teacher']
  }, {
    path: '/admin/requests',
    label: 'คำร้องขอ',
    icon: RequestIcon,
    roles: ['admin', 'teacher']
  }, {
    path: '/admin/academics',
    label: 'ระบบวิชาการ',
    icon: AcademicsIcon,
    roles: ['admin', 'teacher']
  }]
}, {
  key: 'commerce',
  label: 'การเงินและสินค้า',
  items: [{
    path: '/admin/finance',
    label: 'การเงิน',
    icon: FinanceIcon,
    roles: ['admin', 'staff']
  }]
}, {
  key: 'system',
  label: 'ระบบ',
  items: [{
    path: '/admin/users',
    label: 'ผู้ใช้',
    icon: UsersMenuIcon,
    roles: ['admin']
  }, {
    path: '/admin/permissions',
    label: 'สิทธิ์การใช้งาน',
    icon: PermissionsIcon,
    roles: ['admin']
  }, {
    path: '/admin/settings',
    label: 'ตั้งค่า',
    icon: SettingsIcon,
    roles: ['admin']
  }]
}, {
  key: 'master',
  label: 'Master Data',
  items: [{
    path: '/admin/rooms',
    label: 'ห้องเรียน',
    icon: RoomIcon,
    roles: ['admin']
  }]
}];
const navigationKeyByPath = {
  '/admin/dashboard': 'dashboard', '/admin/students': 'students', '/admin/teachers': 'teachers',
  '/admin/courses': 'courses', '/admin/attendance': 'attendance', '/admin/leads': 'leads',
  '/admin/makeup-slots': 'makeupSlots', '/admin/requests': 'requests', '/admin/academics': 'academics',
  '/admin/finance': 'finance', '/admin/users': 'users',
  '/admin/permissions': 'permissions', '/admin/settings': 'settings', '/admin/rooms': 'rooms',
};
export const AdminLayout = ({
  children,
  path
}) => {
  const {
    state,
    dispatch
  } = useAppContext();
  const currentPath = path || '/admin/dashboard';
  const { t, currentLanguage } = useTranslation();
  const currentTitle = t(`navigation.${navigationKeyByPath[currentPath] || 'dashboard'}`);
  const [now, setNow] = useState(() => new Date());
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [switchingInstituteId, setSwitchingInstituteId] = useState(null);
  const isNeo = false;
  const {
    badges
  } = useBadges();
  const allPaths = menuGroups.flatMap(g => g.items.map(m => m.path));
  useEffect(() => {
    const close = () => setDropdownOpen(false);
    return dropdownOpen ? (() => {
      document.addEventListener('click', close);
      return () => document.removeEventListener('click', close);
    })() : undefined;
  }, [dropdownOpen]);
  useEffect(() => {
    unlockBadge('first_login');
  }, []);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const role = state.userProfile?.role || state.user?.role;
    if (!state.isAuthenticated || role !== 'admin') return undefined;

    const expireSession = () => {
      clearAuthStorage();
      dispatch({ type: 'CLEAR_USER' });
      route('/login?reason=session-expired', true);
      logout().catch(() => {});
    };
    return startAdminInactivityTimer({ onTimeout: expireSession });
  }, [state.isAuthenticated, state.userProfile?.role, state.user?.role]);
  useEffect(() => {
    return currentPath ? (() => {
      const key = 'page_' + currentPath.replace(/\//g, '_');
      const stored = JSON.parse(localStorage.getItem('th_badges') || '[]');
      !stored.includes(key) ? (() => {
        stored.push(key);
        localStorage.setItem('th_badges', JSON.stringify(stored));
      })() : () => {};
      return allPaths.every(p => stored.includes('page_' + p.replace(/\//g, '_'))) ? (() => {
        unlockBadge('all_pages');
      })() : undefined;
    })() : undefined;
  }, [currentPath]);
  const handleLogout = async () => {
    setDropdownOpen(false);
    const confirmed = await showConfirm({
      title: t('common.logout'),
      message: t('navigation.logoutConfirmation'),
      yesLabel: t('common.logout'),
      cancelLabel: t('common.cancel')
    });
    return !confirmed ? undefined : (() => {
      clearAuthStorage();
      dispatch({
        type: 'CLEAR_USER'
      });
      route('/login');
      logout().catch(() => {});
    })();
  };
  const profile = state.userProfile;
  const institutes = profile?.institutes || profile?.data?.institutes || [];
  const currentInstitute = profile?.currentInstitute || profile?.data?.currentInstitute;
  const displayName = profile?.profile?.fullName || profile?.fullName || profile?.email || state.user?.email || state.user?.userId || 'admin';
    const displayRole = t(`users.roles.${profile?.role || 'member'}`, { defaultValue: t('common.member') });
  const avatarChar = (displayName || 'A').charAt(0).toUpperCase();
   const userRole = String(profile?.role || state.user?.role || 'unknown').trim().toLowerCase();
  const filteredGroups = menuGroups.map(group => ({
    ...group,
     items: group.items.filter(item => item.roles.includes(userRole) && canReadPage(userRole, item.path))
  })).filter(group => group.items.length > 0);
  const filteredMenuItems = filteredGroups.flatMap(g => g.items);
  const handleSwitchInstitute = async (instituteId) => {
    if (switchingInstituteId || Number(instituteId) === Number(currentInstitute?.id ?? profile?.instituteId)) return;
    setSwitchingInstituteId(instituteId);
    try {
      const response = await switchInstitute(Number(instituteId));
      const payload = response.data?.data || response.data || {};
      if (!payload.token) throw new Error('ไม่พบ token สำหรับสถาบันที่เลือก');
      setAuthStorage(payload.token, state.user);
      window.location.reload();
    } catch (error) {
      showToast(error?.data?.message || error?.data?.error || 'สลับสถาบันไม่สำเร็จ กรุณาลองใหม่', 'error');
      setSwitchingInstituteId(null);
    }
  };
  const renderInstituteOptions = () => institutes.length > 1 ? <div class="border-b border-slate-100 py-2">
    <p class="px-4 pb-1 text-xs font-semibold text-slate-500">สถาบันที่ใช้งาน</p>
    {institutes.map(institute => <button
      key={institute.id}
      type="button"
      disabled={!!switchingInstituteId}
      onClick={() => handleSwitchInstitute(institute.id)}
      class={`flex w-full items-center justify-between px-4 py-2 text-left text-sm transition hover:bg-slate-50 disabled:opacity-60 ${Number(institute.id) === Number(currentInstitute?.id ?? profile?.instituteId) ? 'font-semibold text-blue-700' : 'text-slate-700'}`}
    >
      <span class="truncate">{institute.name}</span>
      {switchingInstituteId === institute.id ? <span class="ml-2 text-xs">กำลังสลับ…</span> : Number(institute.id) === Number(currentInstitute?.id ?? profile?.instituteId) ? <span aria-label="สถาบันปัจจุบัน">✓</span> : null}
    </button>)}
  </div> : null;
      return <div class="admin-shell min-h-screen bg-[#edf2f7] text-slate-800">
        <aside class="admin-sidebar hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-20 lg:flex lg:w-64 lg:flex-col">
        <div class="admin-sidebar-brand flex h-20 items-center gap-3 px-5">
          {state.instituteLogo ? <img src={state.instituteLogo} alt="โลโก้สถาบัน" class={`h-10 w-10 rounded-xl object-cover shrink-0 ${isNeo ? 'ring-3 ring-black' : 'ring-2 ring-blue-100'}`} /> : <img src="/tiwhub-mark.svg" alt="tiwhub" class="h-10 w-10 shrink-0 rounded-xl" />}
          <div class="flex min-w-0 flex-col gap-0.5">
            <div class="flex min-w-0 items-center gap-1.5">
              <span class="truncate text-xl font-bold leading-tight tracking-tight text-slate-900">{t('common.appName')}</span>
              <span class="shrink-0 rounded bg-blue-100 px-1.5 py-0.5 text-[9px] font-bold leading-none tracking-wide text-blue-700">ACADEMY</span>
            </div>
            <span class="truncate text-xs leading-tight text-slate-500">{state.instituteName || t('navigation.sidebarSubtitle')}</span>
          </div>
        </div>

        <nav class="admin-sidebar-nav flex flex-1 flex-col gap-6 overflow-y-auto px-3.5 py-4" aria-label={t('navigation.mainMenu', { defaultValue: t('navigation.groups.primary') })}>
          {filteredGroups.map(group => <div key={group.key} class="min-w-0">
              <p class="admin-sidebar-group mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider">
                {t(`navigation.groups.${group.key}`)}
              </p>
              {group.items.map(item => {
            const isActive = currentPath === item.path;
                return <button key={item.path} type="button" aria-current={isActive ? 'page' : undefined} onClick={() => route(item.path)} class={`admin-nav-item mt-1 flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium transition-colors ${isActive ? 'is-active' : ''}`}>
                  <item.icon class="admin-nav-icon h-5 w-5 shrink-0" aria-hidden="true" />
                  <span class="min-w-0 flex-1 truncate">{t(`navigation.${navigationKeyByPath[item.path]}`)}</span>
                  {isActive ? <span class="ml-auto h-2 w-2 rounded-full bg-white" aria-hidden="true" /> : null}
                  </button>;
          })}
            </div>)}
        </nav>

        <div class="admin-sidebar-account border-t border-slate-200 p-3">
          <div class="mb-2 flex items-center gap-2.5 overflow-hidden rounded-xl border border-slate-200 bg-white p-2">
            <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-oasis-primary text-sm font-bold text-white">
              {avatarChar}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-slate-900 truncate">{displayName}</p>
              <p class="truncate text-xs text-slate-500">{displayRole}</p>
            </div>
            <button type="button" onClick={handleLogout} aria-label={t('common.logout')} title={t('common.logout')} class="admin-logout-button flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-700">
              <LogoutIcon class="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header class="admin-mobile-header fixed left-0 right-0 top-0 z-20 flex h-14 items-center justify-between px-4 lg:hidden">
        <div class="flex items-center gap-2">
          {state.instituteLogo ? <img src={state.instituteLogo} alt="โลโก้สถาบัน" class="h-7 w-7 rounded-lg object-cover shrink-0" /> : <img src="/tiwhub-mark.svg" alt="tiwhub" class="h-7 w-7 shrink-0 rounded-lg" />}
          <span class="text-base font-semibold text-slate-900">{currentTitle}</span>
        </div>
        <LanguageSwitcher class="mr-2" />
        <div class="relative">
          <button onClick={e => {
          e.stopPropagation();
          setDropdownOpen(!dropdownOpen);
        }} class="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xs font-bold shadow-sm">
            {avatarChar}
          </button>
          {dropdownOpen ? <div class="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-30">
              <div class="px-4 py-2 border-b border-slate-100">
                <p class="text-sm font-semibold text-slate-900">{displayName}</p>
                <p class="text-xs text-slate-500">{displayRole}</p>
              </div>
              {renderInstituteOptions()}
              <button onClick={handleLogout} class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left text-zinc-600 hover:bg-red-50 hover:text-red-600 transition-colors">
                <LogoutIcon class="h-4 w-4" />
                {t('common.logout')}
              </button>
            </div> : null}
        </div>
      </header>

      {/* Desktop Top Bar */}
      <header class="admin-desktop-header sticky top-0 z-10 ml-64 hidden h-20 items-center justify-between border-b border-slate-200 bg-white px-8 lg:flex">
        <div class="admin-header-title flex min-w-0 items-center">
          <div class="min-w-0">
            <h1 class="truncate text-lg font-bold leading-tight tracking-tight text-slate-900">{currentTitle}</h1>
            <p class="admin-header-meta mt-1 flex items-center gap-1.5 whitespace-nowrap text-xs text-slate-500">
              <CalendarIcon class="h-4 w-4 shrink-0 text-blue-600" aria-hidden="true" />
              <span>{now.toLocaleDateString(currentLanguage === 'th' ? 'th-TH' : 'en-US', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}</span>
              <span class="text-slate-300" aria-hidden="true">·</span>
              <span class="admin-header-time inline-flex items-center gap-1 font-semibold text-slate-700">
                <ClockIcon class="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
                {now.toLocaleTimeString(currentLanguage === 'th' ? 'th-TH' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </p>
          </div>
        </div>
        <div class="admin-header-actions flex shrink-0 items-center gap-3">
          {canReadPage(userRole, '/admin/attendance') && <button type="button" aria-label={t('navigation.scanQr')} title={t('navigation.scanQr')} onClick={() => route('/admin/attendance')} class="admin-qr-action inline-flex min-h-11 items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-100">
            <QrScanIcon class="h-4 w-4" />
            <span class="admin-qr-label">{t('navigation.scanQr')}</span>
          </button>}
          {canReadPage(userRole, '/admin/students') && canEditPage(userRole, '/admin/students') && <button type="button" onClick={() => route('/admin/students/add')} class="admin-new-student-action inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
            <PlusIcon class="h-4 w-4" aria-hidden="true" />
            <span>{t('navigation.newStudent')}</span>
          </button>}
          <span class="admin-header-divider mx-1 h-6 w-px bg-slate-200" aria-hidden="true" />
          <LanguageSwitcher />
          {userRole === 'admin' && <PaymentSlipNotificationBell isNeo={isNeo} />}
          <div class="relative">
            <button onClick={e => {
            e.stopPropagation();
            setDropdownOpen(!dropdownOpen);
          }} class="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
              <div class="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xs font-bold shrink-0 shadow-sm">
                {avatarChar}
              </div>
              <span class="max-w-[min(14rem,24vw)] truncate text-sm font-medium text-slate-600">{displayName}</span>
              <ChevronDownIcon class="h-4 w-4 text-slate-400" />
            </button>
            {dropdownOpen ? <div class="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-30">
                <div class="px-4 py-2 border-b border-slate-100">
                  <p class="text-sm font-semibold text-slate-900">{displayName}</p>
                  <p class="text-xs text-slate-500">{displayRole}</p>
                </div>
                {renderInstituteOptions()}
                <button onClick={handleLogout} class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left text-zinc-600 hover:bg-red-50 hover:text-red-600 transition-colors">
                  <LogoutIcon class="h-4 w-4" />
                   {t('common.logout')}
                </button>
              </div> : null}
          </div>
        </div>
      </header>

      {/* Main Content — floating card */}
      <main class="admin-main ml-0 pb-20 pt-14 lg:ml-64 lg:pb-0 lg:pt-0">
        <div class="admin-content-container mx-auto w-full p-4 sm:p-5 lg:p-7">
          <div class="admin-page-content min-w-0">
            {children}
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav class="admin-bottom-nav fixed bottom-0 left-0 right-0 z-20 h-16 safe-area-bottom lg:hidden" aria-label={t('navigation.mainMenu', { defaultValue: t('navigation.groups.primary') })}>
        <div class="flex h-full items-center gap-1 overflow-x-auto overflow-y-hidden px-2 no-scrollbar">
          {filteredMenuItems.map(item => {
          const isActive = currentPath === item.path;
          return <button key={item.path} type="button" aria-current={isActive ? 'page' : undefined} onClick={() => route(item.path)} class={`admin-bottom-nav-item flex min-w-[60px] shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg px-2 py-1 transition-colors ${isActive ? 'is-active' : ''}`}>
                <item.icon class="h-5 w-5" />
                <span class="whitespace-nowrap text-[10px] leading-tight">{t(`navigation.${navigationKeyByPath[item.path]}`)}</span>
              </button>;
        })}
        </div>
      </nav>

      <BadgeSticker />
    </div>;
};
