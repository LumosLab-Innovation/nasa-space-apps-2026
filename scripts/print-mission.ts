// Prints the mission window chosen from the cached JPL Horizons data (npx vite-node scripts/print-mission.ts).
import { readFileSync } from 'node:fs';
import { planMission } from '../src/data/mission';
const load = (n: string) => JSON.parse(readFileSync(`public/data/ephemeris/${n}.json`, 'utf8'));
const m = planMission({ sun: load('sun'), earth: load('earth'), source: 'horizons' });
const iso = (t: number) => new Date(t).toISOString().slice(0, 16) + 'Z';
console.log(JSON.stringify({ start: iso(m.start), minSunElDeg: m.minSunElDeg.toFixed(2), earthSet: iso(m.earthSet), sunSet: iso(m.sunSet), dawn: iso(m.dawn) }));
