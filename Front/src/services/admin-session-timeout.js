export const ADMIN_INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;

const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];

export function startAdminInactivityTimer({
  onTimeout,
  windowRef = window,
  timeoutMs = ADMIN_INACTIVITY_TIMEOUT_MS,
}) {
  let timer = null;
  const resetTimer = () => {
    if (timer !== null) windowRef.clearTimeout(timer);
    timer = windowRef.setTimeout(onTimeout, timeoutMs);
  };

  ACTIVITY_EVENTS.forEach(eventName => windowRef.addEventListener(eventName, resetTimer, { passive: true }));
  resetTimer();

  return () => {
    if (timer !== null) windowRef.clearTimeout(timer);
    ACTIVITY_EVENTS.forEach(eventName => windowRef.removeEventListener(eventName, resetTimer));
  };
}
