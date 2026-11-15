import type { GameState } from '../core/gameState';

/**
 * Autosave (Plan 6a): the game state (all Sets) and the story clock in localStorage. Continuing rebuilds the
 * world from it (surfaceScene.restore). Reloading in the middle of Act 5 goes back to the start of Act 5.
 */
export interface SaveData {
  v: 1;
  modules: string[];
  samples: string[];
  dataLogs: string[];
  flags: string[];
  cards: string[];
  clockMs: number;
  savedAt: number;
}

export interface RestorePlan {
  modules: string[];
  samples: string[];
  dataLogs: string[];
  flags: string[];
  cards: string[];
  /** null: keep the mission start (Act 5 jumps the clock to its real night itself). */
  clockMs: number | null;
  where: 'landing' | 'camp';
}

const KEY = 'pipmica.save';
export const CONTINUE_KEY = 'pipmica.continue';
const MODULE_IDS = ['solarTower', 'radiator', 'habitat', 'antenna'];
const SAMPLE_IDS = ['anorthosite', 'breccia', 'glassBeads', 'regolith', 'freshCrater', 'iceRegolith'];
const LOG_IDS = ['tempSunShade', 'dustDepth', 'sunAngleShadow', 'radiation', 'commDelay'];

/** What each system restores quietly on continue (so nothing already done is offered or replayed). */
export interface RestoreSteps {
  micaFound: boolean; micaAwakeSilent: boolean; micaToldUs: boolean; shadowDone: boolean; antennaDone: boolean;
  flagPlanted: boolean; winchDone: boolean; cargoLanded: boolean;
  /** The first meeting with Pip already happened (Plan 7). */
  pipMet: boolean;
  /** Where the rover is: still stowed in the lander (lowered after the meeting) or parked at camp. */
  roverAt: 'hls' | 'camp';
}

export function restoreSteps(s: GameState): RestoreSteps {
  const f = s.flags;
  return {
    micaFound: f.has('act3:micaFound'),
    micaAwakeSilent: f.has('act4:micaAwake'),
    micaToldUs: f.has('act4:memory'),
    shadowDone: s.dataLogs.has('sunAngleShadow'),
    antennaDone: s.dataLogs.has('commDelay'),
    flagPlanted: f.has('flag:planted'),
    winchDone: s.modules.has('solarTower') || f.has('dialogue:winch_done:done'),
    cargoLanded: f.has('cargo:landed'),
    pipMet: f.has('pip:met') || f.has('dialogue:meetPip:done'),
    roverAt: f.has('pip:met') || f.has('dialogue:meetPip:done') ? 'camp' : 'hls',
  };
}

/** Act 5 is one checkpoint: no autosave between its start and MICA's data reaching Houston. */
export function shouldAutosave(flags: Set<string>): boolean {
  return !flags.has('act5:started') || flags.has('ending:dataSent');
}

export function serialize(s: GameState, clockMs: number): SaveData {
  return {
    v: 1,
    modules: [...s.modules],
    samples: [...s.samples],
    dataLogs: [...s.dataLogs],
    flags: [...s.flags],
    cards: [...s.unlockedCards],
    clockMs,
    savedAt: Date.now(),
  };
}

const strings = (x: unknown): x is string[] => Array.isArray(x) && x.every((v) => typeof v === 'string');

export function deserialize(json: string | null): SaveData | null {
  if (!json) return null;
  try {
    const d = JSON.parse(json) as Partial<SaveData>;
    if (!d || d.v !== 1) return null;
    if (!strings(d.modules) || !strings(d.samples) || !strings(d.dataLogs) || !strings(d.flags) || !strings(d.cards)) return null;
    if (typeof d.clockMs !== 'number' || !Number.isFinite(d.clockMs)) return null;
    return { v: 1, modules: d.modules, samples: d.samples, dataLogs: d.dataLogs, flags: d.flags, cards: d.cards, clockMs: d.clockMs, savedAt: Number(d.savedAt) || 0 };
  } catch {
    return null;
  }
}

/** Act 5 progress (notch, leaks, night choices, ending) is dropped: Act 5 starts again from its title card. */
export function prepareRestore(d: SaveData): RestorePlan {
  const inAct5 = d.flags.includes('act5:started');
  const flags = inAct5 ? d.flags.filter((f) => !f.startsWith('act5:') && !f.startsWith('ending:')) : [...d.flags];
  const later = d.modules.some((m) => MODULE_IDS.includes(m)) || flags.includes('act3:micaFound') || flags.some((f) => f.startsWith('act4:'));
  return {
    modules: d.modules.filter((m) => MODULE_IDS.includes(m)),
    samples: d.samples.filter((m) => SAMPLE_IDS.includes(m)),
    dataLogs: d.dataLogs.filter((m) => LOG_IDS.includes(m)),
    flags,
    cards: [...d.cards],
    clockMs: inAct5 ? null : d.clockMs,
    where: later ? 'camp' : 'landing',
  };
}

const MILESTONE_FLAGS = [
  'landing:done', 'flag:planted', 'relay:aligned', 'cargo:landed', 'storm:sheltered', 'storm:rescued',
  'act3:micaFound', 'act4:micaAwake', 'act4:memory', 'act4:ice', 'act5:started', 'ending:dataSent',
];

/** Changes when something worth saving happened (a module, sample, log or story milestone). */
export function milestoneKey(s: GameState): string {
  const f = MILESTONE_FLAGS.filter((x) => s.flags.has(x)).join(',');
  return `${s.modules.size}|${s.samples.size}|${s.dataLogs.size}|${f}`;
}

interface KV { getItem(k: string): string | null; setItem(k: string, v: string): void; removeItem(k: string): void }

export function writeSave(storage: KV | null | undefined, s: GameState, clockMs: number): void {
  try {
    storage?.setItem(KEY, JSON.stringify(serialize(s, clockMs)));
  } catch {
    /* blocked or full storage: play on without saving */
  }
}

export function loadSave(storage: KV | null | undefined): SaveData | null {
  try {
    return deserialize(storage?.getItem(KEY) ?? null);
  } catch {
    return null;
  }
}

export function clearSave(storage: KV | null | undefined): void {
  try {
    storage?.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
