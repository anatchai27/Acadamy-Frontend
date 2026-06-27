import { createContext } from 'preact';
import { useContext, useReducer, useEffect, useCallback } from 'preact/hooks';
import { route } from 'preact-router';
import { AppReducer } from './AppReducer';
import { getStoredToken, getStoredUser, clearAuthStorage, getMe } from '../services/auth-service';
import { setOnUnauthorized } from '../services/api';

const initialState = {
  theme: 'dark',
  user: null,
  userProfile: null,
  isAuthenticated: false,
};

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const initializedState = (() => {
    const token = getStoredToken();
    const user = getStoredUser();
    if (token && user) {
      return { ...initialState, user, isAuthenticated: true };
    }
    return initialState;
  })();

  const [state, dispatch] = useReducer(AppReducer, initializedState);

  const handleUnauthorized = useCallback(() => {
    dispatch({ type: 'CLEAR_USER' });
    route('/login');
  }, []);

  useEffect(() => {
    setOnUnauthorized(handleUnauthorized);
  }, [handleUnauthorized]);

  useEffect(() => {
    if (state.isAuthenticated) {
      getMe()
        .then((res) => dispatch({ type: 'SET_PROFILE', payload: res.data?.data || res.data }))
        .catch(() => {});
    }
  }, [state.isAuthenticated]);

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
