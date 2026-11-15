import { STORM } from '../config/constants';
import type { Act5Stage } from '../story/act5';

/** 0 calm · 1 wonder · 2 tense · 3 urgent. */
export type MusicLevel = 0 | 1 | 2 | 3;
export type MusicCue = 'none' | 'silence' | 'night' | 'dawn' | 'finale';
export interface MusicTarget { level: MusicLevel; urgency: number; cue: MusicCue }

export interface MusicInputs {
  /** The silent beat when MICA is found (spec: Pip says nothing for 5 s). */
  micaSilent: boolean;
  /** The held breath between CONTACT and the touchdown chord. */
  touchdownHold: boolean;
  storm: 'none' | 'warning' | 'storm';
  stormLeftS: number;
  landing: 'none' | 'cruise' | 'braking' | 'alarm' | 'final' | 'low';
  countdownLeftS: number | null;
  countdownTotalS: number;
  /** Dark crater, a vital under 25 %, towing MICA. */
  tense: boolean;
  /** A few seconds after reaching a new stop or planting the flag. */
  wonder: boolean;
  act5: Act5Stage | null;
}

export const BPM: Record<MusicLevel, number> = { 0: 60, 1: 72, 2: 90, 3: 128 };
const URGENT_MAX_BPM = 140;
const BPM_RATE = 20;

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const T = (level: MusicLevel, urgency = 0, cue: MusicCue = 'none'): MusicTarget => ({ level, urgency, cue });

/** The mood for this moment, highest priority first (plan 5, task 8). */
export function pickMusic(i: Partial<MusicInputs>): MusicTarget {
  if (i.micaSilent || i.touchdownHold) return T(0, 0, 'silence');
  switch (i.act5) {
    case 'liftoff':
    case 'record':
      return T(1, 0, 'finale');
    case 'dawn':
    case 'sendData':
    case 'farewell':
      return T(1, 0, 'dawn');
    case 'night':
    case 'nightPlanner':
      return T(0, 0, 'night');
    default:
      break;
  }
  if (i.storm === 'storm') return T(3, 1);
  if (i.storm === 'warning') return T(3, clamp01(1 - (i.stormLeftS ?? STORM.warningS) / STORM.warningS));
  if (i.landing === 'alarm') return T(3, 1);
  if (i.landing === 'braking') return T(3, 0.5);
  if (i.landing === 'low') return T(3, 0.8);
  if (i.countdownLeftS != null) return T(3, clamp01(1 - i.countdownLeftS / Math.max(1, i.countdownTotalS ?? 90)));
  if (i.tense || i.landing === 'final') return T(2);
  if (i.wonder || i.landing === 'cruise') return T(1);
  return T(0);
}

const QUIET_FACES = new Set(['sad', 'worried', 'scared']);

/** Pip's and MICA's motifs stay out of silences and sad or worried lines (final review, Plan 5). */
export function motifAllowed(cue: MusicCue, face?: string): boolean {
  return cue !== 'silence' && !(face && QUIET_FACES.has(face));
}

/** A grid time that has already passed (the timer stalled) jumps to just ahead of now instead of piling up. */
export function catchUpGrid(next: number, now: number, margin = 0.01): number {
  return next < now ? now + margin : next;
}

export function targetBpm(t: MusicTarget): number {
  if (t.cue === 'night') return 54;
  if (t.level === 3) return BPM[3] + (URGENT_MAX_BPM - BPM[3]) * t.urgency;
  return BPM[t.level];
}

/** Tempo follows the target at most 20 BPM per second, so it never jumps. */
export function stepBpm(cur: number, target: number, dt: number): number {
  const d = target - cur;
  const max = BPM_RATE * dt;
  return Math.abs(d) <= max ? target : cur + Math.sign(d) * max;
}

/** Beat times in [from, to) for a grid that has a beat at phase0. */
export function beatTimes(from: number, to: number, bpm: number, phase0: number): number[] {
  const p = 60 / bpm;
  const out: number[] = [];
  for (let k = Math.ceil((from - phase0) / p - 1e-9); phase0 + k * p < to - 1e-9; k++) out.push(+(phase0 + k * p).toFixed(9));
  return out;
}

/** Beats between the high count ticks: every beat when calm, quarters of a beat when time is almost up. */
export function countTickEvery(urgency: number): number {
  if (urgency < 0.4) return 1;
  if (urgency < 0.75) return 0.5;
  return 0.25;
}

interface KV { getItem(k: string): string | null; setItem(k: string, v: string): void }
const KEY = 'pipmica.music';

export function loadMusicOn(storage: KV | null | undefined): boolean {
  try {
    return storage?.getItem(KEY) !== 'off';
  } catch {
    return true;
  }
}

export function saveMusicOn(storage: KV | null | undefined, on: boolean): void {
  try {
    storage?.setItem(KEY, on ? 'on' : 'off');
  } catch {
    /* private window or blocked storage: the toggle still works for this session */
  }
}
