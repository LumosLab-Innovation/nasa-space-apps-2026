import type { GameState } from '../core/gameState';

/**
 * Suit oxygen, suit heat and Pip's battery (spec v3 §7.3). Pure and testable. There is no game over:
 * when something runs out, Pip brings the player home and explains (v2 §5.8) — progress is never lost.
 * All values are percentages 0..100; rates are per real second.
 */
export interface Resources {
  o2: number;
  heat: number;
  pip: number;
}

export interface Env {
  playerInSun: boolean;
  inDarkCrater: boolean;
  nearPip: boolean;
  atCamp: boolean;
  pipInSun: boolean;
  pipMoving: boolean;
  pipLamp: boolean;
  /** How squarely Pip's vertical panels face the Sun, 0..1. */
  pipPanelFactor: number;
  /** Dust coat on Pip's panels, 0..1. */
  pipDust: number;
}

/** The slice of Pip's upgrades this module needs (src/pip/upgrades.ts provides the full set). */
export interface Upg {
  heater: boolean;
  fastCharge: boolean;
  batteryX: number;
}

export const RATES = {
  o2Drain: 0.08,
  o2Refill: 5,
  heatDrainDark: 1.6,
  heatDrainDarkHeater: 0.35,
  heatRecover: 0.8,
  pipMove: 0.15,
  pipLamp: 0.1,
  pipHeater: 0.2,
  pipCharge: 1.2,
};

const clamp = (v: number) => Math.min(100, Math.max(0, v));

export function stepResources(r: Resources, env: Env, upg: Upg, dt: number): Resources {
  const heating = upg.heater && env.nearPip && r.pip > 0;
  const o2 = env.atCamp ? r.o2 + RATES.o2Refill * dt : r.o2 - RATES.o2Drain * dt;
  const heat = env.inDarkCrater
    ? r.heat - (heating ? RATES.heatDrainDarkHeater : RATES.heatDrainDark) * dt
    : r.heat + RATES.heatRecover * dt;
  let drain = 0;
  if (env.pipMoving) drain += RATES.pipMove;
  if (env.pipLamp) drain += RATES.pipLamp;
  if (env.inDarkCrater && heating) drain += RATES.pipHeater;
  let charge = 0;
  if (env.pipInSun) {
    charge = RATES.pipCharge * Math.max(0, Math.min(1, env.pipPanelFactor)) * (1 - Math.max(0, Math.min(1, env.pipDust)));
    if (upg.fastCharge && env.atCamp) charge *= 2;
  }
  // A bigger battery moves the percentage more slowly both ways.
  const pip = r.pip + ((charge - drain) / Math.max(1, upg.batteryX)) * dt;
  return { o2: clamp(o2), heat: clamp(heat), pip: clamp(pip) };
}

/** Which resource forces a rescue, most urgent first; an empty Pip in sunlight just recharges. */
export function needsRescue(r: Resources, pipInSun = false): 'o2' | 'heat' | 'pip' | null {
  if (r.o2 <= 0) return 'o2';
  if (r.heat <= 0) return 'heat';
  if (r.pip <= 0 && !pipInSun) return 'pip';
  return null;
}

/** Rescue refills everything and touches nothing else: modules, samples, flags and cards are kept. */
export function applyRescue(_state: GameState, _r: Resources): Resources {
  return { o2: 100, heat: 100, pip: 100 };
}

/**
 * Pip's three vertical panels face left, right and back (the front is open for the mast and arm).
 * Returns how squarely the best one faces a Sun at azimuth `sunAzDeg` (0 = +z), for body yaw `yaw` (rad).
 */
export function panelFactor(yaw: number, sunAzDeg: number): number {
  const a = (sunAzDeg * Math.PI) / 180;
  const sx = Math.sin(a);
  const sz = Math.cos(a);
  const fx = Math.sin(yaw);
  const fz = Math.cos(yaw);
  const rx = Math.cos(yaw);
  const rz = -Math.sin(yaw);
  return Math.max(0, -(fx * sx + fz * sz), rx * sx + rz * sz, -(rx * sx + rz * sz));
}
