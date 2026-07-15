import { route } from 'preact-router';
import { useEffect } from 'preact/hooks';
import { useAppContext } from '../store/AppContext';

export function requireAuth(Component) {
  return function AuthenticatedComponent(props) {
    const { state } = useAppContext();

    useEffect(() => {
      if (!state.isAuthenticated && !state.isAuthLoading) {
        route('/login', true);
      }
    }, [state.isAuthenticated, state.isAuthLoading]);

    if (state.isAuthLoading) {
      return (
        <div class="flex items-center justify-center min-h-screen bg-tiwhub-bg dark:bg-tiwhub-heading">
          <div class="h-10 w-10 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
        </div>
      );
    }

    if (!state.isAuthenticated) {
      return null;
    }

    return <Component {...props} />;
  };
}
