import { describe, expect, it } from 'vitest';
import { getTodaySessions } from './dashboard-operations';

describe('today schedule selection', () => {
  it('keeps only local-day sessions and sorts them by start time', () => {
    const today = new Date(2026, 10, 7, 9, 0, 0);
    const sessions = [
      { id: 2, scheduledAt: new Date(2026, 10, 7, 14, 30).toISOString() },
      { id: 3, scheduledAt: new Date(2026, 10, 8, 8, 0).toISOString() },
      { id: 1, scheduledAt: new Date(2026, 10, 7, 10, 0).toISOString() },
      { id: 4, scheduledAt: 'not-a-date' },
    ];

    expect(getTodaySessions(sessions, today).map(session => session.id)).toEqual([1, 2]);
  });

  it('returns an empty list when no sessions are scheduled for that day', () => {
    expect(getTodaySessions([], new Date(2026, 10, 7))).toEqual([]);
  });
});
