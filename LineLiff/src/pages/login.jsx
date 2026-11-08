import { route } from 'preact-router';
import { useEffect, useState } from 'preact/hooks';
import { useLiffContext } from '../store/LiffContext';
import { bindLineUserId, getCurrentTerms } from '../services/parent-service';
import { normalizeParentLinkCode, validateParentLinkCode } from '../utils/parent-link-code';
import { APP_VERSION } from '../utils/app-version';

const testAuthMode = import.meta.env.MODE_TEST_AUTH === 'true';

export const LoginPage = () => {
  const { state, dispatch } = useLiffContext();
  const [error, setError] = useState(null);
  const [binding, setBinding] = useState(false);
  const [needsCode, setNeedsCode] = useState(false);
  const [linkCode, setLinkCode] = useState('');
  const [lineAuthFailed, setLineAuthFailed] = useState(false);
  const [needsTerms, setNeedsTerms] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [terms, setTerms] = useState(null);
  const [termsLanguage, setTermsLanguage] = useState('th');

  const bindParent = async (code = '', acceptTerms = false) => {
    setBinding(true);
    setError(null);
    setLineAuthFailed(false);

    try {
      const { getLiffIdToken } = await import('../services/liff');
      const idToken = await getLiffIdToken();
      if (!idToken) throw new Error('ไม่พบ LINE ID token กรุณาปิดแล้วเปิด LIFF ใหม่');
      const res = await bindLineUserId(idToken, code, {
        acceptTerms,
        termsVersion: acceptTerms ? terms?.version : undefined,
        termsLanguage,
      });
      const token = res.data?.token || res.data?.accessToken;
      token ? ((() => {
        try {
          window.localStorage.setItem('parent_token', token);
        } catch {}
      })(), dispatch({ type: 'SET_PARENT_TOKEN', payload: token })) : null;
      const user = res.data?.user || res.data;
      dispatch({ type: 'SET_PARENT_USER', payload: user });
      const children = res.data?.children || user?.children || [];
      dispatch({ type: 'SET_CHILDREN', payload: children });
      children.length > 0 ? dispatch({ type: 'SET_ACTIVE_CHILD', payload: children[0].id }) : null;
      route('/liff/dashboard', true);
    } catch (err) {
      if (err.status === 428 && err.data?.code === 'TERMS_ACCEPTANCE_REQUIRED') {
        setNeedsTerms(true);
        setTermsAccepted(false);
        try {
          const response = await getCurrentTerms(termsLanguage);
          setTerms(response.data?.document || null);
        } catch {
          setError('ไม่สามารถโหลดข้อกำหนดได้ กรุณาลองใหม่ / Unable to load the terms. Please retry.');
        }
        return;
      }
      if (err.status === 404 && err.data?.code === 'LINK_CODE_REQUIRED' && !code) {
        setNeedsTerms(false);
        setNeedsCode(true);
        return;
      }
      setLineAuthFailed(err.status === 401);
      setError(err.status === 409
        ? (err.data?.error || 'ไม่สามารถยืนยันบัญชีได้ กรุณาติดต่อโรงเรียนเพื่อตรวจสอบ')
        : (err.data?.error || err.message || 'ไม่สามารถเชื่อมต่อกับ LINE ได้'));
    } finally {
      setBinding(false);
    }
  };

  const restartLineAuth = async () => {
    setBinding(true);
    setError(null);
    try {
      const { getLiff } = await import('../services/liff');
      const liff = getLiff();
      if (!liff) throw new Error('LIFF ยังไม่พร้อม กรุณาปิดแล้วเปิดใหม่');
      liff.logout();
      liff.login();
    } catch (err) {
      setBinding(false);
      setError(err.message || 'เริ่มยืนยัน LINE ใหม่ไม่สำเร็จ กรุณาปิดแล้วเปิด LIFF ใหม่');
    }
  };

  const recoveryActions = lineAuthFailed && (
    <div class="mt-3 grid gap-2">
      <button type="button" onClick={() => bindParent(needsCode ? normalizeParentLinkCode(linkCode) : '')} disabled={binding} class="min-h-11 w-full rounded-xl border border-sage-300 bg-white px-3 py-2 text-sm font-bold text-sage-700 transition hover:bg-sage-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-700 disabled:opacity-50">
        ลองตรวจสอบอีกครั้ง
      </button>
      <button type="button" onClick={restartLineAuth} disabled={binding} class="min-h-11 w-full rounded-xl bg-sage-700 px-3 py-2 text-sm font-bold text-white transition hover:bg-sage-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-700 disabled:opacity-50">
        เริ่มยืนยัน LINE ใหม่
      </button>
      <p class="text-center text-xs leading-5 text-ink-500">หากยังไม่ผ่าน ให้ผู้ดูแลตรวจว่า LINE Login channel ID ในระบบตรงกับ LIFF</p>
    </div>
  );

  useEffect(() => {
    !state.liffInitialized ? null : (
      !state.liffProfile ? (async () => {
        try {
          const { getLiffProfile } = await import('../services/liff');
          const profile = await getLiffProfile();
          profile ? dispatch({ type: 'SET_LIFF_PROFILE', payload: profile }) : null;
        } catch (err) {
          setError(err.message || 'ไม่สามารถยืนยันตัวตนกับ LINE ได้ กรุณาลองเปิด LIFF ใหม่');
        }
      })() :
      state.parentUser ? route('/liff/dashboard', true) :
      needsCode || needsTerms || binding ? null : bindParent()
    );
  }, [state.liffInitialized, state.liffProfile, state.parentUser, needsCode]);

  const handleCodeSubmit = event => {
    event.preventDefault();
    const normalizedCode = normalizeParentLinkCode(linkCode);
    const validationError = validateParentLinkCode(normalizedCode);
    if (validationError) {
      setError(validationError);
      return;
    }
    bindParent(normalizedCode, termsAccepted);
  };

  const handleTermsSubmit = event => {
    event.preventDefault();
    if (!termsAccepted || !terms?.version) return;
    bindParent(needsCode ? normalizeParentLinkCode(linkCode) : '', true);
  };

  const handleLeaveLogin = async () => {
    try {
      const { getLiff } = await import('../services/liff');
      const liff = getLiff();
      if (liff?.isInClient()) {
        liff.closeWindow();
        return;
      }
    } catch {}

    window.history.length > 1 ? window.history.back() : window.location.assign('/');
  };

  return (
    <div class="flex min-h-[100dvh] flex-col items-center justify-center bg-sage-50 p-5 text-ink-900 sm:p-6">
      <div class="w-full max-w-sm text-center">
        <img src="/tiwhub-mark.svg" alt="" class="mx-auto mb-4 h-14 w-14 rounded-2xl shadow-soft" />
        <h1 class="text-2xl font-bold tracking-tight text-ink-900">tiwhub</h1>
        <p class="mt-1 text-ink-500">ระบบจัดการเรียนการสอน</p>
        <p class="mb-5 mt-2 text-xs text-ink-500">เวอร์ชัน {APP_VERSION}</p>
        {needsTerms ? (
          <form onSubmit={handleTermsSubmit} class="text-left">
            <section class="mb-4 rounded-2xl border border-sage-200 bg-white p-5 shadow-soft">
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div><h2 class="text-lg font-bold text-ink-900">ข้อกำหนดการใช้บริการ / Terms of Service</h2><p class="mt-1 text-xs text-ink-500">Version {terms?.version || '—'} · Effective {terms?.effectiveAt || '—'}</p></div>
                <div class="flex gap-2 text-xs"><button type="button" class="underline" aria-pressed={termsLanguage === 'th'} onClick={async () => { setTermsLanguage('th'); try { const response = await getCurrentTerms('th'); setTerms(response.data?.document || null); } catch { setError('โหลดข้อกำหนดไม่สำเร็จ'); } }}>ไทย</button><button type="button" class="underline" aria-pressed={termsLanguage === 'en'} onClick={async () => { setTermsLanguage('en'); try { const response = await getCurrentTerms('en'); setTerms(response.data?.document || null); } catch { setError('Unable to load terms.'); } }}>English</button></div>
              </div>
              {terms ? <article class="mt-4 max-h-[45vh] overflow-y-auto border-y border-sage-100 py-3 text-sm leading-6 text-ink-700" lang={termsLanguage}><h3 class="font-semibold">{terms.title?.[termsLanguage]}</h3><p class="mt-2">{terms.intro?.[termsLanguage]}</p>{terms.sections?.map(section => <section class="mt-3" key={section.heading?.[termsLanguage]}><h4 class="font-semibold">{section.heading?.[termsLanguage]}</h4>{section.paragraphs?.[termsLanguage]?.map(paragraph => <p class="mt-1" key={paragraph}>{paragraph}</p>)}</section>)}</article> : <p class="mt-3 text-sm text-ink-500">กำลังโหลดข้อกำหนด / Loading terms…</p>}
              <label class="mt-4 flex cursor-pointer items-start gap-3 text-sm leading-6"><input type="checkbox" class="mt-1 h-4 w-4" checked={termsAccepted} onChange={event => setTermsAccepted(event.currentTarget.checked)} /><span>ฉันได้อ่านและยอมรับข้อกำหนดฉบับนี้ / I have read and expressly accept these Terms of Service.</span></label>
              {error && <p role="alert" class="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
              <button type="submit" disabled={binding || !termsAccepted || !terms} class="mt-4 min-h-11 w-full rounded-xl bg-sage-700 px-3 py-2 text-sm font-bold text-white disabled:opacity-50">{binding ? 'กำลังบันทึก...' : 'ยอมรับและดำเนินการต่อ / Accept and continue'}</button>
            </section>
          </form>
        ) : needsCode ? (
          <form onSubmit={handleCodeSubmit} class="text-left">
            <div class="mb-4 rounded-2xl border border-sage-200 bg-white p-5 shadow-soft">
              <h2 class="text-lg font-bold text-ink-900">เชื่อมบัญชีผู้ปกครอง</h2>
              <p class="mb-4 mt-1 text-sm leading-6 text-ink-500">กรอกรหัสที่ได้รับจากโรงเรียน รหัสใช้ได้ครั้งเดียวและหมดอายุใน 5 วัน</p>
              {testAuthMode && <p class="mb-3 rounded-xl bg-gold-50 p-3 text-xs text-gold-600">โหมดทดสอบ: รหัสต้องออกจากโปรไฟล์นักเรียนในระบบโรงเรียน</p>}
              <input
                type="text"
                inputMode="text"
                autoComplete="one-time-code"
                maxLength={16}
                placeholder="เช่น ABCD2345EFGH"
                value={linkCode}
                onInput={event => (setLinkCode(event.currentTarget.value.toUpperCase().slice(0, 16)), setError(null))}
                aria-describedby="link-code-hint"
                class="min-h-12 w-full rounded-xl border border-sage-200 bg-sage-50 px-3 py-2 text-center font-mono text-base tracking-widest text-ink-900 outline-none transition focus:border-sage-600 focus:ring-2 focus:ring-sage-100"
                disabled={binding}
              />
              <p id="link-code-hint" class="mt-2 text-xs text-ink-500">รหัสมี 12 ตัว ไม่ใช้ตัว I, O, 0 หรือ 1</p>
              {error && <p role="alert" class="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
              {recoveryActions}
              <button type="submit" class="mt-4 min-h-11 w-full rounded-xl bg-sage-700 px-3 py-2 text-sm font-bold text-white transition hover:bg-sage-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-700 disabled:opacity-50" disabled={binding}>
                {binding ? 'กำลังเชื่อมต่อ...' : 'เชื่อมต่อข้อมูล'}
              </button>
            </div>
          </form>
        ) : error ? (
          <div role="alert" class="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            <p class="text-sm">{error}</p>
            {recoveryActions}
          </div>
        ) : (
          <div class="flex flex-col items-center gap-3">
            <div class="h-8 w-8 animate-spin rounded-full border-3 border-sage-200 border-t-sage-700" />
            <p class="text-sm text-ink-500">กำลังเชื่อมต่อกับ LINE...</p>
          </div>
        )}
        {testAuthMode && (
          <section class="mx-auto mt-4 w-full rounded-2xl border border-sage-200 bg-white p-4 text-left shadow-soft" aria-live="polite">
            <h2 class="text-sm font-semibold text-ink-900">ข้อมูล LINE Profile ที่ได้รับ</h2>
            <p class="mt-1 text-xs text-ink-500">
              จาก <code>liff.getProfile()</code> — ใช้ตรวจสอบข้อมูลในโหมดทดสอบเท่านั้น
            </p>
            {state.liffProfile ? (
              <>
                <dl class="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs text-ink-900">
                  <dt class="text-ink-500">ชื่อ</dt>
                  <dd class="break-all">{state.liffProfile.displayName || '-'}</dd>
                  <dt class="text-ink-500">LINE userId</dt>
                  <dd class="break-all font-mono">{state.liffProfile.userId || '-'}</dd>
                </dl>
                <pre class="mt-3 max-h-64 overflow-auto whitespace-pre-wrap break-all rounded-xl bg-sage-50 p-3 text-left text-xs leading-relaxed text-ink-700" dir="ltr">
                  {JSON.stringify(state.liffProfile, null, 2)}
                </pre>
              </>
            ) : (
              <p class="mt-3 text-xs text-gold-600">ยังไม่ได้รับ LINE Profile — กำลังรอ LIFF ยืนยันตัวตน</p>
            )}
          </section>
        )}
        <button
          type="button"
          onClick={handleLeaveLogin}
          disabled={binding}
          class="mt-2 min-h-11 rounded-full px-4 py-2 text-sm font-semibold text-sage-700 underline underline-offset-4 transition hover:text-sage-600 disabled:opacity-50"
        >
          ปิด LIFF และกลับไป LINE
        </button>
      </div>
    </div>
  );
};
