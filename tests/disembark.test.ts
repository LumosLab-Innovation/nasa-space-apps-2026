import { afterEach, describe, expect, it, vi } from 'vitest';
import { ArcRotateCamera, NullEngine, Scene, Vector3 } from '@babylonjs/core';
import type { AdvancedDynamicTexture } from '@babylonjs/gui';
import { createDisembark, insideCarFootprint } from '../src/landing/disembark';
import { DISEMBARK, PLAYER_HEIGHT_M, CAMERA_AIM_M } from '../src/landing/disembarkTimeline';

const engines: NullEngine[] = [];
afterEach(() => engines.splice(0).forEach((e) => e.dispose()));
const STILL = { forward: 0, right: 0, jump: false, lope: false };

function fixture() {
  const engine = new NullEngine(); engines.push(engine);
  const scene = new Scene(engine);
  const ui = { addControl: vi.fn(), getScene: () => scene, getSize: () => ({ width: 1280, height: 720 }) } as unknown as AdvancedDynamicTexture;
  const floor = new Vector3(10, 5, 20);
  const rig = {
    elevator: 0, deployed: false, gate: 0, gateTarget: 0, floor,
    snapshotMotion() { return { elevator: { position: this.elevator, velocity: 0 } }; },
    get elevatorDeployed() { return this.deployed; },
    get gateOpen() { return this.gate; },
    setGate: vi.fn(function (this: any, v: 0 | 1) { this.gateTarget = v; }),
    setTargets: vi.fn(function (this: any, _g: number, e: number, imm?: boolean) { if (imm) { this.elevator = e; this.deployed = e === 1; } }),
    carAnchor() { return { floor: this.floor.clone(), top: this.floor.add(new Vector3(0, 3, 0)), outwardYaw: 0.5 }; },
  };
  const position = new Vector3(0, 0, 0);
  const player = {
    root: { setEnabled: vi.fn(), position: new Vector3() },
    camera: new ArcRotateCamera('pc', 0, 1, 5, Vector3.Zero(), scene),
    position,
    // Real contract: setRide only stores the seat; update() applies it to the root/position.
    seat: null as null | { x: number; y: number; z: number },
    setRide: vi.fn(function (this: any, at: any) { this.seat = at; }),
    update: vi.fn(function (this: any, dt: number) { if (dt > 0 && this.seat) position.set(this.seat.x, this.seat.y, this.seat.z); }),
    setFloorOverride: vi.fn(), placeOnFloor: vi.fn((x: number, y: number, z: number) => position.set(x, y, z)),
  };
  const hud = { showPrompt: vi.fn(), toast: vi.fn(), setHint: vi.fn() };
  const dispose = vi.fn();
  const makeFloorCollider = vi.fn(() => ({ dispose }));
  const onHandOver = vi.fn();
  const d = createDisembark({ scene, ui, hud: hud as never, player: player as never }, {
    rig: rig as never, from: { alpha: 0, beta: 1, radius: 50, target: [0, 0, 0] }, hullCentre: new Vector3(0, 0, 0),
    touchdownAt: 0, onHandOver, makeFloorCollider,
  } as never);
  return { scene, ui, rig, player, hud, d, dispose, makeFloorCollider, onHandOver };
}

describe('disembark adapter', () => {
  it('hands over exactly once when the gate is open', () => {
    const f = fixture();
    f.d.update(0.1, STILL);
    expect(f.onHandOver).not.toHaveBeenCalled();
    f.rig.elevator = 1; f.rig.deployed = true;
    f.d.update(0.1, STILL);
    expect(f.rig.setGate).toHaveBeenCalledWith(1);
    f.rig.gate = 1;
    f.d.update(0.1, STILL); f.d.update(0.1, STILL);
    expect(f.onHandOver).toHaveBeenCalledTimes(1);
    expect(f.player.placeOnFloor).toHaveBeenCalledTimes(1);
    expect(f.makeFloorCollider).toHaveBeenCalledTimes(1);
    expect(f.d.prompt).toContain('W');
    expect(f.scene.activeCamera).toBe(f.player.camera);
    expect(f.d.stage).toBe('arrived');
  });

  it('astronaut rides glued to the car floor', () => {
    const f = fixture();
    f.rig.elevator = 0.3;
    f.d.update(0.1, STILL);
    expect(f.player.setRide).not.toHaveBeenCalled();
    f.rig.elevator = 0.4;
    f.d.update(0.1, STILL);
    expect(f.player.root.setEnabled).toHaveBeenCalledWith(true);
    expect(f.player.setRide).toHaveBeenLastCalledWith({ x: 10, y: 5, z: 20, yaw: 0.5, standing: true });
    f.rig.floor.set(10, 3, 20);
    f.d.update(0.1, STILL);
    expect(f.player.setRide).toHaveBeenLastCalledWith({ x: 10, y: 3, z: 20, yaw: 0.5, standing: true });
  });

  it('applies the ride pose to the player every frame while riding', () => {
    const f = fixture();
    f.rig.elevator = 0.7;
    f.d.update(0.1, STILL);
    expect(f.player.update).toHaveBeenCalledTimes(1);
    expect(f.player.position.x).toBeCloseTo(10); expect(f.player.position.y).toBeCloseTo(5); expect(f.player.position.z).toBeCloseTo(20);
    f.rig.floor.set(10, 3.5, 21);
    f.d.update(0.1, STILL);
    expect(f.player.position.y).toBeCloseTo(3.5); expect(f.player.position.z).toBeCloseTo(21);
    f.player.update.mockClear();
    f.d.update(0, STILL);
    expect(f.player.update).not.toHaveBeenCalled();
  });

  it('presents banner and toast after the first step and removes the collider', () => {
    const f = fixture();
    f.rig.elevator = 1; f.rig.deployed = true; f.rig.gate = 1;
    f.d.update(0.1, STILL);
    f.player.position.x += DISEMBARK.stepOffM + 0.1;
    f.d.update(0.1, STILL);
    expect(f.d.stage).toBe('done');
    expect(f.hud.toast).toHaveBeenCalledTimes(1);
    expect(f.dispose).toHaveBeenCalledTimes(1);
    expect(f.d.prompt).toBeNull();
    expect(f.hud.showPrompt).not.toHaveBeenCalled();
  });

  it('skip at riding commits once and leaves a playable player', () => {
    const f = fixture();
    f.rig.setTargets.mockImplementation(function (this: any) { this.elevator = 1; this.deployed = true; });
    f.rig.setGate.mockImplementation(function (this: any) { this.gate = 1; });
    f.d.skip(); f.d.skip();
    expect(f.onHandOver).toHaveBeenCalledTimes(1);
    expect(f.player.placeOnFloor).toHaveBeenCalledTimes(1);
    expect(f.scene.activeCamera).toBe(f.player.camera);
    expect(f.d.stage).toBe('done');
    expect(f.hud.toast).toHaveBeenCalledTimes(1);
  });

  it('dispose removes camera and collider', () => {
    const f = fixture();
    f.rig.elevator = 1; f.rig.deployed = true; f.rig.gate = 1;
    f.d.update(0.1, STILL);
    f.d.dispose(); f.d.dispose();
    expect(f.dispose).toHaveBeenCalledTimes(1);
    const f2 = fixture();
    f2.d.update(0.1, STILL);
    expect(f2.scene.getCameraByName('disembarkCam')).not.toBeNull();
    f2.d.dispose();
    expect(f2.scene.getCameraByName('disembarkCam')).toBeNull();
  });
});

describe('disembark fixes', () => {
  it('warms the astronaut parked away from the car at creation', () => {
    const f = fixture();
    expect(f.player.root.setEnabled).toHaveBeenCalledWith(true);
    expect(f.player.root.position.y).toBeLessThan(f.rig.floor.y - 100);
  });
  it('player camera target at hand-over equals the astronaut own aim', () => {
    const f = fixture();
    f.rig.elevator = 1; f.rig.deployed = true; f.rig.gate = 1;
    f.d.update(0.1, STILL);
    const t = f.player.camera.target;
    expect([t.x, t.y, t.z]).toEqual([10, 5 + PLAYER_HEIGHT_M / 2 + CAMERA_AIM_M, 20]);
  });
  it('floor override is set at hand-over and cleared at done / dispose', () => {
    const f = fixture();
    f.rig.elevator = 1; f.rig.deployed = true; f.rig.gate = 1;
    f.d.update(0.1, STILL);
    const fn = f.player.setFloorOverride.mock.calls[0][0] as (x: number, z: number) => number | null;
    expect(fn(10, 20)).toBe(5);
    expect(fn(40, 20)).toBeNull();
    f.player.position.x += 2;
    f.d.update(0.1, STILL);
    expect(f.d.stage).toBe('done');
    expect(f.player.setFloorOverride).toHaveBeenLastCalledWith(null);
    const g = fixture();
    g.rig.elevator = 1; g.rig.deployed = true; g.rig.gate = 1;
    g.d.update(0.1, STILL); g.d.dispose();
    expect(g.player.setFloorOverride).toHaveBeenLastCalledWith(null);
  });
  it('insideCarFootprint respects yaw', () => {
    const c = { x: 0, z: 0 };
    expect(insideCarFootprint(0.9, 0, c, 0)).toBe(true);
    expect(insideCarFootprint(1.0, 0, c, 0)).toBe(false);
    expect(insideCarFootprint(0.9, 0.9, c, Math.PI / 4)).toBe(false);
    expect(insideCarFootprint(1.2, 0, c, Math.PI / 4)).toBe(true);
  });
});
