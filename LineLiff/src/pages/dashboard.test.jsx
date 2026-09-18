import { describe, expect, it } from 'vitest';
import { getDashboardSchedule, getTodaySchedule, resolveActiveChildId } from './dashboard';

describe('LIFF dashboard data rules', () => {
  it('returns no schedule when the API has no real schedule', () => {
    expect(getDashboardSchedule({})).toEqual([]);
    expect(getDashboardSchedule({ todaySchedule: null })).toEqual([]);
    expect(getDashboardSchedule({ todaySchedule: [] })).toEqual([]);
  });

  it('keeps only an active child returned by the parent API', () => {
    const children = [{ id: 10 }, { id: 20 }];

    expect(resolveActiveChildId(children, 20)).toBe(20);
    expect(resolveActiveChildId(children, 999)).toBe(10);
    expect(resolveActiveChildId([], 20)).toBeNull();
  });

  it('maps only today\'s sessions from the child sessions API', () => {
    const now = new Date('2026-09-18T10:00:00');
    const schedule = getTodaySchedule([
      { courseName: 'Math', scheduledAt: '2026-09-18T11:00:00', durationMin: 90, status: 'scheduled', roomId: 'A1' },
      { courseName: 'Past class', scheduledAt: '2026-09-17T11:00:00', durationMin: 60, status: 'completed' },
    ], now);

    expect(schedule).toHaveLength(1);
    expect(schedule[0]).toMatchObject({ title: 'Math', endTime: '12:30', subtitle: 'ห้อง A1' });
  });
});
