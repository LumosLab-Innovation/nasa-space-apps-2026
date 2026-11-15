import { describe, expect, it } from 'vitest';
import { firstSampleLine, pipCanScan } from '../src/science/scienceRules';

describe('Pip stays silent before the meeting (plan 7 final review)', () => {
  it('no LIDAR scan and no first-sample lecture until the player has met Pip', () => {
    expect(pipCanScan(new Set())).toBe(false);
    expect(pipCanScan(new Set(['pip:met']))).toBe(true);
    expect(firstSampleLine('anorthosite', new Set())).toBeNull();
    expect(firstSampleLine('anorthosite', new Set(['dialogue:meetPip:done']))).toBe('firstSample');
    expect(firstSampleLine('breccia', new Set(['pip:met']))).toBeNull();
  });
});
