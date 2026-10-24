import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api, setOnUnauthorized } from '../api';

const jsonResponse = (status, data) => ({
  ok: status >= 200 && status < 300,
  status,
  headers: { get: () => 'application/json' },
  json: async () => data,
});

describe('API access-token refresh', () => {
  beforeEach(() => {
    localStorage.clear();
    setOnUnauthorized(vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('refreshes an expired access token and retries the original request once', async () => {
    localStorage.setItem('auth_token', 'expired-access-token');
    const unauthorizedHandler = vi.fn();
    setOnUnauthorized(unauthorizedHandler);
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse(401, null))
      .mockResolvedValueOnce(jsonResponse(200, { token: 'refreshed-access-token' }))
      .mockResolvedValueOnce(jsonResponse(200, { data: ['student'] }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await api.get('/students', { params: { page: 1, limit: 200 } });

    expect(result.data).toEqual({ data: ['student'] });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1][0]).toContain('/api/auth/refresh-token');
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ token: 'expired-access-token' });
    expect(fetchMock.mock.calls[2][1].headers.Authorization).toBe('Bearer refreshed-access-token');
    expect(localStorage.getItem('auth_token')).toBe('refreshed-access-token');
    expect(unauthorizedHandler).not.toHaveBeenCalled();
  });

  it('keeps unauthorized handling when token refresh fails', async () => {
    localStorage.setItem('auth_token', 'invalid-access-token');
    const unauthorizedHandler = vi.fn();
    setOnUnauthorized(unauthorizedHandler);
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse(401, null))
      .mockResolvedValueOnce(jsonResponse(401, null));
    vi.stubGlobal('fetch', fetchMock);

    await expect(api.get('/students')).rejects.toMatchObject({ status: 401 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(unauthorizedHandler).toHaveBeenCalledOnce();
  });
});
