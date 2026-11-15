import { LUNAR_G } from '../config/constants';

/**
 * Lunar dust kinematics. With no air there is no drag and no suspension: every grain flies a clean
 * parabola and drops straight back to the ground (spec v3 §5). These functions are pure so they can be tested.
 */
export interface Grain {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  alive: boolean;
}

export const MAX_BURST = 400;
const GRAINS_PER_MS = 40;
const MIN_IMPACT_MS = 0.3;

/** Exact parabolic step: y += vy·dt − ½g·dt², vy −= g·dt; horizontal velocity untouched. Dies on touching the ground. */
export function stepGrain(g: Grain, dt: number, groundY: (x: number, z: number) => number, gravity = LUNAR_G): void {
  if (!g.alive) return;
  g.x += g.vx * dt;
  g.z += g.vz * dt;
  g.y += g.vy * dt - 0.5 * gravity * dt * dt;
  g.vy -= gravity * dt;
  const ground = groundY(g.x, g.z);
  if (g.y <= ground) {
    g.y = ground;
    g.alive = false;
  }
}

/** Seconds until a grain launched upward at vy from h0 above flat ground lands. */
export function timeToGround(vy: number, h0: number, g = LUNAR_G): number {
  return (vy + Math.sqrt(vy * vy + 2 * g * h0)) / g;
}

/** Grains thrown up by a boot or body hitting the ground at this speed. */
export function burstCount(impactSpeedMs: number): number {
  if (impactSpeedMs < MIN_IMPACT_MS) return 0;
  return Math.min(MAX_BURST, Math.round(impactSpeedMs * GRAINS_PER_MS));
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Launch velocities fanning out around the feet, 15–60° above the horizontal. */
export function burstVelocities(n: number, impactSpeedMs: number, rand: () => number): { vx: number; vy: number; vz: number }[] {
  const base = clamp(impactSpeedMs, 0.5, 4);
  const out: { vx: number; vy: number; vz: number }[] = [];
  for (let i = 0; i < n; i++) {
    const az = rand() * Math.PI * 2;
    const elev = ((15 + rand() * 45) * Math.PI) / 180;
    const speed = (0.4 + 0.6 * rand()) * base;
    const h = speed * Math.cos(elev);
    out.push({ vx: h * Math.sin(az), vy: speed * Math.sin(elev), vz: h * Math.cos(az) });
  }
  return out;
}

/**
 * Wheel "rooster tail" (Apollo rover footage): regolith flung backwards and up off the tyre, 25–60° above
 * the horizontal, within ±20° of straight behind, at up to the wheel's speed. Too slow to throw: none.
 */
export function sprayVelocities(n: number, dirYaw: number, speedMs: number, rand: () => number): { vx: number; vy: number; vz: number }[] {
  if (speedMs < 0.1) return [];
  const out: { vx: number; vy: number; vz: number }[] = [];
  const back = dirYaw + Math.PI;
  for (let i = 0; i < n; i++) {
    const az = back + (rand() - 0.5) * 0.7;
    const elev = ((25 + rand() * 35) * Math.PI) / 180;
    const speed = (0.35 + 0.65 * rand()) * speedMs;
    const h = speed * Math.cos(elev);
    out.push({ vx: h * Math.sin(az), vy: speed * Math.sin(elev), vz: h * Math.cos(az) });
  }
  return out;
}

/** Rocket-plume spray at liftoff: fast grains thrown out low (2–15°) in every direction, no drag. */
export function plumeVelocities(n: number, speedMs: number, rand: () => number): { vx: number; vy: number; vz: number }[] {
  const out: { vx: number; vy: number; vz: number }[] = [];
  for (let i = 0; i < n; i++) {
    const az = rand() * Math.PI * 2;
    const elev = ((2 + rand() * 13) * Math.PI) / 180;
    const speed = (0.5 + 0.5 * rand()) * speedMs;
    const h = speed * Math.cos(elev);
    out.push({ vx: h * Math.sin(az), vy: speed * Math.sin(elev), vz: h * Math.cos(az) });
  }
  return out;
}
