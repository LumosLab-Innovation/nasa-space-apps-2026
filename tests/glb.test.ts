import { describe, expect, it, vi } from 'vitest';
import { nodeNames, nodeWorldPosition, parseGlbJson } from '../src/models/glb';
import { loadModel } from '../src/models/loadModel';
import { MODELS } from '../src/models/manifest';

/** Minimal GLB: 12-byte header + one JSON chunk padded with spaces to 4 bytes. */
function makeGlb(json: object): Uint8Array {
  let text = JSON.stringify(json);
  while (text.length % 4) text += ' ';
  const body = new TextEncoder().encode(text);
  const out = new Uint8Array(12 + 8 + body.length);
  const dv = new DataView(out.buffer);
  out.set(new TextEncoder().encode('glTF'), 0);
  dv.setUint32(4, 2, true);
  dv.setUint32(8, out.length, true);
  dv.setUint32(12, body.length, true);
  out.set(new TextEncoder().encode('JSON'), 16);
  out.set(body, 20);
  return out;
}

describe('GLB reader', () => {
  it('parses the JSON chunk of a GLB', () => {
    const j = parseGlbJson(makeGlb({ nodes: [{ name: 'a' }], scenes: [{ nodes: [0] }] }));
    expect([...nodeNames(j)]).toEqual(['a']);
  });

  it('rejects files that are not GLB', () => {
    expect(() => parseGlbJson(new Uint8Array(20))).toThrow('not a GLB');
  });

  it('composes parent translation and rotation into world position', () => {
    // parent at (0,0,2) rotated 90° about +Y; child at local (1,0,0) → world (0,0,1)
    const j = {
      scenes: [{ nodes: [0] }],
      nodes: [
        { name: 'p', translation: [0, 0, 2], rotation: [0, Math.SQRT1_2, 0, Math.SQRT1_2], children: [1] },
        { name: 'c', translation: [1, 0, 0] },
      ],
    };
    const w = nodeWorldPosition(j as never, 'c')!;
    expect(w[0]).toBeCloseTo(0, 5);
    expect(w[1]).toBeCloseTo(0, 5);
    expect(w[2]).toBeCloseTo(1, 5);
  });

  it('applies parent scale to child offsets', () => {
    const j = { scenes: [{ nodes: [0] }], nodes: [{ name: 'p', scale: [2, 2, 2], children: [1] }, { name: 'c', translation: [0, 1, 0] }] };
    expect(nodeWorldPosition(j as never, 'c')![1]).toBeCloseTo(2, 6);
  });

  it('returns null for an unknown node', () => {
    expect(nodeWorldPosition({ nodes: [], scenes: [{ nodes: [] }] }, 'x')).toBeNull();
  });
});

describe('model loading', () => {
  it('loadModel returns null when the importer fails', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await expect(loadModel({} as never, 'pip', () => Promise.reject(new Error('404')))).resolves.toBeNull();
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  it('every model spec names a file under models/ and a sane height range', () => {
    for (const [id, s] of Object.entries(MODELS)) {
      expect(s.file).toBe(`${id}.glb`);
      expect(s.heightM[0]).toBeGreaterThan(0);
      expect(s.heightM[1]).toBeGreaterThanOrEqual(s.heightM[0]);
      expect(s.nodes.length).toBeGreaterThan(0);
    }
  });
});
