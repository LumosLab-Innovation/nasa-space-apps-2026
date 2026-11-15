import { describe, expect, it } from 'vitest';
import {
  DISEMBARK, PLAYER_HEIGHT_M, CAMERA_AIM_M, cameraAt, endPose, moveProgress, sidePose, stageFor, type CamPose, type DisembarkStage,
} from '../src/landing/disembarkTimeline';
import { elevatorPose } from '../src/demo/hlsElevatorMotion';

const ORDER: DisembarkStage[] = ['deploying', 'riding', 'arrived', 'stepped', 'done'];
const camPos = (p: CamPose) => [
  p.target[0] + p.radius * Math.cos(p.alpha) * Math.sin(p.beta),
  p.target[1] + p.radius * Math.cos(p.beta),
  p.target[2] + p.radius * Math.sin(p.alpha) * Math.sin(p.beta),
];

describe('disembark timeline', () => {
  it('stages run deploying → riding → arrived → stepped in order', () => {
    const seq: DisembarkStage[] = [];
    for (let i = 0; i <= 100; i++) seq.push(stageFor({ elevator: i / 100, deployed: false, gate: 0, steppedOff: false, sinceHandOver: 0 }));
    for (let i = 0; i <= 100; i++) seq.push(stageFor({ elevator: 1, deployed: i >= 50, gate: i / 100, steppedOff: false, sinceHandOver: i * 0.01 }));
    seq.push(stageFor({ elevator: 1, deployed: true, gate: 1, steppedOff: true, sinceHandOver: 2 }));
    const idx = seq.map((s) => ORDER.indexOf(s));
    for (let i = 1; i < idx.length; i++) expect(idx[i]).toBeGreaterThanOrEqual(idx[i - 1]);
    expect(new Set(seq)).toEqual(new Set(['deploying', 'riding', 'arrived', 'stepped']));
  });

  it('presentation falls back after 20 s', () => {
    const base = { elevator: 1, deployed: true, gate: 1, steppedOff: false };
    expect(stageFor({ ...base, sinceHandOver: 20 })).toBe('stepped');
    expect(stageFor({ ...base, sinceHandOver: 19.9 })).toBe('arrived');
  });

  it('end pose is the gameplay framing outside the hull', () => {
    const hull: [number, number, number] = [3, 5, -2];
    for (let k = 0; k < 8; k++) {
      const yaw = (k / 8) * Math.PI * 2;
      const floor: [number, number, number] = [hull[0] + Math.sin(yaw) * 4, 1, hull[2] + Math.cos(yaw) * 4];
      const p = endPose(floor, yaw, hull);
      expect(p.beta).toBe(1.25);
      expect(p.radius).toBe(7);
      expect(p.target).toEqual([floor[0], floor[1] + PLAYER_HEIGHT_M / 2 + CAMERA_AIM_M, floor[2]]);
      const c = camPos(p);
      expect(Math.hypot(c[0] - hull[0], c[2] - hull[2])).toBeGreaterThanOrEqual(5.5);
    }
  });

  const from: CamPose = { alpha: 0.5, beta: 1.1, radius: 28, target: [0, 8, 0] };
  const mk = () => {
    const top: [number, number, number] = [10, 6, 4];
    const floor: [number, number, number] = [10, 0, 4];
    return { from, side: sidePose(top, 0.7), end: endPose(floor, 0.7, [0, 4, 0]) };
  };

  it('side pose uses radius 22, beta 1.32 and outward+55° alpha', () => {
    const p = sidePose([1, 2, 3], 0.7);
    expect(p.radius).toBe(22);
    expect(p.beta).toBe(1.32);
    const a = 0.7 + (55 * Math.PI) / 180;
    expect(p.alpha).toBeCloseTo(Math.atan2(Math.cos(a), Math.sin(a)), 9);
  });

  it('camera path has no jumps', () => {
    const poses = mk();
    const N = 600, T = 12;
    let prev: CamPose | null = null;
    let first!: CamPose, last!: CamPose;
    for (let i = 0; i <= N; i++) {
      const t = 1 + (i / N) * T;
      const move = moveProgress(t, false);
      const descend = elevatorPose((t - 1) / 12).lower;
      const p = cameraAt(poses, move, descend);
      if (i === 0) first = p;
      last = p;
      if (prev) {
        const dt = Math.hypot(p.target[0] - prev.target[0], p.target[1] - prev.target[1], p.target[2] - prev.target[2]);
        expect(dt).toBeLessThanOrEqual(0.15);
        expect(Math.abs(p.alpha - prev.alpha)).toBeLessThanOrEqual(0.02);
        expect(Math.abs(p.beta - prev.beta)).toBeLessThanOrEqual(0.02);
        expect(Math.abs(p.radius - prev.radius)).toBeLessThanOrEqual(0.1);
      }
      prev = p;
    }
    const close = (a: CamPose, b: CamPose) => {
      expect(Math.cos(a.alpha - b.alpha)).toBeCloseTo(1, 9);
      expect(a.beta).toBeCloseTo(b.beta, 6);
      expect(a.radius).toBeCloseTo(b.radius, 6);
      a.target.forEach((v, k) => expect(v).toBeCloseTo(b.target[k], 6));
    };
    close(first, poses.from);
    close(last, poses.end);
  });

  it('camera path is frame-rate independent', () => {
    const poses = mk();
    const run = (fps: number) => {
      let t = 0;
      const dt = 1 / fps;
      for (let i = 0; i < fps * 8; i++) t += dt;
      return cameraAt(poses, moveProgress(t, false), 0.3);
    };
    const ref = run(60);
    for (const f of [30, 144]) {
      const p = run(f);
      expect(p.alpha).toBeCloseTo(ref.alpha, 6);
      expect(p.radius).toBeCloseTo(ref.radius, 6);
    }
    expect(moveProgress(1 + DISEMBARK.cameraMoveS / 2, false)).toBeCloseTo(0.5, 9);
    expect(moveProgress(1 + DISEMBARK.cameraMoveS / 4, true)).toBeCloseTo(0.5, 9);
    expect(moveProgress(0.5, false)).toBe(0);
  });

  it('pause leaves the camera pose unchanged', () => {
    const poses = mk();
    const t = 3.3;
    const a = cameraAt(poses, moveProgress(t, false), 0.2);
    const b = cameraAt(poses, moveProgress(t + 0, false), 0.2);
    expect(b).toEqual(a);
  });
});
