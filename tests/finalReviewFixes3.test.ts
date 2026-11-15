import { describe, expect, it } from 'vitest';
import { TIME_SCALE } from '../src/config/constants';
import { planMission } from '../src/data/mission';
import { resolveQ } from '../src/pip/qCommand';
import { Winch, winchHoldsPip, winchPromptActive } from '../src/challenges/winch';
import { iceLines } from '../src/challenges/darkCrater';
import { relayPrompt } from '../src/challenges/earthRelay';
import { TRACKS_PATH, zone } from '../src/world/zones';
import { realEphemeris } from './helpers/realWorld';

describe('Critical 1: a stuck Pip cannot be freed without the winch', () => {
  it('the winch holds Pip while stuck, anchored or reeling', () => {
    expect(winchHoldsPip('idle')).toBe(false);
    expect(winchHoldsPip('stuck')).toBe(true);
    expect(winchHoldsPip('anchored')).toBe(true);
    expect(winchHoldsPip('reeling')).toBe(true);
    expect(winchHoldsPip('done')).toBe(false);
  });
  it('Q does not toggle wait/come while Pip is busy with a task', () => {
    expect(resolveQ(null, 'task')).toBeNull();
    expect(resolveQ(null, 'follow')).toBe('wait');
    expect(resolveQ(null, 'wait')).toBe('come');
    expect(resolveQ('pull', 'task')).toBe('pull');
  });
});

describe('Important 2/3: the winch prompt and its Q only act near the hill', () => {
  it('prompt is active only within 15 m of the anchor or of Pip', () => {
    expect(winchPromptActive('anchored', 40, 40)).toBe(false);
    expect(winchPromptActive('anchored', 10, 40)).toBe(true);
    expect(winchPromptActive('anchored', 40, 12)).toBe(true);
    expect(winchPromptActive('idle', 1, 1)).toBe(false);
  });
});

describe('Important 4 and 8: the winch can be reset (rescue) or finished (demo skip)', () => {
  it('reset returns a stuck or reeling winch to idle with a full rope', () => {
    const w = new Winch(40);
    w.onPipSlip(1);
    w.plantAnchor(1);
    w.startReel();
    w.reel(5);
    w.reset();
    expect(w.state).toBe('idle');
    expect(w.ropeLeftM).toBe(40);
  });
  it('finishNow completes the winch from any state', () => {
    const w = new Winch();
    w.onPipSlip(1);
    w.finishNow();
    expect(w.state).toBe('done');
  });
});

describe('Important 5: following the tracks does not wander into the Dark Crater', () => {
  it('every track point stays at least 5 m outside the crater edge', () => {
    const d = zone('darkCrater');
    for (const p of TRACKS_PATH) expect(Math.hypot(p.x - d.x, p.z - d.z)).toBeGreaterThanOrEqual(d.radius + 5);
  });
});

describe('Important 6: ice dialogue matches what has happened', () => {
  it('ice found before MICA wakes is Pip-only; MICA thanks only when awake', () => {
    expect(iceLines('found', false)).toBe('ice_found_alone');
    expect(iceLines('found', true)).toBe('ice_found');
    expect(iceLines('micaWakes', false)).toBe('mica_ice');
    expect(iceLines('micaWakes', true)).toBe('mica_ice_done');
  });
});

describe('Important 7: Earth stays up for a whole playthrough, and the relay explains when it is not', () => {
  it('relay prompt explains instead of offering E while Earth is hidden', () => {
    expect(relayPrompt('packed', true)).toBe('E — deploy the comms relay');
    expect(relayPrompt('packed', false)).toMatch(/Earth is below the horizon/);
  });
  it('the real Earth window covers at least 3 hours of real play at the game time scale', () => {
    const m = planMission(realEphemeris());
    const simHours = (m.earthSet - m.start) / 3600_000;
    expect(simHours / TIME_SCALE).toBeGreaterThanOrEqual(3);
  });
});
