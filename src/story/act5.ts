import { tr } from '../i18n/i18n';

/**
 * Act 5 "The Long Shadow" and the ending as a pure state machine (spec v3 §8, v2 Act 5 + K).
 * The scene (act5System.ts) does the clock jumps, dialogue and panels; this only decides what comes next.
 */
export type Act5Stage = 'waiting' | 'titleCard' | 'prep' | 'nightPlanner' | 'night' | 'dawn' | 'sendData' | 'farewell' | 'liftoff' | 'record';
export type Act5Event = 'start' | 'titleDone' | 'beginNight' | 'plannerDone' | 'nightDone' | 'dawnDone' | 'dataSent' | 'boarded' | 'liftoffDone';

const NEXT: Record<Act5Stage, Partial<Record<Act5Event, Act5Stage>>> = {
  waiting: { start: 'titleCard' },
  titleCard: { titleDone: 'prep' },
  prep: { beginNight: 'nightPlanner' },
  nightPlanner: { plannerDone: 'night' },
  night: { nightDone: 'dawn' },
  dawn: { dawnDone: 'sendData' },
  sendData: { dataSent: 'farewell' },
  farewell: { boarded: 'liftoff' },
  liftoff: { liftoffDone: 'record' },
  record: {},
};

export interface Act5StartState {
  memory: boolean;
  inCamp: boolean;
  dialogueBusy: boolean;
  towing: boolean;
  locked: boolean;
  /** Radiation storm warning or storm in progress (final review, Plan 4). */
  stormActive: boolean;
}

export class Act5Director {
  stage: Act5Stage = 'waiting';

  canStart(s: Act5StartState): boolean {
    return this.stage === 'waiting' && s.memory && s.inCamp && !s.dialogueBusy && !s.towing && !s.locked && !s.stormActive;
  }

  next(ev: Act5Event): Act5Stage {
    const to = NEXT[this.stage][ev];
    if (to) this.stage = to;
    return this.stage;
  }
}

/** What still stands between the player and the long night (empty = ready). */
export function nightBlockers(s: { notchChosen: boolean; ice: boolean }): string[] {
  const out: string[] = [];
  if (!s.notchChosen) out.push(tr('choose where the Sun will rise'));
  if (!s.ice) out.push(tr('sample the Dark Crater ice'));
  return out;
}
