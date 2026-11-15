import { describe, expect, it } from 'vitest';
import { elevationKm, sampleGrid, buildOrbitalGeometry, terrainClearance, readOrbitalElevation, type HeightGrid } from '../src/world/orbitalTerrain';
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { latLonToSphere, MOON_R_KM } from '../src/landing/moonMath';

const grid: HeightGrid = { width: 2, height: 2, west: 0, east: 2, north: 2, south: 0, samples: new Uint16Array([20000, 22000, 24000, 26000]) };
describe('LOLA orbital terrain', () => {
  it('loads the shipped compressed DEM and locates Apollo 11 below the reference radius', async () => {
    const b = readFileSync('public/textures/moon/lola-elevation-delta-v1.bin');
    const sample = await readOrbitalElevation(Uint8Array.from(b).buffer);
    expect(sample(.674,23.473)).toBeCloseTo(-1.925, 1);
    expect(sample(0,180)).toBeCloseTo(sample(0,-180),8);
    expect(sample(0,23)).not.toBe(sample(0,25));
    expect(Math.abs(sample(12-.00001,24)-sample(12+.00001,24))).toBeLessThan(.001);
  });
  it('rejects truncated height data rather than silently flattening the Moon', async () => {
    const b = gzipSync(new Uint8Array(16));
    await expect(readOrbitalElevation(Uint8Array.from(b).buffer)).rejects.toThrow('Incomplete NASA');
  });
  it('decodes unsigned half metres against the NASA reference radius', () => {
    expect(elevationKm(20000)).toBe(0);
    expect(elevationKm(16000)).toBe(-2);
    expect(elevationKm(26000)).toBe(3);
  });
  it('preserves north/east orientation and interpolates height', () => {
    expect(sampleGrid(grid, 2, 0)).toBe(0);
    expect(sampleGrid(grid, 0, 2)).toBe(3);
    expect(sampleGrid(grid, 1, 1)).toBe(1.5);
    expect(sampleGrid(grid, 9, -3)).toBe(0);
  });
  it('measures camera clearance above terrain rather than the reference sphere', () => {
    expect(terrainClearance(latLonToSphere(1, 1, MOON_R_KM + 1.8), () => 1.5)).toBeCloseTo(0.3, 6);
  });
  it('builds displaced geometry with bounded triangle budget and valid outward faces', () => {
    const g = buildOrbitalGeometry(() => 1.5);
    expect(g.positions.length / 3).toBeLessThan(210000);
    expect(g.indices.length / 3).toBeLessThan(420000);
    expect(g.positions.every(Number.isFinite)).toBe(true);
    expect(Math.hypot(...g.positions.slice(3 * 100, 3 * 101))).toBeCloseTo(MOON_R_KM + 1.5, 2);
    let wrong = 0;
    for (let i = 0; i < g.indices.length; i += 3) {
      const a = g.indices[i] * 3, b = g.indices[i + 1] * 3, c = g.indices[i + 2] * 3;
      const p = g.positions;
      const u = [p[b]-p[a],p[b+1]-p[a+1],p[b+2]-p[a+2]];
      const v = [p[c]-p[a],p[c+1]-p[a+1],p[c+2]-p[a+2]];
      const dot = (u[1]*v[2]-u[2]*v[1])*p[a]+(u[2]*v[0]-u[0]*v[2])*p[a+1]+(u[0]*v[1]-u[1]*v[0])*p[a+2];
      // Babylon left-handed front faces have inward cross products.
      if (dot > 1e-3) wrong++;
    }
    expect(wrong).toBe(0);
  });
});
