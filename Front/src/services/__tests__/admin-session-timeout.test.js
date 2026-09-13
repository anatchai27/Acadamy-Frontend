import { describe, expect, it, vi } from 'vitest';
import { ADMIN_INACTIVITY_TIMEOUT_MS, startAdminInactivityTimer } from '../admin-session-timeout';

describe('admin inactivity timeout', () => {
  it('uses a 30 minute timeout', () => {
    expect(ADMIN_INACTIVITY_TIMEOUT_MS).toBe(30 * 60 * 1000);
  });

  it('expires after inactivity and resets on activity', () => {
    vi.useFakeTimers();
    const onTimeout = vi.fn();
    const cleanup = startAdminInactivityTimer({ onTimeout, windowRef: window, timeoutMs: 1000 });

    vi.advanceTimersByTime(999);
    expect(onTimeout).not.toHaveBeenCalled();
    window.dispatchEvent(new Event('mousemove'));
    vi.advanceTimersByTime(999);
    expect(onTimeout).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onTimeout).toHaveBeenCalledTimes(1);

    cleanup();
    vi.useRealTimers();
  });
});
