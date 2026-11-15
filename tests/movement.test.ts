import { describe, expect, it } from 'vitest';
import { LUNAR_G } from '../src/config/constants';
import { clampToWorld, computeMoveVelocity, JUMP_SPEED_MS } from '../src/player/movement';

describe('computeMoveVelocity', () => {
  it('forward with camera yaw 0 moves north (+z) at 1.8 m/s', () => {
    const v = computeMoveVelocity({ forward: 1, right: 0, jump: false }, 0);
    expect(v.x).toBeCloseTo(0, 9);
    expect(v.z).toBeCloseTo(1.8, 9);
  });
  it('forward with camera yaw 90 deg moves east (+x)', () => {
    const v = computeMoveVelocity({ forward: 1, right: 0, jump: false }, Math.PI / 2);
    expect(v.x).toBeCloseTo(1.8, 9);
    expect(v.z).toBeCloseTo(0, 9);
  });
  it('diagonal input is normalised to the same speed', () => {
    const v = computeMoveVelocity({ forward: 1, right: 1, jump: false }, 0);
    expect(Math.hypot(v.x, v.z)).toBeCloseTo(1.8, 9);
  });
});

describe('clampToWorld', () => {
  it('keeps the player 10 m inside the 1500 m world edge', () => {
    expect(clampToWorld(800, 0)).toEqual({ x: 740, z: 0 });
  });
  it('leaves positions inside the world unchanged', () => {
    expect(clampToWorld(0, 0)).toEqual({ x: 0, z: 0 });
  });
});

describe('jump', () => {
  it('reaches about 0.79 m on the Moon', () => {
    expect(JUMP_SPEED_MS ** 2 / (2 * LUNAR_G)).toBeCloseTo(0.79, 2);
  });
});

describe('lunar lope (Shift)', () => {
  it('moves at 2.8 m/s', async () => {
    const { LOPE_SPEED_MS } = await import('../src/player/movement');
    const v = computeMoveVelocity({ forward: 1, right: 0, jump: false, lope: true }, 0, LOPE_SPEED_MS);
    expect(v.z).toBeCloseTo(2.8, 9);
  });
});

describe('fall-through rescue', () => {
  it('flags a player more than 3 m below the ground surface', async () => {
    const { isBelowGround } = await import('../src/player/movement');
    expect(isBelowGround(-669, 61)).toBe(true);
    expect(isBelowGround(60.5, 61)).toBe(false);
    expect(isBelowGround(62, 61)).toBe(false);
  });
});
