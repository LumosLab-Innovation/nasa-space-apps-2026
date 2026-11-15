import { LUNAR_G } from '../config/constants';
import { legIk, type V3 } from './legIk';

/**
 * Lunar gait for the rigid-part astronaut (spec v3 §4.5, Plan 7 spec §3.2). Apollo crews found walking
 * awkward at 1/6 g and mostly used the "bunny hop" lope: both legs push off together and the body floats
 * between contacts. Angles in radians; hip/shoulder/ankle/wrist + = swing forward, knee/elbow + = bend,
 * spine + = lean forward, neck + = nod down, roll + = lean to the right.
 */
export type GaitMode = 'idle' | 'walk' | 'lope' | 'air';
export type { V3 };

export interface Pose {
  hipL: number;
  hipR: number;
  kneeL: number;
  kneeR: number;
  shoulderL: number;
  shoulderR: number;
  elbowL: number;
  elbowR: number;
  /** Vertical pelvis offset in metres (bob, suit flex and landing crouch together). */
  bob: number;
  spine: number;
  neck: number;
  ankleL: number;
  ankleR: number;
  wristL: number;
  wristR: number;
  /** Landing crouch, 0..LAND_CROUCH.max. */
  crouch: number;
  /** Forward lean of the upper body. */
  lean: number;
  /** Sideways lean into a turn. */
  roll: number;
}

export function gaitMode(speedMs: number, lope: boolean, supported: boolean): GaitMode {
  if (!supported) return 'air';
  if (speedMs < 0.1) return 'idle';
  return lope ? 'lope' : 'walk';
}

/** Phase in [0, 1): one full cycle per stride length travelled. */
export function advancePhase(phase: number, speedMs: number, dt: number, strideM = 1.4): number {
  const p = phase + (speedMs * dt) / strideM;
  return p - Math.floor(p);
}

const ZERO: Pose = {
  hipL: 0, hipR: 0, kneeL: 0, kneeR: 0, shoulderL: 0, shoulderR: 0, elbowL: 0, elbowR: 0, bob: 0,
  spine: 0, neck: 0, ankleL: 0, ankleR: 0, wristL: 0, wristR: 0, crouch: 0, lean: 0, roll: 0,
};

/** Simple phase-driven poses (Plan 2), kept for the fallback body and tests. */
export function gaitPose(mode: GaitMode, phase: number): Pose {
  const s = Math.sin(phase * Math.PI * 2);
  switch (mode) {
    case 'idle':
      return { ...ZERO };
    case 'walk':
      return {
        ...ZERO,
        hipL: 0.42 * s,
        hipR: -0.42 * s,
        kneeL: 0.15 + 0.35 * Math.max(0, -s),
        kneeR: 0.15 + 0.35 * Math.max(0, s),
        shoulderL: -0.32 * s,
        shoulderR: 0.32 * s,
        elbowL: 0.35,
        elbowR: 0.35,
        bob: 0.03 * Math.abs(s),
      };
    case 'lope':
      return {
        ...ZERO,
        hipL: 0.35 * s,
        hipR: 0.35 * s,
        kneeL: 0.45 + 0.3 * s,
        kneeR: 0.45 + 0.3 * s,
        shoulderL: -0.2 * s + 0.15,
        shoulderR: -0.2 * s + 0.15,
        elbowL: 0.6,
        elbowR: 0.6,
        bob: 0.12 * Math.abs(s),
      };
    case 'air':
      return { ...ZERO, hipL: 0.25, hipR: 0.15, kneeL: 0.6, kneeR: 0.5, shoulderL: 0.3, shoulderR: 0.25, elbowL: 0.45, elbowR: 0.45 };
  }
}

export function blendGait(a: Pose, b: Pose, t: number): Pose {
  const k = Math.min(1, Math.max(0, t));
  const out = { ...a };
  for (const key of Object.keys(a) as (keyof Pose)[]) out[key] = a[key] + (b[key] - a[key]) * k;
  return out;
}

// ---------------------------------------------------------------------------------------------------------
// Plan 7: planted feet, smooth turns, jump crouch and breathing.

/** ≈ 340°/s: a 180° turn takes about half a second. */
export const MAX_TURN_RAD_S = 6;
/** Landing crouch = min(max, perMs · |fall speed|), recovered in about 0.4 s. */
export const LAND_CROUCH = { perMs: 0.12, max: 0.35 } as const;
/** astronaut.glb measurements (tools/blender/build_astronaut.py): hip pivot height, leg bones, ankle height. */
export const BODY = { hipY: 0.94, hipX: 0.13, thighM: 0.41, shinM: 0.4, ankleM: 0.13, flexM: 0.04, crouchDropM: 0.4 } as const;

/**
 * Walk 1.8 m/s: a "đi nhún" with a short float between steps (the stance covers only ~0.5 m of each 0.7 m
 * step). Lope: both feet push off almost together and the body floats for ~0.5 s under lunar gravity.
 */
const GAITS = {
  walk: { stride: 1.4, duty: 0.36, offR: 0.5, lift: 0.1, lean: 0.105, nominal: 1.8, press: 0.025, steps: 2 },
  lope: { stride: 2.0, duty: 0.25, offR: 0.04, lift: 0.08, lean: 0.21, nominal: 2.8, press: 0.06, steps: 1 },
} as const;
const BREATH = { amp: (1.5 * Math.PI) / 180, periodS: 4 } as const;

export interface GaitState {
  phase: number;
  /** World position of each ankle; null in the air. */
  footL: V3 | null;
  footR: V3 | null;
  crouch: number;
  lean: number;
  yaw: number;
  roll: number;
  t: number;
  mode: GaitMode;
  stanceL: boolean;
  stanceR: boolean;
  /** Body-local forward offset of each foot when it lifted off (start of the swing). */
  liftL: number;
  liftR: number;
  airVy: number;
  /** Capsule-to-ground render offset, retained in flight to avoid a contact-state pop. */
  groundOffset: number;
  crouchPeak: number;
  landT: number;
  /** 0 → 1 over a quarter second after a gait change (blends the legs, then they follow IK exactly). */
  settle: number;
  pose: Pose;
}

export interface GaitInput {
  /** Body position at foot level (world). */
  pos: V3;
  speedMs: number;
  lope: boolean;
  supported: boolean;
  /** Vertical velocity (m/s). */
  vy: number;
  groundAt: (x: number, z: number) => number;
  desiredYaw: number;
  dt: number;
}

/** Grounded, motionless pose (also used while riding the lander elevator standing up). */
export const STANDING_POSE: Pose = { ...ZERO, bob: -BODY.flexM };

export function initGait(yaw = 0): GaitState {
  return {
    phase: 0, footL: null, footR: null, crouch: 0, lean: 0, yaw, roll: 0, t: 0, mode: 'idle',
    stanceL: false, stanceR: false, liftL: 0, liftR: 0, airVy: 0, groundOffset: 0, crouchPeak: 0, landT: Infinity, settle: 1,
    pose: { ...STANDING_POSE },
  };
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const frac = (v: number) => v - Math.floor(v);
const wrapPi = (a: number) => a - 2 * Math.PI * Math.floor((a + Math.PI) / (2 * Math.PI));
const ease = (s: number) => s * s * (3 - 2 * s);

export function stepGait(prev: GaitState, inp: GaitInput): { st: GaitState; pose: Pose; planted: ('L' | 'R')[] } {
  const st: GaitState = { ...prev };
  const dt = Math.max(0, inp.dt);
  st.t += dt;
  const planted: ('L' | 'R')[] = [];

  // Turning: capped rate; the movement direction itself still follows the keys at once (movement.ts).
  const err = wrapPi(inp.desiredYaw - st.yaw);
  const turn = clamp(err, -MAX_TURN_RAD_S * dt, MAX_TURN_RAD_S * dt);
  st.yaw = wrapPi(st.yaw + turn);
  const turnRate = dt > 0 ? turn / dt : 0;

  const turningInPlace = inp.supported && inp.speedMs < 0.1 && Math.abs(err) > 0.2;
  const speed = turningInPlace ? 0.6 : inp.speedMs;
  const mode = gaitMode(speed, inp.lope, inp.supported);
  if (mode !== st.mode) st.settle = 0;

  // Jump and landing: remember the fall speed, crouch on touchdown in proportion to it.
  // Fastest fall speed of this flight (on the contact frame the physics has already zeroed vy).
  if (mode === 'air') st.airVy = st.mode === 'air' ? Math.min(st.airVy, inp.vy) : inp.vy;
  else if (st.mode === 'air') {
    st.crouchPeak = Math.min(LAND_CROUCH.max, LAND_CROUCH.perMs * Math.abs(Math.min(0, st.airVy)));
    st.landT = 0;
  }
  if (Number.isFinite(st.landT)) {
    st.landT += dt;
    const RISE_S = 0.08;
    st.crouch = st.landT < RISE_S ? st.crouchPeak * (st.landT / RISE_S) : st.crouchPeak * Math.exp(-(st.landT - RISE_S) / 0.11);
    if (st.landT > 0.6) {
      st.landT = Infinity;
      st.crouch = 0;
    }
  }
  st.mode = mode;

  const g = mode === 'lope' ? GAITS.lope : GAITS.walk;
  const moving = mode === 'walk' || mode === 'lope';
  const stride = g.stride * clamp(speed / g.nominal, 0.45, 1.15);
  const span = turningInPlace ? 0.05 : g.duty * stride;
  if (moving) st.phase = advancePhase(st.phase, speed, dt, stride);

  // Pelvis: suit flex, landing crouch, stance compression, then a ballistic float between contacts.
  let bob = -BODY.flexM - st.crouch * BODY.crouchDropM;
  // Havok's supported capsule includes a contact clearance above the terrain.
  // Compensate it throughout the stride, not only while a foot is planted:
  // otherwise releasing the last support snaps the pelvis back up by ~15 cm.
  if (inp.supported) st.groundOffset = clamp(inp.groundAt(inp.pos.x, inp.pos.z) - inp.pos.y, -.3, .3);
  bob += st.groundOffset;
  if (moving) {
    const q = frac(st.phase * g.steps);
    const dutyQ = g.duty * g.steps;
    const stepS = stride / g.steps / Math.max(0.3, speed);
    if (q < dutyQ) bob -= g.press * Math.sin((Math.PI * q) / dutyQ);
    else {
      const T = (1 - dutyQ) * stepS;
      const tau = (q - dutyQ) * stepS;
      bob += Math.min(0.12, (LUNAR_G / 2) * tau * (T - tau));
    }
  }

  const fwd = { x: Math.sin(st.yaw), z: Math.cos(st.yaw) };
  const right = { x: Math.cos(st.yaw), z: -Math.sin(st.yaw) };
  let hipY = inp.pos.y + BODY.hipY + bob;

  const leg = (side: 'L' | 'R'): { foot: V3; fwd: number; swing: number; stance: boolean } | null => {
    const lat = side === 'L' ? -BODY.hipX : BODY.hipX;
    const hx = inp.pos.x + right.x * lat;
    const hz = inp.pos.z + right.z * lat;
    const old = side === 'L' ? st.footL : st.footR;
    const wasStance = side === 'L' ? st.stanceL : st.stanceR;
    const localFwd = (f: V3) => (f.x - hx) * fwd.x + (f.z - hz) * fwd.z;
    const at = (f: number, lift: number): V3 => {
      const x = hx + fwd.x * f, z = hz + fwd.z * f;
      return { x, y: inp.groundAt(x, z) + BODY.ankleM + lift, z };
    };
    let foot: V3 | null = null;
    let stance = false;
    let swing = 0;
    if (mode === 'air') foot = null;
    else if (mode === 'idle') {
      foot = at(0, 0);
      stance = true;
    } else {
      const u = frac(st.phase - (side === 'L' ? 0 : g.offR));
      stance = u < g.duty;
      if (stance) {
        const tooFar = old && Math.hypot(old.x - hx, old.z - hz) > 0.9;
        if (wasStance && old && !tooFar) foot = { x: old.x, y: inp.groundAt(old.x, old.z) + BODY.ankleM, z: old.z };
        else {
          foot = at(span / 2 - u * stride, 0); // where the foot lands, ahead of the hip
          planted.push(side);
        }
      } else {
        if (wasStance || !old) {
          const lift0 = old ? clamp(localFwd(old), -0.4, 0.4) : 0;
          if (side === 'L') st.liftL = lift0;
          else st.liftR = lift0;
        }
        swing = (u - g.duty) / (1 - g.duty);
        const from = side === 'L' ? st.liftL : st.liftR;
        foot = at(from + (span / 2 - from) * ease(swing), g.lift * Math.sin(Math.PI * swing));
      }
    }
    if (side === 'L') {
      st.footL = foot;
      st.stanceL = stance;
    } else {
      st.footR = foot;
      st.stanceR = stance;
    }
    if (!foot) return null;
    return { foot, fwd: localFwd(foot), swing, stance };
  };
  const footL = leg('L');
  const footR = leg('R');
  // Keep a continuous support envelope through toe-off and heel-strike. The
  // swing foot contributes its terrain projection, not its animated lift, so
  // the hips cannot jump when a binary stance flag changes on a slope.
  const reach = (BODY.thighM + BODY.shinM) * 0.995;
  let drop = 0;
  for (const ft of [footL, footR]) {
    if (!ft || (mode === 'lope' && !ft.stance)) continue;
    const f = Math.min(Math.abs(ft.fwd), reach * 0.98);
    const supportY = inp.groundAt(ft.foot.x, ft.foot.z) + BODY.ankleM;
    const maxHipY = supportY + Math.sqrt(reach * reach - f * f);
    drop = Math.max(drop, hipY - maxHipY);
  }
  drop = Math.min(drop, 0.3);
  if (drop > 0) {
    bob -= drop;
    hipY -= drop;
  }
  const ik = (ft: typeof footL) =>
    ft ? { ...legIk({ x: 0, y: hipY, z: 0 }, { x: 0, y: ft.foot.y, z: ft.fwd }, BODY.thighM, BODY.shinM), fwd: ft.fwd, swing: ft.swing } : null;
  const L = ik(footL);
  const R = ik(footR);

  // Target pose.
  const target: Pose = { ...ZERO, bob, crouch: st.crouch };
  if (L && R) {
    target.hipL = L.hip;
    target.kneeL = L.knee;
    target.hipR = R.hip;
    target.kneeR = R.knee;
    // Boots stay level with the ground; toes lift a little mid-swing.
    target.ankleL = -(L.hip - L.knee) + 0.2 * Math.sin(Math.PI * L.swing);
    target.ankleR = -(R.hip - R.knee) + 0.2 * Math.sin(Math.PI * R.swing);
  } else {
    // In the air: knees tuck while rising, legs reach down for the landing while falling.
    const k = (clamp(inp.vy / 1.6, -1, 1) + 1) / 2;
    target.hipL = 0.15 + 0.3 * k;
    target.hipR = 0.08 + 0.25 * k;
    target.kneeL = 0.2 + 0.6 * k;
    target.kneeR = 0.15 + 0.55 * k;
    target.ankleL = -0.15;
    target.ankleR = -0.12;
  }
  if (mode === 'walk') {
    // A stiff suit: small arm swing, opposite to the leg on the same side.
    target.shoulderL = 0.1 - 0.7 * (L?.fwd ?? 0);
    target.shoulderR = 0.1 - 0.7 * (R?.fwd ?? 0);
    target.elbowL = target.elbowR = 0.4;
  } else if (mode === 'lope') {
    const s = Math.sin(st.phase * Math.PI * 2);
    target.shoulderL = target.shoulderR = 0.28 - 0.12 * s;
    target.elbowL = target.elbowR = 0.65;
  } else if (mode === 'air') {
    const k = (clamp(inp.vy / 1.6, -1, 1) + 1) / 2;
    target.shoulderL = 0.25 + 0.3 * k;
    target.shoulderR = 0.2 + 0.3 * k;
    target.elbowL = target.elbowR = 0.5;
  } else {
    target.shoulderL = target.shoulderR = 0.06;
    target.elbowL = target.elbowR = 0.25;
  }
  target.wristL = target.wristR = 0.12;

  const leanTarget = mode === 'walk' ? g.lean * clamp(speed / g.nominal, 0, 1) : mode === 'lope' ? g.lean : mode === 'air' ? 0.05 : 0;
  st.lean += (leanTarget - st.lean) * Math.min(1, dt * 4);
  const rollTarget = inp.supported ? clamp(turnRate * Math.max(speed, 0.3) * 0.05, -0.15, 0.15) : 0;
  st.roll += (rollTarget - st.roll) * Math.min(1, dt * 6);
  const breath = BREATH.amp * Math.sin((2 * Math.PI * st.t) / BREATH.periodS);
  target.lean = st.lean;
  target.roll = st.roll;
  target.spine = st.lean + breath;
  target.neck = -0.6 * st.lean;

  // Blend: legs follow IK exactly once settled (planted feet never slide); the rest eases in.
  st.settle = Math.min(1, st.settle + dt / 0.25);
  const kLegs = Math.max(Math.min(1, dt * 12), st.settle);
  const kBody = Math.min(1, dt * 8);
  const pose = { ...st.pose };
  const LEGS: (keyof Pose)[] = ['hipL', 'hipR', 'kneeL', 'kneeR', 'ankleL', 'ankleR'];
  for (const key of Object.keys(target) as (keyof Pose)[]) {
    const k = LEGS.includes(key) ? kLegs : kBody;
    pose[key] = pose[key] + (target[key] - pose[key]) * k;
  }
  pose.bob = bob;
  pose.crouch = st.crouch;
  pose.spine = target.spine; // lean is already eased; breathing stays exactly within ±1.5°
  st.pose = pose;
  return { st, pose, planted };
}
