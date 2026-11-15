import { tracksUnlocked, type GameState } from '../core/gameState';

export type MicaStage = 'hidden' | 'tracksSeen' | 'following' | 'found';
type P2 = { x: number; z: number };

export const NOTICE_TRACKS_M = 15;
export const REACH_TRACKS_M = 4;
export const FIND_MICA_M = 6;

const dist = (a: P2, b: P2) => Math.hypot(a.x - b.x, a.z - b.z);

/** Act 3 progression (spec §6). Finding Mica always works, even if the tracks were skipped. */
export function nextMicaStage(stage: MicaStage, s: GameState, player: P2, tracksStart: P2, micaPos: P2): MicaStage {
  if (stage === 'found') return 'found';
  if (dist(player, micaPos) < FIND_MICA_M) return 'found';
  if (stage === 'hidden' && tracksUnlocked(s) && dist(player, tracksStart) < NOTICE_TRACKS_M) return 'tracksSeen';
  if (stage === 'tracksSeen' && dist(player, tracksStart) < REACH_TRACKS_M) return 'following';
  return stage;
}
