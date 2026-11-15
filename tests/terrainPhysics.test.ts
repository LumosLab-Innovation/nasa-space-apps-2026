import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import HavokPhysics from '@babylonjs/havok';
import { HavokPlugin, NullEngine, PhysicsShapeMesh, Scene, Vector3 } from '@babylonjs/core';
import { createTerrain } from '../src/world/terrain';
import { realHeightmap } from './helpers/realWorld';

it('native terrain collision matches the old mesh across the real LOLA grid within 1 cm', async () => {
  const havok = await HavokPhysics({ wasmBinary: new Uint8Array(readFileSync('node_modules/@babylonjs/havok/lib/esm/HavokPhysics.wasm')).buffer });
  const engine = new NullEngine();
  const scene = new Scene(engine);
  scene.enablePhysics(new Vector3(0, -1.62, 0), new HavokPlugin(true, havok));
  const mesh = createTerrain(scene, realHeightmap());
  const body = mesh.physicsBody!;
  const field = body.shape!;
  const legacy = new PhysicsShapeMesh(mesh, scene);
  const points = Array.from({ length: 1000 }, (_, i) => [
    (((i * 179) % 997) / 997 - 0.5) * 1498,
    (((i * 283) % 991) / 991 - 0.5) * 1498,
  ]);
  const heights = () => points.map(([x, z]) => {
    const hit = scene.getPhysicsEngine()!.raycast(new Vector3(x, 700, z), new Vector3(x, -700, z));
    expect(hit.hasHit).toBe(true);
    return hit.hitPointWorld.y;
  });
  try {
    const actual = heights();
    body.shape = legacy;
    const expected = heights();
    expect(Math.max(...actual.map((v, i) => Math.abs(v - expected[i])))).toBeLessThan(0.01);
  } finally {
    body.shape = field;
    legacy.dispose();
    scene.dispose();
    engine.dispose();
  }
}, 15000);
