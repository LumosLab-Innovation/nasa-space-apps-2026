import { describe, expect, it } from 'vitest';
import { ARM_POSES, blendPose, lookAngles, steerAngles, wheelSpin } from '../src/pip/pipRig';
import { blinkAmount } from '../src/pip/faceArt';

describe('Pip rig', () => {
  it('a wheel turns one radian per radius travelled', () => {
    expect(wheelSpin(0.4)).toBeCloseTo(2, 6);
  });

  it('four-wheel steering counter-steers the rear and clamps', () => {
    const s = steerAngles(1.5, 1.6);
    expect(Math.sign(s.rear)).toBe(-Math.sign(s.front));
    expect(Math.abs(s.front)).toBeLessThanOrEqual(0.6);
  });

  it('turning on the spot uses the X stance', () => {
    expect(Math.abs(steerAngles(1, 0).front)).toBeCloseTo(0.785, 3);
  });

  it('driving straight keeps the wheels straight', () => {
    expect(steerAngles(0, 1.6)).toEqual({ front: 0, rear: 0 });
  });

  it('head looks at a target behind-left and clamps tilt', () => {
    const a = lookAngles({ x: 0, y: 1.4, z: 0 }, { x: -1, y: 1.4, z: -1 }, 0);
    expect(a.pan).toBeLessThan(0);
    expect(Math.abs(a.pan)).toBeLessThanOrEqual(2.6);
    expect(lookAngles({ x: 0, y: 1.4, z: 0 }, { x: 0, y: -50, z: 1 }, 0).tilt).toBe(-0.6);
  });

  it('blendPose halfway is the joint-wise mean', () => {
    const m = blendPose(ARM_POSES.stowed, ARM_POSES.lift, 0.5);
    expect(m.shoulder).toBeCloseTo((ARM_POSES.stowed.shoulder + ARM_POSES.lift.shoulder) / 2, 6);
  });
});

describe('Pip face animation', () => {
  it('blinks briefly and is open most of the time', () => {
    let closed = 0;
    for (let t = 0; t < 20; t += 0.01) if (blinkAmount(t, 3) > 0.5) closed++;
    expect(closed).toBeGreaterThan(0);
    expect(closed / 2000).toBeLessThan(0.05);
  });
});
