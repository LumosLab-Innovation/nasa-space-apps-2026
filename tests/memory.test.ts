import { describe, expect, it } from 'vitest';
import { SUN_AZ_RATE_DEG_PER_DAY, checkOrder, memoryPhotos } from '../src/mica/memoryPuzzle';
import { sampleAt } from '../src/data/ephemeris';
import { realEphemeris } from './helpers/realWorld';

const wrap = (d: number) => ((((d + 180) % 360) + 360) % 360) - 180;

describe("MICA's memory: ordering photos by shadow direction (v2 scene 4.5)", () => {
  it("the Sun's azimuth decreases about 12.2° per day at the site", () => {
    const e = realEphemeris();
    const t0 = e.sun[0].t;
    const t1 = e.sun[e.sun.length - 1].t - 24 * 3600_000;
    let sum = 0;
    let n = 0;
    for (let t = t0; t <= t1; t += 24 * 3600_000) {
      sum += wrap(sampleAt(e.sun, t + 24 * 3600_000).az - sampleAt(e.sun, t).az);
      n++;
    }
    const mean = sum / n;
    expect(mean).toBeGreaterThan(-12.6);
    expect(mean).toBeLessThan(-11.8);
    expect(SUN_AZ_RATE_DEG_PER_DAY).toBeCloseTo(-12.19, 2);
  });

  it('photos are 24.4° apart and the shuffled order solves the puzzle', () => {
    const { photos, order } = memoryPhotos(7);
    expect(photos).toHaveLength(5);
    const byDay = [...photos].sort((a, b) => a.day - b.day);
    expect(byDay.map((p) => p.day)).toEqual([663, 665, 667, 669, 671]);
    for (let i = 1; i < 5; i++) expect(Math.abs(wrap(byDay[i].shadowAzDeg - byDay[i - 1].shadowAzDeg))).toBeCloseTo(24.38, 1);
    // order lists display indices in chronological order
    expect(order.map((i) => photos[i].day)).toEqual([663, 665, 667, 669, 671]);
    // the display is actually shuffled
    expect(photos.map((p) => p.day)).not.toEqual([663, 665, 667, 669, 671]);
    expect(checkOrder(order, order)).toBe('ok');
  });

  it('checkOrder reports partial progress and wrong picks', () => {
    const order = [3, 0, 4, 1, 2];
    expect(checkOrder([3, 0], order)).toBe('partial');
    expect(checkOrder([3, 1], order)).toBe('wrong');
    expect(checkOrder([], order)).toBe('partial');
  });
});
