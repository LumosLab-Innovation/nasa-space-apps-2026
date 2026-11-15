import { sampleHeight, type Heightmap } from '../data/heightmap';
import { sampleAt, type EphemSample } from '../data/ephemeris';

/**
 * Real terrain lighting (spec v3 §10.1): at the pole the Sun skims the horizon, so whether a spot is lit
 * depends on the terrain between it and the Sun. Azimuth: 0 = north (+z), 90 = east (+x), as JPL Horizons.
 */
interface AzEl {
  az: number;
  el: number;
}

const RAD = Math.PI / 180;

/** Highest elevation angle (degrees) of terrain seen from (x, z) looking along `azDeg`. */
export function horizonElevationDeg(hm: Heightmap, x: number, z: number, azDeg: number, eyeM = 1.0, maxDistM = 1400, stepM = 5): number {
  const eye = sampleHeight(hm, x, z) + eyeM;
  const dx = Math.sin(azDeg * RAD);
  const dz = Math.cos(azDeg * RAD);
  const half = hm.worldSizeM / 2;
  let best = -90;
  for (let d = stepM; d <= maxDistM; d += stepM) {
    const px = x + dx * d;
    const pz = z + dz * d;
    if (Math.abs(px) > half || Math.abs(pz) > half) break;
    const a = Math.atan2(sampleHeight(hm, px, pz) - eye, d) / RAD;
    if (a > best) best = a;
  }
  return best;
}

export function isSunlit(hm: Heightmap, x: number, z: number, sun: AzEl, eyeM = 0.5): boolean {
  return sun.el > horizonElevationDeg(hm, x, z, sun.az, eyeM);
}

/** Line of sight to Earth for an antenna 2 m above the ground. */
export function earthVisible(hm: Heightmap, x: number, z: number, earth: AzEl): boolean {
  return earth.el > horizonElevationDeg(hm, x, z, earth.az, 2);
}

/** Share of time steps in [fromMs, toMs] (inclusive, every `stepH` hours) when (x, z) is sunlit. */
export function sunlitFraction(hm: Heightmap, x: number, z: number, sun: EphemSample[], fromMs: number, toMs: number, stepH = 3): number {
  let lit = 0;
  let n = 0;
  for (let t = fromMs; t <= toMs; t += stepH * 3600_000) {
    n++;
    if (isSunlit(hm, x, z, sampleAt(sun, t))) lit++;
  }
  return n ? lit / n : 0;
}

/**
 * Per-frame sunlight queries without ray-marching every frame: the horizon is cached per grid cell and
 * azimuth bucket (computed at the cell centre), so only the comparison with the Sun's elevation is live.
 */
export class SunlightCache {
  misses = 0;
  private readonly horizon = new Map<string, number>();

  constructor(private readonly hm: Heightmap, private readonly cellM = 8, private readonly azBucketDeg = 2) {}

  isSunlit(x: number, z: number, sun: AzEl): boolean {
    const cx = Math.floor(x / this.cellM);
    const cz = Math.floor(z / this.cellM);
    const ab = Math.round((((sun.az % 360) + 360) % 360) / this.azBucketDeg);
    const key = `${cx},${cz},${ab}`;
    let h = this.horizon.get(key);
    if (h === undefined) {
      this.misses++;
      h = horizonElevationDeg(this.hm, (cx + 0.5) * this.cellM, (cz + 0.5) * this.cellM, ab * this.azBucketDeg, 0.5);
      this.horizon.set(key, h);
    }
    return sun.el > h;
  }
}
