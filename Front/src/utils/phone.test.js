import { describe, expect, it } from 'vitest';
import { formatPhoneNumber } from './phone';

describe('formatPhoneNumber', () => {
  it('formats a 10-digit phone number for display', () => {
    expect(formatPhoneNumber('0812345678')).toBe('081-234-5678');
  });

  it('formats an already separated 10-digit phone number consistently', () => {
    expect(formatPhoneNumber('081-234-5678')).toBe('081-234-5678');
  });

  it('preserves values that are not 10-digit phone numbers', () => {
    expect(formatPhoneNumber('02-123-4567')).toBe('02-123-4567');
    expect(formatPhoneNumber('unknown')).toBe('unknown');
  });
});
