import { createContext } from 'preact';
import { useContext, useReducer, useEffect, useCallback } from 'preact/hooks';
import { route } from 'preact-router';
import { AppReducer } from './AppReducer';
import { getMe } from '../services/auth-service';
import { setOnUnauthorized } from '../services/api';

const initialState = {
  theme: 'dark',
  user: null,
  userProfile: null,
  isAuthenticated: false,
  isAuthLoading: true,
};

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(AppReducer, initialState);

  const handleUnauthorized = useCallback(() => {
    dispatch({ type: 'CLEAR_USER' });
    route('/login');
  }, []);

  useEffect(() => {
    setOnUnauthorized(handleUnauthorized);
  }, [handleUnauthorized]);

  useEffect(() => {
    getMe()
      .then((res) => {
        const profile = res.data?.data || res.data;
        dispatch({ type: 'SET_PROFILE', payload: profile });
        dispatch({ type: 'SET_USER', payload: profile });
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
