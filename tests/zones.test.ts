import { describe, expect, it } from 'vitest';
import { WORLD_SIZE_M } from '../src/config/constants';
import { CRATES, MICA_POS, SAMPLE_SPOTS, TRACKS_PATH, ZONES } from '../src/world/zones';

const inside = (p: { x: number; z: number }) => Math.abs(p.x) < WORLD_SIZE_M / 2 - 10 && Math.abs(p.z) < WORLD_SIZE_M / 2 - 10;

describe('world layout', () => {
  it('keeps every placed thing inside the walkable world', () => {
    for (const p of [...ZONES, ...CRATES, ...CRATES.map((c) => c.site), ...TRACKS_PATH, ...SAMPLE_SPOTS, MICA_POS]) {
      expect(inside(p), JSON.stringify(p)).toBe(true);
    }
  });
  it('has the eight journey stops in order', () => {
    expect(ZONES.map((z) => z.id)).toEqual(['landing', 'base', 'solarHill', 'boulderField', 'freshCrater', 'earthPeak', 'tracks', 'darkCrater']);
  });
  it('tracks have at least 12 points and end where Mica is found (< 6 m)', () => {
    expect(TRACKS_PATH.length).toBeGreaterThanOrEqual(12);
    const end = TRACKS_PATH[TRACKS_PATH.length - 1];
    expect(Math.hypot(end.x - MICA_POS.x, end.z - MICA_POS.z)).toBeLessThan(6);
  });
});
