export type ModuleId = 'solarTower' | 'radiator' | 'habitat' | 'antenna';
export type SampleId = 'anorthosite' | 'breccia' | 'glassBeads' | 'regolith' | 'freshCrater' | 'iceRegolith';
export type DataLogId = 'tempSunShade' | 'dustDepth' | 'sunAngleShadow' | 'radiation' | 'commDelay';

export interface GameState {
  modules: Set<ModuleId>;
  samples: Set<SampleId>;
  dataLogs: Set<DataLogId>;
  flags: Set<string>;
  unlockedCards: Set<string>;
}

export function createState(): GameState {
  return { modules: new Set(), samples: new Set(), dataLogs: new Set(), flags: new Set(), unlockedCards: new Set() };
}

function addOnce<T>(set: Set<T>, value: T): boolean {
  if (set.has(value)) return false;
  set.add(value);
  return true;
}

export const installModule = (s: GameState, id: ModuleId) => addOnce(s.modules, id);
export const addSample = (s: GameState, id: SampleId) => addOnce(s.samples, id);
export const logData = (s: GameState, id: DataLogId) => addOnce(s.dataLogs, id);
export const setFlag = (s: GameState, flag: string) => addOnce(s.flags, flag);
export const unlockCard = (s: GameState, cardId: string) => addOnce(s.unlockedCards, cardId);

/** Mica's tracks become noticeable after 2 modules and 3 samples (spec §6 Act 3). */
export function tracksUnlocked(s: GameState): boolean {
  return s.modules.size >= 2 && s.samples.size >= 3;
}
