import type { Heightmap } from './heightmap';
import { sampleAt, type Ephemeris } from './ephemeris';
import { earthVisible, isSunlit } from '../world/lighting';

/**
 * Act 5 "The Long Shadow" happens in the first REAL long night at camp (user decision 07/11/2026): the Sun
 * slips behind the terrain for days. Found from the LOLA heightmap and the JPL Sun, never hard-coded.
 */
export interface CampNight {
  sunsetMs: number;
  dawnMs: number;
  dawnAzDeg: number;
  sunsetAzDeg: number;
  /** First moment after dawn when Earth drops out of view from camp (or the end of the data). */
  earthSetMs: number;
  hours: number;
}

const H = 3600_000;
const FINE = 10 * 60_000;

export function findCampNight(e: Ephemeris, hm: Heightmap, at: { x: number; z: number }, fromMs: number, minHours = 48): CampNight | null {
  const last = e.sun[e.sun.length - 1].t;
  const lit = (t: number) => isSunlit(hm, at.x, at.z, sampleAt(e.sun, t));
  // Earliest 10-minute step in (a, b] where pred becomes true (pred(b) is known true).
  const refine = (a: number, b: number, pred: (t: number) => boolean) => {
    for (let t = a + FINE; t < b; t += FINE) if (pred(t)) return t;
    return b;
  };
  let darkStart: number | null = null;
  let prev = fromMs;
  for (let t = fromMs; t <= last; t += H) {
    const l = lit(t);
    if (!l && darkStart === null) darkStart = t === fromMs ? t : refine(prev, t, (x) => !lit(x));
    if (l && darkStart !== null) {
      const dawn = refine(prev, t, lit);
      if ((dawn - darkStart) / H >= minHours) {
        const seen = (x: number) => earthVisible(hm, at.x, at.z, sampleAt(e.earth, x));
        let earthSetMs = last;
        for (let u = dawn; u <= last; u += H) {
          if (!seen(u)) {
            earthSetMs = refine(u - H, u, (x) => !seen(x));
            break;
          }
        }
        return {
          sunsetMs: darkStart,
          dawnMs: dawn,
          dawnAzDeg: sampleAt(e.sun, dawn).az,
          sunsetAzDeg: sampleAt(e.sun, darkStart).az,
          earthSetMs,
          hours: (dawn - darkStart) / H,
        };
      }
      darkStart = null;
    }
    prev = t;
  }
  return null;
}
