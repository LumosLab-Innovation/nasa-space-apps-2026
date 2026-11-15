import { describe, expect, it } from 'vitest';
import { BPM, beatTimes, countTickEvery, loadMusicOn, pickMusic, saveMusicOn, stepBpm, targetBpm } from '../src/audio/musicMood';
import { CHORDS, PIP_MOTIF, THEME, midiToHz } from '../src/audio/musicScore';

describe('adaptive music: choosing the mood (plan 5, task 8)', () => {
  it('silence beats the storm', () => {
    expect(pickMusic({ micaSilent: true, storm: 'storm', stormLeftS: 20 }).cue).toBe('silence');
    expect(pickMusic({ touchdownHold: true, landing: 'low' }).cue).toBe('silence');
  });

  it('storm warning is urgent and urgency rises toward zero', () => {
    const early = pickMusic({ storm: 'warning', stormLeftS: 150 });
    expect(early.level).toBe(3);
    expect(early.urgency).toBeCloseTo(0, 5);
    const late = pickMusic({ storm: 'warning', stormLeftS: 15 });
    expect(late.level).toBe(3);
    expect(late.urgency).toBeGreaterThanOrEqual(0.9);
    expect(pickMusic({ storm: 'storm', stormLeftS: 30 }).urgency).toBe(1);
    expect(targetBpm(late)).toBeGreaterThan(targetBpm(early));
    expect(targetBpm(pickMusic({ storm: 'storm', stormLeftS: 1 }))).toBe(140);
  });

  it('calm by default at 60 BPM', () => {
    const t = pickMusic({});
    expect(t).toEqual({ level: 0, urgency: 0, cue: 'none' });
    expect(targetBpm(t)).toBe(60);
    expect(BPM).toEqual({ 0: 60, 1: 72, 2: 90, 3: 128 });
  });

  it('act 5 cues', () => {
    expect(pickMusic({ act5: 'night' }).cue).toBe('night');
    expect(pickMusic({ act5: 'nightPlanner' }).cue).toBe('night');
    expect(pickMusic({ act5: 'dawn' }).cue).toBe('dawn');
    expect(pickMusic({ act5: 'farewell' }).cue).toBe('dawn');
    expect(pickMusic({ act5: 'liftoff' }).cue).toBe('finale');
    expect(pickMusic({ act5: 'record' }).cue).toBe('finale');
    // The prep before the night is ordinary play.
    expect(pickMusic({ act5: 'prep' }).cue).toBe('none');
  });

  it('landing below 30 m is urgent, above is tense; braking is urgent, cruising is wonder', () => {
    expect(pickMusic({ landing: 'low' }).level).toBe(3);
    expect(pickMusic({ landing: 'final' }).level).toBe(2);
    expect(pickMusic({ landing: 'braking' }).level).toBe(3);
    expect(pickMusic({ landing: 'alarm' }).urgency).toBe(1);
    expect(pickMusic({ landing: 'cruise' }).level).toBe(1);
  });

  it('a countdown (cargo lander) is urgent; dark, low vitals or towing are tense; a new stop is wonder', () => {
    const c = pickMusic({ countdownLeftS: 45, countdownTotalS: 90 });
    expect(c.level).toBe(3);
    expect(c.urgency).toBeCloseTo(0.5, 5);
    expect(pickMusic({ tense: true }).level).toBe(2);
    expect(pickMusic({ wonder: true }).level).toBe(1);
    expect(pickMusic({ tense: true, wonder: true }).level).toBe(2);
  });

  it('tempo ramps instead of jumping', () => {
    expect(stepBpm(60, 128, 0.5)).toBe(70);
    expect(stepBpm(128, 60, 0.5)).toBe(118);
    expect(stepBpm(70, 72, 0.5)).toBe(72);
  });

  it('count ticks speed up', () => {
    expect(countTickEvery(0)).toBe(1);
    expect(countTickEvery(1)).toBe(0.25);
    let prev = Infinity;
    for (let u = 0; u <= 1.0001; u += 0.05) {
      const v = countTickEvery(u);
      expect(v).toBeLessThanOrEqual(prev);
      prev = v;
    }
  });

  it('beatTimes lists the beats in a window and honours the phase', () => {
    expect(beatTimes(0, 2.5, 60, 0)).toEqual([0, 1, 2]);
    expect(beatTimes(0, 2.5, 60, 0.5)).toEqual([0.5, 1.5]);
    expect(beatTimes(10, 11, 120, 0)).toEqual([10, 10.5]);
  });

  it('music preference survives broken storage', () => {
    const broken = { getItem: () => { throw new Error('denied'); }, setItem: () => { throw new Error('denied'); } };
    expect(loadMusicOn(broken)).toBe(true);
    expect(() => saveMusicOn(broken, false)).not.toThrow();
    const mem = new Map<string, string>();
    const ok = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v) };
    saveMusicOn(ok, false);
    expect(loadMusicOn(ok)).toBe(false);
  });
});

describe('adaptive music: the score', () => {
  it('uses A4 = 440 Hz and an original D-minor progression, a 4-note Pip motif and an 8-note theme', () => {
    expect(midiToHz(69)).toBeCloseTo(440, 6);
    expect(midiToHz(62)).toBeCloseTo(293.66, 1);
    expect(CHORDS.calm).toHaveLength(4);
    expect(PIP_MOTIF).toEqual([67, 72, 76, 74]);
    expect(THEME).toHaveLength(8);
    // The dawn progression resolves on D major (F# = 66 or 78 present in the last chord).
    const last = CHORDS.dawn[CHORDS.dawn.length - 1];
    expect(last.some((n) => n % 12 === 6)).toBe(true);
  });
});
