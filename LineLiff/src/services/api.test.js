import { afterEach, describe, expect, it, vi } from 'vitest';
import { api, recoverExpiredParentSession } from './api';

describe('expired LIFF parent sessions', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    window.localStorage.clear();
  });

  it('clears the stale token and routes protected LIFF pages to login on 401', () => {
    const storage = { removeItem: vi.fn() };
    const location = { pathname: '/liff/dashboard', assign: vi.fn() };

    expect(recoverExpiredParentSession(401, '/parents/me/dashboard', { storage, location })).toBe(true);
    expect(storage.removeItem).toHaveBeenCalledWith('parent_token');
    expect(location.assign).toHaveBeenCalledWith('/liff/login');
  });

  it('does not redirect or clear the session for LINE bind endpoint errors', () => {
    const storage = { removeItem: vi.fn() };
    const location = { pathname: '/liff/login', assign: vi.fn() };

    expect(recoverExpiredParentSession(401, '/parents/bind-line', { storage, location })).toBe(false);
    expect(storage.removeItem).not.toHaveBeenCalled();
    expect(location.assign).not.toHaveBeenCalled();
  });

  it('applies expired-session recovery when a protected request receives 401', async () => {
    window.localStorage.setItem('parent_token', 'expired-test-token');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{"error":"Unauthorized"}', {
      status: 401,
      headers: { 'content-type': 'application/json' },
    })));

    await expect(api.get('/parents/me/dashboard')).rejects.toMatchObject({ status: 401 });
    expect(window.localStorage.getItem('parent_token')).toBeNull();
  });

  it('applies expired-session recovery to protected file downloads too', async () => {
    window.localStorage.setItem('parent_token', 'expired-test-token');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 401 })));

    await expect(api.download('/course-materials/12/download')).rejects.toMatchObject({ status: 401 });
    expect(window.localStorage.getItem('parent_token')).toBeNull();
  });
});