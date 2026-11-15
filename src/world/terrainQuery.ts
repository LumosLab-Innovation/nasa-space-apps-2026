import { sampleHeight, type Heightmap } from '../data/heightmap';

const DEG = 180 / Math.PI;

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
