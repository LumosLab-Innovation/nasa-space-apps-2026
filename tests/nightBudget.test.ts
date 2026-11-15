import { describe, expect, it } from 'vitest';
import { HEAT_LEAKS, leaksFixed } from '../src/story/heatLeaks';
import { canThermalize } from '../src/ui/thermalColor';
import { SHELTER_POS } from '../src/world/zones';

describe('heat leaks on the shelter (v2 scene 5.2, task 2)', () => {
  it('the three leaks sit on the shelter shell, at least 3 m from each other', () => {
    expect(HEAT_LEAKS.map((l) => l.id)).toEqual(['door', 'vent', 'cable']);
    for (const l of HEAT_LEAKS) expect(Math.hypot(l.x - SHELTER_POS.x, l.z - SHELTER_POS.z)).toBeCloseTo(3.2, 5);
    for (let i = 0; i < 3; i++)
      for (let j = i + 1; j < 3; j++) expect(Math.hypot(HEAT_LEAKS[i].x - HEAT_LEAKS[j].x, HEAT_LEAKS[i].z - HEAT_LEAKS[j].z)).toBeGreaterThanOrEqual(3);
  });

  it('leak count reads back from flags', () => {
    expect(leaksFixed(new Set())).toBe(0);
    expect(leaksFixed(new Set(['act5:leak:door', 'act5:leak:cable', 'other']))).toBe(2);
  });

  it('hot spots keep their own glowing material in thermal view', () => {
    const mesh = (metadata: unknown) => ({ getClassName: () => 'Mesh', infiniteDistance: false, material: {}, metadata });
    expect(canThermalize(mesh(null))).toBe(true);
    expect(canThermalize(mesh({ hotSpot: true }))).toBe(false);
  });
});

import { NIGHT, budget, nightDays, resolveNight } from '../src/story/nightBudget';
import { findCampNight } from '../src/data/night';
import { planMission } from '../src/data/mission';
import { zone } from '../src/world/zones';
import { realEphemeris, realHeightmap } from './helpers/realWorld';

describe('night energy budget and MICA\'s choice (v2 scenes 5.2, 5.5)', () => {
  const all = { lights: true, comms: true, mica: true };
  const bare = { lights: false, comms: false, mica: true };

  it('the real night is 4 night-days', () => {
    const e = realEphemeris();
    const n = findCampNight(e, realHeightmap(), zone('base'), planMission(e).start + 7 * 24 * 3600_000)!;
    expect(nightDays(n.hours)).toBe(4);
  });

  it('with no leaks fixed, keeping everyone warm is not enough even with lights and comms off', () => {
    expect(budget(bare, 0, 4).enough).toBe(false);
    expect(budget(bare, 0, 4).need).toBe(4 * (NIGHT.shelterHeat + NIGHT.freezer + NIGHT.pipWarm + NIGHT.micaWarm));
  });

  it('fixing all three leaks keeps all three robots warm with lights and comms on', () => {
    expect(budget(all, 3, 4).enough).toBe(true);
  });

  it('keeping MICA with a deficit never blocks and costs one data log', () => {
    const r = resolveNight(all, 0, 4);
    expect(r.plan).toEqual({ lights: false, comms: false, mica: true, freezer: false });
    expect(r.dataLost).toBe(true);
    expect(budget(r.plan, 0, 4)).toEqual({ need: 100, enough: true });
  });

  it('letting MICA sleep removes the deficit when one leak is fixed', () => {
    const r = resolveNight({ lights: false, comms: false, mica: false }, 1, 4);
    expect(budget(r.plan, 1, 4).enough).toBe(true);
    expect(r.dataLost).toBe(false);
  });

  it('a plan that already fits is left alone', () => {
    expect(resolveNight(all, 3, 4)).toEqual({ plan: all, dataLost: false });
  });

  it('every choice for the shipped four-day night balances after resolution', () => {
    for (let leaks = 0; leaks <= 3; leaks++) for (const lights of [true, false]) for (const comms of [true, false]) for (const mica of [true, false]) {
      const result = resolveNight({ lights, comms, mica }, leaks, 4);
      expect(budget(result.plan, leaks, 4).enough).toBe(true);
      expect(result.dataLost).toBe(result.plan.freezer === false);
      expect(result.plan.mica).toBe(mica);
    }
  });
});
