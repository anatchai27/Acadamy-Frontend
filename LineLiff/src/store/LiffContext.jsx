import { createContext } from 'preact';
import { useContext, useReducer, useEffect, useCallback } from 'preact/hooks';

const LiffContext = createContext(null);

const initialState = {
  liffInitialized: false,
  liffError: null,
  liffProfile: null,
  parentToken: null,
  parentUser: null,
  children: [],
  activeChildId: null,
  dashboard: null,
  loading: true,
};

function reducer(state, action) {
  switch (action.type) {
    case 'LIFF_INIT_SUCCESS':
      return { ...state, liffInitialized: true, liffError: null, loading: false };
    case 'LIFF_INIT_ERROR':
      return { ...state, liffError: action.payload, loading: false };
    case 'SET_LIFF_PROFILE':
      return { ...state, liffProfile: action.payload };
    case 'SET_PARENT_TOKEN':
      return { ...state, parentToken: action.payload };
    case 'SET_PARENT_USER':
      return { ...state, parentUser: action.payload };
    case 'SET_CHILDREN':
      return { ...state, children: action.payload };
    case 'SET_ACTIVE_CHILD':
      return { ...state, activeChildId: action.payload };
    case 'SET_DASHBOARD':
      return { ...state, dashboard: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'RESET':
      return { ...initialState, loading: false };
    default:
      return state;
  }
}

export function LiffProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
    try { window.localStorage.removeItem('parent_token'); } catch {}
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const { initLiff } = await import('../services/liff');
        const liff = await initLiff();
        if (cancelled) return;
        dispatch({ type: 'LIFF_INIT_SUCCESS' });

        if (liff.isLoggedIn()) {
          const profile = await liff.getProfile();
          if (cancelled) return;
          dispatch({ type: 'SET_LIFF_PROFILE', payload: profile });
        }
      } catch (err) {
        if (!cancelled) {
          dispatch({ type: 'LIFF_INIT_ERROR', payload: err.message });
        }
      }
    }
    init();
    return () => { cancelled = true; };
  }, []);

  return (
    <LiffContext.Provider value={{ state, dispatch, reset }}>
      {children}
    </LiffContext.Provider>
  );
}

export function useLiffContext() {
  const ctx = useContext(LiffContext);
  if (!ctx) throw new Error('useLiffContext must be used within LiffProvider');
  return ctx;
}