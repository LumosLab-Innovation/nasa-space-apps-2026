import { describe, expect, it } from 'vitest';
import { LINES } from '../src/content/lines.en';
import { LINES_VI } from '../src/content/lines.vi';

describe('story audit: Pip and MICA (plan 7, task 1)', () => {
  it('Pip never speaks before the meeting (orbit and descent lines)', () => {
    for (const script of [LINES, LINES_VI]) {
      const early = Object.entries(script).filter(([id]) => id.startsWith('landing_') || id.startsWith('land_'));
      expect(early.length).toBeGreaterThan(8);
      const pipLines = early.flatMap(([id, lines]) => lines.filter((l) => l.speaker === 'pip').map(() => id));
      expect(pipLines).toEqual([]);
    }
  });

  it('new meeting lines exist in both languages', () => {
    for (const id of ['pip_mutter', 'pip_heard', 'houston_pip']) {
      expect(LINES[id]?.length, id).toBeGreaterThan(0);
      expect(LINES_VI[id]?.length, id).toBe(LINES[id].length);
    }
    expect(LINES.pip_mutter.every((l) => l.speaker === 'pip')).toBe(true);
    expect(LINES.houston_pip.some((l) => l.speaker === 'houston')).toBe(true);
  });

  it('Pip does not know MICA before finding it', () => {
    const before = ['meetPip', 'silenceExplain', 'houstonWelcome', 'tracksFound', 'followTracks', 'upgrade_solarTower', 'upgrade_radiator', 'upgrade_habitat', 'upgrade_antenna',
      ...Object.keys(LINES).filter((id) => id.startsWith('stop_'))];
    const bad = before.flatMap((id) => (LINES[id] ?? []).filter((l) => l.speaker === 'pip' && /MICA/.test(l.text)).map((l) => `${id}: ${l.text}`));
    expect(bad).toEqual([]);
    expect(LINES.micaFound.some((l) => l.speaker === 'pip' && /another/i.test(l.text) && /robot/i.test(l.text))).toBe(true);
  });

  it('Pip talks to Earth for the first time at the radio antenna', () => {
    const lines = LINES.houstonWelcome;
    expect(lines.some((l) => l.speaker === 'pip' && /Earth|Houston/.test(l.text))).toBe(true);
    expect(lines.some((l) => l.speaker === 'houston' && /Pip/.test(l.text))).toBe(true);
  });
});
