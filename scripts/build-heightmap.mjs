// Build the game heightmap from a LOLA south-pole GeoTIFF (polar stereographic, metres).
// Usage: node scripts/build-heightmap.mjs <input.tif>
// Output: public/data/terrain/heightmap-f32-v1.bin (gzipped Float32 LE, row-major, row 0 = south edge) + heightmap.json
import { writeFile, mkdir } from 'node:fs/promises';
import { fromFile } from 'geotiff';
import { gzipSync } from 'node:zlib';

const SITE = { latDeg: -89.45, lonDegEast: 222.7 }; // keep in sync with src/config/constants.ts
const MOON_R_M = 1737400;
const SIZE = 513;
const WORLD_M = 1500; // game world edge
const CROP_M = 3000; // real terrain edge squeezed into the game world (spec §4: compact open world)
const SCALE = WORLD_M / CROP_M; // also applied to heights so slopes stay real
const OUT = 'public/data/terrain';
const DEG = Math.PI / 180;

const input = process.argv[2];
if (!input) throw new Error('usage: node scripts/build-heightmap.mjs <input.tif>');

const img = await (await fromFile(input)).getImage();
const [ox, oy] = img.getOrigin();
const [rx, ry] = img.getResolution();
const w = img.getWidth();
const h = img.getHeight();
const [raster] = await img.readRasters();

const rho = 2 * MOON_R_M * Math.tan(Math.PI / 4 + (SITE.latDeg * DEG) / 2);
const lam = SITE.lonDegEast * DEG;
const site = { x: rho * Math.sin(lam), y: rho * Math.cos(lam) };
const north = { x: Math.sin(lam), y: Math.cos(lam) }; // away from the pole
const east = { x: Math.cos(lam), y: -Math.sin(lam) };

function dem(px, py) {
  const c = (px - ox) / rx;
  const r = (py - oy) / ry;
  const c0 = Math.floor(c), r0 = Math.floor(r);
  if (c0 < 0 || r0 < 0 || c0 + 1 >= w || r0 + 1 >= h) throw new Error(`crop leaves the DEM at ${px},${py}`);
  const fc = c - c0, fr = r - r0;
  const at = (rr, cc) => raster[rr * w + cc];
  const v = at(r0, c0) * (1 - fc) * (1 - fr) + at(r0, c0 + 1) * fc * (1 - fr) + at(r0 + 1, c0) * (1 - fc) * fr + at(r0 + 1, c0 + 1) * fc * fr;
  return v;
}

const heights = new Float32Array(SIZE * SIZE);
let nan = 0;
for (let row = 0; row < SIZE; row++) {
  for (let col = 0; col < SIZE; col++) {
    const gx = (col / (SIZE - 1) - 0.5) * CROP_M; // metres east of site
    const gz = (row / (SIZE - 1) - 0.5) * CROP_M; // metres north of site
    const v = dem(site.x + gx * east.x + gz * north.x, site.y + gx * east.y + gz * north.y);
    if (Number.isNaN(v)) nan++;
    heights[row * SIZE + col] = v;
  }
}
const valid = heights.filter((v) => !Number.isNaN(v));
const mean = valid.reduce((a, b) => a + b, 0) / valid.length;
for (let i = 0; i < heights.length; i++) heights[i] = Number.isNaN(heights[i]) ? 0 : (heights[i] - mean) * SCALE;

await mkdir(OUT, { recursive: true });
await writeFile(`${OUT}/heightmap-f32-v1.bin`, gzipSync(Buffer.from(heights.buffer), { level: 9 }));
await writeFile(`${OUT}/heightmap.json`, JSON.stringify({ size: SIZE, worldSizeM: WORLD_M, source: 'lola' }));
let min = Infinity, max = -Infinity;
for (const v of heights) { if (v < min) min = v; if (v > max) max = v; }
console.log(`site stereo (m) ${site.x.toFixed(0)}, ${site.y.toFixed(0)}; NaN filled ${nan}; relief ${min.toFixed(1)}..${max.toFixed(1)} m (game scale), mean elevation ${mean.toFixed(1)} m`);
