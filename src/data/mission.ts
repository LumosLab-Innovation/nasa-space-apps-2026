import { sampleAt, type Ephemeris } from './ephemeris';

/**
 * When the mission happens (spec v3 §10.1–10.2): the window in 2028 with the highest Sun while Earth
 * stays above the horizon, so the stops can be done in any order with Houston in view. Also the real
 * milestones Plan 4 jumps to: Earth setting, Sun setting and the next dawn. Times are epoch ms UTC.
 */
export interface MissionPlan {
  start: number;
  earthUpUntil: number;
  earthSet: number;
  sunSet: number;
  dawn: number;
  /** Lowest Sun elevation inside the chosen window (degrees). */
  minSunElDeg: number;
}

const EARTH_MIN_EL = 1;
const H = 3600_000;

export function planMission(e: Ephemeris, windowHours = 72): MissionPlan {
  const sun = e.sun;
  const last = sun[sun.length - 1].t;
  const earthEl = sun.map((s) => sampleAt(e.earth, s.t).el);
  let best = -1;
  let bestMin = -Infinity;
  for (let i = 0; i + windowHours < sun.length; i++) {
    let mn = Infinity;
    let ok = true;
    for (let j = i; j <= i + windowHours; j++) {
      if (earthEl[j] <= EARTH_MIN_EL || sun[j].el <= 0) {
        ok = false;
        break;
      }
      if (sun[j].el < mn) mn = sun[j].el;
    }
    if (ok && mn > bestMin) {
      bestMin = mn;
      best = i;
    }
  }
  if (best < 0) {
    const t0 = sun[0].t;
    return { start: t0, earthUpUntil: last, earthSet: last, sunSet: last, dawn: last, minSunElDeg: sun[0].el };
  }
  const start = sun[best].t;
  const firstAfter = (from: number, pred: (i: number) => boolean) => {
    for (let i = 0; i < sun.length; i++) if (sun[i].t >= from && pred(i)) return sun[i].t;
    return last;
  };
  const earthSet = firstAfter(start, (i) => earthEl[i] <= 0);
  const sunSet = firstAfter(start + windowHours * H, (i) => sun[i].el <= 0);
  const dawn = firstAfter(sunSet, (i) => sun[i].el > 0);
  return { start, earthUpUntil: earthSet, earthSet, sunSet, dawn, minSunElDeg: bestMin };
}
