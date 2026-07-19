import { route } from 'preact-router';
import { useEffect } from 'preact/hooks';
import { useAppContext } from '../store/AppContext';

export function requireAuth(Component) {
  return function AuthenticatedComponent(props) {
    const { state } = useAppContext();

    useEffect(() => {
      if (!state.isAuthenticated) {
        route('/login', true);
      }
    }, [state.isAuthenticated]);

    if (!state.isAuthenticated) {
      return null;
    }

    return <Component {...props} />;
  };
}
