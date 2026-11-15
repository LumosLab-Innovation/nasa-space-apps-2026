/** Sun/Earth position as seen from the landing site (JPL Horizons, cached at build time). */
export interface EphemSample {
  t: number; // epoch ms UTC
  az: number; // degrees, 0 = north, clockwise
  el: number; // degrees above horizon
}
export interface Ephemeris {
  sun: EphemSample[];
  earth: EphemSample[];
  source: 'horizons' | 'fallback';
}

type FetchFn = (url: string) => Promise<{ ok: boolean; json(): Promise<unknown> }>;

const FALLBACK: Ephemeris = {
  sun: [{ t: 0, az: 0, el: 1.5 }],
  earth: [{ t: 0, az: 0, el: 3 }],
  source: 'fallback',
};

function isSamples(x: unknown): x is EphemSample[] {
  return Array.isArray(x) && x.length > 0 && x.every((s) => typeof s?.t === 'number' && typeof s?.az === 'number' && typeof s?.el === 'number');
}

export async function loadEphemeris(fetchFn: FetchFn = fetch as unknown as FetchFn): Promise<Ephemeris> {
  try {
    const get = async (name: string) => {
      const res = await fetchFn(`${import.meta.env?.BASE_URL ?? '/'}data/ephemeris/${name}.json`);
      if (!res.ok) throw new Error(`HTTP error for ${name}`);
      const data = await res.json();
      if (!isSamples(data)) throw new Error(`Bad ephemeris ${name}`);
      return data;
    };
    const [sun, earth] = await Promise.all([get('sun'), get('earth')]);
    return { sun, earth, source: 'horizons' };
  } catch (err) {
    console.warn('Ephemeris unavailable, using fallback:', err);
    return FALLBACK;
  }
}

/** Linear interpolation; azimuth takes the short way across 0/360. Clamps outside the data range. */
export function sampleAt(samples: EphemSample[], tMs: number): { az: number; el: number } {
  const first = samples[0];
  const last = samples[samples.length - 1];
  if (tMs <= first.t) return { az: first.az, el: first.el };
  if (tMs >= last.t) return { az: last.az, el: last.el };
  let lo = 0;
  let hi = samples.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (samples[mid].t <= tMs) lo = mid;
    else hi = mid;
  }
  const a = samples[lo];
  const b = samples[hi];
  const f = (tMs - a.t) / (b.t - a.t);
  let dAz = b.az - a.az;
  if (dAz > 180) dAz -= 360;
  if (dAz < -180) dAz += 360;
  const az = (((a.az + dAz * f) % 360) + 360) % 360;
  return { az, el: a.el + (b.el - a.el) * f };
}

/** @deprecated Use planMission() in src/data/mission.ts (Plan 3). First hourly sample where the Sun is up, Earth is >2° up, and Earth stays up for `minEarthUpHours`. */
export function findMissionStart(e: Ephemeris, minEarthUpHours = 120): number {
  const earth = e.earth;
  for (let i = 0; i + minEarthUpHours <= earth.length; i++) {
    if (earth[i].el <= 2 || sampleAt(e.sun, earth[i].t).el <= 0) continue;
    let ok = true;
    for (let j = i; j < i + minEarthUpHours; j++) {
      if (earth[j].el <= 0) { ok = false; break; }
    }
    if (ok) return earth[i].t;
  }
  return earth[0].t;
}
