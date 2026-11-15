import { describe, expect, it } from 'vitest';
import { coatColor, DustCoat, MAX_COAT } from '../src/fx/dustCoat';

describe('DustCoat', () => {
  it('coat grows with distance and is capped below full', () => {
    const c = new DustCoat();
    c.addTravel(400);
    expect(c.level).toBeCloseTo(0.5, 5);
    c.addTravel(1e6);
    expect(c.level).toBe(MAX_COAT);
  });

  it('a hard landing adds more dust than a soft one', () => {
    const soft = new DustCoat();
    const hard = new DustCoat();
    soft.addBurst(0.5);
    hard.addBurst(3);
    expect(hard.level).toBeGreaterThan(soft.level);
  });

  it('cleaning never goes below zero', () => {
    const c = new DustCoat();
    c.addTravel(80);
    c.clean(5);
    expect(c.level).toBe(0);
  });

  it('coat colour moves from base toward regolith grey', () => {
    const w = { r: 0.95, g: 0.95, b: 0.93 };
    expect(coatColor(w, 0)).toEqual(w);
    expect(coatColor(w, 1).r).toBeCloseTo(0.42, 5);
  });
});
