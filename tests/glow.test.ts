import { describe, expect, it } from 'vitest';
import { firstTime, glowVisible } from '../src/fx/horizonGlow';

const yes = { playerInSun: false, sunElDeg: 0.5, litNearby: true, thermal: false };

describe('horizon glow at the light–dark boundary (2G, plan 5 task 5)', () => {
  it('horizon glow only at the light–dark boundary', () => {
    expect(glowVisible(yes)).toBe(true);
    expect(glowVisible({ ...yes, playerInSun: true })).toBe(false);
    expect(glowVisible({ ...yes, sunElDeg: 2.5 })).toBe(false);
    expect(glowVisible({ ...yes, sunElDeg: -1.5 })).toBe(false);
    expect(glowVisible({ ...yes, litNearby: false })).toBe(false);
    expect(glowVisible({ ...yes, thermal: true })).toBe(false);
    expect(glowVisible({ ...yes, sunElDeg: -1 })).toBe(true);
    expect(glowVisible({ ...yes, sunElDeg: 2 })).toBe(true);
  });

  it('glow line plays once', () => {
    const seen = new Set<string>();
    expect(firstTime(seen, 'glow')).toBe(true);
    expect(firstTime(seen, 'glow')).toBe(false);
    expect(firstTime(seen, 'other')).toBe(true);
  });
});
