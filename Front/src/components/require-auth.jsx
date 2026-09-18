import { route } from 'preact-router';
import { useEffect } from 'preact/hooks';
import { useAppContext } from '../store/AppContext';
export const normalizeRole = role => String(role || '').trim().toLowerCase();

export const hasAllowedRole = (role, allowedRoles) => (
  !allowedRoles?.length || allowedRoles.includes(normalizeRole(role))
);

export const RoleForbidden = () => (
  <main class="flex min-h-screen items-center justify-center bg-oasis-bg p-6 text-center">
    <div>
      <h1 class="text-2xl font-bold text-zinc-900">ไม่มีสิทธิ์เข้าหน้านี้</h1>
      <p class="mt-2 text-sm text-zinc-500">บัญชีของคุณไม่มีสิทธิ์ใช้งานเมนูนี้</p>
    </div>
  </main>
);

export const requireAuth = (Component, allowedRoles = []) => {
  return props => {
    const {
      state
    } = useAppContext();
    const role = state.userProfile?.role || state.user?.role;
    useEffect(() => {
      return !state.isAuthenticated && !state.isAuthLoading ? (() => {
        route('/login', true);
      })() : undefined;
    }, [state.isAuthenticated, state.isAuthLoading]);
    useEffect(() => {
      return state.isAuthenticated && !state.isAuthLoading && !hasAllowedRole(role, allowedRoles)
        ? (() => route('/forbidden', true))()
        : undefined;
    }, [state.isAuthenticated, state.isAuthLoading, role]);
    return state.isAuthLoading ? <div class="flex items-center justify-center min-h-screen bg-oasis-bg">
        <div class="h-10 w-10 rounded-full border-2 border-oasis-primary border-t-transparent animate-spin" />
      </div> : !state.isAuthenticated || !hasAllowedRole(role, allowedRoles) ? null : <Component {...props} />;
  };
};
