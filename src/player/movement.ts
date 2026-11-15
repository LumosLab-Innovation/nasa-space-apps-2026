import { WORLD_SIZE_M } from '../config/constants';

export interface MoveInput {
  forward: number; // -1..1
  right: number; // -1..1
  jump: boolean;
  /** Shift: Apollo-style bounding lope. */
  lope?: boolean;
}

export const WALK_SPEED_MS = 1.8;
export const LOPE_SPEED_MS = 2.8;

/** Vertical launch speed; apex = v²/(2g) ≈ 0.79 m on the Moon. */
export const JUMP_SPEED_MS = 1.6;

/** Horizontal velocity from input, relative to the camera heading. Yaw 0 faces +z (north), yaw π/2 faces +x (east). */
export function computeMoveVelocity(input: MoveInput, cameraYawRad: number, speedMs = WALK_SPEED_MS): { x: number; z: number } {
  const len = Math.hypot(input.forward, input.right);
  if (len === 0) return { x: 0, z: 0 };
  const f = input.forward / Math.max(1, len);
  const r = input.right / Math.max(1, len);
  const sin = Math.sin(cameraYawRad);
  const cos = Math.cos(cameraYawRad);
  return { x: (f * sin + r * cos) * speedMs, z: (f * cos - r * sin) * speedMs };
}

export function clampToWorld(x: number, z: number, worldSizeM = WORLD_SIZE_M, marginM = 10): { x: number; z: number } {
  const lim = worldSizeM / 2 - marginM;
  return { x: Math.min(lim, Math.max(-lim, x)), z: Math.min(lim, Math.max(-lim, z)) };
}

/** True when the character has slipped through the terrain (capsule centre well below the surface). */
export function isBelowGround(centerY: number, groundY: number, toleranceM = 3): boolean {
  return centerY < groundY - toleranceM;
}
