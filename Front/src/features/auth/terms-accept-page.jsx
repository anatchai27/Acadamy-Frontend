import { route } from 'preact-router';
import { useEffect, useState } from 'preact/hooks';
import { acceptTerms, getCurrentTerms } from '../../services';
import { useAppContext } from '../../store/AppContext';
import { clearAuthStorage } from '../../services/auth-service';

export const TermsAcceptPage = () => {
  const { state, dispatch } = useAppContext();
  const [document, setDocument] = useState(null);
  const [language, setLanguage] = useState('th');
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!state.isAuthLoading && !state.isAuthenticated) route('/login', true);
  }, [state.isAuthLoading, state.isAuthenticated]);

  useEffect(() => {
    getCurrentTerms(language)
      .then(response => { setDocument(response.data?.document); setError(''); })
      .catch(() => setError('Unable to load the current terms. Check your connection and retry.'));
  }, [language]);

  const submit = async event => {
    event.preventDefault();
    if (!document || !checked || busy) return;
    setBusy(true);
    setError('');
    try {
      await acceptTerms({ accepted: true, version: document.version, language });
      dispatch({ type: 'SET_TERMS_ACCEPTED', payload: true });
      route('/admin/dashboard', true);
    } catch (requestError) {
      if (requestError.status === 409) {
        setChecked(false);
        setError('Terms were updated while this page was open. Review the current version and accept again.');
        getCurrentTerms(language).then(response => setDocument(response.data?.document)).catch(() => {});
      } else setError(requestError.data?.error || requestError.message || 'Acceptance could not be saved. Please retry.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main class="min-h-screen bg-oasis-bg px-4 py-8 text-zinc-900 sm:px-6">
      <div class="mx-auto max-w-3xl rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-8">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div><h1 class="text-2xl font-bold">ข้อกำหนดการใช้บริการ / Terms of Service</h1><p class="mt-2 text-sm text-zinc-600">มีข้อกำหนดฉบับใหม่ โปรดอ่านและยอมรับเพื่อใช้งานต่อ / A new version is available. Review and accept it to continue.</p></div>
          <div class="flex gap-2 text-sm"><button type="button" class="rounded-lg border px-3 py-2" aria-pressed={language === 'th'} onClick={() => { setLanguage('th'); setChecked(false); }}>ไทย</button><button type="button" class="rounded-lg border px-3 py-2" aria-pressed={language === 'en'} onClick={() => { setLanguage('en'); setChecked(false); }}>English</button></div>
        </div>
        {document ? <article class="mt-6 max-h-[58vh] overflow-y-auto border-y border-zinc-200 py-5 text-sm leading-7 text-zinc-700" lang={language}>
          <div class="mb-5"><h2 class="text-lg font-semibold text-zinc-900">{document.title?.[language]} · v{document.version}</h2><p class="mt-1">Effective: {document.effectiveAt}</p><p class="mt-3">{document.intro?.[language]}</p></div>
          {document.sections?.map(section => <section class="mb-5" key={section.heading?.[language]}><h3 class="font-semibold text-zinc-900">{section.heading?.[language]}</h3>{section.paragraphs?.[language]?.map(paragraph => <p class="mt-2" key={paragraph}>{paragraph}</p>)}</section>)}
        </article> : <p class="mt-6 text-sm text-zinc-600">Loading current terms…</p>}
        <form class="mt-5" onSubmit={submit}>
          <label class="flex cursor-pointer items-start gap-3 text-sm leading-6"><input type="checkbox" class="mt-1 h-4 w-4" checked={checked} onChange={event => setChecked(event.currentTarget.checked)} /><span>I have read and expressly accept this version of the Terms of Service. / ฉันได้อ่านและยอมรับข้อกำหนดฉบับนี้</span></label>
          {error && <p role="alert" class="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <div class="mt-5 flex flex-wrap gap-3"><button type="submit" disabled={!document || !checked || busy} class="min-h-11 rounded-xl bg-oasis-primary px-5 py-2.5 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{busy ? 'Saving…' : 'ยอมรับและดำเนินการต่อ / Accept and continue'}</button><button type="button" onClick={() => { clearAuthStorage(); dispatch({ type: 'CLEAR_USER' }); route('/login', true); }} class="min-h-11 rounded-xl border border-zinc-300 px-5 py-2.5 font-semibold text-zinc-700">ออกจากระบบ / Sign out</button></div>
        </form>
      </div>
    </main>
  );
};