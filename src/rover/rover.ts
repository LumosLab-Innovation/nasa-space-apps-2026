import { LUNAR_G } from '../config/constants';
import { tr } from '../i18n/i18n';
import type { PipMode } from '../pip/brain';
import type { MeetStage } from '../story/pipMeeting';
import { ROVER_PARK } from '../world/zones';

export { ROVER_PARK };

/**
 * Drivable Artemis lunar terrain vehicle (Plan 7, spec §3.7). Pure rules; roverSystem.ts drives the scene.
 * Apollo's LRV: 2.3 m wheelbase (NASA NSSDC), designed for about 9–13 km/h and slopes up to ~25°
 * (NASA NTRS 20250011301), 18 km/h record on Apollo 17. The game tops out at 5 m/s (18 km/h) and stops at
 * 20° for a safety margin; the "bounce" is the suspension sag that sets its slow lunar spring.
 */
export const ROVER = { maxSpeedMs: 5, accel: 1.2, brake: 2.5, steerRad: 0.5, wheelbaseM: 2.3, maxSlopeDeg: 20, bounce: 0.25 } as const;
const TRACK_M = 1.9;
const COAST_MS2 = 0.5;
const REVERSE = { maxMs: 1.5, accel: 0.6, afterStillS: 0.4 } as const;
const DAMPING = 0.25;

export interface RoverState {
  x: number;
  z: number;
  yaw: number;
  speed: number;
  pitch: number;
  roll: number;
  /** Body height above its rest position on the suspension (m) and its rate (m/s). */
  bounceY: number;
  bounceV: number;
  /** Vertical speed of the ground under the rover last step (feeds the suspension). */
  groundVy: number;
  /** Seconds spent standing still with the brake held (reverse engages after a short stop). */
  stillS: number;
}

export interface RoverGround {
  height(x: number, z: number): number;
  /** Steepness along a heading (degrees, uphill or downhill). */
  slopeDeg(x: number, z: number, yaw: number): number;
  /** Places the rover may not enter (the Dark Crater, around the shelter and the lander). */
  forbidden(x: number, z: number): boolean;
}

export function initRover(x: number, z: number, yaw: number): RoverState {
  return { x, z, yaw, speed: 0, pitch: 0, roll: 0, bounceY: 0, bounceV: 0, groundVy: 0, stillS: 0 };
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function roverStep(prev: RoverState, input: { throttle: number; steer: number }, ground: RoverGround, dt: number): RoverState {
  const s = { ...prev };
  if (dt <= 0) return s;
  const thr = clamp(input.throttle, -1, 1);
  const steer = clamp(input.steer, -1, 1);

  // Speed: throttle, brakes (S while rolling forward), a short stop before reverse, coasting on regolith.
  if (thr > 0) {
    s.stillS = 0;
    s.speed = s.speed < 0 ? Math.min(0, s.speed + ROVER.brake * thr * dt) : Math.min(ROVER.maxSpeedMs, s.speed + ROVER.accel * thr * dt);
  } else if (thr < 0) {
    if (s.speed > 0) s.speed = Math.max(0, s.speed + ROVER.brake * thr * dt);
    else {
      if (s.speed === 0) s.stillS += dt;
      if (s.stillS >= REVERSE.afterStillS || s.speed < 0) s.speed = Math.max(-REVERSE.maxMs, s.speed + REVERSE.accel * thr * dt);
    }
  } else {
    s.stillS = 0;
    s.speed = s.speed > 0 ? Math.max(0, s.speed - COAST_MS2 * dt) : Math.min(0, s.speed + COAST_MS2 * dt);
  }

  // Bicycle model: the front wheels steer, the rover turns about its rear axle.
  s.yaw += (s.speed / ROVER.wheelbaseM) * Math.tan(steer * ROVER.steerRad) * dt;

  const h0 = ground.height(s.x, s.z);
  if (s.speed !== 0) {
    const nx = s.x + Math.sin(s.yaw) * s.speed * dt;
    const nz = s.z + Math.cos(s.yaw) * s.speed * dt;
    const travelYaw = s.speed >= 0 ? s.yaw : s.yaw + Math.PI;
    if (ground.forbidden(nx, nz) || ground.slopeDeg(nx, nz, travelYaw) > ROVER.maxSlopeDeg) {
      s.speed = 0; // stops at the edge
    } else {
      s.x = nx;
      s.z = nz;
    }
  }

  // Suspension: a damped spring whose stiffness comes from the sag under lunar gravity (ω = √(g/sag)).
  const h1 = ground.height(s.x, s.z);
  const gv = (h1 - h0) / dt;
  const w = Math.sqrt(LUNAR_G / ROVER.bounce);
  let v = s.bounceV - (gv - s.groundVy);
  v += (-w * w * s.bounceY - 2 * DAMPING * w * v) * dt;
  v = clamp(v, -3, 3);
  s.bounceY = clamp(s.bounceY + v * dt, -0.2, 0.3);
  s.bounceV = v;
  s.groundVy = gv;

  const fx = Math.sin(s.yaw), fz = Math.cos(s.yaw);
  const half = ROVER.wheelbaseM / 2;
  s.pitch = Math.atan2(ground.height(s.x + fx * half, s.z + fz * half) - ground.height(s.x - fx * half, s.z - fz * half), ROVER.wheelbaseM);
  const rx = Math.cos(s.yaw), rz = -Math.sin(s.yaw);
  s.roll = Math.atan2(ground.height(s.x + rx * TRACK_M / 2, s.z + rz * TRACK_M / 2) - ground.height(s.x - rx * TRACK_M / 2, s.z - rz * TRACK_M / 2), TRACK_M);
  return s;
}

/** The player climbs in within 3 m; Pip rides along only when nothing else needs it. */
export function canBoard(s: { distM: number; pipMode: PipMode; pipBusy: boolean }): { player: boolean; pip: boolean } {
  const player = s.distM <= 3;
  const pipFree = s.pipMode === 'follow' || s.pipMode === 'wait' || s.pipMode === 'ride';
  return { player, pip: player && !s.pipBusy && pipFree };
}

/**
 * When the stowed rover appears: it waits until the first meeting is completely over (the greeting chain
 * marks meetPip done before Pip is marked met), comes down beside the lander after a meeting played in this
 * session ('pip:met'), and is simply parked at camp after a dev jump, the demo or an earlier deployment.
 */
export function roverArrival(meet: MeetStage, flags: Set<string>): 'wait' | 'lower' | 'park' {
  if (meet !== 'done') return 'wait';
  return flags.has('pip:met') && !flags.has('rover:deployed') ? 'lower' : 'park';
}

/** What else is going on in the world, for the rover's rules. */
export interface WorldBusy {
  storm: boolean;
  cargoCountdown: boolean;
  towing: boolean;
  winchHoldsPip: boolean;
  pipCarrying: boolean;
  pipSleeping: boolean;
}

/**
 * Moments that need the astronaut on foot (the challenges run their timers and keys only on foot): a solar
 * storm warning or storm, the cargo lander countdown, towing MICA, the winch pulling Pip. The player cannot
 * climb in, and is put out of the rover if one starts while driving.
 */
export function walkReason(b: WorldBusy): string | null {
  if (b.storm) return tr('Rover unavailable during the solar storm: stay on foot and find shelter.');
  if (b.cargoCountdown) return tr('Rover unavailable during cargo landing: finish protecting the equipment on foot.');
  if (b.towing) return tr('Finish towing MICA before driving the rover.');
  if (b.winchHoldsPip) return tr('Free Pip with the winch before driving the rover.');
  return null;
}
export const mustWalk = (b: WorldBusy): boolean => walkReason(b) !== null;

/** Pip keeps doing its job instead of riding: carrying a crate, held by the winch or the tow, asleep. */
export const pipBusyFor = (b: WorldBusy): boolean => b.pipSleeping || b.towing || b.winchHoldsPip || b.pipCarrying;

/** Getting out only needs the rover (nearly) stopped, wherever it is, so a stuck rover never traps you. */
export const canLeave = (s: RoverState): boolean => Math.abs(s.speed) < 0.5;
