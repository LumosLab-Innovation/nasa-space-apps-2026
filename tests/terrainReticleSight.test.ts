import { expect, test } from 'vitest';
import type { Heightmap } from '../src/data/heightmap';
import { terrainBlocksSight, terrainSurfaceHeight } from '../src/world/terrainQuery';

const diagonalRidge: Heightmap = {
  size: 2,
  worldSizeM: 2,
  heights: new Float32Array([0, 2, 2, 0]),
  source: 'procedural',
};

test('a ridge on the mesh diagonal hides the marker even within a single heightmap cell', () => {
  expect(terrainSurfaceHeight(diagonalRidge, 0, 0)).toBe(2);
  const first = { x: -0.8, y: 1.5, z: -0.8 };
  const second = { x: 0.8, y: 1.5, z: 0.8 };
  expect(terrainBlocksSight(diagonalRidge, first, second)).toBe(true);
  expect(terrainBlocksSight(diagonalRidge, second, first)).toBe(true);
  expect(terrainBlocksSight(diagonalRidge, { ...first, y: 3 }, { ...second, y: 1.2 })).toBe(false);
});
