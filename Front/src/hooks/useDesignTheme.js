import { useAppContext } from '../store/AppContext';

export const useDesignTheme = () => {
  useAppContext();
  const designTheme = 'neobrutalism';

  return { designTheme };
};
