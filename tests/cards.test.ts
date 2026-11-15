import { describe, expect, it } from 'vitest';
import cards from '../src/content/cards.en.json';

const REQUIRED = ['hammerFeather', 'longShadows', 'anorthosite', 'noSound', 'apollo17Dust', 'tracksLast', 'eds', 'lightDelay', 'sunFacingHeat', 'micaFiction'];

describe('knowledge cards', () => {
  it('keeps the 10 slice cards and gives every card a unique id', () => {
    expect(cards.length).toBeGreaterThanOrEqual(10);
    expect(new Set(cards.map((c) => c.id)).size).toBe(cards.length);
    for (const id of REQUIRED) expect(cards.map((c) => c.id)).toContain(id);
  });
  it('every card is tagged real/fiction/debated and cites an https source', () => {
    for (const c of cards) {
      expect(['real', 'fiction', 'debated'], c.id).toContain(c.tag);
      expect(c.source.url.startsWith('https://'), c.id).toBe(true);
      expect(c.title.length).toBeGreaterThan(0);
      expect(c.body.length).toBeGreaterThan(40);
    }
  });
  it('labels Mica as fiction', () => {
    expect(cards.find((c) => c.id === 'micaFiction')!.tag).toBe('fiction');
  });
  it('cards include the Plan 3 set with https sources', () => {
    for (const id of ['spiritStuck', 'boulderTracks', 'apolloFlags', 'earthVisibility', 'lcrossIce', 'viperPanels']) {
      const c = cards.find((k) => k.id === id);
      expect(c, id).toBeDefined();
      expect(c!.source.url.startsWith('https://'), id).toBe(true);
    }
  });
  it('cards include the Plan 4 set with https sources', () => {
    const ids = ['lunarRadiation', 'regolithShield', 'shadowClock', 'peaksOfLight', 'lunarNight', 'earthshine', 'story_pragyan', 'story_slim', 'story_odysseus', 'story_eds', 'story_artemis'];
    for (const id of ids) {
      const c = cards.find((k) => k.id === id);
      expect(c, id).toBeDefined();
      expect(c!.source.url.startsWith('https://'), id).toBe(true);
      expect(['real', 'fiction', 'debated'], id).toContain(c!.tag);
    }
  });
});
