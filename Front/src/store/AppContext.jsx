import { createContext } from 'preact';
import { useContext, useReducer, useEffect, useCallback } from 'preact/hooks';
import { route } from 'preact-router';
import { AppReducer } from './AppReducer';
import { clearAuthStorage, getMe, getTermsStatus } from '../services/auth-service';
import { setOnTermsRequired, setOnUnauthorized } from '../services/api';
import { getRolePermissions } from '../services/user-service';
import { setRolePermissions } from '../config/permissions';

const savedTheme = 'oasis';

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

  const handleTermsRequired = useCallback(() => {
    if (!state.isAuthenticated) return;
    dispatch({ type: 'SET_TERMS_ACCEPTED', payload: false });
    route('/terms/accept', true);
  }, [state.isAuthenticated]);

  useEffect(() => {
    setOnUnauthorized(handleUnauthorized);
  }, [handleUnauthorized]);

  useEffect(() => {
    setOnTermsRequired(handleTermsRequired);
  }, [handleTermsRequired]);

  useEffect(() => {
    getMe()
      .then(async (res) => {
        const profile = res.data?.data || res.data;
        dispatch({ type: 'SET_PROFILE', payload: profile });
        dispatch({ type: 'SET_USER', payload: profile });
        const currentInstitute = profile?.data?.currentInstitute || profile?.currentInstitute;
        dispatch({ type: 'SET_INSTITUTE_NAME', payload: currentInstitute?.name || '' });
        dispatch({ type: 'SET_INSTITUTE_LOGO', payload: currentInstitute?.logoUrl || '' });

        let hasAcceptedTerms = false;
        try {
          const termsStatus = await getTermsStatus();
          hasAcceptedTerms = !!termsStatus.data?.accepted;
        } catch {
          hasAcceptedTerms = false;
        }
        dispatch({ type: 'SET_TERMS_ACCEPTED', payload: hasAcceptedTerms });
        if (!hasAcceptedTerms) {
          route('/terms/accept', true);
          return;
        }

        try {
          const permissions = await getRolePermissions(profile?.role);
          const rolePermissions = permissions.data?.data?.permissions || permissions.data?.permissions;
          if (rolePermissions && profile?.role) setRolePermissions(profile.role, rolePermissions);
        } catch {
          // Use the default policy when the API has no saved permissions yet.
        }
      })
      .catch(() => {
        dispatch({ type: 'CLEAR_USER' });
        dispatch({ type: 'SET_TERMS_ACCEPTED', payload: false });
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
