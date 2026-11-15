import { expect, it } from 'vitest';
import { shutterSamples } from '../src/audio/shutterSound';

it('makes a short, quiet two-click shutter burst', () => {
  for (const rate of [24000, 44100, 48000]) {
    const s = shutterSamples(rate);
    expect(Math.abs(s.length - 0.12 * rate)).toBeLessThanOrEqual(1);
    let peak = 0;
    for (const v of s) {
      expect(Number.isFinite(v)).toBe(true);
      peak = Math.max(peak, Math.abs(v));
    }
    expect(peak).toBeLessThanOrEqual(0.2);
    expect(peak).toBeGreaterThan(0.02);
  }
});

it('has two separate clicks: loud at the start and again later, quiet in between', () => {
  const rate = 48000;
  const s = shutterSamples(rate);
  const peakIn = (a: number, b: number) => {
    let p = 0;
    for (let i = Math.round(a * rate); i < Math.round(b * rate); i++) p = Math.max(p, Math.abs(s[i]));
    return p;
  };
  const first = peakIn(0, 0.02);
  const gap = peakIn(0.035, 0.05);
  const second = peakIn(0.06, 0.09);
  expect(first).toBeGreaterThan(0.02);
  expect(second).toBeGreaterThan(0.02);
  expect(gap).toBeLessThan(Math.min(first, second) * 0.5);
});
