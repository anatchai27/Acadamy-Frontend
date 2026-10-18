import { route } from 'preact-router';
import { useEffect, useState } from 'preact/hooks';
import { useLiffContext } from '../store/LiffContext';
import { bindLineUserId } from '../services/parent-service';

const testAuthMode = import.meta.env.MODE_TEST_AUTH === 'true';

export const LoginPage = () => {
  const { state, dispatch } = useLiffContext();
  const [error, setError] = useState(null);
  const [binding, setBinding] = useState(false);
  const [needsCode, setNeedsCode] = useState(false);
  const [linkCode, setLinkCode] = useState('');

  const bindParent = async (code = '') => {
    setBinding(true);
    setError(null);

    try {
      const { getLiffIdToken } = await import('../services/liff');
      const idToken = await getLiffIdToken();
      if (!idToken) throw new Error('ไม่พบ LINE ID token กรุณาปิดแล้วเปิด LIFF ใหม่');
      const res = await bindLineUserId(idToken, code);
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
      if (err.status === 404 && err.data?.code === 'LINK_CODE_REQUIRED' && !code) {
        setNeedsCode(true);
        return;
      }
      setError(err.status === 409
        ? (err.data?.error || 'ไม่สามารถยืนยันบัญชีได้ กรุณาติดต่อโรงเรียนเพื่อตรวจสอบ')
        : (err.data?.error || err.message || 'ไม่สามารถเชื่อมต่อกับ LINE ได้'));
    } finally {
      setBinding(false);
    }
  };

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
      needsCode || binding ? null : bindParent()
    );
  }, [state.liffInitialized, state.liffProfile, state.parentUser, needsCode]);

  const handleCodeSubmit = event => {
    event.preventDefault();
    const normalizedCode = linkCode.replace(/[^a-z0-9]/gi, '').toUpperCase();
    if (normalizedCode.length !== 12) {
      setError('กรุณากรอกรหัสเชื่อม 12 ตัวอักษรที่ได้รับจากโรงเรียน');
      return;
    }
    bindParent(normalizedCode);
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
    <div class="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-500 to-blue-700 text-white p-6">
      <div class="text-center">
        <div class="text-5xl mb-4">📚</div>
        <h1 class="text-2xl font-bold mb-2">TiwHub</h1>
        <p class="text-blue-100 mb-8">ระบบจัดการเรียนการสอน</p>
        {needsCode ? (
          <form onSubmit={handleCodeSubmit} class="w-full max-w-xs text-left">
            <div class="bg-white/10 rounded-xl p-4 mb-4">
              <p class="text-sm mb-3">กรอกรหัสเชื่อม LINE ที่ได้รับจากโรงเรียน รหัสใช้ได้ครั้งเดียวและหมดอายุใน 5 วัน</p>
              {testAuthMode && <p class="text-xs text-amber-100 mb-3">โหมดทดสอบ: รหัสต้องออกจากโปรไฟล์นักเรียนในระบบโรงเรียน</p>}
              <input
                type="text"
                inputMode="text"
                autoComplete="one-time-code"
                maxLength={16}
                placeholder="เช่น ABCD2345EFGH"
                value={linkCode}
                onInput={event => (setLinkCode(event.currentTarget.value.toUpperCase().slice(0, 16)), setError(null))}
                class="w-full rounded-lg px-3 py-2 text-center font-mono text-base tracking-widest text-slate-900 outline-none"
                disabled={binding}
              />
              {error && <p class="text-sm text-red-200 mt-2">{error}</p>}
              <button type="submit" class="w-full mt-3 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-blue-700 disabled:opacity-50" disabled={binding}>
                {binding ? 'กำลังเชื่อมต่อ...' : 'เชื่อมต่อข้อมูล'}
              </button>
            </div>
          </form>
        ) : error ? (
          <div class="bg-red-500/20 rounded-xl p-4 mb-4">
            <p class="text-sm">{error}</p>
          </div>
        ) : (
          <div class="flex flex-col items-center gap-3">
            <div class="h-8 w-8 rounded-full border-3 border-white/30 border-t-white animate-spin" />
            <p class="text-sm text-blue-100">กำลังเชื่อมต่อกับ LINE...</p>
          </div>
        )}
        {testAuthMode && (
          <section class="mx-auto mt-4 w-full max-w-sm rounded-xl border border-white/20 bg-slate-950/20 p-4 text-left" aria-live="polite">
            <h2 class="text-sm font-semibold text-white">ข้อมูล LINE Profile ที่ได้รับ</h2>
            <p class="mt-1 text-xs text-blue-100">
              จาก <code>liff.getProfile()</code> — ใช้ตรวจสอบข้อมูลในโหมดทดสอบเท่านั้น
            </p>
            {state.liffProfile ? (
              <>
                <dl class="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs text-white">
                  <dt class="text-blue-100">ชื่อ</dt>
                  <dd class="break-all">{state.liffProfile.displayName || '-'}</dd>
                  <dt class="text-blue-100">LINE userId</dt>
                  <dd class="break-all font-mono">{state.liffProfile.userId || '-'}</dd>
                </dl>
                <pre class="mt-3 max-h-64 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-slate-950/40 p-3 text-left text-xs leading-relaxed text-white" dir="ltr">
                  {JSON.stringify(state.liffProfile, null, 2)}
                </pre>
              </>
            ) : (
              <p class="mt-3 text-xs text-amber-100">ยังไม่ได้รับ LINE Profile — กำลังรอ LIFF ยืนยันตัวตน</p>
            )}
          </section>
        )}
        <button
          type="button"
          onClick={handleLeaveLogin}
          disabled={binding}
          class="mt-2 rounded-lg px-4 py-2 text-sm font-medium text-white/90 underline underline-offset-4 disabled:opacity-50"
        >
          ปิด LIFF และกลับไป LINE
        </button>
      </div>
    </div>
  );
};
