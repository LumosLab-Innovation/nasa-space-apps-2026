import { describe, expect, it } from 'vitest';
import { advancePhase, gaitMode, gaitPose, type GaitMode } from '../src/player/gait';

describe('lunar gait', () => {
  it('lope moves both legs together, walk moves them in opposition', () => {
    const l = gaitPose('lope', 0.25);
    const w = gaitPose('walk', 0.25);
    expect(l.hipL).toBeCloseTo(l.hipR, 6);
    expect(Math.sign(w.hipL)).toBe(-Math.sign(w.hipR));
  });

  it('lope bobs more than walk', () => {
    const peak = (m: GaitMode) => Math.max(...Array.from({ length: 50 }, (_, i) => gaitPose(m, i / 50).bob));
    expect(peak('lope')).toBeGreaterThan(peak('walk'));
  });

  it('idle is the neutral pose', () => {
    expect(Object.values(gaitPose('idle', 0.3)).every((v) => Math.abs(v) < 1e-6)).toBe(true);
  });

  it('gait mode picks air whenever unsupported', () => {
    expect(gaitMode(2, true, false)).toBe('air');
    expect(gaitMode(0.05, false, true)).toBe('idle');
    expect(gaitMode(1.5, true, true)).toBe('lope');
    expect(gaitMode(1.5, false, true)).toBe('walk');
  });

  it('phase advances by distance over stride and wraps', () => {
    expect(advancePhase(0.9, 1.4, 0.2)).toBeCloseTo(0.1, 6);
  });

  it('arms swing opposite to the leg on the same side when walking', () => {
    const w = gaitPose('walk', 0.25);
    expect(Math.sign(w.shoulderL)).toBe(-Math.sign(w.hipL));
  });
});

import { BODY, LAND_CROUCH, MAX_TURN_RAD_S, initGait, stepGait, type GaitInput, type GaitState } from '../src/player/gait';
import { legIk } from '../src/player/legIk';

const flat = () => 0;
const step = (st: GaitState, over: Partial<GaitInput> = {}) =>
  stepGait(st, { pos: { x: 0, y: 0, z: 0 }, speedMs: 0, lope: false, supported: true, vy: 0, groundAt: flat, desiredYaw: st.yaw, dt: 1 / 60, ...over });

describe('natural lunar gait (plan 7)', () => {
  it('planted foot follows the ground; landing crouch grows with fall speed; turning rate is capped', () => {
    // Walk north at 1.8 m/s up a 10 % slope until the left foot plants.
    const slope = (_x: number, z: number) => 0.1 * z;
    let st = initGait(0);
    let z = 0;
    let planted = false;
    for (let i = 0; i < 200 && !planted; i++) {
      z += 1.8 / 60;
      const r = step(st, { pos: { x: 0, y: slope(0, z), z }, speedMs: 1.8, groundAt: slope });
      st = r.st;
      planted = r.planted.includes('L');
    }
    expect(planted).toBe(true);
    const p0 = { ...st.footL! };
    for (let i = 0; i < 10; i++) {
      z += 1.8 / 60; // 0.3 m more: still inside the stance
      st = step(st, { pos: { x: 0, y: slope(0, z), z }, speedMs: 1.8, groundAt: slope }).st;
    }
    expect(st.footL!.x).toBeCloseTo(p0.x, 6);
    expect(st.footL!.z).toBeCloseTo(p0.z, 6);
    expect(st.footL!.y).toBeCloseTo(slope(p0.x, p0.z) + BODY.ankleM, 6);

    const landing = (vy: number) => {
      let s = initGait(0);
      s = step(s, { supported: false, vy }).st;
      s = step(s, { supported: false, vy }).st;
      s = step(s, { supported: false, vy: 0 }).st; // contact frame: physics already zeroed vy
      let peak = 0;
      for (let i = 0; i < 30; i++) {
        s = step(s).st;
        peak = Math.max(peak, s.crouch);
      }
      return peak;
    };
    expect(landing(-1)).toBeGreaterThan(0);
    expect(landing(-1)).toBeLessThan(landing(-4));
    expect(landing(-4)).toBeLessThanOrEqual(LAND_CROUCH.max);

    const t = step(initGait(0), { desiredYaw: Math.PI * 0.9, dt: 0.1 });
    expect(Math.abs(t.st.yaw)).toBeLessThanOrEqual(MAX_TURN_RAD_S * 0.1 + 1e-9);
    expect(Math.abs(t.st.yaw)).toBeGreaterThan(0.5);
  });

  it('legIk reaches reachable targets and stays straight for far ones', () => {
    const fk = (hip: { y: number; z: number }, a: { hip: number; knee: number }) => {
      const ky = hip.y - BODY.thighM * Math.cos(a.hip), kz = hip.z + BODY.thighM * Math.sin(a.hip);
      return { y: ky - BODY.shinM * Math.cos(a.hip - a.knee), z: kz + BODY.shinM * Math.sin(a.hip - a.knee) };
    };
    const hip = { x: 0, y: 0.92, z: 0 };
    for (const target of [{ x: 0, y: 0.2, z: 0.2 }, { x: 0, y: 0.3, z: -0.25 }, { x: 0, y: 0.5, z: 0 }]) {
      const a = legIk(hip, target, BODY.thighM, BODY.shinM);
      const f = fk(hip, a);
      expect(Math.hypot(f.y - target.y, f.z - target.z)).toBeLessThan(1e-6);
      expect(a.knee).toBeGreaterThanOrEqual(0); // the knee never bends backwards
    }
    const far = legIk(hip, { x: 0, y: -1, z: 0.5 }, BODY.thighM, BODY.shinM);
    expect(far.knee).toBeCloseTo(0, 6);
    expect(far.hip).toBeCloseTo(Math.atan2(0.5, 1.92), 6);
  });

  it('idle breathing stays within ±1.5°', () => {
    let st = initGait(0);
    let hi = -1, lo = 1;
    for (let i = 0; i < 8 * 60; i++) {
      const r = step(st);
      st = r.st;
      hi = Math.max(hi, r.pose.spine);
      lo = Math.min(lo, r.pose.spine);
    }
    const lim = (1.5 * Math.PI) / 180;
    expect(hi).toBeLessThanOrEqual(lim + 1e-9);
    expect(lo).toBeGreaterThanOrEqual(-lim - 1e-9);
    expect(hi).toBeGreaterThan(lim * 0.6); // it does breathe
  });
});

describe('feet on slopes (plan 7 final review)', () => {
  it('retains capsule clearance during a brief loss of ground contact', () => {
    let st = initGait();
    for (let i = 0; i < 90; i++) st = step(st, { pos: { x: 0, y: .146, z: .03 * i }, speedMs: 1.8 }).st;
    const before = st.pose.bob;
    st = step(st, { pos: { x: 0, y: .146, z: 2.7 }, speedMs: 1.8, supported: false, vy: -.03 }).st;
    expect(Math.abs(st.pose.bob - before)).toBeLessThan(.03);
  });
  it.each([30, 60, 120])('keeps pelvis continuous across walking contacts at %i fps with capsule clearance', (fps) => {
    let st = initGait();
    let previous = st.pose.bob, worstSpeed = 0;
    for (let i = 0; i < fps * 8; i++) {
      st = step(st, { pos: { x: 0, y: .146, z: 1.8 * i / fps }, speedMs: 1.8, dt: 1 / fps }).st;
      if (i > fps) worstSpeed = Math.max(worstSpeed, Math.abs(st.pose.bob - previous) * fps);
      previous = st.pose.bob;
    }
    // A relaxed walk must not teleport the hips by a capsule skin-width at toe-off.
    expect(worstSpeed).toBeLessThan(.8);
  });

  it('the rendered leg reaches the planted foot on a 17° slope (no floating boots)', () => {
    const k = Math.tan((17 * Math.PI) / 180);
    const slope = (_x: number, z: number) => k * z;
    let st = initGait(0);
    let z = 0;
    let worst = 0;
    for (let i = 0; i < 240; i++) {
      z += 1.8 / 60;
      const r = step(st, { pos: { x: 0, y: slope(0, z), z }, speedMs: 1.8, groundAt: slope });
      st = r.st;
      if (i < 60) continue; // settled
      for (const side of ['L', 'R'] as const) {
        const planted = side === 'L' ? st.stanceL : st.stanceR;
        const foot = side === 'L' ? st.footL : st.footR;
        if (!planted || !foot) continue;
        const hip = r.pose[side === 'L' ? 'hipL' : 'hipR'];
        const knee = r.pose[side === 'L' ? 'kneeL' : 'kneeR'];
        const hipY = slope(0, z) + BODY.hipY + r.pose.bob;
        const ankleY = hipY - BODY.thighM * Math.cos(hip) - BODY.shinM * Math.cos(hip - knee);
        const ankleZ = z + BODY.thighM * Math.sin(hip) + BODY.shinM * Math.sin(hip - knee);
        worst = Math.max(worst, Math.hypot(ankleY - foot.y, ankleZ - foot.z));
      }
    }
    expect(worst).toBeLessThan(0.01);
  });
});

import { STANDING_POSE } from '../src/player/gait';

describe('STANDING_POSE', () => {
  it('equals the idle pose of a fresh grounded, motionless gait', () => {
    expect(STANDING_POSE).toEqual(initGait(0).pose);
    expect(STANDING_POSE.bob).toBeCloseTo(-BODY.flexM, 9);
  });
});
