import { afterEach, describe, expect, it } from 'vitest';
import { landerSite, resetLanderSite, setLanderSite } from '../src/world/landerSite';
import { HLS_POS } from '../src/world/zones';

afterEach(() => resetLanderSite());

describe('lander site', () => {
  it('defaults to HLS_POS', () => {
    expect(landerSite()).toEqual({ x: HLS_POS.x, z: HLS_POS.z });
  });
  it('set then reset', () => {
    setLanderSite({ x: 5, z: 7 });
    expect(landerSite()).toEqual({ x: 5, z: 7 });
    landerSite().x = 99; // copy-safe
    expect(landerSite().x).toBe(5);
    resetLanderSite();
    expect(landerSite()).toEqual({ x: HLS_POS.x, z: HLS_POS.z });
  });
});
