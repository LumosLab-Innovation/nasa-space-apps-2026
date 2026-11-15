import { describe, expect, it } from 'vitest';
import { heritageShot, markerVisible } from '../src/landing/apolloHeritageShot';

describe('Apollo heritage camera', () => {
  it('switches scale only under a fully black fade', () => {
    expect(heritageShot(1.5).local).toBe(false);
    expect(heritageShot(2.1).local).toBe(true);
    expect(heritageShot(2.1).fade).toBeCloseTo(1);
    expect(heritageShot(2.6).fade).toBeCloseTo(0);
  });
  it('approaches smoothly and holds above ground', () => {
    const start=heritageShot(2.1), middle=heritageShot(6.1), end=heritageShot(10.1);
    expect(start.travel).toBe(0);
    expect(middle.travel).toBeCloseTo(.5);
    expect(end.travel).toBe(1);
    expect(heritageShot(20).travel).toBe(1);
  });
  it('hides orbital annotations when behind the camera, horizon or outside the view', () => {
    expect(markerVisible(500,300,.9,1000,600,1)).toBe(true);
    expect(markerVisible(500,300,.9,1000,600,-1)).toBe(false);
    expect(markerVisible(500,300,1.1,1000,600,1)).toBe(false);
    expect(markerVisible(1100,300,.9,1000,600,1)).toBe(false);
  });
});
