import { describe, expect, it } from 'vitest';
import { rideRootY } from '../src/player/astronaut';

describe('rideRootY', () => {
  it('standing puts the capsule centre half a body height above the floor', () => {
    expect(rideRootY({ y: 10 }, true)).toBeCloseTo(10.95, 9);
  });
  it('seated drops the root 0.82 m below the seat surface', () => {
    expect(rideRootY({ y: 10 }, false)).toBeCloseTo(10 - 0.82 + 0.95, 9);
  });
});
