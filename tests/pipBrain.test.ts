import { describe, expect, it } from 'vitest';
import { PipBrain, RUN, WALK, type PipInput } from '../src/pip/brain';

const base = (pip: { x: number; z: number }, extra: Partial<PipInput> = {}): PipInput => ({
  pip, player: { x: 0, z: 0 }, playerYawRad: 0, dt: 0.016, mode: 'follow', ...extra,
});

describe('PipBrain follow', () => {
  it('stops when already close to the player', () => {
    expect(new PipBrain().update(base({ x: 0, z: -1.5 })).target).toBeNull();
  });
  it('walks to the spot behind-left of the player', () => {
    const out = new PipBrain().update(base({ x: 0, z: -6 }));
    expect(out.target!.x).toBeCloseTo(-1, 9);
    expect(out.target!.z).toBeCloseTo(-2.5, 9);
    expect(out.speedMs).toBe(WALK);
  });
  it('runs when far behind', () => {
    expect(new PipBrain().update(base({ x: 0, z: -12 })).speedMs).toBe(RUN);
  });
  it('waits in place when told to wait, however far the player is', () => {
    expect(new PipBrain().update(base({ x: 0, z: -60 }, { mode: 'wait' })).target).toBeNull();
  });
  it('goes to a commanded point', () => {
    const out = new PipBrain().update(base({ x: 0, z: 0 }, { mode: 'goto', gotoTarget: { x: 5, z: 7 } }));
    expect(out.target).toEqual({ x: 5, z: 7 });
  });
});

describe('PipBrain catch-up (stuck or left behind)', () => {
  it('teleports behind the player after 3 s more than 25 m away', () => {
    const brain = new PipBrain();
    const far = base({ x: 0, z: -30 }, { dt: 1 });
    expect(brain.update(far).teleportTo).toBeNull();
    expect(brain.update(far).teleportTo).toBeNull();
    const out = brain.update(far);
    expect(out.teleportTo!.x).toBeCloseTo(-1, 9);
    expect(out.teleportTo!.z).toBeCloseTo(-2.5, 9);
    expect(brain.farTimerS).toBe(0);
  });
  it('resets the timer once Pip gets close again', () => {
    const brain = new PipBrain();
    brain.update(base({ x: 0, z: -30 }, { dt: 2 }));
    brain.update(base({ x: 0, z: -5 }, { dt: 0.1 }));
    expect(brain.farTimerS).toBe(0);
  });
});
