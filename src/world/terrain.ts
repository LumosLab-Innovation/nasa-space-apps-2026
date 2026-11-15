import { Color3, Mesh, PBRMaterial, PhysicsAggregate, PhysicsShapeHeightField, Scene, VertexData } from '@babylonjs/core';
import type { Heightmap } from '../data/heightmap';

export function createTerrain(scene: Scene, hm: Heightmap): Mesh {
  const n = hm.size;
  const step = hm.worldSizeM / (n - 1);
  const positions = new Float32Array(n * n * 3);
  const uvs = new Float32Array(n * n * 2);
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const i = r * n + c;
      positions[i * 3] = c * step - hm.worldSizeM / 2;
      positions[i * 3 + 1] = hm.heights[i];
      positions[i * 3 + 2] = r * step - hm.worldSizeM / 2;
      uvs[i * 2] = c / (n - 1);
      uvs[i * 2 + 1] = r / (n - 1);
    }
  }
  const indices = new Uint32Array((n - 1) * (n - 1) * 6);
  let k = 0;
  for (let r = 0; r < n - 1; r++) {
    for (let c = 0; c < n - 1; c++) {
      const a = r * n + c;
      const b = a + 1;
      const d = a + n;
      const e = d + 1;
      indices.set([a, b, d, b, e, d], k);
      k += 6;
    }
  }
  const normals = new Float32Array(positions.length);
  VertexData.ComputeNormals(positions, indices, normals);
  const data = new VertexData();
  data.positions = positions;
  data.indices = indices;
  data.normals = normals;
  data.uvs = uvs;

  const mesh = new Mesh('terrain', scene);
  data.applyToMesh(mesh);
  const mat = new PBRMaterial('regolith', scene);
  mat.albedoColor = new Color3(0.42, 0.41, 0.4);
  mat.metallic = 0;
  mat.roughness = 1;
  mat.environmentIntensity = 0;
  mesh.material = mat;
  mesh.receiveShadows = true;
  // Native heightfields avoid cooking half a million triangles; Babylon expects rows from +z to -z.
  const heights = new Float32Array(hm.heights.length);
  for (let r = 0; r < n; r++) heights.set(hm.heights.subarray(r * n, (r + 1) * n), (n - 1 - r) * n);
  const shape = new PhysicsShapeHeightField(hm.worldSizeM, hm.worldSizeM, n, n, heights, scene);
  new PhysicsAggregate(mesh, shape, { mass: 0 }, scene);
  mesh.onDisposeObservable.addOnce(() => shape.dispose());
  return mesh;
}
