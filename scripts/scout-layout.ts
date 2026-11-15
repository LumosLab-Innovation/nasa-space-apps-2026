// Scouts the real LOLA terrain × JPL light for journey-stop positions (plan 3, Task 3).
// Run: npx vite-node scripts/scout-layout.ts   — prints proposed coordinates for src/world/zones.ts.
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { sampleAt, type EphemSample } from '../src/data/ephemeris';
import type { Heightmap } from '../src/data/heightmap';
import { sampleHeight } from '../src/data/heightmap';
import { planMission } from '../src/data/mission';
import { earthVisible, horizonElevationDeg, sunlitFraction } from '../src/world/lighting';
import { maxSlopeDeg, segmentMaxSlopeDeg } from '../src/world/terrainQuery';

const meta = JSON.parse(readFileSync('public/data/terrain/heightmap.json', 'utf8'));
const buf = gunzipSync(readFileSync('public/data/terrain/heightmap-f32-v1.bin'));
const hm: Heightmap = { size: meta.size, worldSizeM: meta.worldSizeM, heights: new Float32Array(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)), source: 'lola' };
const load = (n: string): EphemSample[] => JSON.parse(readFileSync(`public/data/ephemeris/${n}.json`, 'utf8'));
const eph = { sun: load('sun'), earth: load('earth'), source: 'horizons' as const };
const m = planMission(eph);
const W0 = m.start;
const W1 = m.start + 72 * 3600_000;

const GRID = 20;
const LIM = 720;
const BIN = 5;
const BINS = 360 / BIN;
type P = { x: number; z: number };
const dist = (a: P, b: P) => Math.hypot(a.x - b.x, a.z - b.z);

// Max Sun elevation per azimuth bin over the whole year → permanently-shadowed test.
const maxSunEl = new Array(BINS).fill(-90);
for (const s of eph.sun) {
  const b = Math.round(s.az / BIN) % BINS;
  maxSunEl[b] = Math.max(maxSunEl[b], s.el);
}
const windowSun: { az: number; el: number }[] = [];
const windowEarth: { az: number; el: number }[] = [];
for (let t = W0; t <= W1; t += 3 * 3600_000) {
  windowSun.push(sampleAt(eph.sun, t));
  windowEarth.push(sampleAt(eph.earth, t));
}

interface Cell { p: P; frac: number; psr: boolean; earth: boolean; slope15: number }
const cells: Cell[] = [];
console.time('grid');
for (let x = -LIM; x <= LIM; x += GRID) {
  for (let z = -LIM; z <= LIM; z += GRID) {
    const hor = Array.from({ length: BINS }, (_, b) => horizonElevationDeg(hm, x, z, b * BIN, 0.5, 1400, 8));
    const lit = windowSun.filter((s) => s.el > hor[Math.round(s.az / BIN) % BINS]).length / windowSun.length;
    const psr = hor.every((h, b) => h > maxSunEl[b] + 0.2);
    const earth = windowEarth.every((e) => e.el > hor[Math.round(e.az / BIN) % BINS] + 0.3);
    cells.push({ p: { x, z }, frac: lit, psr, earth, slope15: maxSlopeDeg(hm, x, z, 15, 4) });
  }
}
console.timeEnd('grid');

const exactFrac = (p: P) => sunlitFraction(hm, p.x, p.z, eph.sun, W0, W1, 3);
const exactEarth = (p: P) => windowEarth.every((e) => earthVisible(hm, p.x, p.z, e));

const psr = cells.filter((c) => c.psr);
const flatLit = cells.filter((c) => c.slope15 < 4 && c.frac >= 0.85);
const earthOk = cells.filter((c) => c.earth);
const hot = cells.filter((c) => c.frac >= 0.7);
console.log(`candidates: psr ${psr.length}, flatLit ${flatLit.length}, earth ${earthOk.length}, hot ${hot.length}`);

function solarHillFor(near: P, avoid: P[]): { crate: P; site: P } | null {
  let best: { crate: P; site: P; d: number } | null = null;
  for (const c of cells) {
    if (c.frac < 0.95 || dist(c.p, near) > 600 || dist(c.p, near) < 120 || avoid.some((a) => dist(a, c.p) < 110)) continue;
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2;
      for (const r of [25, 35, 45, 55]) {
        const crate = { x: c.p.x + Math.sin(a) * r, z: c.p.z + Math.cos(a) * r };
        if (sampleHeight(hm, crate.x, crate.z) >= sampleHeight(hm, c.p.x, c.p.z)) continue;
        const s = segmentMaxSlopeDeg(hm, crate, c.p);
        if (s < 19 || s > 29 || maxSlopeDeg(hm, crate.x, crate.z, 3) > 14) continue;
        const d = dist(c.p, near);
        if (!best || d < best.d) best = { crate, site: c.p, d };
      }
    }
  }
  return best && { crate: best.crate, site: best.site };
}

function boulderFor(near: P, avoid: P[]): { top: P; bottom: P } | null {
  let best: { top: P; bottom: P; d: number } | null = null;
  for (const c of cells) {
    if (dist(c.p, near) > 600 || avoid.some((a) => dist(a, c.p) < 110)) continue;
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2;
      const top = { x: c.p.x + Math.sin(a) * 25, z: c.p.z + Math.cos(a) * 25 };
      if (sampleHeight(hm, top.x, top.z) <= sampleHeight(hm, c.p.x, c.p.z) + 5) continue;
      if (segmentMaxSlopeDeg(hm, top, c.p) < 17) continue;
      const d = dist(c.p, near);
      if (!best || d < best.d) best = { top, bottom: c.p, d };
    }
  }
  return best && { top: best.top, bottom: best.bottom };
}

let bestPlan: Record<string, unknown> | null = null;
let bestScore = Infinity;
for (const base of flatLit) {
  const landing = flatLit.filter((l) => dist(l.p, base.p) >= 150 && dist(l.p, base.p) <= 320).sort((a, b) => dist(a.p, base.p) - dist(b.p, base.p))[0];
  if (!landing) continue;
  // Spread the journey: each stop at least SEP from the others, the far ones 200+ m from camp.
  const SEP = 130;
  const far = (c: Cell, lo: number, hi: number, others: P[]) =>
    dist(c.p, base.p) >= lo && dist(c.p, base.p) <= hi && others.every((o) => dist(o, c.p) >= SEP);
  const byBase = (a: Cell, b: Cell) => dist(a.p, base.p) - dist(b.p, base.p);
  const ice = psr.filter((c) => far(c, 220, 560, [landing.p])).sort(byBase)[0];
  if (!ice) continue;
  const relay = earthOk.filter((c) => far(c, 160, 600, [landing.p, ice.p])).sort(byBase)[0];
  if (!relay) continue;
  const crater = hot.filter((c) => far(c, 160, 600, [landing.p, ice.p, relay.p])).sort(byBase)[0];
  if (!crater) continue;
  const score = dist(base.p, landing.p) + dist(base.p, ice.p) + dist(base.p, relay.p) + dist(base.p, crater.p);
  if (score < bestScore) {
    bestScore = score;
    bestPlan = { base: base.p, landing: landing.p, ice: ice.p, relay: relay.p, crater: crater.p };
  }
}
if (!bestPlan) throw new Error('no base/landing/ice/relay/crater combination found');
const base = bestPlan.base as P;
const ice = bestPlan.ice as P;
console.log('core', JSON.stringify(bestPlan), 'score', bestScore.toFixed(0));

// Refine: MICA on the rim of the dark crater, half lit.
let mica: P | null = null;
for (let r = 30; r <= 140 && !mica; r += 10) {
  for (let k = 0; k < 24 && !mica; k++) {
    const a = (k / 24) * Math.PI * 2;
    const p = { x: ice.x + Math.sin(a) * r, z: ice.z + Math.cos(a) * r };
    const f = exactFrac(p);
    if (f >= 0.25 && f <= 0.55 && maxSlopeDeg(hm, p.x, p.z, 4) < 15) mica = p;
  }
}
const used: P[] = [base, bestPlan.landing as P, ice, bestPlan.relay as P, bestPlan.crater as P];
const hill = solarHillFor(base, used);
const boulder = boulderFor(base, [...used, hill?.site ?? base, hill?.crate ?? base]);
const relayExact = exactEarth(bestPlan.relay as P);
console.log(JSON.stringify({
  ...bestPlan,
  mica,
  micaFrac: mica && exactFrac(mica),
  hill,
  hillSlope: hill && segmentMaxSlopeDeg(hm, hill.crate, hill.site),
  hillFrac: hill && exactFrac(hill.site),
  boulder,
  landingFrac: exactFrac(bestPlan.landing as P),
  baseFrac: exactFrac(base),
  craterFrac: exactFrac(bestPlan.crater as P),
  relayExact,
}, null, 1));
