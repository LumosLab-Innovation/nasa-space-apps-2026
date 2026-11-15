import { Color3, Mesh, MeshBuilder, PBRMaterial, Scene, Vector3 } from '@babylonjs/core';
import { sampleHeight, type Heightmap } from '../data/heightmap';

const STEP_M = 0.5;
const ROW_OFFSET_M = 0.55; // left/right wheel rows of a six-wheel rover
const ROW_WIDTH_M = 0.22;

/** Resample a polyline every `step` metres (straight segments). */
function resample(path: { x: number; z: number }[], step: number): { x: number; z: number }[] {
  const out: { x: number; z: number }[] = [path[0]];
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1];
    const b = path[i];
    const len = Math.hypot(b.x - a.x, b.z - a.z);
    const n = Math.max(1, Math.round(len / step));
    for (let k = 1; k <= n; k++) out.push({ x: a.x + ((b.x - a.x) * k) / n, z: a.z + ((b.z - a.z) * k) / n });
  }
  return out;
}

/** Two darker wheel-row strips that hug the terrain along Mica's path (spec §6 Act 3). */
export function createTracks(scene: Scene, path: { x: number; z: number }[], hm: Heightmap): Mesh {
  const pts = resample(path, STEP_M);
  const rows: Vector3[][][] = [[], []].map(() => [[], []]);
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const q = pts[Math.min(i + 1, pts.length - 1)];
    const r = pts[Math.max(i - 1, 0)];
    let dx = q.x - r.x;
    let dz = q.z - r.z;
    const l = Math.hypot(dx, dz) || 1;
    dx /= l;
    dz /= l;
    const nx = -dz;
    const nz = dx;
    [-1, 1].forEach((side, row) => {
      for (const [edge, off] of [[0, ROW_OFFSET_M * side - ROW_WIDTH_M / 2], [1, ROW_OFFSET_M * side + ROW_WIDTH_M / 2]] as const) {
        const x = p.x + nx * off;
        const z = p.z + nz * off;
        rows[row][edge].push(new Vector3(x, sampleHeight(hm, x, z) + 0.03, z));
      }
    });
  }
  const mat = new PBRMaterial('trackMat', scene);
  mat.albedoColor = new Color3(0.25, 0.245, 0.24);
  mat.roughness = 1;
  mat.zOffset = -2;
  const strips = rows.map((r, i) => MeshBuilder.CreateRibbon(`tracks-${i}`, { pathArray: r, sideOrientation: Mesh.DOUBLESIDE }, scene));
  const merged = Mesh.MergeMeshes(strips, true)!;
  merged.name = 'micaTracks';
  merged.material = mat;
  merged.receiveShadows = true;
  merged.isPickable = false;
  return merged;
}
