import { describe, expect, it } from 'vitest';
import { createState } from '../src/core/gameState';
import { clearSave, deserialize, loadSave, milestoneKey, prepareRestore, serialize, writeSave } from '../src/save/save';

const mem = () => {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k) };
};
const broken = { getItem: () => { throw new Error('x'); }, setItem: () => { throw new Error('x'); }, removeItem: () => { throw new Error('x'); } };

function midGame() {
  const s = createState();
  s.modules.add('solarTower');
  s.samples.add('anorthosite');
  s.dataLogs.add('commDelay');
  for (const f of ['landing:done', 'dialogue:meetPip:done', 'flag:planted', 'act3:micaFound']) s.flags.add(f);
  s.unlockedCards.add('hammerFeather');
  return s;
}

describe('autosave and continue (plan 6a, task 2)', () => {
  it('serialize / deserialize round-trips the whole game state and the clock', () => {
    const s = midGame();
    const d = deserialize(JSON.stringify(serialize(s, 123456)))!;
    expect(d.modules).toEqual(['solarTower']);
    expect(d.samples).toEqual(['anorthosite']);
    expect(d.dataLogs).toEqual(['commDelay']);
    expect(d.flags).toContain('flag:planted');
    expect(d.cards).toEqual(['hammerFeather']);
    expect(d.clockMs).toBe(123456);
  });

  it('broken, foreign or old-version saves are ignored', () => {
    expect(deserialize(null)).toBeNull();
    expect(deserialize('not json')).toBeNull();
    expect(deserialize('{"v":99}')).toBeNull();
    expect(deserialize(JSON.stringify({ v: 1, modules: [3], samples: [], dataLogs: [], flags: [], cards: [], clockMs: 0 }))).toBeNull();
  });

  it('reloading in the middle of Act 5 goes back to the start of Act 5', () => {
    const s = midGame();
    for (const f of ['act4:memory', 'act5:started', 'act5:notchChosen', 'act5:keptMica', 'ending:dataSent', 'act5:leak:door']) s.flags.add(f);
    s.samples.add('iceRegolith');
    const r = prepareRestore(serialize(s, 999));
    expect(r.flags).toContain('act4:memory');
    expect(r.flags.some((f) => f.startsWith('act5:') || f.startsWith('ending:'))).toBe(false);
    expect(r.samples).toContain('iceRegolith');
    // Act 5 jumps the clock to its real night itself: the saved (December) time must not be restored.
    expect(r.clockMs).toBeNull();
    expect(r.where).toBe('camp');
  });

  it('before any module or MICA the player continues at the landing site, later at camp', () => {
    const early = createState();
    early.flags.add('landing:done');
    expect(prepareRestore(serialize(early, 5)).where).toBe('landing');
    expect(prepareRestore(serialize(early, 5)).clockMs).toBe(5);
    expect(prepareRestore(serialize(midGame(), 5)).where).toBe('camp');
  });

  it('a milestone (new module, sample, log or story flag) changes the milestone key; idle time does not', () => {
    const s = midGame();
    const k0 = milestoneKey(s);
    s.flags.add('dialogue:something:done');
    expect(milestoneKey(s)).toBe(k0);
    s.samples.add('breccia');
    const k1 = milestoneKey(s);
    expect(k1).not.toBe(k0);
    s.flags.add('act4:micaAwake');
    expect(milestoneKey(s)).not.toBe(k1);
  });

  it('storage that throws never breaks the game', () => {
    const s = midGame();
    expect(() => writeSave(broken, s, 1)).not.toThrow();
    expect(loadSave(broken)).toBeNull();
    expect(() => clearSave(broken)).not.toThrow();
    const m = mem();
    writeSave(m, s, 7);
    expect(loadSave(m)!.clockMs).toBe(7);
    clearSave(m);
    expect(loadSave(m)).toBeNull();
  });
});
