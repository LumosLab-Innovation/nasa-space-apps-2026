import { MOON_RADIUS_KM } from '../config/constants';

const DEG = Math.PI / 180;

/** South polar stereographic projection (as used by LOLA polar products), true scale at the pole. */
export function latLonToPolarStereoKm(latDeg: number, lonDegEast: number): { x: number; y: number } {
  const rho = 2 * MOON_RADIUS_KM * Math.tan(Math.PI / 4 + (latDeg * DEG) / 2);
  return { x: rho * Math.sin(lonDegEast * DEG), y: rho * Math.cos(lonDegEast * DEG) };
}
