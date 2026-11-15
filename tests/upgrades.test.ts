import { describe, expect, it } from 'vitest';
import type { ModuleId } from '../src/core/gameState';
import { upgradesFor } from '../src/pip/upgrades';

const mods = (...m: ModuleId[]) => new Set<ModuleId>(m);

describe('Pip upgrades', () => {
  it('no modules gives the base Pip', () => {
    expect(upgradesFor(mods(), new Set())).toEqual({ batteryX: 1, fastCharge: false, heater: false, eds: false, lidarRangeM: 60, map: false });
  });

  it('each module adds exactly its upgrade', () => {
    expect(upgradesFor(mods('solarTower'), new Set())).toMatchObject({ batteryX: 1.5, fastCharge: true, heater: false, eds: false });
    expect(upgradesFor(mods('radiator'), new Set())).toMatchObject({ heater: true, batteryX: 1, eds: false });
    expect(upgradesFor(mods('habitat'), new Set())).toMatchObject({ eds: true, heater: false });
  });

  it('habitat enables EDS cleaning of Pip', () => {
    expect(upgradesFor(mods('habitat'), new Set()).eds).toBe(true);
  });

  it('map and long LIDAR come only from the aligned relay', () => {
    expect(upgradesFor(mods('antenna', 'solarTower', 'radiator', 'habitat'), new Set())).toMatchObject({ map: false, lidarRangeM: 60 });
    expect(upgradesFor(mods(), new Set(['relay:aligned']))).toMatchObject({ map: true, lidarRangeM: 150 });
  });
});
