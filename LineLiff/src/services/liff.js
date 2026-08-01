const LIFF_ID = import.meta.env.VITE_LIFF_ID || '';

let liff = null;

export async function initLiff() {
  if (liff) return liff;
  const mod = await import('@line/liff');
  liff = mod.default;
  await liff.init({ liffId: LIFF_ID });
  return liff;
}

export function getLiff() {
  return liff;
}

export async function getLiffProfile() {
  if (!liff) throw new Error('LIFF not initialized');
  if (!liff.isLoggedIn()) {
    liff.login();
    return null;
  }
  return liff.getProfile();
}

export async function getLiffAccessToken() {
  if (!liff) throw new Error('LIFF not initialized');
  return liff.getAccessToken();
}

export function logoutLiff() {
  if (liff) liff.logout();
}

export function closeLiff() {
  if (liff) liff.closeWindow();
}