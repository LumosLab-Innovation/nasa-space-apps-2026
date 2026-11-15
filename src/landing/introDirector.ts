import { BRAKE_START, type BrakeState } from './descent';
import { flightReference, flightStart, stepFlight } from './guidedFlight';

export type IntroStage = 'm1' | 'tranquility' | 'undock' | 'pip' | 'brake' | 'done';
export type IntroEvent = 'alarm' | 'bandWarn' | 'done';

const ORDER: IntroStage[] = ['m1', 'tranquility', 'undock', 'pip', 'brake', 'done'];
/** The braking burn runs at ×10 time: 229 s of real physics in about 23 s of play (HUD shows "TIME ×10"). */
export const BRAKE_WARP = 10;
/**
 * The 1202-style program alarm sounds once, at 6 km (Apollo 11's first 1202 came near 10 km). That leaves
 * about 10 s of play before the burn ends, so Houston's "GO" is heard (final review, Plan 5).
 */
export const ALARM_H = 6_000;
const WARN_AFTER_S = 3;

/** Story beats M1–M5 of the orbital intro; the scene plays the lines and calls next() when each one ends. */
export class IntroDirector {
  stage: IntroStage = 'm1';
  brake: BrakeState = { ...BRAKE_START };
  throttle = 0;
  flight = flightStart();
  ground = 0;
  private alarmFired = false;
  private outS = 0;

  constructor(private readonly opts: { assist: boolean }) {}

  get assist(): boolean {
    return this.opts.assist;
  }

  next(): void {
    if (this.stage === 'brake' || this.stage === 'done') return;
    this.stage = ORDER[ORDER.indexOf(this.stage) + 1];
  }

  get inBand(): boolean {
    const b = this.band;
    return this.brake.v >= b.lo && this.brake.v <= b.hi;
  }

  get band() { const v=flightReference(this.brake.h).vx; return {lo:v*.88,hi:v*1.12}; }

  /** dt is real seconds; throttle 0..1 from the held key (ignored in assist mode). */
  stepBrake(dt: number, throttle: number, warp = BRAKE_WARP): IntroEvent[] {
    if (this.stage !== 'brake') return [];
    const ev: IntroEvent[] = [];
    this.flight=stepFlight(this.flight,{assist:this.opts.assist,throttle,ground:this.ground,attitudeTimeScale:1/Math.max(1,warp)},dt*warp);
    this.throttle=this.flight.throttle;
    this.brake={v:this.flight.vx,h:this.flight.y-this.ground,fuelKg:this.flight.fuelKg,t:this.flight.t};
    if (!this.alarmFired && this.brake.h <= ALARM_H) {
      this.alarmFired = true;
      ev.push('alarm');
    }
    this.outS = this.inBand ? 0 : this.outS + dt;
    if (this.outS >= WARN_AFTER_S) {
      this.outS = 0;
      ev.push('bandWarn');
    }
    if (this.brake.h <= 300) {
      this.stage = 'done';
      ev.push('done');
    }
    return ev;
  }
}
