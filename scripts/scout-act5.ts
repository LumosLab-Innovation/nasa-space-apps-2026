// Scouts the real Act 5 moments at camp (npx vite-node scripts/scout-act5.ts).
import { planMission } from '../src/data/mission';
import { sampleAt } from '../src/data/ephemeris';
import { horizonElevationDeg, isSunlit, earthVisible } from '../src/world/lighting';
import { zone } from '../src/world/zones';
import { realEphemeris, realHeightmap } from '../tests/helpers/realWorld';
const e = realEphemeris();
const hm = realHeightmap();
const m = planMission(e);
const b = zone('base');
const iso = (t: number) => new Date(t).toISOString().slice(0, 16) + 'Z';
const H = 3600_000;
const last = e.sun[e.sun.length - 1].t;
let prevSun: boolean | null = null, prevEarth: boolean | null = null;
const ev: string[] = [];
for (let t = m.start; t <= Math.min(last, m.start + 120 * 24 * H); t += H) {
  const s = sampleAt(e.sun, t), ea = sampleAt(e.earth, t);
  const sl = isSunlit(hm, b.x, b.z, s);
  const el = earthVisible(hm, b.x, b.z, ea);
  if (sl !== prevSun) ev.push(`${iso(t)} camp sun ${sl ? 'UP' : 'DOWN'} el=${s.el.toFixed(2)} az=${s.az.toFixed(0)} hz=${horizonElevationDeg(hm, b.x, b.z, s.az, 0.5).toFixed(2)}`);
  if (el !== prevEarth) ev.push(`${iso(t)} camp earth ${el ? 'UP' : 'DOWN'} el=${ea.el.toFixed(2)}`);
  prevSun = sl; prevEarth = el;
}
console.log(JSON.stringify({ start: iso(m.start), earthSet: iso(m.earthSet), sunSet: iso(m.sunSet), dawn: iso(m.dawn) }));
console.log(ev.slice(0, 80).join('\n'));
