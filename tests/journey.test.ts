import { describe, expect, it } from 'vitest';
import { createState } from '../src/core/gameState';
import { LINES } from '../src/content/lines.en';
import { discoverStops, PipFarWatcher, STOPS } from '../src/journey/stops';
import { zone } from '../src/world/zones';
import { glassBeadsVisible } from '../src/challenges/freshCrater';
import { tryPlant } from '../src/challenges/flagPlant';
import { iceCollectable } from '../src/challenges/darkCrater';

describe('journey stops', () => {
  it('stops are discovered in any order', () => {
    const s = createState();
    for (const id of ['earthPeak', 'darkCrater', 'landing'] as const) {
      const found = discoverStops(s, zone(id), STOPS);
      expect(found.map((f) => f.id)).toEqual([id]);
      expect(s.flags.has(`stop:${id}`)).toBe(true);
    }
  });

  it('a stop is discovered only once', () => {
    const s = createState();
    expect(discoverStops(s, zone('solarHill'), STOPS)).toHaveLength(1);
    expect(discoverStops(s, zone('solarHill'), STOPS)).toHaveLength(0);
  });

  it('far watcher fires after leaving 40 m and respects the 60 s cooldown', () => {
    const w = new PipFarWatcher();
    expect(w.update(1, 30)).toBe(false);
    expect(w.update(1, 45)).toBe(true);
    expect(w.update(30, 45)).toBe(false);
    expect(w.update(31, 45)).toBe(true);
  });

  it('every stop has a dialogue line', () => {
    expect(STOPS).toHaveLength(8);
    for (const st of STOPS) expect(LINES[st.lineId], st.lineId).toBeDefined();
    expect(LINES.pipFar).toBeDefined();
  });
});

describe('fresh crater', () => {
  it('glass beads show only through the thermal view within 25 m', () => {
    expect(glassBeadsVisible(false, 5)).toBe(false);
    expect(glassBeadsVisible(true, 5)).toBe(true);
    expect(glassBeadsVisible(true, 25)).toBe(true);
    expect(glassBeadsVisible(true, 26)).toBe(false);
  });
});

describe('Artemis IV flag', () => {
  it('flag can be planted only once', () => {
    const s = createState();
    expect(tryPlant(s)).toBe(true);
    expect(s.flags.has('flag:planted')).toBe(true);
    expect(tryPlant(s)).toBe(false);
  });
});

describe('Dark Crater ice', () => {
  it("ice is collectable only with Pip's lamp on and both close", () => {
    expect(iceCollectable(true, 5, 2)).toBe(true);
    expect(iceCollectable(false, 5, 2)).toBe(false);
    expect(iceCollectable(true, 9, 2)).toBe(false);
    expect(iceCollectable(true, 5, 3)).toBe(false);
  });
});
