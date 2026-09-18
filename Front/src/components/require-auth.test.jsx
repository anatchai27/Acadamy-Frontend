import { describe, expect, it } from 'vitest';
import { hasAllowedRole, normalizeRole } from './require-auth';

describe('admin role guard', () => {
  it('normalizes role values from the API', () => {
    expect(normalizeRole(' Teacher ')).toBe('teacher');
    expect(normalizeRole(null)).toBe('');
  });

  it('denies roles that are not explicitly allowed', () => {
    expect(hasAllowedRole('staff', ['admin', 'teacher'])).toBe(false);
    expect(hasAllowedRole('STAFF', ['admin', 'staff'])).toBe(true);
    expect(hasAllowedRole('', ['admin'])).toBe(false);
  });
});
