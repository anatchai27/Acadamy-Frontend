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
  return liff ? (FORCE_LOGOUT ? liff.logout() : null, !liff.isLoggedIn() ? (liff.login(), null) : liff.getProfile()) : (() => { throw new Error('LIFF not initialized'); })();
};

export const getLiffAccessToken = async () => {
  return liff ? liff.getAccessToken() : (() => { throw new Error('LIFF not initialized'); })();
};

export const logoutLiff = () => {
  liff ? liff.logout() : null;
};

export const closeLiff = () => {
  liff ? liff.closeWindow() : null;
};
