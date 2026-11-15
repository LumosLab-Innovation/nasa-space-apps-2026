import { flightScale, smoother } from './descentGeometry';

/** Metres. Matches the approved "Gần hơn" low chase-camera reference. */
export const closeApproachDistance = (heightM: number) =>
  .8 * (110 + 100 * Math.max(0, Math.min(1, heightM / 1000)));

/** Ease into the close shot before the last kilometre; do not snap the orbital camera. */
export function approachCameraDistance(heightM: number): number {
  const close = closeApproachDistance(heightM);
  // Allow a little more terrain around the ship without letting altitude alone
  // pull the camera away as the cinematic model shrinks toward its real scale.
  const extraDisplayedLength = 50 * 1000 * (flightScale(heightM) - .001);
  return close + 2.6 * extraDisplayedLength * smoother((heightM - 1500) / 4500);
}

/** Retain the close view while ceasing to dolly toward a descending ship below 600 m. */
export function descentFraming(heightM:number) {
 const distance=approachCameraDistance(heightM),hold=smoother((800-heightM)/200);
 return {distance:distance+(136-distance)*hold,screenDrop:.04*smoother((600-heightM)/240)};
}

/** Keep the low framing through handoff, then settle into the earlier composition by 150 m. */
export const landingCamera = (heightM: number) => ({
  radius: 110 + Math.max(0, heightM) * .25,
  targetHeight: 18+56*smoother((heightM-150)/150),
  beta: 1.05,
  radiusPerMetre: .25,
});
