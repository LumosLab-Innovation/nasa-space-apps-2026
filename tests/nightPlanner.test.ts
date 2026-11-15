import { describe, expect, it, vi } from 'vitest';
import { createState } from '../src/core/gameState';
import { createNightPlanner } from '../src/ui/nightPlanner';
import type { StoryPanelOptions } from '../src/ui/storyPanel';
import { nightDialogue } from '../src/story/nightBudget';
import { linesFor } from '../src/content/content';

function setup(leaks = 0, logs = false) {
  const state = createState();
  state.samples.add('iceRegolith');
  if (logs) { state.dataLogs.add('dustDepth'); state.dataLogs.add('radiation'); }
  for (const id of ['door', 'vent', 'cable'].slice(0, leaks)) state.flags.add(`act5:leak:${id}`);
  let shown: StoryPanelOptions = { title: '' };
  const keys = new Set<string>();
  const dialogue = { busy: false, idleSince: -10000, play: vi.fn((_id: string) => Promise.resolve()) };
  const mica = { setAwake: vi.fn() };
  const pip = { sleep: vi.fn() };
  const done = vi.fn();
  const planner = createNightPlanner(
    { show: (p: StoryPanelOptions) => { shown = p; }, hide: vi.fn() } as never,
    { consume: (k) => keys.delete(k) }, state, dialogue as never, { toast: vi.fn() } as never,
    pip as never, () => mica as never, {} as never, null, vi.fn(), done,
  );
  const key = (k: string) => { keys.add(k); planner.update(0); };
  planner.open();
  return { state, planner, key, dialogue, mica, pip, done, shown: () => shown };
}

describe('night planner decisions and actual consequences', () => {
  it.each([false, true])('previews freezer loss and commits once (has logs=%s)', logs => {
    const t = setup(0, logs);
    t.key('Enter');
    expect(t.shown().options![0]).toContain(logs ? 'lose the most recent' : 'no data log to lose');
    expect(t.shown().options![0]).toContain('100% / 100%');
    t.key('Digit1');
    expect(t.shown().title).toBe('Night plan confirmed');
    expect(t.shown().options).toBeUndefined();
    expect(t.shown().body).toContain('Comms off · Freezer off');
    expect([...t.state.dataLogs]).toEqual(logs ? ['dustDepth'] : []);
    expect(t.state.samples.has('iceRegolith')).toBe(true);
    expect(t.state.flags.has('act5:freezerOff')).toBe(true);
    expect(t.state.flags.has('act5:dataLost')).toBe(logs);
    t.key('Digit1');
    expect([...t.state.dataLogs]).toEqual(logs ? ['dustDepth'] : []);
  });

  it('sleep branch says farewell before shutdown and uses only available speakers all four days', async () => {
    const t = setup();
    t.key('Enter');
    t.key('Digit2');
    expect(t.mica.setAwake).not.toHaveBeenCalled();
    await Promise.resolve();
    expect(t.mica.setAwake).toHaveBeenCalledWith(false);
    for (let day = 0; day < 5; day++) { t.planner.update(8); await Promise.resolve(); }
    expect(t.dialogue.play.mock.calls.map(c => c[0])).toEqual([
      'mica_offer', 'mica_slept', 'pip_sleep_alone', 'night_day2', 'night_day3', 'night_day4_alone',
    ]);
    expect(t.pip.sleep).toHaveBeenCalledWith(true);
    expect(t.done).toHaveBeenCalledOnce();
  });

  it('three sealed leaks preserve every load and log without offering sacrifice', () => {
    const t = setup(3, true);
    t.key('Enter');
    expect(t.shown().title).toBe('Night plan confirmed');
    expect(t.shown().body).toContain('96% / 100%');
    expect(t.state.dataLogs.size).toBe(2);
    expect(t.state.flags.has('act5:keptMica')).toBe(true);
    expect(t.state.flags.has('act5:freezerOff')).toBe(false);
  });

  it('EN and VI never let sleeping MICA or disconnected Houston speak during the night', () => {
    for (const lang of ['en', 'vi'] as const) for (const mica of [false, true]) for (const comms of [false, true]) {
      for (let turn = 1; turn <= 4; turn++) {
        const lines = linesFor(lang)[nightDialogue(turn, { mica, comms, lights: false })];
        expect(lines.length).toBeGreaterThan(0);
        if (!mica) expect(lines.some(l => l.speaker === 'mica')).toBe(false);
        if (!comms) expect(lines.some(l => l.speaker === 'houston')).toBe(false);
        if (turn > 1) expect(lines.some(l => l.speaker === 'pip')).toBe(false);
      }
    }
  });
});
