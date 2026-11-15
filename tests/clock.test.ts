import { describe, expect, it } from 'vitest';
import { GameClock } from '../src/core/clock';
import { azElToDirection } from '../src/world/skyMath';

describe('azElToDirection (+z north, +x east, +y up)', () => {
  const close = (v: { x: number; y: number; z: number }, x: number, y: number, z: number) => {
    expect(v.x).toBeCloseTo(x, 9);
    expect(v.y).toBeCloseTo(y, 9);
    expect(v.z).toBeCloseTo(z, 9);
  };
  it('az 0 el 0 points north', () => close(azElToDirection(0, 0), 0, 0, 1));
  it('az 90 el 0 points east', () => close(azElToDirection(90, 0), 1, 0, 0));
  it('el 90 points straight up', () => close(azElToDirection(0, 90), 0, 1, 0));
});

describe('GameClock', () => {
  it('runs 60x faster than real time by default', () => {
    const c = new GameClock(0);
    c.tick(1);
    expect(c.nowMs).toBe(60000);
  });
  it('can skip ahead by hours', () => {
    const c = new GameClock(0);
    c.skipHours(2);
    expect(c.nowMs).toBe(7.2e6);
  });
  it('jumpTo only moves forward', () => {
    const c = new GameClock(1000);
    c.jumpTo(5000);
    expect(c.nowMs).toBe(5000);
    c.jumpTo(2000);
    expect(c.nowMs).toBe(5000);
  });
  it('fastForwardTo lands exactly on the target after overRealS and then runs at the normal scale', () => {
    const c = new GameClock(0, 20);
    const target = 6 * 3600_000;
    c.fastForwardTo(target, 1);
    expect(c.fastForwarding).toBe(true);
    for (let i = 0; i < 10; i++) c.tick(0.1);
    expect(c.nowMs).toBeCloseTo(target, 3);
    expect(c.fastForwarding).toBe(false);
    c.tick(1);
    expect(c.nowMs).toBeCloseTo(target + 20_000, 3);
  });
});
