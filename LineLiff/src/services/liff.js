import { resetParentAuthForRollout } from './parent-auth-reset';

const LIFF_ID = import.meta.env.VITE_LIFF_ID || '';
const FORCE_LOGOUT = import.meta.env.VITE_FORCE_LOGOUT === 'true';

let liff = null;

export const initLiff = async () => {
  return liff || (async () => {
    const mod = await import('@line/liff');
    liff = mod.default;
    await liff.init({ liffId: LIFF_ID });
    return liff;
  })();
};

export const getLiff = () => liff;

export const getLiffProfile = async () => {
  if (!liff) throw new Error('LIFF not initialized');
  if (resetParentAuthForRollout({ enabled: FORCE_LOGOUT, storage: window.localStorage, liff })) return null;
  return !liff.isLoggedIn() ? (liff.login(), null) : liff.getProfile();
};

export const getLiffAccessToken = async () => {
  return liff ? liff.getAccessToken() : (() => { throw new Error('LIFF not initialized'); })();
};

export const getLiffIdToken = async () => {
  return liff ? liff.getIDToken() : (() => { throw new Error('LIFF not initialized'); })();
};

export const logoutLiff = () => {
  liff ? liff.logout() : null;
};

export const closeLiff = () => {
  liff ? liff.closeWindow() : null;
};
