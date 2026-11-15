import { sampleAt } from '../src/data/ephemeris';
import { horizonElevationDeg } from '../src/world/lighting';
import { zone } from '../src/world/zones';
import { realEphemeris, realHeightmap } from '../tests/helpers/realWorld';
const e = realEphemeris(); const hm = realHeightmap(); const b = zone('base');
const t0 = Date.parse('2028-11-29T12:00Z'), t1 = Date.parse('2028-12-03T18:00Z');
for (let t = t0; t <= t1; t += 3 * 3600_000) {
  const s = sampleAt(e.sun, t); const hz = horizonElevationDeg(hm, b.x, b.z, s.az, 0.5);
  console.log(new Date(t).toISOString().slice(5, 16), 'az', s.az.toFixed(1), 'el', s.el.toFixed(2), 'hz', hz.toFixed(2), s.el > hz ? 'LIT' : '-');
}
let row = '';
for (let az = 90; az <= 180; az += 5) row += `${az}:${horizonElevationDeg(hm, b.x, b.z, az, 0.5).toFixed(2)} `;
console.log(row);
const ea = (t: number) => sampleAt(e.earth, t);
console.log('earth 11-29', ea(Date.parse('2028-11-29T20:00Z')), 'earth 12-03', ea(Date.parse('2028-12-03T10:00Z')));
