import { route } from 'preact-router';
import { useState, useEffect } from 'preact/hooks';
import { useAppContext } from '../store/AppContext';
import { logout } from '../services/auth-service';
import { showConfirm, BadgeSticker } from '../components/ui';
import { useDesignTheme } from '../hooks/useDesignTheme';
import { unlockBadge, useBadges } from '../components/ui/badge-sticker';
import {
  DashboardIcon, StudentIcon, TeacherIcon, CourseIcon,
  AttendanceIcon, RequestIcon, AcademicsIcon, FinanceIcon,
  PackageIcon, UsersMenuIcon, SettingsIcon, QrScanIcon,
  ChevronDownIcon, LogoutIcon, BellIcon,
} from '../components/ui/icons';

const menuGroups = [
  {
    label: 'ข้อมูลหลัก',
    items: [
      { path: '/admin/dashboard', label: 'หน้าหลัก', icon: DashboardIcon, roles: ['admin', 'teacher', 'staff'] },
      { path: '/admin/students', label: 'นักเรียน', icon: StudentIcon, roles: ['admin', 'teacher', 'staff'] },
      { path: '/admin/teachers', label: 'ครูผู้สอน', icon: TeacherIcon, roles: ['admin'] },
      { path: '/admin/courses', label: 'คอร์สเรียน', icon: CourseIcon, roles: ['admin', 'teacher'] },
    ],
  },
  {
    label: 'การดำเนินงาน',
    items: [
      { path: '/admin/attendance', label: 'เช็คชื่อ', icon: AttendanceIcon, roles: ['admin', 'teacher'] },
      { path: '/admin/requests', label: 'คำร้องขอ', icon: RequestIcon, roles: ['admin', 'teacher'] },
      { path: '/admin/academics', label: 'ระบบวิชาการ', icon: AcademicsIcon, roles: ['admin', 'teacher'] },
    ],
  },
  {
    label: 'การเงินและสินค้า',
    items: [
      { path: '/admin/finance', label: 'การเงิน', icon: FinanceIcon, roles: ['admin'] },
      { path: '/admin/products', label: 'สินค้า', icon: PackageIcon, roles: ['admin', 'staff'] },
    ],
  },
  {
    label: 'ระบบ',
    items: [
      { path: '/admin/users', label: 'ผู้ใช้', icon: UsersMenuIcon, roles: ['admin'] },
      { path: '/admin/settings', label: 'ตั้งค่า', icon: SettingsIcon, roles: ['admin'] },
    ],
  },
];

function getPageTitle(path) {
  for (const group of menuGroups) {
    const item = group.items.find((m) => m.path === path);
    if (item) return item.label;
  }
  return 'หน้าหลัก';
}

export function AdminLayout({ children, path }) {
  const { state, dispatch } = useAppContext();
  const currentPath = path || '/admin/dashboard';
  const currentTitle = getPageTitle(currentPath);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { designTheme, toggleDesignTheme } = useDesignTheme();
  const isNeo = designTheme === 'neobrutalism';
  const { badges } = useBadges();

  const allPaths = menuGroups.flatMap(g => g.items.map(m => m.path));

  useEffect(() => {
    const close = () => setDropdownOpen(false);
    if (dropdownOpen) {
      document.addEventListener('click', close);
      return () => document.removeEventListener('click', close);
    }
  }, [dropdownOpen]);

  useEffect(() => {
    unlockBadge('first_login');
  }, []);

  useEffect(() => {
    if (currentPath) {
      const key = 'page_' + currentPath.replace(/\//g, '_');
      const stored = JSON.parse(localStorage.getItem('th_badges') || '[]');
      if (!stored.includes(key)) {
        stored.push(key);
        localStorage.setItem('th_badges', JSON.stringify(stored));
      }
      if (allPaths.every(p => stored.includes('page_' + p.replace(/\//g, '_')))) {
        unlockBadge('all_pages');
      }
    }
  }, [currentPath]);

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
  const userRole = profile?.role || 'admin';
  const filteredGroups = menuGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.roles.includes(userRole)),
    }))
    .filter((group) => group.items.length > 0);

  const filteredMenuItems = filteredGroups.flatMap((g) => g.items);

  return (
<div class={`min-h-screen ${isNeo ? 'bg-[#FAF3E0] text-black' : 'bg-slate-50 text-slate-700'}`}>
      <aside class={`hidden md:fixed md:inset-y-0 md:left-0 md:flex md:w-64 md:flex-col md:z-20 ${isNeo ? 'bg-[#FFF] border-r-3 border-black' : 'bg-white border-r border-slate-200 shadow-sm'}`}>
        <div class={`flex h-16 items-center gap-3 px-6 ${isNeo ? 'border-b-3 border-black' : 'border-b border-slate-100'}`}>
          {state.instituteLogo ? (
            <img src={state.instituteLogo} alt="logo" class={`h-9 w-9 rounded-xl object-cover shrink-0 ${isNeo ? 'ring-3 ring-black' : 'ring-2 ring-blue-100'}`} />
          ) : (
            <div class={`flex h-9 w-9 items-center justify-center bg-gradient-to-br from-blue-600 to-blue-700 text-white font-bold text-sm shrink-0 ${isNeo ? 'rounded-xl border-2 border-black shadow-[2px_2px_0px_#000]' : 'rounded-xl shadow-sm'}`}>
              TH
            </div>
          )}
          <div class="flex flex-col">
            <span class="text-lg font-bold text-slate-900 leading-tight tracking-tight">
              {state.instituteName || 'TiwHub'}
            </span>
            <span class="text-xs text-slate-400 leading-tight">Admin Panel</span>
          </div>
        </div>

        <nav class="flex-1 space-y-0.5 px-3 py-5 overflow-y-auto">
          {filteredGroups.map((group) => (
            <div key={group.label} class="mb-4">
              <p class={`px-3 mb-2 text-xs font-semibold uppercase tracking-widest ${isNeo ? 'text-black/60' : 'text-slate-400'}`}>
                {group.label}
              </p>
              {group.items.map((item) => {
                const isActive = currentPath === item.path;
                const activeBg = isNeo ? 'bg-black text-white' : 'bg-blue-50 text-blue-700';
                const inactiveBg = isNeo ? 'text-black hover:bg-black hover:text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800';
                const activeIconColor = isNeo ? 'text-white' : 'text-blue-600';
                const inactiveIconColor = isNeo ? 'text-black' : 'text-slate-400';
                return (
                  <button
                    key={item.path}
                    onClick={() => route(item.path)}
                    class={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${isActive ? activeBg : inactiveBg}`}
                  >
                    <item.icon class={`h-5 w-5 shrink-0 ${isActive ? activeIconColor : inactiveIconColor}`} />
                    {item.label}
                    {isActive && (
                      <div class={`ml-auto w-1 h-5 rounded-full ${isNeo ? 'bg-white' : 'bg-blue-600'}`} />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div class={`${isNeo ? 'border-t-3 border-black' : 'border-t border-slate-100'} p-4`}>
          <div class="flex items-center gap-3 mb-3 px-1">
            <div class="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xs font-bold shrink-0 shadow-sm">
              {avatarChar}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-slate-900 truncate">{displayName}</p>
              <p class="text-xs text-slate-400">{displayRole}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            class={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${isNeo ? 'border-2 border-black text-black hover:bg-red-500 hover:text-white hover:border-red-500' : 'text-slate-500 hover:text-red-600 hover:bg-red-50'}`}
          >
            <LogoutIcon class="h-5 w-5 shrink-0" />
            ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header class={`md:hidden fixed top-0 left-0 right-0 z-20 h-14 flex items-center justify-between px-4 shadow-sm ${isNeo ? 'bg-[#FFF] border-b-3 border-black' : 'bg-white/80 backdrop-blur-lg border-b border-slate-200'}`}>
        <div class="flex items-center gap-2">
          {state.instituteLogo ? (
            <img src={state.instituteLogo} alt="logo" class="h-7 w-7 rounded-lg object-cover shrink-0" />
          ) : (
            <div class={`flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 text-white font-bold text-xs shrink-0 ${isNeo ? 'border-2 border-black' : ''}`}>
              TH
            </div>
          )}
          <span class="text-base font-semibold text-slate-900">{currentTitle}</span>
        </div>
        <div class="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setDropdownOpen(!dropdownOpen); }}
            class="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xs font-bold shadow-sm"
          >
            {avatarChar}
          </button>
          {dropdownOpen && (
            <div class="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-30">
              <div class="px-4 py-2 border-b border-slate-100">
                <p class="text-sm font-semibold text-slate-900">{displayName}</p>
                <p class="text-xs text-slate-500">{displayRole}</p>
              </div>
              <button
                onClick={handleLogout}
                class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left text-slate-700 hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                <LogoutIcon class="h-4 w-4" />
                ออกจากระบบ
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Desktop Top Bar */}
      <header class={`hidden md:sticky md:top-0 md:z-10 md:ml-64 md:flex md:h-16 md:items-center md:justify-between md:px-8 ${isNeo ? 'bg-[#FFF] border-b-3 border-black' : 'bg-white/80 backdrop-blur-lg border-b border-slate-200 shadow-sm'}`}>
        <div class="flex items-center gap-4">
          <div>
            <h1 class="text-lg font-semibold text-slate-900 tracking-tight">{currentTitle}</h1>
            <p class="text-xs text-slate-400">
              {new Date().toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <button
            onClick={() => route('/admin/attendance')}
            class={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${isNeo ? 'border-3 border-black text-black bg-white shadow-[3px_3px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#000]' : 'text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-sm hover:shadow-md active:scale-[0.98]'}`}
          >
            <QrScanIcon class="h-4 w-4" />
            สแกน QR
          </button>
        </div>
        <div class="flex items-center gap-4">
          {/* Theme Toggle */}
          <button
            onClick={toggleDesignTheme}
            class="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors flex items-center gap-1.5"
            aria-label="เปลี่ยนธีม"
          >
            {designTheme === 'bento' ? <><span class="text-sm">🔲</span> Bento</> : <><span class="text-sm">■</span> Neo</>}
          </button>
          <button class="relative p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-lg hover:bg-slate-100">
            <BellIcon class="h-5 w-5" />
            <span class="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
          </button>
          <div class="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setDropdownOpen(!dropdownOpen); }}
              class="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <div class="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xs font-bold shrink-0 shadow-sm">
                {avatarChar}
              </div>
              <span class="text-sm font-medium text-slate-600">{displayName}</span>
              <ChevronDownIcon class="h-4 w-4 text-slate-400" />
            </button>
            {dropdownOpen && (
              <div class="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-30">
                <div class="px-4 py-2 border-b border-slate-100">
                  <p class="text-sm font-semibold text-slate-900">{displayName}</p>
                  <p class="text-xs text-slate-500">{displayRole}</p>
                </div>
                <button
                  onClick={handleLogout}
                  class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left text-slate-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  <LogoutIcon class="h-4 w-4" />
                  ออกจากระบบ
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content — floating card */}
      <main class="md:ml-64 pt-14 md:pt-0 pb-20 md:pb-0">
        <div class="p-4 md:p-8 max-w-7xl mx-auto">
          <div class={`${isNeo ? 'bg-white my-4 neo-card p-4 md:p-8' : 'bg-white my-4 rounded-2xl border border-slate-200 p-4 md:p-8 shadow-sm'}`}>
            {children}
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav
        class={`md:hidden fixed bottom-0 left-0 right-0 z-20 h-16 safe-area-bottom shadow-sm ${
          isNeo ? 'bg-[#FFF] border-t-3 border-black' : 'bg-white/80 backdrop-blur-lg border-t border-slate-200'
        }`}
      >
        <div class="flex items-center overflow-x-auto overflow-y-hidden h-full px-2 gap-1 no-scrollbar">
          {filteredMenuItems.map((item) => {
            const isActive = currentPath === item.path;
            const btnClass = isActive
              ? isNeo ? 'text-black bg-black/5' : 'text-blue-600 bg-blue-50'
              : 'text-slate-400';
            return (
              <button
                key={item.path}
                onClick={() => route(item.path)}
                class={`flex flex-col items-center justify-center gap-0.5 px-2 py-1 min-w-[60px] shrink-0 transition-colors rounded-lg ${btnClass}`}
              >
                <item.icon class="h-5 w-5" />
                <span class="text-[10px] leading-tight whitespace-nowrap">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <BadgeSticker />
    </div>
  );
}