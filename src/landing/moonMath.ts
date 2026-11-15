/** Moon geometry for the orbital intro (1 scene unit = 1 km). */
export const MOON_R_KM = 1737.4;

/** Tranquility Base, Apollo 11 (NASA: 0.674° N, 23.473° E). */
export const APOLLO11 = { lat: 0.674, lon: 23.473 } as const;

const DEG = Math.PI / 180;

const EARTH_R_KM = 6371;
const EARTH_MOON_KM = 384_400;

/** Earth drawn closer than it is (the camera's far plane) but scaled so it looks its real size, about 1.9°. */
export function earthDisc(distUnits: number): { radius: number } {
  return { radius: EARTH_R_KM * (distUnits / EARTH_MOON_KM) };
}

/**
 * Selenographic latitude/longitude → point on a Babylon `CreateSphere` of radius r, matching its UVs for an
 * equirectangular map centred on 0° longitude. The texture is drawn with uScale = −1 (Babylon's left-handed
 * sphere otherwise shows it mirrored), so longitude lon sits at u = (180 − lon)/360; v = 0 is the north pole (+y).
 * Babylon builds each vertex as Up rotated by −colatitude about Z, then by 2π·u about Y.
 */
export function latLonToSphere(latDeg: number, lonDeg: number, r: number): { x: number; y: number; z: number } {
  const colat = (90 - latDeg) * DEG;
  const a = ((180 - lonDeg) / 360) * 2 * Math.PI;
  const s = Math.sin(colat);
  return { x: r * s * Math.cos(a), y: r * Math.cos(colat), z: -r * s * Math.sin(a) };
}
