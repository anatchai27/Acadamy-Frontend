import { useCallback } from 'preact/hooks';
import { useAppContext } from '../store/AppContext';

export function useDesignTheme() {
  const { state, dispatch } = useAppContext();
  const designTheme = state.designTheme || 'bento';

  const setDesignTheme = useCallback((theme) => {
    if (theme === 'bento' || theme === 'neobrutalism') {
      dispatch({ type: 'SET_DESIGN_THEME', payload: theme });
    }
  }, [dispatch]);

  const toggleDesignTheme = useCallback(() => {
    const next = designTheme === 'bento' ? 'neobrutalism' : 'bento';
    setDesignTheme(next);
  }, [designTheme, setDesignTheme]);

  return { designTheme, setDesignTheme, toggleDesignTheme };
}