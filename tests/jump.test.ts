import { describe, expect, it } from 'vitest';
import { createState } from '../src/core/gameState';
import { jumpState } from '../src/demo/jump';

describe('dev jump shortcuts (?jump=act4 | act5, dev builds only)', () => {
  it('act4 starts with MICA found and nothing of Act 4 done', () => {
    const s = createState();
    jumpState(s, 'act4');
    expect(s.flags.has('act3:micaFound')).toBe(true);
    expect(s.flags.has('act4:memory')).toBe(false);
    expect(s.modules.size).toBe(4);
  });
  it('act5 has memory restored, five samples and no ice yet', () => {
    const s = createState();
    jumpState(s, 'act5');
    expect(s.flags.has('act4:memory')).toBe(true);
    expect(s.samples.size).toBe(5);
    expect(s.samples.has('iceRegolith')).toBe(false);
  });
});
