import { describe, expect, it } from 'vitest';
import { sampleAt } from '../src/data/ephemeris';
import { planMission } from '../src/data/mission';
import { earthVisible, isSunlit, sunlitFraction } from '../src/world/lighting';
import { maxSlopeDeg, segmentMaxSlopeDeg } from '../src/world/terrainQuery';
import { BOULDER, CRATES, ICE_SPOT, MICA_POS, RELAY_SPOT, ZONES, zone } from '../src/world/zones';
import { realEphemeris, realHeightmap } from './helpers/realWorld';

/** Every stop must sit where the REAL light (LOLA terrain × JPL Sun/Earth) supports its challenge (plan 3, Task 3). */
const hm = realHeightmap();
const eph = realEphemeris();
const mission = planMission(eph);
const W0 = mission.start;
const W1 = mission.start + 72 * 3600_000;
const frac = (p: { x: number; z: number }) => sunlitFraction(hm, p.x, p.z, eph.sun, W0, W1, 3);

describe('journey layout on real light', () => {
  it('all stops are inside the world and within 650 m of camp', () => {
    const base = zone('base');
    for (const z of ZONES) {
      expect(Math.abs(z.x) <= 740 && Math.abs(z.z) <= 740, z.id).toBe(true);
      expect(Math.hypot(z.x - base.x, z.z - base.z), z.id).toBeLessThanOrEqual(650);
    }
  });

  it('landing is flat and mostly sunlit', () => {
    const l = zone('landing');
    expect(maxSlopeDeg(hm, l.x, l.z, 15)).toBeLessThan(5);
    expect(frac(l)).toBeGreaterThanOrEqual(0.8);
  });

  it('camp is flat, sunlit and 120–350 m from the landing', () => {
    const b = zone('base');
    const l = zone('landing');
    expect(maxSlopeDeg(hm, b.x, b.z, 20)).toBeLessThan(6);
    expect(frac(b)).toBeGreaterThanOrEqual(0.7);
    const d = Math.hypot(b.x - l.x, b.z - l.z);
    expect(d).toBeGreaterThanOrEqual(120);
    expect(d).toBeLessThanOrEqual(350);
  });

  it('Sunny Hill site is almost always lit and its crate sits below a steep climb', () => {
    const c = CRATES.find((k) => k.moduleId === 'solarTower')!;
    expect(frac(c.site)).toBeGreaterThanOrEqual(0.9);
    const s = segmentMaxSlopeDeg(hm, c, c.site);
    expect(s).toBeGreaterThanOrEqual(18);
    expect(s).toBeLessThanOrEqual(30);
  });

  it('boulder field has a slope of at least 15° for the rolling-boulder trail', () => {
    expect(segmentMaxSlopeDeg(hm, BOULDER.top, BOULDER.bottom)).toBeGreaterThanOrEqual(15);
    const bf = zone('boulderField');
    expect(Math.hypot(BOULDER.bottom.x - bf.x, BOULDER.bottom.z - bf.z)).toBeLessThanOrEqual(30);
  });

  it('fresh crater gets sun at least half the time (hot rocks)', () => {
    expect(frac(zone('freshCrater'))).toBeGreaterThanOrEqual(0.5);
  });

  it('Earth View Peak sees Earth for the whole window', () => {
    for (let t = W0; t <= W1; t += 3 * 3600_000) {
      expect(earthVisible(hm, RELAY_SPOT.x, RELAY_SPOT.z, sampleAt(eph.earth, t)), new Date(t).toISOString()).toBe(true);
    }
  });

  it('MICA sits half in light, half in shadow', () => {
    const f = frac(MICA_POS);
    expect(f).toBeGreaterThanOrEqual(0.15);
    expect(f).toBeLessThanOrEqual(0.65);
  });

  it('the ice spot in the Dark Crater never sees the Sun all year', () => {
    for (const s of eph.sun.filter((_, i) => i % 6 === 0)) {
      if (s.el <= 0) continue;
      expect(isSunlit(hm, ICE_SPOT.x, ICE_SPOT.z, s), new Date(s.t).toISOString()).toBe(false);
    }
    const d = zone('darkCrater');
    expect(Math.hypot(ICE_SPOT.x - d.x, ICE_SPOT.z - d.z)).toBeLessThanOrEqual(d.radius);
  });
});
