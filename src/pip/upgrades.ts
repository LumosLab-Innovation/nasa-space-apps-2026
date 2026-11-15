import type { ModuleId } from '../core/gameState';

/**
 * Pip grows with the base (spec v3 §7.1): each installed module unlocks one ability, which opens new
 * parts of the map. The camp antenna talks to Houston; only the aligned relay on Earth View Peak gives
 * long-range LIDAR and the map.
 */
export interface Upgrades {
  batteryX: number;
  fastCharge: boolean;
  heater: boolean;
  eds: boolean;
  lidarRangeM: number;
  map: boolean;
}

export const UPGRADE_TEXT: Record<ModuleId, string> = {
  solarTower: 'Pip upgrade: bigger battery + fast charging at camp',
  radiator: 'Pip upgrade: heater — stay within 6 m of Pip in the Dark Crater',
  habitat: "Pip upgrade: EDS dust cleaning at camp (stand by Pip, press E)",
  antenna: 'Camp antenna online: Houston can hear you from camp when Earth is up',
};

export function upgradesFor(modules: Set<ModuleId>, flags: Set<string>): Upgrades {
  const relay = flags.has('relay:aligned');
  return {
    batteryX: modules.has('solarTower') ? 1.5 : 1,
    // Cargo-lander ejecta on unstowed panels (act 2E) turn fast charging off until they are brushed.
    fastCharge: modules.has('solarTower') && !flags.has('cargo:towerDusty'),
    heater: modules.has('radiator'),
    eds: modules.has('habitat'),
    lidarRangeM: relay ? 150 : 60,
    map: relay,
  };
}
