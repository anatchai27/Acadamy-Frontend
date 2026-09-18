import { describe, expect, it } from 'vitest';
import { getStudentEmptyMessage } from '../students-page';

describe('student list states', () => {
  it('gives a retry-oriented message when the API fails', () => {
    expect(getStudentEmptyMessage('โหลดไม่ได้', '')).toEqual({ title: 'โหลดไม่ได้', description: 'ตรวจการเชื่อมต่อ API แล้วลองใหม่' });
  });

  it('distinguishes search empty state from an empty institute', () => {
    expect(getStudentEmptyMessage('', 'somchai').description).toBe('ลองเปลี่ยนคำค้นหา');
    expect(getStudentEmptyMessage('', '').description).toBe('ยังไม่มีนักเรียนในสถาบัน');
  });
});
