import { describe, expect, it } from 'vitest';
import type { Heightmap } from '../src/data/heightmap';
import { earthVisible, horizonElevationDeg, isSunlit, SunlightCache, sunlitFraction } from '../src/world/lighting';

/** 600 m square, 2 m cells, flat at 0 with a 50 m wall for x in [100, 110]. */
function wallMap(): Heightmap {
  const size = 301;
  const worldSizeM = 600;
  const heights = new Float32Array(size * size);
  for (let r = 0; r < size; r++) {
    // Columns 200..205 are x = 100..110 m exactly (integer bounds avoid float drift at the edges).
    for (let c = 200; c <= 205; c++) heights[r * size + c] = 50;
  }
  return { size, worldSizeM, heights, source: 'procedural' };
}
const flatMap = (): Heightmap => ({ size: 101, worldSizeM: 600, heights: new Float32Array(101 * 101), source: 'procedural' });

describe('terrain lighting', () => {
  it('flat ground sees the Sun at any positive elevation', () => {
    expect(isSunlit(flatMap(), 0, 0, { az: 123, el: 0.2 })).toBe(true);
  });

  it('a wall to the east blocks a low eastern Sun', () => {
    expect(isSunlit(wallMap(), 0, 0, { az: 90, el: 2 })).toBe(false);
  });

  it('the same wall does not block a western Sun', () => {
    expect(isSunlit(wallMap(), 0, 0, { az: 270, el: 2 })).toBe(true);
  });

  it('horizon elevation matches atan(height/distance)', () => {
    const expected = (Math.atan(49 / 100) * 180) / Math.PI;
    expect(Math.abs(horizonElevationDeg(wallMap(), 0, 0, 90) - expected)).toBeLessThan(1);
  });

  it('earth visible when Earth is above the local horizon', () => {
    const hm = wallMap();
    expect(earthVisible(hm, 0, 0, { az: 90, el: 4 })).toBe(false);
    expect(earthVisible(hm, 0, 0, { az: 0, el: 4 })).toBe(true);
  });

  it('sunlit fraction counts lit samples over a time span', () => {
    const sun = [0, 1, 2, 3].map((h) => ({ t: h * 3600_000, az: h < 2 ? 90 : 270, el: 2 }));
    expect(sunlitFraction(wallMap(), 0, 0, sun, 0, 3 * 3600_000, 1)).toBeCloseTo(0.5, 6);
  });

  it('cache returns the same answer as the direct test and reuses cells', () => {
    const hm = wallMap();
    const cache = new SunlightCache(hm);
    const sun = { az: 90, el: 2 };
    for (let i = 0; i < 1000; i++) expect(cache.isSunlit(1 + (i % 3) * 0.5, 1, sun)).toBe(isSunlit(hm, 0, 0, sun));
    expect(cache.misses).toBe(1);
  });
});
