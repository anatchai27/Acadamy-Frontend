const RESET_MARKER = 'liff_parent_auth_reset_v1';

export const resetParentAuthForRollout = ({ enabled, storage, liff }) => {
  if (!enabled) {
    try {
      storage.removeItem(RESET_MARKER);
    } catch {}
    return false;
  }

  try {
    if (storage.getItem(RESET_MARKER) === 'done') return false;
    storage.removeItem('parent_token');
    storage.setItem(RESET_MARKER, 'done');
  } catch {
    return false;
  }

  if (liff.isLoggedIn()) liff.logout();
  liff.login();
  return true;
};
