import { CRATES, HLS_POS } from '../world/zones';

/**
 * The first meeting with Pip (Plan 7, spec §4): Pip peeks out from behind a crate, the player overhears it
 * muttering on its short-range radio, then says hello. Pure rules; pipMeetingSystem.ts drives the scene.
 */
export type MeetStage = 'hidden' | 'peeking' | 'overheard' | 'greeted' | 'done';

export const MEET = { peekM: 45, overhearM: 20 } as const;

const crate = CRATES.find((c) => c.moduleId === 'habitat')!;
const away = (() => {
  const dx = crate.x - HLS_POS.x;
  const dz = crate.z - HLS_POS.z;
  const d = Math.hypot(dx, dz);
  return { x: dx / d, z: dz / d };
})();

/** Behind the habitat crate, 1.5 m on the side away from the lander. */
export const PIP_HIDE_SPOT = { x: crate.x + away.x * 1.5, z: crate.z + away.z * 1.5 };
/** Where Pip leans out to look at the lander (2 m to the side of the hiding spot). */
export const PIP_PEEK_SPOT = { x: PIP_HIDE_SPOT.x + away.z * 2, z: PIP_HIDE_SPOT.z - away.x * 2 };

export function meetStep(stage: MeetStage, s: { playerDistM: number; ePressed: boolean; dialogueBusy: boolean; locked: boolean }): MeetStage {
  switch (stage) {
    case 'hidden':
      if (s.playerDistM <= MEET.overhearM) return 'overheard';
      return s.playerDistM <= MEET.peekM ? 'peeking' : 'hidden';
    case 'peeking':
      return s.playerDistM <= MEET.overhearM ? 'overheard' : 'peeking';
    case 'overheard':
      return s.ePressed && !s.locked ? 'greeted' : 'overheard';
    case 'greeted':
      return s.dialogueBusy ? 'greeted' : 'done';
    default:
      return 'done';
  }
}

/** True once the player has met Pip: before that, Pip says nothing (journey stops, companion lines). */
export const pipKnown = (flags: Set<string>): boolean => flags.has('pip:met') || flags.has('dialogue:meetPip:done');
