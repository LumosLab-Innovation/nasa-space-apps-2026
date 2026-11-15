import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { decodeOrbitalSamples } from '../src/world/orbitalTerrain';
import { loadHeightmap } from '../src/data/heightmap';

const hash = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
const bytes = (path: string) => Uint8Array.from(readFileSync(path));

describe('lossless heightmap packaging', () => {
  it('restores every original orbital elevation byte, including row boundaries', async () => {
    const samples = await decodeOrbitalSamples(bytes('public/textures/moon/lola-elevation-delta-v1.bin').buffer);
    expect(hash(new Uint8Array(samples.buffer))).toBe('02f2572efc0a25970b91d04dbebc19e96697c2963c890ab348f6f54d098505c3');
  });
  it('loads the compressed surface map without falling back and preserves Float32 bits', async () => {
    const requested: string[] = [];
    const hm = await loadHeightmap(async url => {
      requested.push(url);
      return new Response(bytes('public' + url));
    });
    expect(requested.at(-1)).toMatch(/heightmap-f32-v1\.bin$/);
    expect(hm.source).toBe('lola');
    expect(hash(new Uint8Array(hm.heights.buffer))).toBe('11b08c0f9861422cdde7c441af77517d7d36d0733362e044f39a7de4adb74934');
  });
  it('handles negative deltas, uint16 wraparound and both grid row resets', async () => {
    const n = 720*360+768*768, data = new Uint16Array(n);
    data.set([65535,2,65535],0);
    data[720] = 17;
    data[720*360] = 23;
    data[720*360+768] = 31;
    const zipped = gzipSync(new Uint8Array(data.buffer));
    const result = await decodeOrbitalSamples(Uint8Array.from(zipped).buffer);
    expect(Array.from(result.slice(0,4))).toEqual([65535,1,0,0]);
    expect(result[720]).toBe(17);
    expect(result[720*360]).toBe(23);
    expect(result[720*360+768]).toBe(31);
  });
});
