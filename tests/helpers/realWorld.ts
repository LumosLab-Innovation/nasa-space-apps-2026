import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import type { Ephemeris } from '../../src/data/ephemeris';
import type { Heightmap } from '../../src/data/heightmap';

/** The real LOLA heightmap and JPL ephemeris shipped in public/data, read straight from disk for tests. */
export function realHeightmap(): Heightmap {
  const meta = JSON.parse(readFileSync('public/data/terrain/heightmap.json', 'utf8')) as { size: number; worldSizeM: number };
  const buf = gunzipSync(readFileSync('public/data/terrain/heightmap-f32-v1.bin'));
  const heights = new Float32Array(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
  return { size: meta.size, worldSizeM: meta.worldSizeM, heights, source: 'lola' };
}

export function realEphemeris(): Ephemeris {
  const load = (n: string) => JSON.parse(readFileSync(`public/data/ephemeris/${n}.json`, 'utf8'));
  return { sun: load('sun'), earth: load('earth'), source: 'horizons' };
}
