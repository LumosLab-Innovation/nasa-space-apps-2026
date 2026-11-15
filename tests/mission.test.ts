import { describe, expect, it } from 'vitest';
import type { EphemSample, Ephemeris } from '../src/data/ephemeris';
import { planMission } from '../src/data/mission';

const H = 3600_000;
const DAY = 24 * H;

/** Synthetic year: the Sun wobbles around 1° with a 30-day period; Earth is up 14 days, down 14 days. */
function synthetic(): Ephemeris {
  const sun: EphemSample[] = [];
  const earth: EphemSample[] = [];
  for (let h = 0; h < 120 * 24; h++) {
    const t = h * H;
    sun.push({ t, az: (h * 0.5) % 360, el: 1 + 0.9 * Math.sin((2 * Math.PI * t) / (30 * DAY)) });
    earth.push({ t, az: 0, el: 6 * Math.sin((2 * Math.PI * t) / (28 * DAY)) });
  }
  return { sun, earth, source: 'horizons' };
}

const at = (s: EphemSample[], t: number) => s.reduce((best, x) => (Math.abs(x.t - t) < Math.abs(best.t - t) ? x : best));

describe('planMission', () => {
  const e = synthetic();
  const m = planMission(e);

  it('planMission keeps Earth up for the whole window', () => {
    for (let t = m.start; t <= m.start + 72 * H; t += H) {
      expect(at(e.earth, t).el).toBeGreaterThan(1);
      expect(at(e.sun, t).el).toBeGreaterThan(0);
    }
  });

  it('planMission prefers the highest Sun', () => {
    let bestMin = -Infinity;
    for (let i = 0; i + 72 < e.sun.length; i++) {
      let ok = true;
      let mn = Infinity;
      for (let j = i; j <= i + 72; j++) {
        if (e.earth[j].el <= 1 || e.sun[j].el <= 0) { ok = false; break; }
        mn = Math.min(mn, e.sun[j].el);
      }
      if (ok) bestMin = Math.max(bestMin, mn);
    }
    expect(m.minSunElDeg).toBeCloseTo(bestMin, 6);
  });

  it('milestones are ordered', () => {
    expect(m.start).toBeLessThan(m.earthSet);
    expect(m.start).toBeLessThan(m.sunSet);
    expect(m.sunSet).toBeLessThanOrEqual(m.dawn);
  });

  it('fallback ephemeris gives zeros', () => {
    const f = planMission({ sun: [{ t: 0, az: 0, el: 1.5 }], earth: [{ t: 0, az: 0, el: 3 }], source: 'fallback' });
    expect(f.start).toBe(0);
    expect(f.earthSet).toBe(0);
  });
});
