import { useTranslation } from '../../hooks';

export function LanguageSwitcher({ class: className = '' }) {
  const { changeLanguage, currentLanguage } = useTranslation();
  const isThai = currentLanguage === 'th';

  return (
    <div role="group" aria-label={isThai ? 'เลือกภาษา' : 'Select language'} class={`inline-flex h-10 items-center rounded-xl bg-slate-100 p-1 text-xs font-semibold text-slate-600 ${className}`}>
      <button
        type="button"
        class={`flex h-8 min-w-9 items-center justify-center rounded-lg px-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-cyan-600 ${isThai ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'}`}
        onClick={() => changeLanguage('th')}
        aria-label={isThai ? 'ภาษาไทย' : 'เปลี่ยนภาษาเป็นภาษาไทย'}
        aria-pressed={isThai}
        title="ภาษาไทย"
      >
        TH
      </button>
      <button
        type="button"
        class={`flex h-8 min-w-9 items-center justify-center rounded-lg px-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-cyan-600 ${!isThai ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'}`}
        onClick={() => changeLanguage('en')}
        aria-label={isThai ? 'Switch language to English' : 'English'}
        aria-pressed={!isThai}
        title="English"
      >
        EN
      </button>
    </div>
  );
}
