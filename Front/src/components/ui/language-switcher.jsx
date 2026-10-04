import { useTranslation } from '../../hooks';

export function LanguageSwitcher({ class: className = '' }) {
  const { changeLanguage, currentLanguage } = useTranslation();
  const nextLanguage = currentLanguage === 'th' ? 'en' : 'th';

  return (
    <button
      type="button"
      class={`inline-flex items-center justify-center rounded-lg border border-current/20 px-3 py-2 text-sm font-semibold transition-colors hover:bg-black/5 ${className}`}
      onClick={() => changeLanguage(nextLanguage)}
      aria-label={currentLanguage === 'th' ? 'Switch language to English' : 'เปลี่ยนภาษาเป็นภาษาไทย'}
      title={currentLanguage === 'th' ? 'English' : 'ภาษาไทย'}
    >
      {currentLanguage === 'th' ? 'EN' : 'ไทย'}
    </button>
  );
}
