import { describe, expect, it } from 'vitest';
import { buildRadarPoints, getScoreValue } from './scores';

describe('LIFF skill score presentation', () => {
  it('clamps scores to the API display range', () => {
    expect(getScoreValue(-1)).toBe(0);
    expect(getScoreValue(3)).toBe(3);
    expect(getScoreValue(9)).toBe(5);
  });

  it('builds a radar polygon from real topic scores', () => {
    expect(buildRadarPoints([{ score: 5 }, { score: 0 }])).toBe('120,42 120,120');
  });
});
