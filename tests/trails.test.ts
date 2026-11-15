import { describe, expect, it } from 'vitest';
import { StampRing, StampSpacer } from '../src/fx/trails';

describe('StampSpacer', () => {
  it('spacer fires once per spacing of travelled distance', () => {
    const s = new StampSpacer(0.7);
    s.feed(0, 0);
    const hits = [0.3, 0.6, 0.9, 1.2, 1.5].map((x) => s.feed(x, 0));
    expect(hits).toEqual([false, false, true, false, true]);
  });

  it('spacer ignores teleports', () => {
    const s = new StampSpacer(0.7);
    s.feed(0, 0);
    expect(s.feed(30, 0)).toBe(false);
    expect(s.feed(30.8, 0)).toBe(true);
  });
});

describe('StampRing', () => {
  it('stamp ring buffer overwrites oldest', () => {
    const r = new StampRing<number>(3);
    [1, 2, 3, 4].forEach((v) => r.push(v));
    expect(r.size).toBe(3);
    expect([r.at(0), r.at(1), r.at(2)].sort()).toEqual([2, 3, 4]);
  });

  it('push returns the slot it wrote, wrapping around', () => {
    const r = new StampRing<string>(2);
    expect([r.push('a'), r.push('b'), r.push('c')]).toEqual([0, 1, 0]);
  });
});
