import { describe, expect, it } from 'vitest';
import { tempToColor } from '../src/ui/thermalColor';

const close = (c: { r: number; g: number; b: number }, r: number, g: number, b: number) => {
  expect(c.r).toBeCloseTo(r, 6);
  expect(c.g).toBeCloseTo(g, 6);
  expect(c.b).toBeCloseTo(b, 6);
};

describe('tempToColor', () => {
  it('maps the anchor temperatures exactly', () => {
    close(tempToColor(-250), 0, 0, 0.4);
    close(tempToColor(-150), 0, 0.3, 1);
    close(tempToColor(60), 1, 0.5, 0);
    close(tempToColor(120), 1, 1, 0.8);
  });
  it('0 C is a light violet', () => {
    const c = tempToColor(0);
    expect(c.r).toBeGreaterThan(0.5);
    expect(c.b).toBeGreaterThan(0.5);
  });
  it('interpolates between anchors (-200 C sits halfway)', () => {
    expect(tempToColor(-200).b).toBeCloseTo(0.7, 6);
  });
  it('clamps beyond the hottest anchor', () => {
    close(tempToColor(400), 1, 1, 0.8);
  });
});
