import { describe, expect, it } from 'vitest';
import { sampleAt } from '../src/data/ephemeris';
import { planMission } from '../src/data/mission';
import { findCampNight } from '../src/data/night';
import { azElToDirection, earthPhase } from '../src/world/skyMath';
import { zone } from '../src/world/zones';
import { realEphemeris, realHeightmap } from './helpers/realWorld';

describe('night sky (Plan 4)', () => {
  it('earthPhase is full when Earth is opposite the Sun and new when they line up', () => {
    const sun = azElToDirection(0, 0);
    expect(earthPhase(sun, azElToDirection(180, 0))).toBeCloseTo(1, 6);
    expect(earthPhase(sun, azElToDirection(0, 0))).toBeCloseTo(0, 6);
    expect(earthPhase(sun, azElToDirection(90, 0))).toBeCloseTo(0.5, 6);
  });

  it('Earth is a thin crescent during the real camp night', () => {
    const e = realEphemeris();
    const n = findCampNight(e, realHeightmap(), zone('base'), planMission(e).start + 7 * 24 * 3600_000)!;
    for (const t of [n.sunsetMs, (n.sunsetMs + n.dawnMs) / 2]) {
      const s = sampleAt(e.sun, t);
      const m = sampleAt(e.earth, t);
      expect(earthPhase(azElToDirection(s.az, s.el), azElToDirection(m.az, m.el))).toBeLessThan(0.15);
    }
  });
});
