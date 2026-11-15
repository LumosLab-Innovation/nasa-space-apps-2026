/**
 * MICA's corrupted memory (v2 scene 4.5): five photos of the same reference rock with their dates lost.
 * At the pole the Sun circles the horizon once per synodic month (29.53 days), so shadows turn like a clock
 * hand; ordering the photos by shadow direction restores the log. The sign (azimuth decreasing) is checked
 * against the real JPL ephemeris in tests/memory.test.ts.
 */
export const SUN_AZ_RATE_DEG_PER_DAY = -360 / 29.53;

export interface MemoryPhoto {
  day: number;
  shadowAzDeg: number;
}

const DAYS = [663, 665, 667, 669, 671];
const SUN_AZ0 = 200;

/** Small deterministic PRNG so a seed always gives the same shuffle. */
function rng(seed: number): () => number {
  let s = (seed * 2654435761) >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 10000) / 10000;
  };
}

/** Photos in display order plus `order`: the display indices in chronological order. Never left sorted. */
export function memoryPhotos(seed: number): { photos: MemoryPhoto[]; order: number[] } {
  const chrono = DAYS.map((day) => ({ day, shadowAzDeg: (((SUN_AZ0 + 180 + SUN_AZ_RATE_DEG_PER_DAY * (day - DAYS[0])) % 360) + 360) % 360 }));
  const r = rng(seed);
  let idx = [0, 1, 2, 3, 4];
  do {
    idx = idx.map((v) => ({ v, k: r() })).sort((a, b) => a.k - b.k).map((x) => x.v);
  } while (idx.every((v, i) => v === i));
  const photos = idx.map((c) => chrono[c]);
  const order = DAYS.map((_, c) => idx.indexOf(c));
  return { photos, order };
}

export function checkOrder(picked: number[], order: number[]): 'ok' | 'partial' | 'wrong' {
  for (let i = 0; i < picked.length; i++) if (picked[i] !== order[i]) return 'wrong';
  return picked.length === order.length ? 'ok' : 'partial';
}
