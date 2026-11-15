/**
 * Detects touchdown and how hard it was. Havok's character controller already clamps vertical velocity
 * on the contact frame, so the impact speed is the last vertical speed seen while airborne.
 */
export class LandingDetector {
  private wasSupported = true;
  private airVy = 0;

  /** Feed once per frame. Returns the fall speed (m/s, ≥ 0) on the touchdown frame, otherwise null. */
  update(supported: boolean, vy: number): number | null {
    let impact: number | null = null;
    if (supported && !this.wasSupported) impact = Math.max(0, -this.airVy);
    if (!supported) this.airVy = vy;
    this.wasSupported = supported;
    return impact;
  }
}
