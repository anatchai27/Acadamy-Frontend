import { describe, expect, it } from 'vitest';
import { hasAllowedRole, normalizeRole } from './require-auth';
import { canReadPage, getPagePermission, setRolePermissions } from '../config/permissions';

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

  it('uses the permission policy loaded for the role', () => {
    setRolePermissions('admin', {
      '/admin/dashboard': { read: true, edit: true, delete: true },
      '/admin/users': { read: false, edit: false, delete: false },
    });
    expect(canReadPage('admin', '/admin/dashboard')).toBe(true);
    expect(getPagePermission('ADMIN', '/admin/users').read).toBe(false);
  });
});
