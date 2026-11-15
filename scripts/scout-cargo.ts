// Finds a cargo-lander site on the real LOLA heightmap (Plan 5, Task 4): flat (< 5°), at least 600 m from
// camp, inside the map, with open ground at camp's centre (ejecta reach it) and at least one shielded spot
// within 60 m of camp (a ridge Pip can hide behind). Run: npx vite-node scripts/scout-cargo.ts
import { realHeightmap } from '../tests/helpers/realWorld';
import { sampleHeight } from '../src/data/heightmap';
import { ejectaShielded, slopeDeg } from '../src/challenges/cargoLanding';
import { zone } from '../src/world/zones';

const hm = realHeightmap();
const base = zone('base');
const half = hm.worldSizeM / 2 - 60;
const hits: { x: number; z: number; d: number; slope: number; shelters: number }[] = [];
for (let x = -half; x <= half; x += 40)
  for (let z = -half; z <= half; z += 40) {
    const d = Math.hypot(x - base.x, z - base.z);
    if (d < 600 || d > 900) continue;
    const slope = slopeDeg(hm, x, z);
    if (slope >= 5) continue;
    const site = { x, z };
    if (ejectaShielded(hm, base, site)) continue;
    let shelters = 0;
    for (let r = 15; r <= 60; r += 15)
      for (let a = 0; a < 360; a += 30) {
        const p = { x: base.x + r * Math.sin((a * Math.PI) / 180), z: base.z + r * Math.cos((a * Math.PI) / 180) };
        if (ejectaShielded(hm, p, site)) shelters++;
      }
    if (shelters > 0) hits.push({ x, z, d: Math.round(d), slope: +slope.toFixed(1), shelters });
  }
hits.sort((a, b) => b.shelters - a.shelters || a.d - b.d);
console.log(`world ${hm.worldSizeM} m, base (${base.x}, ${base.z}), base height ${sampleHeight(hm, base.x, base.z).toFixed(0)} m`);
console.log(hits.slice(0, 12));
