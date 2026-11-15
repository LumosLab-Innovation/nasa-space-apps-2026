import { describe, expect, it } from 'vitest';
import { LandingDetector } from '../src/player/landing';

describe('LandingDetector', () => {
  it('reports the last airborne fall speed on touchdown, even if the controller already zeroed velocity', () => {
    const d = new LandingDetector();
    expect(d.update(true, 0)).toBeNull();
    expect(d.update(false, 1.2)).toBeNull();
    expect(d.update(false, -0.4)).toBeNull();
    expect(d.update(false, -1.55)).toBeNull();
    expect(d.update(true, 0)).toBeCloseTo(1.55, 6);
  });

  it('does not fire while staying on the ground', () => {
    const d = new LandingDetector();
    expect(d.update(true, 0)).toBeNull();
    expect(d.update(true, -0.1)).toBeNull();
  });

  it('a touchdown while still rising reports zero impact', () => {
    const d = new LandingDetector();
    d.update(true, 0);
    d.update(false, 0.5);
    expect(d.update(true, 0)).toBe(0);
  });
});
