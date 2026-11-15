import { describe, expect, it } from 'vitest';
import { Color3, NullEngine, PBRMaterial, Scene, Vector3 } from '@babylonjs/core';
import { burstCount, burstVelocities, MAX_BURST, stepGrain, timeToGround, type Grain } from '../src/fx/ballistic';
import { DustSystem } from '../src/fx/dustSystem';
import { generateCraterField, sampleHeight } from '../src/data/heightmap';

const flat = () => 0;

describe('ballistic dust kinematics (no air on the Moon)', () => {
  it('a grain thrown up at 2 m/s peaks at v²/2g and lands after 2v/g', () => {
    const g: Grain = { x: 0, y: 0, z: 0, vx: 1, vy: 2, vz: 0, alive: true };
    let peak = 0;
    let t = 0;
    while (g.alive && t < 10) {
      stepGrain(g, 1 / 120, flat);
      peak = Math.max(peak, g.y);
      t += 1 / 120;
    }
    expect(peak).toBeCloseTo(4 / (2 * 1.62), 2);
    expect(t).toBeCloseTo((2 * 2) / 1.62, 1);
  });

  it('no air drag: horizontal speed never changes in flight', () => {
    const g: Grain = { x: 0, y: 0.5, z: 0, vx: 1.3, vy: 0.8, vz: -0.4, alive: true };
    for (let i = 0; i < 50; i++) stepGrain(g, 0.01, flat);
    expect(g.vx).toBe(1.3);
    expect(g.vz).toBe(-0.4);
  });

  it('a grain dies only when it reaches the ground, and rests on it', () => {
    const g: Grain = { x: 0, y: 1, z: 0, vx: 0, vy: 0, vz: 0, alive: true };
    stepGrain(g, 0.5, () => 0.2);
    expect(g.alive).toBe(true);
    for (let i = 0; i < 100 && g.alive; i++) stepGrain(g, 0.05, () => 0.2);
    expect(g.alive).toBe(false);
    expect(g.y).toBe(0.2);
  });

  it('timeToGround matches the kinematics', () => {
    expect(timeToGround(0, 1.5)).toBeCloseTo(Math.sqrt((2 * 1.5) / 1.62), 6);
  });

  it('burst count grows with impact speed and is capped', () => {
    expect(burstCount(0.1)).toBe(0);
    expect(burstCount(2)).toBeGreaterThan(burstCount(1));
    expect(burstCount(40)).toBe(MAX_BURST);
  });

  it('burst velocities all point upward and outward', () => {
    let s = 1;
    const rand = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (const v of burstVelocities(100, 2, rand)) {
      expect(v.vy).toBeGreaterThan(0);
      const elev = (Math.atan2(v.vy, Math.hypot(v.vx, v.vz)) * 180) / Math.PI;
      expect(elev).toBeGreaterThanOrEqual(15 - 1e-9);
      expect(elev).toBeLessThanOrEqual(60 + 1e-9);
    }
  });
});

describe('DustSystem', () => {
  const make = (cap: number) => new DustSystem(new Scene(new NullEngine()), generateCraterField(33, 100, 1), cap);

  it('dust grain material is lit', () => {
    const m = make(50).material as PBRMaterial;
    expect(m.disableLighting).toBe(false);
    expect(m.emissiveColor.equals(Color3.Black())).toBe(true);
  });

  it('pool never exceeds capacity', () => {
    const d = make(50);
    for (let i = 0; i < 10; i++) d.burst(new Vector3(0, 5, 0), 4);
    expect(d.alive).toBeLessThanOrEqual(50);
  });

  it('grains fall back and the pool empties', () => {
    const hm = generateCraterField(33, 100, 1);
    const d = new DustSystem(new Scene(new NullEngine()), hm, 200);
    d.burst(new Vector3(0, sampleHeight(hm, 0, 0) + 0.5, 0), 2);
    expect(d.alive).toBeGreaterThan(0);
    for (let i = 0; i < 600; i++) d.update(1 / 60);
    expect(d.alive).toBe(0);
  });
});
