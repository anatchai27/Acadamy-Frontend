import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import th from '../locales/th.json';
import en from '../locales/en.json';

const resources = {
  th: { translation: th },
  en: { translation: en },
};

i18n
  .use(LanguageDetector)
  .init({
    resources,
    fallbackLng: 'th',
    supportedLngs: ['th', 'en'],
    load: 'languageOnly',
    debug: false,
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage'],
      caches: ['localStorage'],
    },
  });

export default i18n;
