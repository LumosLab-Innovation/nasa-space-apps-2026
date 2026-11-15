import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createState } from '../src/core/gameState';
import { PauseClock, menuKeyAction } from '../src/core/pause';
import { prepareRestore, restoreSteps, serialize, shouldAutosave } from '../src/save/save';

describe('plan 6a final review fixes', () => {
  it('the pause menu handles a key once, ignores auto-repeat, and lets key releases through to the game', () => {
    expect(menuKeyAction({ type: 'keydown', repeat: false })).toBe('handle');
    expect(menuKeyAction({ type: 'keydown', repeat: true })).toBe('swallow');
    // Releases must reach the game, or a key held when the menu opened stays "held" forever.
    expect(menuKeyAction({ type: 'keyup', repeat: false })).toBe('pass');
  });

  it('dialogue time stands still while the game is paused', () => {
    const c = new PauseClock();
    expect(c.now(1000)).toBe(1000);
    c.setPaused(true, 2000);
    expect(c.now(5000)).toBe(2000);
    c.setPaused(false, 5000);
    expect(c.now(6000)).toBe(3000);
    c.setPaused(false, 7000); // no double counting
    expect(c.now(7000)).toBe(4000);
  });

  it('continuing restores what was already done instead of replaying it', () => {
    const s = createState();
    for (const f of ['act3:micaFound', 'act4:micaAwake', 'act4:memory', 'flag:planted', 'cargo:landed', 'dialogue:winch_done:done']) s.flags.add(f);
    s.dataLogs.add('sunAngleShadow');
    s.dataLogs.add('commDelay');
    const r = restoreSteps(s);
    expect(r).toEqual({
      micaFound: true, micaAwakeSilent: true, micaToldUs: true, shadowDone: true, antennaDone: true,
      flagPlanted: true, winchDone: true, cargoLanded: true, pipMet: false, roverAt: 'hls',
    });
    const { roverAt, ...fresh } = restoreSteps(createState());
    expect(roverAt).toBe('hls');
    expect(Object.values(fresh).every((v) => v === false)).toBe(true);
  });

  it('no autosave during Act 5 (its start is the checkpoint), so a lost data log is never saved', () => {
    const s = createState();
    expect(shouldAutosave(s.flags)).toBe(true);
    s.flags.add('act5:started');
    expect(shouldAutosave(s.flags)).toBe(false);
    s.flags.add('ending:dataSent');
    expect(shouldAutosave(s.flags)).toBe(true);
  });

  it('a save with unknown ids loads without them (no black screen)', () => {
    const s = createState();
    const d = serialize(s, 1);
    d.modules = ['solarTower', 'warpDrive'];
    d.samples = ['breccia', 'cheese'];
    d.dataLogs = ['commDelay', 'diary'];
    const r = prepareRestore(d);
    expect(r.modules).toEqual(['solarTower']);
    expect(r.samples).toEqual(['breccia']);
    expect(r.dataLogs).toEqual(['commDelay']);
  });

  it('no English UI literal is shown outside tr() (toast, prompt, return, canvas text, labels)', () => {
    const files = (dir: string): string[] =>
      readdirSync(dir).flatMap((f) => {
        const p = join(dir, f);
        return statSync(p).isDirectory() ? files(p) : p.endsWith('.ts') ? [p] : [];
      });
    const skip = /src[\\/](content|i18n|demo[\\/]musicSampler)|src[\\/]models|src[\\/]data[\\/]heightmap/;
    // A player-facing literal: starts with a capital letter or a key hint, has a space, and is not inside tr(.
    const re = /(toast\(|prompt:|prompt = |return |fillText\(|\.text = |new TextBlock\([^,]+, |one\(|tb\()\s*(['"`])((?:E|Q|T|R|Hold E|●|[A-Z][a-z]+)[^'"`]* [^'"`]*)\2/g;
    const bad: string[] = [];
    for (const file of files('src')) {
      if (skip.test(file)) continue;
      for (const line of readFileSync(file, 'utf8').split('\n')) {
        if (line.includes('script.')) continue; // computed dialogue lines have their own Vietnamese branch
        for (const m of line.matchAll(re)) bad.push(`${file}: ${m[3]}`);
      }
    }
    expect(bad).toEqual([]);
  });
});
