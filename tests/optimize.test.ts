import { describe, expect, it } from 'vitest';
import { shadowWorthy } from '../src/models/optimize';

const fakeMesh = (radius: number) => ({ getBoundingInfo: () => ({ boundingSphere: { radiusWorld: radius } }) });

describe('shadow caster budget', () => {
  it('small parts (bolts, lenses, grips) do not cast shadows', () => {
    expect(shadowWorthy(fakeMesh(0.03) as never)).toBe(false);
  });
  it('body-sized parts cast shadows', () => {
    expect(shadowWorthy(fakeMesh(0.4) as never)).toBe(true);
  });
  it('threshold is configurable', () => {
    expect(shadowWorthy(fakeMesh(0.2) as never, 0.3)).toBe(false);
  });
});
