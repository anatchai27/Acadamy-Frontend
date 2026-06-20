import { createContext } from 'preact';
import { useContext, useReducer, useEffect } from 'preact/hooks';
import { AppReducer } from './AppReducer';
import { getStoredToken, getStoredUser, getMe } from '../services/auth-service';

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

  useEffect(() => {
    if (state.isAuthenticated) {
      getMe()
        .then((res) => dispatch({ type: 'SET_PROFILE', payload: res.data }))
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
