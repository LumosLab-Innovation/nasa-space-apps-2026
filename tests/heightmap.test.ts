import { describe, expect, it } from 'vitest';
import { latLonToPolarStereoKm } from '../src/data/polar';
import { generateCraterField, loadHeightmap, sampleHeight, type Heightmap } from '../src/data/heightmap';

describe('south polar stereographic projection', () => {
  it('maps the pole to the origin', () => {
    const p = latLonToPolarStereoKm(-90, 0);
    expect(p.x).toBeCloseTo(0, 9);
    expect(p.y).toBeCloseTo(0, 9);
  });
  it('places the landing site ~16.68 km from the pole', () => {
    const p = latLonToPolarStereoKm(-89.45, 222.7);
    expect(Math.hypot(p.x, p.y)).toBeCloseTo(16.68, 2);
  });
});

describe('sampleHeight', () => {
  const hm: Heightmap = { size: 3, worldSizeM: 2, heights: new Float32Array([0, 0, 0, 0, 10, 0, 0, 0, 0]), source: 'lola' };
  it('reads the centre vertex', () => expect(sampleHeight(hm, 0, 0)).toBeCloseTo(10, 6));
  it('interpolates bilinearly', () => expect(sampleHeight(hm, 0.5, 0)).toBeCloseTo(5, 6));
  it('clamps outside the map to the edge', () => expect(sampleHeight(hm, 99, 99)).toBeCloseTo(0, 6));
});

describe('generateCraterField', () => {
  it('is deterministic for a seed and differs across seeds', () => {
    const a = generateCraterField(65, 1500, 42);
    const b = generateCraterField(65, 1500, 42);
    const c = generateCraterField(65, 1500, 7);
    expect(Array.from(a.heights)).toEqual(Array.from(b.heights));
    expect(Array.from(a.heights)).not.toEqual(Array.from(c.heights));
    expect(a.source).toBe('procedural');
  });
});

describe('loadHeightmap', () => {
  it('falls back to procedural terrain when the file is missing', async () => {
    const hm = await loadHeightmap(async () => { throw new Error('missing'); });
    expect(hm.source).toBe('procedural');
    expect(hm.size).toBe(513);
  });
});
