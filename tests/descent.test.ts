import { describe, expect, it } from 'vitest';
import {
  BRAKE_START, HLS, LAND, autopilot, brakeAutopilot, brakeBand, brakeDone, brakeStep, failureLineId, landStart, landStep,
  retryLand, skipToEnd, suggestAutopilot, touchdown, type BrakeState, type LandState,
} from '../src/landing/descent';

const DT = 1 / 60;
const G = 1.62;

describe('lunar descent physics (plan 5, task 1)', () => {
  it('free fall from 1.5 m takes about 1.36 s', () => {
    let s: LandState = { ...landStart(), h: 1.5, vy: 0, vx: 0 };
    let t = 0;
    while (s.h > 0) {
      s = landStep(s, { throttle: 0, tiltInput: 0 }, 1 / 1000);
      t += 1 / 1000;
    }
    expect(t).toBeCloseTo(Math.sqrt((2 * 1.5) / G), 2);
  });

  it('burning fuel lightens the ship so the same throttle accelerates more', () => {
    const full: LandState = { ...landStart(), vy: 0 };
    const light: LandState = { ...full, fuelKg: 1_000, massKg: HLS.dryKg + 1_000 };
    const a = (s: LandState) => (landStep(s, { throttle: 1, tiltInput: 0 }, DT).vy - s.vy) / DT;
    expect(a(light)).toBeGreaterThan(a(full));
    // Rocket equation: the full ship burns fuel at T/ve.
    const after = landStep(full, { throttle: 1, tiltInput: 0 }, 1);
    expect(full.fuelKg - after.fuelKg).toBeCloseTo(LAND.thrustN / HLS.ve, 3);
    expect(after.massKg).toBeCloseTo(HLS.dryKg + after.fuelKg, 6);
  });

  it('an empty tank gives no thrust', () => {
    const dry: LandState = { ...landStart(), vy: 0, fuelKg: 0, massKg: HLS.dryKg };
    const n = landStep(dry, { throttle: 1, tiltInput: 0 }, DT);
    expect((n.vy - dry.vy) / DT).toBeCloseTo(-G, 6);
  });

  it('autopilot always lands ok from the standard start', () => {
    let s = landStart();
    let t = 0;
    while (s.h > 0 && t < 120) {
      s = landStep(s, autopilot(s), DT);
      t += DT;
    }
    expect(s.h).toBeLessThanOrEqual(0);
    expect(touchdown(s)).toBe('ok');
    expect(s.fuelKg).toBeGreaterThan(0);
  });

  it('tilt over 6° at touchdown tips the ship (Odysseus)', () => {
    const base: LandState = { ...landStart(), h: 0, vy: -0.5, vx: 0.2 };
    expect(touchdown({ ...base, tiltDeg: 7 })).toBe('tipped');
    expect(touchdown({ ...base, tiltDeg: -7, vy: -3 })).toBe('tipped');
    expect(touchdown({ ...base, tiltDeg: 3 })).toBe('ok');
    expect(touchdown({ ...base, vy: -2 })).toBe('tooFast');
    expect(touchdown({ ...base, vx: 1.5 })).toBe('tooFast');
    expect(touchdown({ ...base, h: 5 })).toBeNull();
  });

  it('tilt follows the input at 8°/s and is clamped to ±15°', () => {
    let s = landStart();
    s = landStep(s, { throttle: 0.5, tiltInput: 1 }, 1);
    expect(s.tiltDeg).toBeCloseTo(8, 6);
    for (let i = 0; i < 5; i++) s = landStep(s, { throttle: 0.5, tiltInput: 1 }, 1);
    expect(s.tiltDeg).toBe(15);
  });

  it('brake band follows the target curve and the brake autopilot stays in it from the start', () => {
    const b0 = brakeBand(BRAKE_START.h);
    expect(BRAKE_START.v).toBeGreaterThanOrEqual(b0.lo);
    expect(BRAKE_START.v).toBeLessThanOrEqual(b0.hi);
    const mid = brakeBand(5_000);
    const c = 1680 * (5_000 / 15_000) ** 0.8;
    expect(mid.lo).toBeCloseTo(c * 0.88, 6);
    expect(mid.hi).toBeCloseTo(c * 1.12, 6);

    let s: BrakeState = { ...BRAKE_START };
    let out = 0;
    while (!brakeDone(s) && s.t < 600) {
      s = brakeStep(s, brakeAutopilot(s), 0.1);
      const b = brakeBand(s.h);
      if (s.v < b.lo || s.v > b.hi) out++;
    }
    expect(brakeDone(s)).toBe(true);
    expect(out).toBe(0);
    expect(s.fuelKg).toBeGreaterThan(0);
  });

  it('without braking the ship leaves the band (too fast); full throttle all the way ends too slow', () => {
    let coast: BrakeState = { ...BRAKE_START };
    for (let i = 0; i < 300 && !brakeDone(coast); i++) coast = brakeStep(coast, 0, 0.1);
    expect(coast.v).toBeGreaterThan(brakeBand(coast.h).hi);
    let hard: BrakeState = { ...BRAKE_START };
    while (!brakeDone(hard) && hard.t < 600 && hard.v > 0) hard = brakeStep(hard, 1, 0.1);
    expect(hard.v).toBeLessThan(brakeBand(hard.h).lo);
  });

  it('failed touchdown explains and resets fuel', () => {
    const first = { state: { ...landStart(), fuelKg: 200, h: 0 }, attempts: 0 };
    const r1 = retryLand(first);
    expect(r1.attempts).toBe(1);
    expect(r1.state).toEqual(landStart());
    expect(r1.state.fuelKg).toBe(LAND.fuelKg);
    expect(suggestAutopilot(r1)).toBe(false);
    expect(suggestAutopilot(retryLand(r1))).toBe(true);
    expect(failureLineId('tipped')).toBe('land_tipped');
    expect(failureLineId('tooFast')).toBe('land_tooFast');
  });

  it('skipping at any phase lands the same final state', () => {
    let b: BrakeState = { ...BRAKE_START };
    for (let i = 0; i < 50; i++) b = brakeStep(b, 0.7, 0.1);
    let l = landStart();
    for (let i = 0; i < 60; i++) l = landStep(l, { throttle: 0.3, tiltInput: 0 }, DT);
    const end = skipToEnd();
    expect(skipToEnd(b)).toEqual(end);
    expect(skipToEnd(l)).toEqual(end);
    expect(end).toEqual({ landed: true, fuelUsedKg: 0 });
  });
});

import { CreateSphereVertexData } from '@babylonjs/core';
import { APOLLO11, MOON_R_KM, latLonToSphere } from '../src/landing/moonMath';
import { IntroDirector } from '../src/landing/introDirector';

describe('orbital intro (plan 5, task 2)', () => {
  it('Apollo 11 site maps to the right point on the textured sphere', () => {
    // Babylon's sphere: u = (180 − lon)/360 with the texture's uScale −1, v = 0 at the +y pole. Compare with real vertices.
    const r = 10;
    const vd = CreateSphereVertexData({ diameter: 2 * r, segments: 2 }) // 4 rings × 8 steps: v 0.25, u 0.75 are vertices;
    const at = (u: number, v: number) => {
      const uv = vd.uvs!;
      for (let i = 0; i < uv.length / 2; i++)
        if (Math.abs(uv[2 * i] - u) < 1e-9 && Math.abs(uv[2 * i + 1] - v) < 1e-9) {
          const p = vd.positions!;
          return { x: p[3 * i], y: p[3 * i + 1], z: p[3 * i + 2] };
        }
      throw new Error(`no vertex at uv ${u},${v}`);
    };
    for (const [lat, lon, u, v] of [[0, 0, 0.5, 0.5], [45, 90, 0.25, 0.25]] as const) {
      const want = at(u, v);
      const got = latLonToSphere(lat, lon, r);
      expect(got.x).toBeCloseTo(want.x, 6);
      expect(got.y).toBeCloseTo(want.y, 6);
      expect(got.z).toBeCloseTo(want.z, 6);
    }
    // Tranquility Base, 0.674° N 23.473° E, worked by hand on the 1 737.4 km Moon.
    expect(APOLLO11).toEqual({ lat: 0.674, lon: 23.473 });
    const a = latLonToSphere(APOLLO11.lat, APOLLO11.lon, MOON_R_KM);
    expect(a.x).toBeCloseTo(-1593.6, 0);
    expect(a.y).toBeCloseTo(20.44, 1);
    expect(a.z).toBeCloseTo(-692.0, 0);
  });

  it('the alarm happens once per intro', () => {
    const d = new IntroDirector({ assist: true });
    while (d.stage !== 'brake') d.next();
    let alarms = 0;
    let t = 0;
    while (d.stage === 'brake' && t < 120) {
      const ev = d.stepBrake(1 / 30, 0);
      alarms += ev.filter((e) => e === 'alarm').length;
      t += 1 / 30;
    }
    expect(alarms).toBe(1);
    expect(d.stage).toBe('done');
    expect(t).toBeLessThan(40);
  });

  it('drifting out of the green band for 3 s brings a reminder from Houston, not a failure', () => {
    const d = new IntroDirector({ assist: false });
    while (d.stage !== 'brake') d.next();
    const ev: string[] = [];
    for (let i = 0; i < 30 * 8; i++) ev.push(...d.stepBrake(1 / 30, 0));
    expect(ev.filter((e) => e === 'bandWarn').length).toBeGreaterThanOrEqual(1);
    expect(d.stage).toBe('brake');
  });
});

import { introMode, plumeRate } from '../src/landing/finalDescent';

describe('final descent on the real surface (plan 5, task 3)', () => {
  it('intro is skipped for demo and jump', () => {
    expect(introMode('?demo=1', false)).toBe('skip');
    expect(introMode('?demo=1', true)).toBe('skip');
    expect(introMode('?jump=act5', true)).toBe('skip');
    expect(introMode('', false)).toBe('intro');
    expect(introMode('', true)).toBe('intro');
    // ?jump only exists in dev builds; in production it is ignored and the intro plays.
    expect(introMode('?jump=act4', false)).toBe('intro');
  });

  it('plume dust scales with throttle and fades with height', () => {
    expect(plumeRate(31, 1)).toBe(0);
    expect(plumeRate(20, 1)).toBe(0);
    expect(plumeRate(19, 1)).toBeLessThan(plumeRate(5, 1)/10);
    expect(plumeRate(10, 0)).toBe(0);
    expect(plumeRate(5, 1)).toBeGreaterThan(plumeRate(20, 1));
    expect(plumeRate(5, 1)).toBeGreaterThan(plumeRate(5, 0.4));
    expect(plumeRate(0, 1)).toBeGreaterThan(0);
    // Extra density is confined to the final 10 m and still follows engine power.
    expect(plumeRate(10, 1)).toBe(33);
    expect(plumeRate(3, 1)).toBeGreaterThan(85);
    expect(plumeRate(0, 1)).toBeLessThanOrEqual(100);
    expect(plumeRate(0, 0)).toBe(0);
  });
});

import { fuelSecondsLeft } from '../src/landing/descent';
import { earthDisc } from '../src/landing/moonMath';

describe('landing cutscene details (M1 Earth, M6 fuel seconds)', () => {
  it('fuel left is shown as seconds of hover (rocket equation, like Apollo)', () => {
    expect(fuelSecondsLeft(0)).toBe(0);
    // Hovering burns m·g/vₑ, so t = vₑ/g · ln(m_full / m_dry): 10 t of fuel on a 120 t lander ≈ 183 s.
    expect(fuelSecondsLeft(10_000)).toBeCloseTo((3_700 / 1.62) * Math.log(130 / 120), 6);
    expect(Math.round(fuelSecondsLeft(10_000))).toBe(183);
    expect(fuelSecondsLeft(5_000)).toBeLessThan(fuelSecondsLeft(10_000));
  });

  it('Earth seen from lunar orbit is drawn at its real size in the sky (about 1.9°)', () => {
    const e = earthDisc(90_000);
    expect(e.radius).toBeCloseTo(6371 * (90_000 / 384_400), 3);
    const deg = (2 * Math.atan(e.radius / 90_000) * 180) / Math.PI;
    expect(deg).toBeGreaterThan(1.8);
    expect(deg).toBeLessThan(2.0);
  });
});
