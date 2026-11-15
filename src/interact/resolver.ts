export interface Interactable {
  id: string;
  x: number;
  z: number;
  enabled: boolean;
  prompt: string;
}

/** Nearest enabled item within `radius`; on a distance tie, the one closest to the facing direction wins. */
export function pickInteractable(
  list: Interactable[],
  player: { x: number; z: number },
  yawRad: number,
  radius = 2.5,
): Interactable | null {
  const fx = Math.sin(yawRad);
  const fz = Math.cos(yawRad);
  let best: Interactable | null = null;
  let bestDist = Infinity;
  let bestDot = -Infinity;
  for (const it of list) {
    if (!it.enabled) continue;
    const dx = it.x - player.x;
    const dz = it.z - player.z;
    const d = Math.hypot(dx, dz);
    if (d > radius) continue;
    const dot = d > 0 ? (dx * fx + dz * fz) / d : 1;
    if (d < bestDist - 1e-6 || (Math.abs(d - bestDist) <= 1e-6 && dot > bestDot)) {
      best = it;
      bestDist = d;
      bestDot = dot;
    }
  }
  return best;
}
