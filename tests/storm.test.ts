import { describe, expect, it } from 'vitest';
import { STORM, isSheltered, stormStep, type StormPhase } from '../src/challenges/solarStorm';
import { LOPE_SPEED_MS } from '../src/player/movement';
import { BOULDER, CRATES, MICA_POS, REPAIR_SPOT, SHELTER_POS, zone } from '../src/world/zones';

const d = (a: { x: number; z: number }, b: { x: number; z: number }) => Math.hypot(a.x - b.x, a.z - b.z);

function run(sheltered: boolean, seconds: number, start: StormPhase = 'idle') {
  let s = stormStep(start, 0, 'start', sheltered, 0);
  let exposures = s.exposed ? 1 : 0;
  for (let i = 0; i < seconds * 10; i++) {
    s = stormStep(s.phase, s.t, 'tick', sheltered, 0.1);
    if (s.exposed) exposures++;
  }
  return { ...s, exposures };
}

describe('radiation storm while towing MICA (v2 scene 4.2)', () => {
  it("storm warning gives enough time to reach camp from MICA's rim", () => {
    expect(STORM.warningS * LOPE_SPEED_MS).toBeGreaterThanOrEqual(1.3 * d(MICA_POS, SHELTER_POS));
  });

  it('storm happens once and exposure triggers rescue', () => {
    const r = run(false, STORM.warningS + STORM.stormS + 5);
    expect(r.exposures).toBe(1);
    expect(r.phase).toBe('clear');
    const again = stormStep('clear', 0, 'start', false, 0);
    expect(again.phase).toBe('clear');
    expect(again.exposed).toBe(false);
  });

  it('sheltering before the countdown ends means no exposure', () => {
    const r = run(true, STORM.warningS + STORM.stormS + 5);
    expect(r.exposures).toBe(0);
    expect(r.phase).toBe('clear');
  });

  it('the warning counts down, then the storm passes', () => {
    const w = run(true, 10);
    expect(w.phase).toBe('warning');
    expect(w.t).toBeCloseTo(STORM.warningS - 10, 5);
    const s = run(true, STORM.warningS + 1);
    expect(s.phase).toBe('storm');
  });

  it('shelter sits inside camp and away from module sites', () => {
    expect(d(SHELTER_POS, zone('base'))).toBeLessThanOrEqual(30);
    for (const c of CRATES) expect(d(SHELTER_POS, c.site), c.moduleId).toBeGreaterThanOrEqual(8);
    expect(d(SHELTER_POS, REPAIR_SPOT)).toBeGreaterThanOrEqual(8);
  });

  it('boulder shadow is not a shelter', () => {
    expect(isSheltered({ x: BOULDER.bottom.x + 2, z: BOULDER.bottom.z + 2 })).toBe(false);
    expect(isSheltered(SHELTER_POS)).toBe(true);
  });
});

describe('the shelter is walk-in', () => {
  it('does not protect a head above the roof, including jumping and roof-level positions', () => {
    expect(isSheltered({ ...SHELTER_POS, y: 51.2 }, 50)).toBe(true);
    expect(isSheltered({ ...SHELTER_POS, y: 54.2 }, 50)).toBe(false);
    expect(isSheltered({ ...SHELTER_POS, x: SHELTER_POS.x + 2, y: 52.5 }, 50)).toBe(false);
  });
  it('standing beside the dome is not sheltered, inside it is', () => {
    expect(isSheltered({ x: SHELTER_POS.x + 2, z: SHELTER_POS.z })).toBe(true);
    expect(isSheltered({ x: SHELTER_POS.x + 6, z: SHELTER_POS.z })).toBe(false);
  });
});
