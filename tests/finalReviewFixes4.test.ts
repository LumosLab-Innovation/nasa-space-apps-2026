import { describe, expect, it } from 'vitest';
import cards from '../src/content/cards.en.json';
import { Act5Director } from '../src/story/act5';
import { realStories } from '../src/story/ending';
import { enterAllowed } from '../src/ui/inputLock';
import { pipComeHint } from '../src/pip/qCommand';

const ready = { memory: true, inCamp: true, dialogueBusy: false, towing: false, locked: false, stormActive: false };

describe('Plan 4 final review fixes', () => {
  it('Important 1: Act 5 never starts while the radiation storm is still running', () => {
    const d = new Act5Director();
    expect(d.canStart({ ...ready, stormActive: true })).toBe(false);
    expect(d.canStart(ready)).toBe(true);
  });

  it('Important 2: an Enter that skips the last dialogue line cannot also confirm a story step', () => {
    expect(enterAllowed(true, 0, 1000)).toBe(false);
    expect(enterAllowed(false, 1000, 1100)).toBe(false); // dialogue ended 100 ms ago: that Enter was the skip
    expect(enterAllowed(false, 1000, 1400)).toBe(true);
  });

  it('Important 3: the five real stories are readable from the Mission Record, in K.5 order', () => {
    const s = realStories(cards);
    expect(s.map((c) => c.id)).toEqual(['story_pragyan', 'story_slim', 'story_odysseus', 'story_eds', 'story_artemis']);
    for (const c of s) expect(c.body.length).toBeGreaterThan(40);
  });

  it('Important 4: a parked, far-away Pip is called with Q instead of "wait for Pip"', () => {
    expect(pipComeHint('wait', 200, 8)).toMatch(/Q — "Pip, come!"/);
    expect(pipComeHint('follow', 200, 8)).toMatch(/coming.*200/);
    expect(pipComeHint('task', 200, 8)).toBeNull();
    expect(pipComeHint('follow', 3, 8)).toBeNull();
    expect(pipComeHint('wait', 3, 8)).toBeNull();
  });
});
