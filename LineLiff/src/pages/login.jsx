import { route } from 'preact-router';
import { useEffect, useState } from 'preact/hooks';
import { useLiffContext } from '../store/LiffContext';
import { bindLineUserId } from '../services/parent-service';

export const LoginPage = () => {
  const { state, dispatch } = useLiffContext();
  const [error, setError] = useState(null);
  const [binding, setBinding] = useState(false);

  useEffect(() => {
    !state.liffInitialized ? null : (
      !state.liffProfile ? (async () => {
        const { getLiffProfile } = await import('../services/liff');
        const profile = await getLiffProfile();
        profile ? dispatch({ type: 'SET_LIFF_PROFILE', payload: profile }) : null;
      })() :
      state.parentUser ? route('/liff/dashboard', true) :
      binding ? null : (setBinding(true), (async () => {
        try {
          const { getLiffAccessToken } = await import('../services/liff');
          const accessToken = await getLiffAccessToken();
          const res = await bindLineUserId(state.liffProfile.userId, accessToken);
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
          setError(err.message || 'ไม่สามารถเชื่อมต่อกับ LINE ได้');
        }
      })())
    );
  }, [state.liffInitialized, state.liffProfile, state.parentUser]);

  return (
    <div class="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-500 to-blue-700 text-white p-6">
      <div class="text-center">
        <div class="text-5xl mb-4">📚</div>
        <h1 class="text-2xl font-bold mb-2">TiwHub</h1>
        <p class="text-blue-100 mb-8">ระบบจัดการเรียนการสอน</p>
        {error ? (
          <div class="bg-red-500/20 rounded-xl p-4 mb-4">
            <p class="text-sm">{error}</p>
          </div>
        ) : (
          <div class="flex flex-col items-center gap-3">
            <div class="h-8 w-8 rounded-full border-3 border-white/30 border-t-white animate-spin" />
            <p class="text-sm text-blue-100">กำลังเชื่อมต่อกับ LINE...</p>
          </div>
        )}
      </div>
    </div>
  );
};
