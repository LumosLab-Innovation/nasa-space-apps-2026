import { sampleHeight, type Heightmap } from '../data/heightmap';

const DEG = 180 / Math.PI;

type Point3 = { x: number; y: number; z: number };

function triangleHeight(hm: Heightmap, u: number, v: number): number {
  const last = hm.size - 1;
  const col = Math.min(Math.floor(u), last - 1);
  const row = Math.min(Math.floor(v), last - 1);
  const x = u - col;
  const z = v - row;
  const a = row * hm.size + col;
  const b = hm.heights[a + 1];
  const d = hm.heights[a + hm.size];
  if (x + z <= 1) return hm.heights[a] * (1 - x - z) + b * x + d * z;
  return b * (1 - z) + d * (1 - x) + hm.heights[a + hm.size + 1] * (x + z - 1);
}

/** Height of the rendered triangles, which join the samples along a diagonal. */
export function terrainSurfaceHeight(hm: Heightmap, x: number, z: number): number {
  const last = hm.size - 1;
  const grid = (metres: number) => Math.max(0, Math.min(last, (metres / hm.worldSizeM + 0.5) * last));
  return triangleHeight(hm, grid(x), grid(z));
}

/** Check the sight line at each cell and triangle boundary, where its clearance can change slope. */
export function terrainBlocksSight(hm: Heightmap, from: Point3, to: Point3): boolean {
  const last = hm.size - 1;
  const grid = (metres: number) => (metres / hm.worldSizeM + 0.5) * last;
  const u = grid(from.x);
  const v = grid(from.z);
  const du = grid(to.x) - u;
  const dv = grid(to.z) - v;
  const belowTerrain = (t: number) => {
    const x = u + du * t;
    const z = v + dv * t;
    return x >= 0 && x <= last && z >= 0 && z <= last &&
      from.y + (to.y - from.y) * t < triangleHeight(hm, x, z);
  };
  const crossesTerrain = (start: number, delta: number, min: number, max: number) => {
    if (delta === 0) return false;
    const end = start + delta;
    const first = Math.max(min, Math.ceil(Math.min(start, end)));
    const limit = Math.min(max, Math.floor(Math.max(start, end)));
    for (let line = first; line <= limit; line++) {
      const t = (line - start) / delta;
      if (t > 0 && t < 1 && belowTerrain(t)) return true;
    }
    return false;
  };
  return belowTerrain(0) || belowTerrain(1) ||
    crossesTerrain(u, du, 0, last) || crossesTerrain(v, dv, 0, last) ||
    crossesTerrain(u + v, du + dv, 1, last * 2 - 1);
}

/** Steepest slope (degrees) between neighbouring samples within `radiusM` of (x, z). */
export function maxSlopeDeg(hm: Heightmap, x: number, z: number, radiusM: number, stepM = 2): number {
  let best = 0;
  for (let dx = -radiusM; dx <= radiusM; dx += stepM) {
    for (let dz = -radiusM; dz <= radiusM; dz += stepM) {
      if (dx * dx + dz * dz > radiusM * radiusM) continue;
      const h = sampleHeight(hm, x + dx, z + dz);
      const gx = (sampleHeight(hm, x + dx + stepM, z + dz) - h) / stepM;
      const gz = (sampleHeight(hm, x + dx, z + dz + stepM) - h) / stepM;
      best = Math.max(best, Math.atan(Math.hypot(gx, gz)) * DEG);
    }
  }
  return best;
}

/** Steepest slope (degrees) met walking the straight segment a → b in `stepM` steps. */
export function segmentMaxSlopeDeg(hm: Heightmap, a: { x: number; z: number }, b: { x: number; z: number }, stepM = 2): number {
  const len = Math.hypot(b.x - a.x, b.z - a.z);
  const n = Math.max(1, Math.ceil(len / stepM));
  let best = 0;
  let prev = sampleHeight(hm, a.x, a.z);
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    const h = sampleHeight(hm, a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t);
    best = Math.max(best, Math.atan(Math.abs(h - prev) / (len / n)) * DEG);
    prev = h;
  }
  return best;
}
