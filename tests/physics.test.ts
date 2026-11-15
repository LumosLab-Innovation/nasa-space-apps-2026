import { describe, expect, it } from 'vitest';
import { EARTH_G } from '../src/config/constants';
import {
  equilibriumTempK, fallTime, kineticEnergy, lightDelayOneWayS, shadowLength, tntEquivalentKg,
} from '../src/physics/lunar';
import { surfaceTempC } from '../src/physics/thermal';

describe('lunar physics', () => {
  it('hammer falls 1.5 m in ~1.36 s on the Moon, ~0.55 s on Earth', () => {
    expect(fallTime(1.5)).toBeCloseTo(1.361, 3);
    expect(fallTime(1.5, EARTH_G)).toBeCloseTo(0.553, 3);
  });
  it('a 1 m rock casts a ~38 m shadow at 1.5 deg sun elevation', () => {
    expect(shadowLength(1, 1.5)).toBeCloseTo(38.19, 2);
  });
  it('shadow is infinite when the sun is at or below the horizon', () => {
    expect(shadowLength(1, 0)).toBe(Infinity);
  });
  it('1 g pebble at 20 km/s carries 200 kJ, ~48 g TNT', () => {
    expect(kineticEnergy(0.001, 20000)).toBeCloseTo(200000, 6);
    expect(tntEquivalentKg(200000)).toBeCloseTo(0.0478, 4);
  });
  it('light takes ~1.28 s from Moon to Earth', () => {
    expect(lightDelayOneWayS()).toBeCloseTo(1.282, 3);
  });
  it('a surface facing the sun reaches ~388 K', () => {
    expect(equilibriumTempK(1)).toBeCloseTo(388.3, 1);
  });
});

describe('surface temperature', () => {
  it('sun-facing surface ~115 C, 60 deg incidence ~53 C', () => {
    expect(surfaceTempC(1, false)).toBeCloseTo(115.2, 1);
    expect(surfaceTempC(0.5, false)).toBeCloseTo(53.4, 1);
  });
  it('shadowed or back-facing surfaces use the shadow temperature', () => {
    expect(surfaceTempC(1, true)).toBe(-150);
    expect(surfaceTempC(-0.3, false)).toBe(-150);
  });
});
