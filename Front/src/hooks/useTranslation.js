import { useEffect, useState } from 'preact/hooks';
import i18n from '../i18n';

export function useTranslation() {
  const [currentLanguage, setCurrentLanguage] = useState(i18n.resolvedLanguage || i18n.language || 'th');

  useEffect(() => {
    const syncLanguage = (language) => setCurrentLanguage(language);
    i18n.on('languageChanged', syncLanguage);
    return () => i18n.off('languageChanged', syncLanguage);
  }, []);

  return {
    t: i18n.t.bind(i18n),
    i18n,
    ready: i18n.isInitialized,
    changeLanguage: (language) => i18n.changeLanguage(language),
    currentLanguage,
  };
}
