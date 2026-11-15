/**
 * Lunar descent physics for the landing intro (Plan 5): the orbital braking burn (interaction 1) and the
 * final descent (interaction 2). Pure functions, g = 1.62 m/s², no air drag, rocket equation dm/dt = −F/vₑ.
 *
 * The numbers are rounded game values, NOT SpaceX specifications. The Starship HLS really does use
 * high-mounted landing thrusters for the last part of the descent, so the final phase uses a smaller
 * thrust than the braking burn.
 */

export const G_MOON = 1.62;

export const HLS = {
  dryKg: 120_000,
  /** Enough for the braking burn (Δv = vₑ·ln(m₀/m₁) ≈ 2 070 m/s) — see the plan 5 ledger ruling. */
  fuelKg: 90_000,
  ve: 3_700,
  maxThrustN: 2_000_000,
} as const;

/** Final descent on the landing thrusters: hover needs about half throttle, so a held key is controllable. */
export const LAND = { thrustN: 400_000, fuelKg: 10_000, startH: 300, startVy: -12, startVx: 4 } as const;

const TILT_RATE_DEG_S = 8;
const TILT_MAX_DEG = 15;
const DEG = Math.PI / 180;

// ---------- braking burn ----------

export interface BrakeState { v: number; h: number; fuelKg: number; t: number }

/** Low lunar orbit speed (about 6 000 km/h) at 15 km. */
export const BRAKE_START: BrakeState = { v: 1_680, h: 15_000, fuelKg: HLS.fuelKg, t: 0 };
const BRAKE_END_H = 300;
/** The deceleration the target curve asks for. Full throttle gives 9.5–14.7 m/s², so there is headroom. */
const BRAKE_NOMINAL_DECEL = 7;
const BAND = 0.12;

const brakeTarget = (h: number) => BRAKE_START.v * (Math.max(h, 0) / BRAKE_START.h) ** 0.8;
/** Distance along the authored target-speed track, independent of time acceleration. */
export const brakeTravel=(fromH:number,toH:number)=>(brakeTarget(fromH)**2-brakeTarget(toH)**2)/(2*BRAKE_NOMINAL_DECEL);

export function brakeBand(h: number): { lo: number; hi: number } {
  const c = brakeTarget(h);
  return { lo: c * (1 - BAND), hi: c * (1 + BAND) };
}

/**
 * One step of the braking burn. Throttle only changes the speed; the height follows a fixed descent
 * schedule (the guidance computer's trajectory), so braking too little leaves the ship too fast for its
 * height and braking too hard leaves it too slow.
 */
export function brakeStep(s: BrakeState, throttle: number, dt: number): BrakeState {
  const u = s.fuelKg > 0 ? clamp(throttle, 0, 1) : 0;
  const m = HLS.dryKg + s.fuelKg;
  const thrust = u * HLS.maxThrustN;
  const v = Math.max(0, s.v - (thrust / m) * dt);
  // On the target curve v ∝ h^0.8, so dv/dh = 0.8·v/h; the schedule makes the nominal deceleration constant.
  const vt = Math.max(brakeTarget(s.h), 1);
  const h = Math.max(0, s.h - (BRAKE_NOMINAL_DECEL / 0.8) * (s.h / vt) * dt);
  const fuelKg = Math.max(0, s.fuelKg - (thrust / HLS.ve) * dt);
  return { v, h, fuelKg, t: s.t + dt };
}

export const brakeDone = (s: BrakeState): boolean => s.h <= BRAKE_END_H;

/** Assist mode for the braking burn: track the centre of the band. */
export function brakeAutopilot(s: BrakeState): number {
  const m = HLS.dryKg + s.fuelKg;
  const want = BRAKE_NOMINAL_DECEL + 0.1 * (s.v - brakeTarget(s.h));
  return clamp((want * m) / HLS.maxThrustN, 0, 1);
}

// ---------- final descent ----------

export interface LandState { h: number; vy: number; vx: number; tiltDeg: number; fuelKg: number; massKg: number }
export interface LandInput { throttle: number; tiltInput: number }
export type Touchdown = 'ok' | 'tipped' | 'tooFast';

export function landStart(): LandState {
  return { h: LAND.startH, vy: LAND.startVy, vx: LAND.startVx, tiltDeg: 0, fuelKg: LAND.fuelKg, massKg: HLS.dryKg + LAND.fuelKg };
}

export function landStep(s: LandState, input: LandInput, dt: number): LandState {
  const u = s.fuelKg > 0 ? clamp(input.throttle, 0, 1) : 0;
  const wantedTilt = clamp(s.tiltDeg + clamp(input.tiltInput, -1, 1) * TILT_RATE_DEG_S * dt, -TILT_MAX_DEG, TILT_MAX_DEG);
  const tiltDeg=s.tiltDeg+clamp(wantedTilt-s.tiltDeg,-TILT_RATE_DEG_S*dt,TILT_RATE_DEG_S*dt);
  const thrust = u * LAND.thrustN;
  const ay = (thrust * Math.cos(tiltDeg * DEG)) / s.massKg - G_MOON;
  const ax = (thrust * Math.sin(tiltDeg * DEG)) / s.massKg;
  const vy = s.vy + ay * dt;
  const vx = s.vx + ax * dt;
  const fuelKg = Math.max(0, s.fuelKg - (thrust / HLS.ve) * dt);
  return { h: s.h + vy * dt, vy, vx, tiltDeg, fuelKg, massKg: HLS.dryKg + fuelKg };
}

/** Null while still flying. At contact: upright and gentle is 'ok'; leaning over 6° tips the ship. */
export function touchdown(s: LandState): Touchdown | null {
  if (s.h > 0) return null;
  if (Math.abs(s.tiltDeg) > 6) return 'tipped';
  return Math.abs(s.vy) <= 1 && Math.abs(s.vx) <= 1 ? 'ok' : 'tooFast';
}

/** PD autopilot for younger pilots: come down along a speed profile to −0.8 m/s and cancel drift. */
export function autopilot(s: LandState): LandInput {
  const vyTarget = -clamp(0.12 * s.h + 0.6, 0.8, 12);
  const wantAy = G_MOON + 1.5 * (vyTarget - s.vy);
  const throttle = clamp((wantAy * s.massKg) / (LAND.thrustN * Math.cos(s.tiltDeg * DEG)), 0, 1);
  const tiltTarget = s.h < 12 ? 0 : clamp(-4 * s.vx, -12, 12);
  const tiltInput = clamp((tiltTarget - s.tiltDeg) / 2, -1, 1);
  return { throttle, tiltInput };
}

export interface LandAttempt { state: LandState; attempts: number }

/** After a failed touchdown: back to the start of the final descent with full landing fuel. */
export function retryLand(prev: LandAttempt): LandAttempt {
  return { state: landStart(), attempts: prev.attempts + 1 };
}

/** From the second failed try on, offer the autopilot (H). */
export const suggestAutopilot = (a: LandAttempt): boolean => a.attempts >= 2;

/** Which explanation a failed touchdown gets: tipped over, ran out of fuel, drifted sideways, or just too hard. */
export function failureLineId(k: Exclude<Touchdown, 'ok'>, s?: LandState): string {
  if (k === 'tipped') return 'land_tipped';
  if (s && s.fuelKg <= 0) return 'land_noFuel';
  if (s && Math.abs(s.vx) > 1 && Math.abs(s.vy) <= 1) return 'land_drift';
  return 'land_tooFast';
}

/**
 * Fuel left as seconds of hover, the way Apollo crews heard it ("60 seconds!"). Hovering burns m·g/vₑ, so
 * with the mass falling the time is vₑ/g · ln(m_now / m_dry).
 */
export function fuelSecondsLeft(fuelKg: number): number {
  if (fuelKg <= 0) return 0;
  return (HLS.ve / G_MOON) * Math.log((HLS.dryKg + fuelKg) / HLS.dryKg);
}

/** Skipping (Esc) at any point ends in the same landed state, with no pretend fuel spent. */
export function skipToEnd(_from?: BrakeState | LandState): { landed: true; fuelUsedKg: 0 } {
  return { landed: true, fuelUsedKg: 0 };
}

function clamp(x: number, lo: number, hi: number): number {
  return x < lo ? lo : x > hi ? hi : x;
}
