import { describe, expect, it, vi } from 'vitest';
import { resetParentAuthForRollout } from './parent-auth-reset';

const createStorage = () => {
  const values = new Map([['parent_token', 'old-token']]);
  return {
    getItem: key => values.get(key) ?? null,
    removeItem: key => values.delete(key),
    setItem: (key, value) => values.set(key, value),
    values,
  };
};

describe('LIFF parent auth reset rollout', () => {
  it('clears stored parent auth and asks LINE to sign in again once', () => {
    const storage = createStorage();
    const liff = { isLoggedIn: vi.fn(() => true), logout: vi.fn(), login: vi.fn() };

    expect(resetParentAuthForRollout({ enabled: true, storage, liff })).toBe(true);
    expect(storage.getItem('parent_token')).toBeNull();
    expect(liff.logout).toHaveBeenCalledOnce();
    expect(liff.login).toHaveBeenCalledOnce();
  });

  it('does not repeatedly log a user out while the rollout flag stays enabled', () => {
    const storage = createStorage();
    const liff = { isLoggedIn: vi.fn(() => true), logout: vi.fn(), login: vi.fn() };

    resetParentAuthForRollout({ enabled: true, storage, liff });
    expect(resetParentAuthForRollout({ enabled: true, storage, liff })).toBe(false);
    expect(liff.logout).toHaveBeenCalledOnce();
    expect(liff.login).toHaveBeenCalledOnce();
  });

  it('clears the rollout marker when disabled so it can be used again later', () => {
    const storage = createStorage();
    const liff = { isLoggedIn: vi.fn(() => false), logout: vi.fn(), login: vi.fn() };

    resetParentAuthForRollout({ enabled: true, storage, liff });
    resetParentAuthForRollout({ enabled: false, storage, liff });
    expect(resetParentAuthForRollout({ enabled: true, storage, liff })).toBe(true);
    expect(liff.login).toHaveBeenCalledTimes(2);
  });
});
