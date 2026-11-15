/**
 * Pure kinematics for Pip's rigid-part rig (spec v3 §4.5): wheel roll, four-wheel steering, head aim and
 * arm poses. The Babylon side only applies these angles to the GLB pivots.
 */
export const WHEEL_RADIUS_M = 0.2;
const HALF_WHEELBASE_M = 0.55;
const MAX_STEER = 0.6;
const SPIN_STANCE = Math.PI / 4;

/** Roll angle (radians) for a wheel that travelled this far without slipping. */
export function wheelSpin(distanceM: number, radiusM = WHEEL_RADIUS_M): number {
  return distanceM / radiusM;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * Steering angles for a body turning at `turnRateRadS` while moving at `speedMs`. Four-wheel steering:
 * the rear wheels counter-steer, so the turn circle is centred mid-body. Turning on the spot uses the
 * "X" stance (all wheels tangent to a circle).
 */
export function steerAngles(turnRateRadS: number, speedMs: number): { front: number; rear: number } {
  if (Math.abs(turnRateRadS) < 1e-4) return { front: 0, rear: 0 };
  if (speedMs < 0.05) {
    const a = Math.sign(turnRateRadS) * SPIN_STANCE;
    return { front: a, rear: -a };
  }
  const front = clamp(Math.atan((turnRateRadS * HALF_WHEELBASE_M) / speedMs), -MAX_STEER, MAX_STEER);
  return { front, rear: -front };
}

interface P3 {
  x: number;
  y: number;
  z: number;
}

/** Mast pan (relative to the body heading) and head tilt needed to look from `from` at `to`. */
export function lookAngles(from: P3, to: P3, bodyYaw: number): { pan: number; tilt: number } {
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  let pan = Math.atan2(dx, dz) - bodyYaw;
  pan = Math.atan2(Math.sin(pan), Math.cos(pan));
  const tilt = Math.atan2(to.y - from.y, Math.hypot(dx, dz));
  return { pan: clamp(pan, -2.6, 2.6), tilt: clamp(tilt, -0.6, 0.5) };
}

export type ArmPose = 'stowed' | 'reach' | 'lift' | 'hold' | 'wave';
export interface ArmAngles {
  /** Yaw of the turret (rad). */
  base: number;
  /** Shoulder raise (rad, + = up). */
  shoulder: number;
  /** Elbow unfold (rad, 0 = folded back over the upper arm). */
  elbow: number;
  /** Wrist pitch (rad, + = gripper up). */
  wristPitch: number;
  /** 0 = closed, 1 = open. */
  grip: number;
}

export const ARM_POSES: Record<ArmPose, ArmAngles> = {
  stowed: { base: 0, shoulder: 0, elbow: 0, wristPitch: 0, grip: 0 },
  reach: { base: 0, shoulder: 0.35, elbow: 2.5, wristPitch: -0.5, grip: 1 },
  lift: { base: 0, shoulder: 0.9, elbow: 2.7, wristPitch: -0.9, grip: 0 },
  hold: { base: 0, shoulder: 0.7, elbow: 2.6, wristPitch: -0.8, grip: 0 },
  wave: { base: 0.5, shoulder: 1.3, elbow: 1.9, wristPitch: 0.4, grip: 1 },
};

export function blendPose(a: ArmAngles, b: ArmAngles, t: number): ArmAngles {
  const k = clamp(t, 0, 1);
  const mix = (x: number, y: number) => x + (y - x) * k;
  return {
    base: mix(a.base, b.base),
    shoulder: mix(a.shoulder, b.shoulder),
    elbow: mix(a.elbow, b.elbow),
    wristPitch: mix(a.wristPitch, b.wristPitch),
    grip: mix(a.grip, b.grip),
  };
}
