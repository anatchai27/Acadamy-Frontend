import { route } from 'preact-router';
import { useState, useEffect } from 'preact/hooks';
import { useAppContext } from '../store/AppContext';
import { clearAuthStorage, logout } from '../services/auth-service';
import { showConfirm } from '../components/ui';

const menuItems = [
  { path: '/admin/dashboard', label: 'หน้าหลัก', icon: DashboardIcon },
  { path: '/admin/students', label: 'นักเรียน', icon: StudentIcon },
  { path: '/admin/teachers', label: 'ครูผู้สอน', icon: TeacherIcon },
  { path: '/admin/attendance', label: 'เช็คชื่อ', icon: AttendanceIcon },
  { path: '/admin/finance', label: 'การเงิน', icon: FinanceIcon },
  { path: '/admin/settings', label: 'ตั้งค่า', icon: SettingsIcon },
];

function getPageTitle(path) {
  const item = menuItems.find((m) => m.path === path);
  return item ? item.label : 'หน้าหลัก';
}

export function AdminLayout({ children, path }) {
  const { state, dispatch } = useAppContext();
  const currentPath = path || '/admin/dashboard';
  const currentTitle = getPageTitle(currentPath);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const close = () => setDropdownOpen(false);
    if (dropdownOpen) {
      document.addEventListener('click', close);
      return () => document.removeEventListener('click', close);
    }
  }, [dropdownOpen]);

  const handleLogout = async () => {
    setDropdownOpen(false);
    const confirmed = await showConfirm({
      title: 'ออกจากระบบ',
      message: 'คุณแน่ใจว่าต้องการออกจากระบบใช่หรือไม่?',
      yesLabel: 'ออกจากระบบ',
      cancelLabel: 'ยกเลิก',
    });
    if (!confirmed) return;

    await logout().catch(() => {});
    clearAuthStorage();
    dispatch({ type: 'CLEAR_USER' });
    route('/login');
  };

  const profile = state.userProfile;

  const displayName =
    profile?.profile?.fullName
    || profile?.fullName
    || profile?.email
    || state.user?.email
    || state.user?.userId
    || 'admin';
  const displayRole = profile?.role === 'admin' ? 'ผู้ดูแลระบบ' : profile?.role === 'teacher' ? 'ผู้สอน' : 'สมาชิก';
  const avatarChar = (displayName || 'A').charAt(0).toUpperCase();

  return (
    <div class="min-h-screen bg-tiwhub-bg dark:bg-tiwhub-heading">
      <aside class="hidden md:fixed md:inset-y-0 md:left-0 md:flex md:w-64 md:flex-col md:z-20 bg-tiwhub-surface dark:bg-tiwhub-heading border-r border-tiwhub-border-light dark:border-tiwhub-border/20">
        <div class="flex h-16 items-center gap-3 px-6 border-b border-tiwhub-border-light dark:border-tiwhub-border/20">
          <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-tiwhub-primary text-white font-bold text-sm shrink-0">
            TH
          </div>
          <div class="flex flex-col">
            <span class="text-lg font-bold text-tiwhub-heading dark:text-white leading-tight">TiwHub</span>
            <span class="text-xs text-tiwhub-muted dark:text-tiwhub-muted/70 leading-tight">Admin Panel</span>
          </div>
        </div>

        <nav class="flex-1 space-y-1 px-3 py-5 overflow-y-auto">
          <p class="px-3 mb-2 text-xs font-semibold text-tiwhub-muted/60 dark:text-tiwhub-muted/40 uppercase tracking-wider">
            เมนูหลัก
          </p>
          {menuItems.map((item) => {
            const isActive = currentPath === item.path;
            return (
              <button
                key={item.path}
                onClick={() => route(item.path)}
                class={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-tiwhub-primary/10 text-tiwhub-primary dark:bg-tiwhub-primary/15 dark:text-tiwhub-primary-light shadow-sm ring-1 ring-tiwhub-primary/10 dark:ring-tiwhub-primary/20'
                    : 'text-tiwhub-body hover:bg-tiwhub-surface-hover hover:text-tiwhub-heading dark:text-tiwhub-muted dark:hover:bg-tiwhub-heading/40 dark:hover:text-tiwhub-bg'
                }`}
              >
                <item.icon class={`h-5 w-5 shrink-0 ${isActive ? 'text-tiwhub-primary dark:text-tiwhub-primary-light' : ''}`} />
                {item.label}
                {isActive && (
                  <div class="ml-auto w-1.5 h-1.5 rounded-full bg-tiwhub-primary dark:bg-tiwhub-primary-light" />
                )}
              </button>
            );
          })}
        </nav>

        <div class="border-t border-tiwhub-border-light dark:border-tiwhub-border/20 p-4">
          <div class="flex items-center gap-3 mb-3 px-1">
            <div class="flex h-8 w-8 items-center justify-center rounded-full bg-tiwhub-primary/10 dark:bg-tiwhub-primary/15 text-tiwhub-primary dark:text-tiwhub-primary-light text-xs font-semibold shrink-0">
              {avatarChar}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-tiwhub-heading dark:text-white truncate">
                {displayName}
              </p>
              <p class="text-xs text-tiwhub-muted dark:text-tiwhub-muted/70">{displayRole}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-tiwhub-body hover:text-tiwhub-danger hover:bg-tiwhub-danger/10 dark:text-tiwhub-muted dark:hover:text-tiwhub-danger dark:hover:bg-tiwhub-danger/10 transition-all duration-200"
          >
            <LogoutIcon class="h-5 w-5 shrink-0" />
            ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header class="md:hidden fixed top-0 left-0 right-0 z-20 h-14 bg-tiwhub-surface/80 dark:bg-tiwhub-heading/80 backdrop-blur-lg border-b border-tiwhub-border-light dark:border-tiwhub-border/20 flex items-center justify-between px-4">
        <div class="flex items-center gap-2">
          <div class="flex h-7 w-7 items-center justify-center rounded-md bg-tiwhub-primary text-white font-bold text-xs shrink-0">
            TH
          </div>
          <span class="text-base font-semibold text-tiwhub-heading dark:text-white">{currentTitle}</span>
        </div>
        <div class="flex h-7 w-7 items-center justify-center rounded-full bg-tiwhub-primary/10 dark:bg-tiwhub-primary/15 text-tiwhub-primary dark:text-tiwhub-primary-light text-xs font-semibold">
          {avatarChar}
        </div>
      </header>

      {/* Desktop Top Bar */}
      <header class="hidden md:sticky md:top-0 md:z-10 md:ml-64 md:flex md:h-16 md:items-center md:justify-between md:px-8 bg-tiwhub-surface/80 dark:bg-tiwhub-heading/80 backdrop-blur-lg border-b border-tiwhub-border-light dark:border-tiwhub-border/20">
        <div class="flex items-center gap-4">
          <div>
            <h1 class="text-lg font-semibold text-tiwhub-heading dark:text-white">{currentTitle}</h1>
            <p class="text-xs text-tiwhub-muted dark:text-tiwhub-muted/70">
              {new Date().toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <button
            onClick={() => route('/admin/attendance')}
            class="px-4 py-2 text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition-colors flex items-center gap-2"
          >
            <QrScanIcon class="h-4 w-4" />
            สแกน QR
          </button>
        </div>
        <div class="flex items-center gap-4">
          <button class="relative p-2 text-tiwhub-muted hover:text-tiwhub-body dark:hover:text-tiwhub-bg transition-colors rounded-lg hover:bg-tiwhub-surface-hover dark:hover:bg-tiwhub-heading/40">
            <BellIcon class="h-5 w-5" />
            <span class="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-tiwhub-danger ring-2 ring-tiwhub-surface dark:ring-tiwhub-heading" />
          </button>
          <div class="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setDropdownOpen(!dropdownOpen); }}
              class="flex items-center gap-2 p-1.5 rounded-lg hover:bg-tiwhub-surface-hover dark:hover:bg-tiwhub-heading/40 transition-colors"
            >
              <div class="flex h-8 w-8 items-center justify-center rounded-full bg-tiwhub-primary/10 dark:bg-tiwhub-primary/15 text-tiwhub-primary dark:text-tiwhub-primary-light text-xs font-semibold">
                {avatarChar}
              </div>
              <span class="text-sm font-medium text-tiwhub-body dark:text-tiwhub-muted">{displayName}</span>
              <ChevronDownIcon class="h-4 w-4 text-tiwhub-muted" />
            </button>
            {dropdownOpen && (
              <div class="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-30">
                <div class="px-4 py-2 border-b border-slate-100 dark:border-slate-700">
                  <p class="text-sm font-medium text-slate-900 dark:text-white">{displayName}</p>
                  <p class="text-xs text-slate-500 dark:text-slate-400">{displayRole}</p>
                </div>
                <button
                  onClick={handleLogout}
                  class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left text-slate-700 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                >
                  <LogoutIcon class="h-4 w-4" />
                  ออกจากระบบ
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main class="md:ml-64 pt-14 md:pt-0">
        <div class="p-4 md:p-8 max-w-7xl mx-auto">{children}</div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav class="md:hidden fixed bottom-0 left-0 right-0 z-20 h-16 bg-tiwhub-surface/80 dark:bg-tiwhub-heading/80 backdrop-blur-lg border-t border-tiwhub-border-light dark:border-tiwhub-border/20 flex items-center justify-around safe-area-bottom">
        {menuItems.map((item) => {
          const isActive = currentPath === item.path;
          return (
            <button
              key={item.path}
              onClick={() => route(item.path)}
              class={`flex flex-col items-center justify-center gap-0.5 w-full h-full transition-colors ${
                isActive
                  ? 'text-tiwhub-primary dark:text-tiwhub-primary-light'
                  : 'text-tiwhub-muted dark:text-tiwhub-muted/60'
              }`}
            >
              <item.icon class="h-5 w-5" />
              <span class="text-xs">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

/* ─── SVG Icons ─── */

function DashboardIcon({ class: className }) {
  return (
    <svg class={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

function StudentIcon({ class: className }) {
  return (
    <svg class={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path d="M12 14l9-5-9-5-9 5 9 5z" />
      <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
    </svg>
  );
}

function AttendanceIcon({ class: className }) {
  return (
    <svg class={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  );
}

function TeacherIcon({ class: className }) {
  return (
    <svg class={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      <path stroke-linecap="round" stroke-linejoin="round" d="M10.25 10.25L9 8.5M13.75 10.25L15 8.5M12 11.5v.01" />
    </svg>
  );
}

function FinanceIcon({ class: className }) {
  return (
    <svg class={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function QrScanIcon({ class: className }) {
  return (
    <svg class={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v1m6 11h2m-6 0h-2m4 0h-2m4 0v-2m0 0h-2m2 0V9m0 4V5m0 2h-2M4 7h1m4 0h1m4 0h1M4 11h1m4 0h1m4 0h1M4 15h1m4 0h1m4 0h1M4 19h1m4 0h1m4 0h1" />
    </svg>
  );
}

function ChevronDownIcon({ class: className }) {
  return (
    <svg class={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function SettingsIcon({ class: className }) {
  return (
    <svg class={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function LogoutIcon({ class: className }) {
  return (
    <svg class={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );
}

function BellIcon({ class: className }) {
  return (
    <svg class={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
}
