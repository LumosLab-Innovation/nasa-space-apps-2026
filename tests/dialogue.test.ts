import { describe, expect, it } from 'vitest';
import { createState } from '../src/core/gameState';
import { DialogueRunner, houstonDelayMs, type Script } from '../src/dialogue/runner';
import { LINES } from '../src/content/lines.en';

const script: Script = {
  test: [
    { speaker: 'pip', text: 'one' },
    { speaker: 'houston', text: 'two' },
    { speaker: 'pip', text: 'three', setFlag: 'x' },
  ],
};

describe('DialogueRunner', () => {
  it('Houston round-trip delay is 2564 ms', () => {
    expect(houstonDelayMs()).toBe(2564);
  });
  it('runs to the end, then reports done', () => {
    const s = createState();
    const r = new DialogueRunner(script, s);
    expect(r.start('test').text).toBe('one');
    expect(r.active).toBe(true);
    r.next();
    r.next();
    expect(r.next()).toBeNull();
    expect(r.active).toBe(false);
    expect(s.flags.has('dialogue:test:done')).toBe(true);
  });
  it('sets a line flag when that line is shown', () => {
    const s = createState();
    const r = new DialogueRunner(script, s);
    r.start('test');
    r.next();
    expect(s.flags.has('x')).toBe(false);
    r.next();
    expect(s.flags.has('x')).toBe(true);
  });
  it('gives Houston lines the light-delay pause by default', () => {
    const r = new DialogueRunner(script, createState());
    r.start('test');
    expect(r.next()!.pauseBeforeMs).toBe(2564);
  });
  it('throws for an unknown dialogue id', () => {
    expect(() => new DialogueRunner(script, createState()).start('nope')).toThrow();
  });
});

describe('slice script', () => {
  const ids = ['meetPip', 'silenceExplain', 'hammerFeatherIntro', 'hammerFeatherResult', 'shadowQuiz', 'firstSample', 'houstonWelcome',
    'moduleDone', 'tracksFound', 'followTracks', 'micaFound', 'micaIdentify', 'micaWake'];
  it('contains every slice dialogue, none empty', () => {
    for (const id of ids) expect(LINES[id]?.length, id).toBeGreaterThan(0);
  });
  it('opens the Mica discovery with 5 seconds of silence', () => {
    expect(LINES.micaFound[0]).toMatchObject({ face: 'dots', pauseBeforeMs: 5000, text: '' });
  });
  it('keeps the time-jump bridge separate from the Houston/Pip lines patched with ephemeris data', () => {
    expect(LINES.act5_bridge[0].speaker).toBe('player');
    expect(LINES.act5_news[0].speaker).toBe('houston');
    expect(LINES.act5_news[3].speaker).toBe('pip');
  });
});
