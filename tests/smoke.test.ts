import { describe, expect, it } from 'vitest';
import { EARTH_G, LUNAR_G } from '../src/config/constants';

describe('constants', () => {
  it('uses lunar gravity 1.62 m/s^2', () => {
    expect(LUNAR_G).toBe(1.62);
  });
  it('lunar gravity is about 1/6 of Earth', () => {
    expect(LUNAR_G / EARTH_G).toBeCloseTo(0.165, 3);
  });
});
