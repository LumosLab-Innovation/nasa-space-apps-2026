import { describe, expect, it } from 'vitest';
import { sampleAt } from '../src/data/ephemeris';
import { planMission } from '../src/data/mission';
import { findCampNight } from '../src/data/night';
import { earthVisible } from '../src/world/lighting';
import { zone } from '../src/world/zones';
import { realEphemeris, realHeightmap } from './helpers/realWorld';

const H = 3600_000;
const e = realEphemeris();
const hm = realHeightmap();
const base = zone('base');
const night = findCampNight(e, hm, base, planMission(e).start + 7 * 24 * H);

describe('the real camp night (Act 5, user decision 07/11/2026)', () => {
  it('the first long camp night after the mission start is 29 Nov – 3 Dec 2028', () => {
    const n = night!;
    expect(n).not.toBeNull();
    expect(n.sunsetMs).toBeGreaterThanOrEqual(Date.parse('2028-11-29T18:00Z'));
    expect(n.sunsetMs).toBeLessThanOrEqual(Date.parse('2028-11-29T21:00Z'));
    expect(n.dawnMs).toBeGreaterThanOrEqual(Date.parse('2028-12-03T09:00Z'));
    expect(n.dawnMs).toBeLessThanOrEqual(Date.parse('2028-12-03T12:00Z'));
    expect(n.dawnAzDeg).toBeGreaterThan(113);
    expect(n.dawnAzDeg).toBeLessThan(119);
    expect(n.hours).toBeGreaterThan(80);
    expect(n.hours).toBeLessThan(92);
  });

  it('Earth stays in view at camp through the whole night and sets less than a day after dawn', () => {
    const n = night!;
    for (const t of [n.sunsetMs, (n.sunsetMs + n.dawnMs) / 2, n.dawnMs]) {
      expect(earthVisible(hm, base.x, base.z, sampleAt(e.earth, t))).toBe(true);
    }
    const gap = n.earthSetMs - n.dawnMs;
    expect(gap).toBeGreaterThan(12 * H);
    expect(gap).toBeLessThan(24 * H);
  });

  it('returns null when no night that long exists in the data', () => {
    expect(findCampNight(e, hm, base, planMission(e).start, 5000)).toBeNull();
  });
});
