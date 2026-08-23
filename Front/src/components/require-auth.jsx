import { route } from 'preact-router';
import { useEffect } from 'preact/hooks';
import { useAppContext } from '../store/AppContext';
export const requireAuth = Component => {
  return props => {
    const {
      state
    } = useAppContext();
    useEffect(() => {
      return !state.isAuthenticated && !state.isAuthLoading ? (() => {
        route('/login', true);
      })() : undefined;
    }, [state.isAuthenticated, state.isAuthLoading]);
    return state.isAuthLoading ? <div class="flex items-center justify-center min-h-screen bg-oasis-bg">
        <div class="h-10 w-10 rounded-full border-2 border-oasis-primary border-t-transparent animate-spin" />
      </div> : !state.isAuthenticated ? null : <Component {...props} />;
  };
};