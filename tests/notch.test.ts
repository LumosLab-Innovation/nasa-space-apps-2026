import { describe, expect, it } from 'vitest';
import { planMission } from '../src/data/mission';
import { findCampNight } from '../src/data/night';
import { horizonProfile, notchCandidates, parkYawForSunAz, sunPath } from '../src/story/sunriseNotch';
import { panelFactor } from '../src/survival/resources';
import { zone } from '../src/world/zones';
import { realEphemeris, realHeightmap } from './helpers/realWorld';

const e = realEphemeris();
const hm = realHeightmap();
const base = zone('base');
const night = findCampNight(e, hm, base, planMission(e).start + 7 * 24 * 3600_000)!;
const profile = horizonProfile(hm, base);
const c = notchCandidates(profile, night);

describe('sunrise notch puzzle on the real LOLA horizon (v2 scene 5.2)', () => {
  it('the correct notch is where the Sun really comes back (~116°)', () => {
    const az = c.azDeg[c.correct];
    expect(Math.abs(az - night.dawnAzDeg)).toBeLessThanOrEqual(2);
    expect(az).toBeGreaterThan(113);
    expect(az).toBeLessThan(119);
  });

  it('the candidates include the sunset point and the hilltop as tempting wrong answers', () => {
    expect(c.azDeg.some((a) => Math.abs(a - night.sunsetAzDeg) <= 3)).toBe(true);
    expect(c.azDeg.some((a) => a > 128 && a < 142)).toBe(true);
  });

  it('four distinct candidates at least 8° apart, in the order the Sun passes them', () => {
    expect(c.azDeg).toHaveLength(4);
    for (let i = 1; i < 4; i++) expect(c.azDeg[i - 1] - c.azDeg[i]).toBeGreaterThanOrEqual(8);
  });

  it('the Sun path covers the night with hidden points in between', () => {
    const path = sunPath(e, night);
    expect(path[0].t).toBeLessThanOrEqual(night.sunsetMs - 12 * 3600_000 + 1);
    expect(path[path.length - 1].t).toBeGreaterThanOrEqual(night.dawnMs + 6 * 3600_000);
    expect(path.length).toBeGreaterThan(15);
  });

  it('parking yaw points a side panel straight at the notch', () => {
    for (const az of [0, 116, 250]) expect(panelFactor(parkYawForSunAz(az), az)).toBeGreaterThan(0.999);
  });
});
