import { Vector3 } from '@babylonjs/core/Maths/math.vector';
/** Camera settles before the braking controls take over; never a cut or blackout. */
export const BURN_ENTRY_SECONDS = 2.4;
export function burnEntryBlend(elapsed: number): number {
  const t = Math.max(0, Math.min(1, elapsed / BURN_ENTRY_SECONDS));
  return t * t * t * (t * (t * 6 - 15) + 10);
}
/** All arguments share world units. The incoming camera must never receive a chase-origin correction. */
export function blendBurnCamera(incoming:Vector3,velocity:Vector3,goal:Vector3,elapsed:number):Vector3 {
 return Vector3.Lerp(incoming.add(velocity.scale(elapsed)),goal,burnEntryBlend(elapsed));
}
