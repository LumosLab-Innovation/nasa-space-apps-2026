import { describe, expect, it } from 'vitest';
import {
  addSample, createState, installModule, logData, setFlag, tracksUnlocked, unlockCard,
} from '../src/core/gameState';
import { EventBus } from '../src/core/events';

describe('game state actions are idempotent', () => {
  it('installs a module only once', () => {
    const s = createState();
    expect(installModule(s, 'solarTower')).toBe(true);
    expect(installModule(s, 'solarTower')).toBe(false);
    expect(s.modules.size).toBe(1);
  });
  it('counts a sample only once', () => {
    const s = createState();
    expect(addSample(s, 'anorthosite')).toBe(true);
    expect(addSample(s, 'anorthosite')).toBe(false);
    expect(s.samples.size).toBe(1);
  });
  it('logs data, flags and cards only once', () => {
    const s = createState();
    expect(logData(s, 'commDelay')).toBe(true);
    expect(logData(s, 'commDelay')).toBe(false);
    expect(setFlag(s, 'x')).toBe(true);
    expect(setFlag(s, 'x')).toBe(false);
    expect(unlockCard(s, 'eds')).toBe(true);
    expect(unlockCard(s, 'eds')).toBe(false);
  });
});

describe('tracksUnlocked', () => {
  const build = (modules: number, samples: number) => {
    const s = createState();
    (['solarTower', 'radiator', 'habitat'] as const).slice(0, modules).forEach((m) => installModule(s, m));
    (['anorthosite', 'breccia', 'glassBeads'] as const).slice(0, samples).forEach((x) => addSample(s, x));
    return s;
  };
  it('needs at least 2 modules and 3 samples', () => {
    expect(tracksUnlocked(build(1, 3))).toBe(false);
    expect(tracksUnlocked(build(2, 2))).toBe(false);
    expect(tracksUnlocked(build(2, 3))).toBe(true);
  });
});

describe('EventBus', () => {
  it('stops delivering after unsubscribe', () => {
    const bus = new EventBus<{ ping: number }>();
    const got: number[] = [];
    const off = bus.on('ping', (n) => got.push(n));
    bus.emit('ping', 1);
    off();
    bus.emit('ping', 2);
    expect(got).toEqual([1]);
  });
});
