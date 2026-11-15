import { describe, expect, it } from 'vitest';
import { createState } from '../src/core/gameState';
import { MEET, PIP_HIDE_SPOT, meetStep, type MeetStage } from '../src/story/pipMeeting';
import { restoreSteps } from '../src/save/save';
import { CRATES, HLS_POS } from '../src/world/zones';

const s = (playerDistM: number, ePressed = false, dialogueBusy = false) => ({ playerDistM, ePressed, dialogueBusy, locked: false });

describe('first meeting with Pip (plan 7, task 1)', () => {
  it('Pip hides behind the habitat crate, on the far side from the lander', () => {
    const crate = CRATES.find((c) => c.moduleId === 'habitat')!;
    expect(Math.hypot(PIP_HIDE_SPOT.x - crate.x, PIP_HIDE_SPOT.z - crate.z)).toBeCloseTo(1.5, 1);
    expect(Math.hypot(PIP_HIDE_SPOT.x - HLS_POS.x, PIP_HIDE_SPOT.z - HLS_POS.z)).toBeGreaterThan(Math.hypot(crate.x - HLS_POS.x, crate.z - HLS_POS.z));
  });

  it('stages advance by distance and E, never backwards', () => {
    let st: MeetStage = 'hidden';
    st = meetStep(st, s(80));
    expect(st).toBe('hidden');
    st = meetStep(st, s(MEET.peekM));
    expect(st).toBe('peeking');
    st = meetStep(st, s(30, true));
    expect(st).toBe('peeking'); // E does nothing before Pip is heard
    st = meetStep(st, s(MEET.overhearM));
    expect(st).toBe('overheard');
    st = meetStep(st, s(60));
    expect(st).toBe('overheard'); // walking away does not undo it
    st = meetStep(st, s(10, true));
    expect(st).toBe('greeted');
    st = meetStep(st, s(10, false, true));
    expect(st).toBe('greeted');
    st = meetStep(st, s(10, false, false));
    expect(st).toBe('done');
  });

  it('meeting completes once from any approach; saved or skipped games count as met', () => {
    // Rushing straight in still passes through 'overheard' before E works.
    let st: MeetStage = meetStep('hidden', s(5, true));
    expect(st).toBe('overheard');
    st = meetStep(st, s(5, true));
    expect(st).toBe('greeted');
    expect(meetStep('done', s(5, true))).toBe('done');
    const saved = createState();
    saved.flags.add('dialogue:meetPip:done');
    expect(restoreSteps(saved).pipMet).toBe(true);
    const met = createState();
    met.flags.add('pip:met');
    expect(restoreSteps(met).pipMet).toBe(true);
    expect(restoreSteps(createState()).pipMet).toBe(false);
  });
});

import { pipKnown } from '../src/story/pipMeeting';

describe('nothing Pip says plays before the meeting', () => {
  it('journey stops and Pip companion lines wait until Pip is met', () => {
    expect(pipKnown(new Set())).toBe(false);
    expect(pipKnown(new Set(['pip:met']))).toBe(true);
    expect(pipKnown(new Set(['dialogue:meetPip:done']))).toBe(true);
  });
});

describe('continuing a save after the meeting (plan 7 final checks)', () => {
  it('restore lets Pip go: it follows the player instead of staying at its hiding spot', async () => {
    const { createPipMeeting } = await import('../src/story/pipMeetingSystem');
    const state = createState();
    const pip = { mode: 'follow', gotoTarget: undefined as unknown, root: { position: { x: 0, z: 0 } }, setFace() {}, wave() {} };
    const meeting = createPipMeeting({ state, dialogue: { busy: false, play: async () => {} }, hud: { toast() {} }, pip } as never);
    expect(pip.mode).toBe('goto'); // fresh scene: Pip waits behind the crate
    state.flags.add('pip:met'); // the save is applied after the scene exists
    meeting.restore();
    expect(meeting.stage).toBe('done');
    expect(pip.mode).toBe('follow');
  });
});
