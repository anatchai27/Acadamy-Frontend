import { route } from 'preact-router';
import { useEffect, useState } from 'preact/hooks';
import { useLiffContext } from '../store/LiffContext';
import { bindLineUserId } from '../services/parent-service';

const testAuthMode = import.meta.env.DEV && import.meta.env.MODE_TEST_AUTH === 'true';

export const LoginPage = () => {
  const { state, dispatch } = useLiffContext();
  const [error, setError] = useState(null);
  const [binding, setBinding] = useState(false);
  const [needsPhone, setNeedsPhone] = useState(false);
  const [phone, setPhone] = useState('');

  const bindParent = async (phoneNumber = '') => {
    setBinding(true);
    setError(null);

    try {
      const { getLiffIdToken } = await import('../services/liff');
      const idToken = await getLiffIdToken();
      if (!idToken) throw new Error('ไม่พบ LINE ID token กรุณาปิดแล้วเปิด LIFF ใหม่');
      const res = await bindLineUserId(idToken, phoneNumber);
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
      if (err.status === 404 && !phoneNumber) {
        setNeedsPhone(true);
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
      needsPhone || binding ? null : bindParent()
    );
  }, [state.liffInitialized, state.liffProfile, state.parentUser, needsPhone]);

  const handlePhoneSubmit = event => {
    event.preventDefault();
    const normalizedPhone = phone.replace(/\D/g, '');
    if (!/^\d{10}$/.test(normalizedPhone)) {
      setError('กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง 10 หลัก');
      return;
    }
    bindParent(normalizedPhone);
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
        {needsPhone ? (
          <form onSubmit={handlePhoneSubmit} class="w-full max-w-xs text-left">
            <div class="bg-white/10 rounded-xl p-4 mb-4">
              <p class="text-sm mb-3">ไม่พบข้อมูลผู้ปกครอง กรุณากรอกเบอร์โทรศัพท์เพื่อเชื่อมต่อข้อมูล</p>
              {testAuthMode && <p class="text-xs text-amber-100 mb-3">โหมดทดสอบ: ใช้เบอร์จากชุดข้อมูลทดสอบเท่านั้น</p>}
              <input
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                placeholder="กรอกเบอร์โทรศัพท์ 10 หลัก"
                value={phone}
                onInput={event => (setPhone(event.currentTarget.value.replace(/\D/g, '').slice(0, 10)), setError(null))}
                class="w-full rounded-lg px-3 py-2 text-sm text-slate-900 outline-none"
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
        {testAuthMode && state.liffProfile && (
          <details class="mx-auto mt-4 w-full max-w-sm rounded-xl border border-white/20 bg-slate-950/20 p-4 text-left">
            <summary class="cursor-pointer text-sm font-semibold text-white">
              ข้อมูล LINE Profile ที่ได้รับ
            </summary>
            <p class="mt-2 text-xs text-blue-100">
              จาก <code>liff.getProfile()</code> — แสดงเฉพาะในโหมด Development สำหรับทดสอบ
            </p>
            <pre class="mt-3 max-h-64 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-slate-950/40 p-3 text-left text-xs leading-relaxed text-white" dir="ltr">
              {JSON.stringify(state.liffProfile, null, 2)}
            </pre>
          </details>
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
