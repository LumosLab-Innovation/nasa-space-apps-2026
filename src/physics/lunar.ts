import { C_KM_S, EARTH_MOON_KM, LUNAR_G, SIGMA, SOLAR_CONST } from '../config/constants';

const DEG = Math.PI / 180;
const TNT_J_PER_KG = 4.184e6;

/** Time to fall `heightM` from rest with no air drag: t = sqrt(2h/g). */
export function fallTime(heightM: number, g = LUNAR_G): number {
  return Math.sqrt((2 * heightM) / g);
}

/** Length of the shadow cast by an object of given height. */
export function shadowLength(objectHeightM: number, sunElevDeg: number): number {
  if (sunElevDeg <= 0) return Infinity;
  return objectHeightM / Math.tan(sunElevDeg * DEG);
}

export function kineticEnergy(massKg: number, speedMs: number): number {
  return 0.5 * massKg * speedMs * speedMs;
}

export function tntEquivalentKg(joules: number): number {
  return joules / TNT_J_PER_KG;
}

export function lightDelayOneWayS(distanceKm = EARTH_MOON_KM): number {
  return distanceKm / C_KM_S;
}

/** Radiative-equilibrium temperature of a surface (no conduction): T = (a·S·cos / (e·σ))^¼ */
export function equilibriumTempK(cosIncidence: number, absorptivity = 0.9, emissivity = 0.95): number {
  const cos = Math.max(0, cosIncidence);
  return Math.pow((absorptivity * SOLAR_CONST * cos) / (emissivity * SIGMA), 0.25);
}
