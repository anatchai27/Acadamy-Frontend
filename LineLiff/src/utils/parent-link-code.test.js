import { describe, expect, it } from 'vitest';
import { normalizeParentLinkCode, validateParentLinkCode } from './parent-link-code';

describe('parent LINE link-code validation', () => {
  it('normalizes pasted codes with spaces, separators, and lowercase letters', () => {
    const code = normalizeParentLinkCode('abcd-2345 efgh');

    expect(code).toBe('ABCD2345EFGH');
    expect(validateParentLinkCode(code)).toBe('');
  });

  it('rejects codes that are not 12 characters long', () => {
    expect(validateParentLinkCode('ABC234')).toContain('12 ตัวอักษร');
  });

  it.each(['I', 'O', '0', '1'])('rejects API-excluded character %s', character => {
    expect(validateParentLinkCode(`ABCD2345EFG${character}`)).toContain('ไม่ใช้ I, O, 0 หรือ 1');
  });

  it('accepts L because the API allows it', () => {
    expect(validateParentLinkCode('ABCD2345EFGL')).toBe('');
  });
});
