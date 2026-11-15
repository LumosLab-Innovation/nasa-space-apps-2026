import { describe, expect, it } from 'vitest';
import { createState } from '../src/core/gameState';
import { plumeVelocities } from '../src/fx/ballistic';
import { LUNAR_G } from '../src/config/constants';
import { missionRecord } from '../src/story/ending';

describe('mission record (v2 K.4)', () => {
  it('mission record lists counts and every decision from flags', () => {
    const s = createState();
    s.modules.add('solarTower');
    s.modules.add('habitat');
    s.samples.add('iceRegolith');
    s.dataLogs.add('radiation');
    s.unlockedCards.add('eds');
    for (const f of ['storm:sheltered', 'act5:notchCorrect', 'act5:leak:door', 'act5:leak:vent', 'act5:keptMica', 'act5:commsOff', 'act5:dataLost', 'flag:planted', 'ending:dataSent'])
      s.flags.add(f);
    const r = missionRecord(s, 20);
    expect(r.lines.join('\n')).toMatch(/Modules 2\/4/);
    expect(r.lines.join('\n')).toMatch(/Samples 1\/6/);
    expect(r.lines.join('\n')).toMatch(/Discoveries 1\/20/);
    const d = r.decisions.join('\n');
    expect(d).toMatch(/sheltered in time/);
    expect(d).toMatch(/right notch/);
    expect(d).toMatch(/2\/3/);
    expect(d).toMatch(/kept MICA warm/);
    expect(d).toMatch(/comms off/i);
    expect(d).toMatch(/one data log/);
    expect(d).toMatch(/flag/i);
    expect(d).toMatch(/MICA's data reached Houston/);
  });

  it('record works for a minimal run', () => {
    const r = missionRecord(createState(), 20);
    expect(r.lines.length).toBeGreaterThan(0);
    expect(r.decisions.join('\n')).toMatch(/not recorded/);
  });

  it('liftoff dust flies in long low ballistic arcs', () => {
    let seed = 7;
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const v = plumeVelocities(200, 25, rand);
    expect(v).toHaveLength(200);
    for (const g of v) {
      expect(g.vy).toBeGreaterThan(0);
      const h = Math.hypot(g.vx, g.vz);
      const elev = (Math.atan2(g.vy, h) * 180) / Math.PI;
      expect(elev).toBeLessThanOrEqual(15.0001);
      // No drag: range = v² sin 2θ / g, tens of metres or more for the fast grains.
    }
    const best = Math.max(...v.map((g) => (2 * g.vy * Math.hypot(g.vx, g.vz)) / LUNAR_G));
    expect(best).toBeGreaterThan(50);
  });
});
