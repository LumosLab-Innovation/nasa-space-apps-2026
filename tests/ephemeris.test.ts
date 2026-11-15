import { describe, expect, it } from 'vitest';
import { findMissionStart, loadEphemeris, sampleAt, type EphemSample } from '../src/data/ephemeris';

const H = 3600_000;

describe('sampleAt', () => {
  it('interpolates azimuth the short way across north (350 -> 10)', () => {
    const s: EphemSample[] = [{ t: 0, az: 350, el: 1 }, { t: H, az: 10, el: 2 }];
    const r = sampleAt(s, H / 2);
    expect(Math.min(r.az, 360 - r.az)).toBeCloseTo(0, 6);
    expect(r.el).toBeCloseTo(1.5, 6);
  });
  it('clamps to the first sample before the data starts', () => {
    const s: EphemSample[] = [{ t: H, az: 20, el: 1 }, { t: 2 * H, az: 30, el: 2 }];
    expect(sampleAt(s, 0)).toEqual({ az: 20, el: 1 });
  });
});

describe('loadEphemeris', () => {
  it('falls back to a fixed low sun when data cannot be loaded', async () => {
    const e = await loadEphemeris(async () => { throw new Error('offline'); });
    expect(e.source).toBe('fallback');
    expect(sampleAt(e.sun, 123456789).el).toBe(1.5);
  });
});

describe('findMissionStart', () => {
  it('returns the first hour with sun up and Earth up for the required time', () => {
    const sun: EphemSample[] = [];
    const earth: EphemSample[] = [];
    for (let h = 0; h < 200; h++) {
      sun.push({ t: h * H, az: h, el: 1 });
      earth.push({ t: h * H, az: 0, el: h < 10 ? -1 : 3 });
    }
    expect(findMissionStart({ sun, earth, source: 'horizons' })).toBe(10 * H);
  });
});
