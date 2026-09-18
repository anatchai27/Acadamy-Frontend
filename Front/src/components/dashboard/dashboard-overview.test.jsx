import { describe, expect, it } from 'vitest';
import { countAttendanceStatuses, getRevenueTotal } from './dashboard-overview';

describe('dashboard daily metrics', () => {
  it('counts attendance statuses from the daily API', () => {
    expect(countAttendanceStatuses([{ status: 'present' }, { status: 'late' }, { status: 'absent' }, { status: 'leave' }])).toEqual({ present: 1, late: 1, absent: 1, leave: 1 });
  });

  it('totals revenue rows without inventing values', () => {
    expect(getRevenueTotal({ rows: [{ grossAmount: 120 }, { grossAmount: '80.50' }] })).toBe(200.5);
    expect(getRevenueTotal({ rows: [] })).toBe(0);
  });
});
