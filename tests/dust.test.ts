import { describe, expect, it } from 'vitest';
import { FreeCamera, NullEngine, Scene, Vector3 } from '@babylonjs/core';
import { sprayVelocities } from '../src/fx/ballistic';
import { DustSystem } from '../src/fx/dustSystem';
import type { Heightmap } from '../src/data/heightmap';

const flatHm: Heightmap = { size: 2, worldSizeM: 1000, heights: new Float32Array(4), source: 'procedural' };
const seeded = () => {
  let s = 7;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
};

describe('lunar dust (plan 7)', () => {
  it('keeps dust clouds facing the live landing camera after switching from exploration', () => {
    const scene=new Scene(new NullEngine());
    const exploration=new FreeCamera('exploration',new Vector3(0,5,-20),scene);exploration.setTarget(Vector3.Zero());
    scene.activeCamera=exploration;
    const d=new DustSystem(scene,flatHm,200,100);
    const landing=new FreeCamera('landing',new Vector3(20,5,0),scene);landing.setTarget(Vector3.Zero());
    scene.activeCamera=landing;
    d.plume(Vector3.Zero(),25,40);d.update(.2);
    const positions=scene.getMeshByName('dustFine')!.getVerticesData('position')!;
    const a=Vector3.FromArray(positions,0),b=Vector3.FromArray(positions,3),c=Vector3.FromArray(positions,6);
    const normal=Vector3.Cross(b.subtract(a),c.subtract(a)).normalize();
    expect(Math.abs(Vector3.Dot(normal,landing.getDirection(Vector3.Forward()).normalize()))).toBeGreaterThan(.99);
    scene.dispose();
  });
  it('landing clumps linger beyond four seconds after cutoff and dissipate within six seconds', () => {
    const scene=new Scene(new NullEngine());new FreeCamera('dust-test-camera',new Vector3(0,5,-20),scene);
    const d=new DustSystem(scene,flatHm,200,100);
    d.plume(Vector3.Zero(),25,40);
    for(let i=0;i<276;i++)d.update(1/60);
    expect(d.fineAlive).toBeGreaterThan(0);
    for(let i=0;i<85;i++)d.update(1/60);
    expect(d.fineAlive).toBe(0);
    scene.dispose();
  });
  it('launches landing dust above each terrain sample, not below nearby elevated ground', () => {
    const scene=new Scene(new NullEngine());
    const raised={...flatHm,heights:new Float32Array([4,4,4,4])};
    const d=new DustSystem(scene,raised,200,100);
    d.plume(Vector3.Zero(),25,40);
    d.update(.001);
    expect(d.fineAlive).toBeGreaterThan(0);
    expect(d.alive).toBe(40);
    scene.dispose();
  });
  it('every grain lands within its ballistic time (no hovering)', () => {
    const d = new DustSystem(new Scene(new NullEngine()), flatHm, 2000);
    // A 2 m/s boot impact throws grains at most 60° up at 2 m/s: vy ≤ 1.73 m/s.
    d.burst(new Vector3(0, 0, 0), 2);
    d.spray(new Vector3(3, 0, 0), 0, 4, 60);
    d.trickle(new Vector3(-3, 0, 0), 0, 3, 0.5);
    expect(d.alive).toBeGreaterThan(0);
    expect(d.fineAlive).toBeGreaterThan(0);
    const maxVy = 4; // spray at 4 m/s is the fastest of the three
    const limit = (2 * maxVy) / 1.62 + 0.1;
    let t = 0;
    while ((d.alive > 0 || d.fineAlive > 0) && t < 30) {
      d.update(1 / 60);
      t += 1 / 60;
    }
    expect(d.alive).toBe(0);
    expect(d.fineAlive).toBe(0);
    expect(t).toBeLessThanOrEqual(limit);
  });

  it('spray throws dust behind the wheel', () => {
    for (const yaw of [0, 1.2, -2.5]) {
      const fx = Math.sin(yaw), fz = Math.cos(yaw);
      const vs = sprayVelocities(80, yaw, 3, seeded());
      expect(vs.length).toBe(80);
      for (const v of vs) {
        expect(v.vx * fx + v.vz * fz).toBeLessThan(0); // backwards
        expect(v.vy).toBeGreaterThan(0); // and up
        expect(Math.hypot(v.vx, v.vy, v.vz)).toBeLessThanOrEqual(3 + 1e-9);
      }
    }
    expect(sprayVelocities(10, 0, 0.05, seeded())).toEqual([]);
  });

  it('a slow foot or wheel never crashes the dust (speeds just above the trickle threshold)', () => {
    const d = new DustSystem(new Scene(new NullEngine()), flatHm, 200);
    for (const v of [0.1, 0.12, 0.15, 0.166, 0.2]) {
      expect(() => d.trickle(new Vector3(0, 0, 0), 0, v, 1)).not.toThrow();
      expect(() => d.spray(new Vector3(0, 0, 0), 0, v, 5)).not.toThrow();
    }
  });

  it('pool never exceeds capacity', () => {
    const d = new DustSystem(new Scene(new NullEngine()), flatHm, 50, 20);
    for (let i = 0; i < 10; i++) {
      d.burst(new Vector3(0, 5, 0), 4);
      d.spray(new Vector3(0, 5, 0), 0, 4, 40);
      d.plume(new Vector3(0, 5, 0), 20, 40);
    }
    expect(d.alive).toBeLessThanOrEqual(50);
    expect(d.fineAlive).toBeLessThanOrEqual(20);
  });
});
