const DEG = Math.PI / 180;

/** Unit vector from the observer towards an object at (azimuth, elevation). +z north, +x east, +y up. */
export function azElToDirection(azDeg: number, elDeg: number): { x: number; y: number; z: number } {
  const az = azDeg * DEG;
  const el = elDeg * DEG;
  return { x: Math.cos(el) * Math.sin(az), y: Math.sin(el), z: Math.cos(el) * Math.cos(az) };
}

/**
 * Illuminated fraction of Earth's disc seen from the Moon: (1 − cos θ)/2, θ = angle between the directions
 * to the Sun and to Earth. Full when Earth is opposite the Sun, new when they line up.
 */
export function earthPhase(sunDir: { x: number; y: number; z: number }, earthDir: { x: number; y: number; z: number }): number {
  const ls = Math.hypot(sunDir.x, sunDir.y, sunDir.z) || 1;
  const le = Math.hypot(earthDir.x, earthDir.y, earthDir.z) || 1;
  const c = (sunDir.x * earthDir.x + sunDir.y * earthDir.y + sunDir.z * earthDir.z) / (ls * le);
  return (1 - Math.max(-1, Math.min(1, c))) / 2;
}
