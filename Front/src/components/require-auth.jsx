import { route } from 'preact-router';
import { useEffect } from 'preact/hooks';
import { useAppContext } from '../store/AppContext';
import { clearAuthStorage } from '../services/auth-service';
import { canReadPage } from '../config/permissions';
import { LanguageSwitcher } from './ui/language-switcher';
export const normalizeRole = role => String(role || '').trim().toLowerCase();

export const hasAllowedRole = (role, allowedRoles) => (
  !allowedRoles?.length || allowedRoles.map(normalizeRole).includes(normalizeRole(role))
);

export const RoleForbidden = () => (
  <main class="relative flex min-h-screen items-center justify-center bg-oasis-bg p-6 text-center">
    <LanguageSwitcher class="absolute right-4 top-4" />
    <div class="max-w-md">
      <h1 class="text-2xl font-bold text-zinc-900">ไม่มีสิทธิ์เข้าหน้านี้</h1>
      <p class="mt-2 text-sm text-zinc-500">บัญชีของคุณไม่มีสิทธิ์ใช้งานเมนูนี้</p>
      <div class="mt-6 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={() => route('/admin/dashboard', true)} class="rounded-xl bg-oasis-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-oasis-primary-dark">
          กลับ Dashboard
        </button>
        <button type="button" onClick={() => { clearAuthStorage(); route('/login', true); }} class="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">
          ออกจากระบบ / Login
        </button>
      </div>
    </div>
  </main>
);

export const requireAuth = (Component, allowedRoles = []) => {
  return props => {
    const {
      state
    } = useAppContext();
    const role = normalizeRole(state.userProfile?.role || state.user?.role);
    const currentPath = props.path || window.location.pathname;
    const hasPageReadAccess = !currentPath || canReadPage(role, currentPath);
    useEffect(() => {
      return !state.isAuthenticated && !state.isAuthLoading ? (() => {
        route('/login', true);
      })() : undefined;
    }, [state.isAuthenticated, state.isAuthLoading]);
    useEffect(() => {
      return state.isAuthenticated && !state.isAuthLoading && (!hasAllowedRole(role, allowedRoles) || !hasPageReadAccess)
        ? (() => route('/forbidden', true))()
        : undefined;
    }, [state.isAuthenticated, state.isAuthLoading, role, hasPageReadAccess]);
    return state.isAuthLoading ? <div class="flex items-center justify-center min-h-screen bg-oasis-bg">
        <div class="h-10 w-10 rounded-full border-2 border-oasis-primary border-t-transparent animate-spin" />
      </div> : !state.isAuthenticated || !hasAllowedRole(role, allowedRoles) || !hasPageReadAccess ? null : <Component {...props} />;
  };
};
