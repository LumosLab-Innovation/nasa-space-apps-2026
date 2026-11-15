import { TERRAIN_VERTS, WORLD_SIZE_M } from '../config/constants';

/** Square height grid in metres, row-major; row 0 at z = -worldSizeM/2, column 0 at x = -worldSizeM/2. */
export interface Heightmap {
  size: number;
  worldSizeM: number;
  heights: Float32Array;
  source: 'lola' | 'procedural';
}

type FetchFn = (url: string) => Promise<{ ok: boolean; json(): Promise<unknown>; arrayBuffer(): Promise<ArrayBuffer> }>;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Bilinear height at world position (x, z); positions outside the map clamp to the edge. */
export function sampleHeight(hm: Heightmap, x: number, z: number): number {
  const n = hm.size - 1;
  const u = clamp((x / hm.worldSizeM + 0.5) * n, 0, n);
  const v = clamp((z / hm.worldSizeM + 0.5) * n, 0, n);
  const c0 = Math.min(Math.floor(u), n - 1);
  const r0 = Math.min(Math.floor(v), n - 1);
  const fu = u - c0;
  const fv = v - r0;
  const h = (r: number, c: number) => hm.heights[r * hm.size + c];
  const top = h(r0, c0) * (1 - fu) + h(r0, c0 + 1) * fu;
  const bottom = h(r0 + 1, c0) * (1 - fu) + h(r0 + 1, c0 + 1) * fu;
  return top * (1 - fv) + bottom * fv;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fallback terrain: rolling ground plus bowl craters with raised rims; the big ones get central peaks. */
export function generateCraterField(size: number, worldSizeM: number, seed: number): Heightmap {
  const rand = mulberry32(seed);
  const heights = new Float32Array(size * size);
  const step = worldSizeM / (size - 1);
  const phase = [rand() * 10, rand() * 10, rand() * 10];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const x = c * step - worldSizeM / 2;
      const z = r * step - worldSizeM / 2;
      heights[r * size + c] =
        6 * Math.sin(x / 210 + phase[0]) * Math.cos(z / 170 + phase[1]) + 2.5 * Math.sin((x + z) / 90 + phase[2]);
    }
  }
  const craters: { x: number; z: number; radius: number; peak: boolean }[] = [];
  for (let i = 0; i < 3; i++) craters.push({ x: (rand() - 0.5) * worldSizeM * 0.7, z: (rand() - 0.5) * worldSizeM * 0.7, radius: 80 + rand() * 70, peak: true });
  for (let i = 0; i < 40; i++) craters.push({ x: (rand() - 0.5) * worldSizeM, z: (rand() - 0.5) * worldSizeM, radius: 5 + rand() * 35, peak: false });
  for (const k of craters) {
    const depth = k.radius * 0.2;
    const reach = k.radius * 1.6;
    const c0 = Math.max(0, Math.floor((k.x - reach + worldSizeM / 2) / step));
    const c1 = Math.min(size - 1, Math.ceil((k.x + reach + worldSizeM / 2) / step));
    const r0 = Math.max(0, Math.floor((k.z - reach + worldSizeM / 2) / step));
    const r1 = Math.min(size - 1, Math.ceil((k.z + reach + worldSizeM / 2) / step));
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        const d = Math.hypot(c * step - worldSizeM / 2 - k.x, r * step - worldSizeM / 2 - k.z) / k.radius;
        let dh = 0;
        if (d < 1) dh = -depth * (1 - d * d) + depth * 0.15;
        else if (d < 1.6) dh = depth * 0.15 * Math.pow(1 - (d - 1) / 0.6, 2);
        if (k.peak && d < 0.2) dh += depth * 0.5 * (1 - d / 0.2);
        heights[r * size + c] += dh;
      }
    }
  }
  return { size, worldSizeM, heights, source: 'procedural' };
}

export async function loadHeightmap(fetchFn: FetchFn = fetch as unknown as FetchFn): Promise<Heightmap> {
  try {
    const base = `${import.meta.env?.BASE_URL ?? '/'}data/terrain/`;
    const metaRes = await fetchFn(`${base}heightmap.json`);
    if (!metaRes.ok) throw new Error('heightmap.json missing');
    const meta = (await metaRes.json()) as { size: number; worldSizeM: number; source: 'lola' | 'procedural' };
    const binRes = await fetchFn(`${base}heightmap-f32-v1.bin`);
    if (!binRes.ok) throw new Error('heightmap-f32-v1.bin missing');
    const stream = new Blob([await binRes.arrayBuffer()]).stream().pipeThrough(new DecompressionStream('gzip'));
    const heights = new Float32Array(await new Response(stream).arrayBuffer());
    if (heights.length !== meta.size * meta.size) throw new Error('heightmap size mismatch');
    return { size: meta.size, worldSizeM: meta.worldSizeM, heights, source: meta.source };
  } catch (err) {
    console.warn('Heightmap unavailable, using procedural terrain:', err);
    return generateCraterField(TERRAIN_VERTS, WORLD_SIZE_M, 42);
  }
}
