import { describe, expect, it } from 'vitest';
import type { Heightmap } from '../src/data/heightmap';
import { slopeDeg, Winch, wheelSlip } from '../src/challenges/winch';

/** Ramp rising 1 m per 2 m toward +x. */
function ramp(): Heightmap {
  const size = 101;
  const worldSizeM = 200;
  const heights = new Float32Array(size * size);
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) heights[r * size + c] = 0.5 * ((c / (size - 1) - 0.5) * worldSizeM);
  return { size, worldSizeM, heights, source: 'procedural' };
}

describe('wheel slip on soft regolith', () => {
  it('no slip below 12 degrees, full slip from 18 (the real Sunny Hill climb peaks at 19.3°)', () => {
    expect(wheelSlip(8)).toBe(0);
    expect(wheelSlip(12)).toBe(0);
    expect(wheelSlip(15)).toBeCloseTo(0.5, 6);
    expect(wheelSlip(18)).toBe(1);
    expect(wheelSlip(35)).toBe(1);
  });

  it('a loaded rover sinks deeper and slips 6 degrees earlier', () => {
    expect(wheelSlip(6, true)).toBe(0);
    expect(wheelSlip(9, true)).toBeCloseTo(0.5, 6);
    expect(wheelSlip(12, true)).toBe(1);
    expect(wheelSlip(12, false)).toBe(0);
  });

  it('slope of a 1-in-2 ramp is about 26.6 degrees', () => {
    expect(slopeDeg(ramp(), 0, 0, Math.PI / 2)).toBeCloseTo(26.57, 1);
    expect(slopeDeg(ramp(), 0, 0, -Math.PI / 2)).toBeCloseTo(-26.57, 1);
  });
});

describe('winch', () => {
  it('winch goes stuck → anchored → reeling → done', () => {
    const w = new Winch(4);
    expect(w.state).toBe('idle');
    w.onPipSlip(1);
    expect(w.state).toBe('stuck');
    expect(w.plantAnchor(1)).toBe(true);
    expect(w.state).toBe('anchored');
    w.startReel();
    expect(w.state).toBe('reeling');
    for (let i = 0; i < 200; i++) w.reel(0.1);
    expect(w.state).toBe('done');
    expect(w.ropeLeftM).toBe(0);
  });

  it('anchor only plants within 2.5 m of the anchor point while stuck', () => {
    const w = new Winch();
    expect(w.plantAnchor(1)).toBe(false); // not stuck yet
    w.onPipSlip(1);
    expect(w.plantAnchor(3)).toBe(false);
    expect(w.plantAnchor(2.4)).toBe(true);
  });

  it('partial slip does not get Pip stuck', () => {
    const w = new Winch();
    w.onPipSlip(0.6);
    expect(w.state).toBe('idle');
  });

  it('stuck winch does not resolve by distance', () => {
    const w = new Winch();
    w.onPipSlip(1);
    for (let i = 0; i < 600; i++) {
      w.reel(0.1); // the game keeps ticking while the player walks 100 m away
      w.plantAnchor(100);
    }
    expect(w.state).toBe('stuck');
    w.dropLoad();
    expect(w.state).toBe('idle');
  });
});
