import { useCallback } from 'preact/hooks';
import { useAppContext } from '../store/AppContext';

export const useDesignTheme = () => {
  const { state, dispatch } = useAppContext();
  const designTheme = state.designTheme || 'neobrutalism';

  const setDesignTheme = useCallback((theme) => {
    theme === 'bento' || theme === 'neobrutalism'
      ? (dispatch({ type: 'SET_DESIGN_THEME', payload: theme }),
        console.log(`Design theme set to: ${theme}`))
      : null;
  }, [dispatch]);

  const toggleDesignTheme = useCallback(() => {
    const next = designTheme === 'bento' ? 'neobrutalism' : 'bento';
    setDesignTheme(next);
  }, [designTheme, setDesignTheme]);

  return { designTheme, setDesignTheme, toggleDesignTheme };
};
