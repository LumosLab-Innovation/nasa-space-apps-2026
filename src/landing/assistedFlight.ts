import { G_MOON, LAND, autopilot, type LandInput, type LandState, type Touchdown } from './descent';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
export const MANUAL_THROTTLE_RATE = .35;

export function assistedThrottle(nominal: number, automatic: number, held: boolean, correctionLimit: number): number {
  const correction = clamp((automatic - nominal) * .25, -correctionLimit, correctionLimit);
  return clamp(nominal + correction + (held ? .18 : -.12), 0, 1);
}

export function assistedLandingInput(s: LandState, held: boolean, steering: number): LandInput {
  const hover = G_MOON * s.massKg / (LAND.thrustN * Math.cos(s.tiltDeg * Math.PI / 180));
  const driftTarget = clamp(-s.vx * 2, -4, 4) * clamp(s.h / 12, 0, 1);
  const target = steering ? clamp(s.tiltDeg + steering * 5, -12, 12) : driftTarget;
  const turnRate = clamp((target - s.tiltDeg) * 2, steering ? -5 : -3, steering ? 5 : 3);
  return {
    throttle: s.fuelKg > 0 ? assistedThrottle(hover, autopilot(s).throttle, held, .10) : 0,
    tiltInput: turnRate / 8,
  };
}

export function manualTouchdown(s: LandState): Touchdown | null {
  if (s.h > 0) return null;
  if (Math.abs(s.tiltDeg) > 8) return 'tipped';
  return Math.abs(s.vy) <= 2 && Math.abs(s.vx) <= 1.5 ? 'ok' : 'tooFast';
}

export function brakingBand(reference: number): { lo: number; hi: number } {
  const half = Math.max(reference * .18, 3);
  return { lo: reference - half, hi: reference + half };
}

export type FlightFailureReason = 'brakingFast' | 'brakingSlow' | 'approachFast' | 'impact' | 'tipped' | 'outside';

export class BrakingFailureMonitor {
  private elapsed = 0;
  private severeTime = 0;
  private previousError: number | null = null;
  reset(): void { this.elapsed = this.severeTime = 0; this.previousError = null; }
  update(dt: number, height: number, speed: number, reference: number, verticalSpeed: number): FlightFailureReason | null {
    this.elapsed += dt;
    if (height <= 0) return 'impact';
    if (height <= 300 && (Math.abs(speed) > 12 || verticalSpeed < -25)) return 'approachFast';
    const error = Math.abs(speed - reference);
    const errorScale = Math.max(reference, 15 / .45);
    // Normalize closing speed with one common scale: a falling reference must
    // not turn actual recovery into failure solely by shrinking the denominator.
    const recovering = this.previousError !== null && error < this.previousError - .015 * errorScale * dt;
    this.previousError = error;
    // A player correcting toward the band must not lose to an old countdown.
    this.severeTime = error > .45 * errorScale && this.elapsed > 2
      ? Math.max(0, this.severeTime + (recovering ? -2 : 1) * dt) : 0;
    if (this.severeTime + 1e-8 >= 6) return speed > reference ? 'brakingFast' : 'brakingSlow';
    return null;
  }
}

/** One attempt owns one explosion and one choice, even if multiple failure tests fire. */
export class FailureAttempt {
  reason: FlightFailureReason | null = null;
  elapsed = 0;
  private chosen = false;
  get active(): boolean { return this.reason !== null; }
  get canChoose(): boolean { return this.active && this.elapsed >= 2 && !this.chosen; }
  fail(reason: FlightFailureReason): boolean {
    if (this.active) return false;
    this.reason = reason; this.elapsed = 0; this.chosen = false;
    return true;
  }
  update(dt: number): void { if (this.active) this.elapsed = Math.min(5, this.elapsed + Math.max(0, dt)); }
  choose(): boolean { if (!this.canChoose) return false; this.chosen = true; return true; }
  reset(): void { this.reason = null; this.elapsed = 0; this.chosen = false; }
}
