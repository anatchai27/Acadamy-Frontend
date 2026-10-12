import { createContext } from 'preact';
import { useContext, useReducer, useEffect, useCallback } from 'preact/hooks';
import { route } from 'preact-router';
import { AppReducer } from './AppReducer';
import { clearAuthStorage, getMe } from '../services/auth-service';
import { setOnUnauthorized } from '../services/api';
import { getRolePermissions } from '../services/user-service';
import { setRolePermissions } from '../config/permissions';

const savedTheme = 'neobrutalism';

const initialState = {
  theme: 'dark',
  designTheme: savedTheme,
  user: null,
  userProfile: null,
  isAuthenticated: false,
  isAuthLoading: true,
};

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(AppReducer, { ...initialState });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.designTheme);
  }, [state.designTheme]);

  const handleUnauthorized = useCallback((reason = 'unauthorized') => {
    clearAuthStorage();
    dispatch({ type: 'CLEAR_USER' });
    route(reason === 'session-expired' ? '/login?reason=session-expired' : '/login');
  }, []);

  useEffect(() => {
    setOnUnauthorized(handleUnauthorized);
  }, [handleUnauthorized]);

  useEffect(() => {
    getMe()
      .then(async (res) => {
        const profile = res.data?.data || res.data;
        try {
          const permissions = await getRolePermissions(profile?.role);
          const rolePermissions = permissions.data?.data?.permissions
            || permissions.data?.permissions;
          if (rolePermissions && profile?.role) {
            setRolePermissions(profile.role, rolePermissions);
          }
        } catch {
          // Use the default policy when the API has no saved permissions yet.
        }
        dispatch({ type: 'SET_PROFILE', payload: profile });
        dispatch({ type: 'SET_USER', payload: profile });
        const currentInstitute = profile?.data?.currentInstitute || profile?.currentInstitute;
        dispatch({ type: 'SET_INSTITUTE_NAME', payload: currentInstitute?.name || '' });
        dispatch({ type: 'SET_INSTITUTE_LOGO', payload: currentInstitute?.logoUrl || '' });
      })
      .catch(() => {
        dispatch({ type: 'CLEAR_USER' });
      })
      .finally(() => {
        dispatch({ type: 'SET_AUTH_LOADING', payload: false });
      });
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
}
