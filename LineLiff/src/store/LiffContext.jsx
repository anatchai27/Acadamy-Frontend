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

const reducer = (state, action) => {
  return ({
    LIFF_INIT_SUCCESS: { ...state, liffInitialized: true, liffError: null, loading: false },
    LIFF_INIT_ERROR: { ...state, liffError: action.payload, loading: false },
    SET_LIFF_PROFILE: { ...state, liffProfile: action.payload },
    SET_PARENT_TOKEN: { ...state, parentToken: action.payload },
    SET_PARENT_USER: { ...state, parentUser: action.payload },
    SET_CHILDREN: { ...state, children: action.payload },
    SET_ACTIVE_CHILD: { ...state, activeChildId: action.payload },
    SET_DASHBOARD: { ...state, dashboard: action.payload },
    SET_LOADING: { ...state, loading: action.payload },
    RESET: { ...initialState, loading: false },
  })[action.type] || state;
};

export const LiffProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
    (() => {
      try {
        window.localStorage.removeItem('parent_token');
      } catch {}
    })();
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { initLiff } = await import('../services/liff');
        const liff = await initLiff();
        cancelled ? null : (dispatch({ type: 'LIFF_INIT_SUCCESS' }), liff.isLoggedIn() ? (async () => {
          const profile = await liff.getProfile();
          cancelled ? null : dispatch({ type: 'SET_LIFF_PROFILE', payload: profile });
        })() : null);
      } catch (err) {
        !cancelled ? dispatch({ type: 'LIFF_INIT_ERROR', payload: err.message }) : null;
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <LiffContext.Provider value={{ state, dispatch, reset }}>
      {children}
    </LiffContext.Provider>
  );
};

export const useLiffContext = () => {
  const ctx = useContext(LiffContext);
  return ctx ? ctx : (() => { throw new Error('useLiffContext must be used within LiffProvider'); })();
};
