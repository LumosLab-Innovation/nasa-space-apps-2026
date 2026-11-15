export type V3 = { x: number; y: number; z: number };

/**
 * Two-bone leg IK in the body's sagittal plane (body-local: +z forward, +y up; x is ignored).
 * Returns the hip swing (+ = forward, from straight down) and the knee bend (+ = shin folds back, so the
 * knee points forward and never bends backwards). Targets out of reach give a straight leg pointing at them.
 */
export function legIk(hip: V3, target: V3, thighM: number, shinM: number): { hip: number; knee: number } {
  const dy = target.y - hip.y;
  const dz = target.z - hip.z;
  const reach = thighM + shinM;
  const L = Math.min(reach, Math.max(Math.abs(thighM - shinM) + 1e-6, Math.hypot(dy, dz)));
  const base = Math.atan2(dz, -dy);
  if (L >= reach) return { hip: base, knee: 0 };
  const cosKnee = (thighM * thighM + shinM * shinM - L * L) / (2 * thighM * shinM);
  const knee = Math.PI - Math.acos(Math.min(1, Math.max(-1, cosKnee)));
  const cosA = (thighM * thighM + L * L - shinM * shinM) / (2 * thighM * L);
  return { hip: base + Math.acos(Math.min(1, Math.max(-1, cosA))), knee };
}
