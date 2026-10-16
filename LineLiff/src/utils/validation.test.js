import { describe, expect, it } from 'vitest';
import {
  apiErrorMessage,
  validateHomeworkFile,
  validateLeaveAttachment,
  validatePaymentSlip,
} from './validation';

const file = (type, size) => ({ type, size });

describe('LIFF upload validation', () => {
  it('accepts an image within the homework size limit', () => {
    expect(validateHomeworkFile(file('image/jpeg', 1024))).toBe('');
  });

  it('rejects non-image homework files and oversized images', () => {
    expect(validateHomeworkFile(file('application/pdf', 1024))).toContain('รูปภาพเท่านั้น');
    expect(validateHomeworkFile(file('image/jpeg', 10 * 1024 * 1024 + 1))).toContain('ไม่เกิน 10MB');
  });

  it('accepts supported leave evidence and rejects unsupported files', () => {
    expect(validateLeaveAttachment(file('application/pdf', 1024))).toBe('');
    expect(validateLeaveAttachment(file('text/plain', 1024))).toContain('PDF, JPG, PNG หรือ WEBP');
    expect(validateLeaveAttachment(file('image/png', 5 * 1024 * 1024 + 1))).toContain('ไม่เกิน 5MB');
  });

  it('accepts image slips and rejects unsupported or oversized files', () => {
    expect(validatePaymentSlip(file('image/jpeg', 1024))).toBe('');
    expect(validatePaymentSlip(file('application/pdf', 1024))).toContain('รูปภาพ');
    expect(validatePaymentSlip(file('image/png', 10 * 1024 * 1024 + 1))).toContain('ไม่เกิน 10MB');
  });
});

describe('LIFF API error mapping', () => {
  it('maps forbidden and conflict responses to user-facing messages', () => {
    expect(apiErrorMessage({ status: 403 }, 'fallback')).toContain('ไม่มีสิทธิ์');
    expect(apiErrorMessage({ status: 409, message: 'slot changed' }, 'fallback')).toBe('slot changed');
    expect(apiErrorMessage({ message: 'network failed' }, 'fallback')).toBe('network failed');
  });
});
