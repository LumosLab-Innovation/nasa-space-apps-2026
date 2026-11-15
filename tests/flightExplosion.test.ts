import { expect, it } from 'vitest';
import { NullEngine, Scene, Vector3 } from '@babylonjs/core';
import { FlightExplosion } from '../src/fx/flightExplosion';

it('reuses its bounded pool and clears all visuals after each burst', () => {
  const engine = new NullEngine(), scene = new Scene(engine);
  const effect = new FlightExplosion(scene);
  const count = scene.meshes.length;
  for (let i = 0; i < 3; i++) {
    effect.start(new Vector3(1, 2, 3), 10);
    effect.update(.6);
    expect(effect.activeCount).toBeGreaterThanOrEqual(64);
    const before = scene.meshes.map(mesh => mesh.position.asArray());
    effect.update(0);
    expect(scene.meshes.map(mesh => mesh.position.asArray())).toEqual(before);
    effect.update(6);
    expect(effect.activeCount).toBeGreaterThan(0);
    effect.update(2);
    expect(effect.activeCount).toBe(0);
    expect(scene.meshes.length).toBe(count);
  }
  effect.start(Vector3.Zero(), 10);
  effect.reset(); expect(effect.activeCount).toBe(0);
  effect.dispose(); expect(scene.meshes.length).toBe(0);
  scene.dispose(); engine.dispose();
});
