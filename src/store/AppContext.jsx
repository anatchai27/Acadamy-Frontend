import { createContext } from 'preact';
import { useContext, useReducer } from 'preact/hooks';
import { AppReducer } from './AppReducer';
const initialState = {
  theme: 'dark',
  user: null,
  isAuthenticated: false,
};



const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(AppReducer, initialState);

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
