import { describe, expect, it } from 'vitest';
import { addSample, createState, installModule, type GameState } from '../src/core/gameState';
import { nextMicaStage } from '../src/mica/sequence';

const TRACKS = { x: 0, z: 0 };
const MICA = { x: 100, z: 0 };
const unlocked = (): GameState => {
  const s = createState();
  installModule(s, 'solarTower');
  installModule(s, 'radiator');
  (['anorthosite', 'breccia', 'glassBeads'] as const).forEach((x) => addSample(s, x));
  return s;
};

describe('nextMicaStage', () => {
  it('stays hidden near the tracks until the quest conditions are met', () => {
    expect(nextMicaStage('hidden', createState(), { x: 1, z: 0 }, TRACKS, MICA)).toBe('hidden');
  });
  it('notices the tracks within 15 m once unlocked', () => {
    expect(nextMicaStage('hidden', unlocked(), { x: 10, z: 0 }, TRACKS, MICA)).toBe('tracksSeen');
  });
  it('starts following when the player reaches the tracks', () => {
    expect(nextMicaStage('tracksSeen', unlocked(), { x: 3, z: 0 }, TRACKS, MICA)).toBe('following');
  });
  it('finds Mica even if the tracks were never noticed', () => {
    expect(nextMicaStage('hidden', createState(), { x: 95, z: 0 }, TRACKS, MICA)).toBe('found');
  });
  it('stays found forever', () => {
    expect(nextMicaStage('found', createState(), { x: -500, z: 0 }, TRACKS, MICA)).toBe('found');
  });
});
