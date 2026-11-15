import { ArcRotateCamera, MeshBuilder, PhysicsAggregate, PhysicsShapeType, Vector3, type Scene } from '@babylonjs/core';
import type { AdvancedDynamicTexture } from '@babylonjs/gui';
import { reducedCameraMotion } from '../core/accessibility';
import { tr } from '../i18n/i18n';
import type { HlsRig } from '../models/hlsRig';
import type { Astronaut } from '../player/astronaut';
import type { MoveInput } from '../player/movement';
import { showActBanner } from '../ui/actBanner';
import type { Hud } from '../ui/hud';
import { DISEMBARK, cameraAt, endPose, moveProgress, sidePose, stageFor, type CamPose, type DisembarkStage } from './disembarkTimeline';

export interface Disembark {
  readonly stage: DisembarkStage;
  update(dt: number, move: MoveInput): void;
  skip(): void;
  dispose(): void;
}

type Collider = { dispose(): void };
const FOOTPRINT_M = 1.9;
const SLAB_M = 0.3;

function realCollider(scene: Scene, floor: Vector3, yaw: number): Collider {
  const box = MeshBuilder.CreateBox('disembarkFloor', { width: FOOTPRINT_M, height: SLAB_M, depth: FOOTPRINT_M }, scene);
  box.position.set(floor.x, floor.y - SLAB_M / 2, floor.z);
  box.rotation.y = yaw;
  box.isVisible = false;
  box.isPickable = false;
  const body = scene.getPhysicsEngine() ? new PhysicsAggregate(box, PhysicsShapeType.BOX, { mass: 0 }, scene) : null;
  return { dispose() { body?.dispose(); box.dispose(); } };
}

export function createDisembark(
  w: { scene: Scene; ui: AdvancedDynamicTexture; hud: Hud; player: Astronaut },
  o: {
    rig: HlsRig; from: CamPose; hullCentre: Vector3; touchdownAt: number; onHandOver: () => void;
    makeFloorCollider?: (floor: Vector3, yaw: number) => Collider;
  },
): Disembark {
  const { scene, player, hud, ui } = w;
  const { rig } = o;
  const cam = new ArcRotateCamera('disembarkCam', o.from.alpha, o.from.beta, o.from.radius, new Vector3(...o.from.target), scene);
  cam.minZ = 0.1;
  cam.maxZ = player.camera.maxZ;
  scene.activeCamera = cam;
  let camOwned = true;

  let since = o.touchdownAt;
  let sinceHandOver = 0;
  let handedOver = false;
  let steppedOff = false;
  let presented = false;
  let disposed = false;
  let stage: DisembarkStage = 'deploying';
  let collider: Collider | null = null;
  let bannerDispose: (() => void) | null = null;
  let anchor0 = new Vector3();

  const elevatorPos = () => rig.snapshotMotion().elevator.position;

  const releaseCamera = () => {
    if (!camOwned) return;
    camOwned = false;
    scene.activeCamera = player.camera;
    const canvas = scene.getEngine().getRenderingCanvas();
    if (canvas) player.camera.attachControl(canvas, true);
    cam.dispose();
  };

  const handOver = () => {
    if (handedOver) return;
    handedOver = true;
    const a = rig.carAnchor();
    anchor0 = a.floor.clone();
    collider = (o.makeFloorCollider ?? ((f, y) => realCollider(scene, f, y)))(a.floor, a.outwardYaw);
    player.root.setEnabled(true);
    player.placeOnFloor(a.floor.x, a.floor.y, a.floor.z, a.outwardYaw);
    const end = endPose(a.floor.asArray() as [number, number, number], a.outwardYaw, o.hullCentre.asArray() as [number, number, number]);
    const pc = player.camera;
    pc.alpha = end.alpha; pc.beta = end.beta; pc.radius = end.radius;
    pc.target.set(end.target[0], end.target[1], end.target[2]);
    releaseCamera();
    hud.showPrompt(tr('W — take your first step'));
    stage = 'arrived';
    o.onHandOver();
  };

  const present = () => {
    if (presented) return;
    presented = true;
    hud.showPrompt(null);
    bannerDispose = showActBanner(ui, tr('Sea of Tranquility, 1969…\n\nSouth Pole, 2028.'));
    hud.toast(tr('New discoveries in your Science Notebook (Tab)'), 4);
    collider?.dispose(); collider = null;
    stage = 'done';
  };

  const drive = () => {
    const a = rig.carAnchor();
    const elev = elevatorPos();
    if (elev >= DISEMBARK.appearAt) {
      player.root.setEnabled(true);
      player.setRide({ x: a.floor.x, y: a.floor.y, z: a.floor.z, yaw: a.outwardYaw, standing: true });
    }
    if (camOwned) {
      const poses = {
        from: o.from,
        side: sidePose(a.top.asArray() as [number, number, number], a.outwardYaw),
        end: endPose(a.floor.asArray() as [number, number, number], a.outwardYaw, o.hullCentre.asArray() as [number, number, number]),
      };
      const p = cameraAt(poses, moveProgress(since, reducedCameraMotion()), elev);
      cam.alpha = p.alpha; cam.beta = p.beta; cam.radius = p.radius;
      cam.target.set(p.target[0], p.target[1], p.target[2]);
    }
    return a;
  };

  return {
    get stage() { return stage; },
    update(dt, _move) {
      if (disposed || !(dt > 0) || stage === 'done') return;
      since += dt;
      if (!handedOver) {
        drive();
        if (rig.elevatorDeployed) rig.setGate(1);
        if (rig.elevatorDeployed && rig.gateOpen >= 1) handOver();
        else stage = stageFor({ elevator: elevatorPos(), deployed: rig.elevatorDeployed, gate: rig.gateOpen, steppedOff: false, sinceHandOver: 0 });
        return;
      }
      sinceHandOver += dt;
      const dx = player.position.x - anchor0.x, dz = player.position.z - anchor0.z;
      steppedOff = Math.hypot(dx, dz) >= DISEMBARK.stepOffM;
      if (stageFor({ elevator: 1, deployed: true, gate: 1, steppedOff, sinceHandOver }) === 'stepped') present();
    },
    skip() {
      if (disposed || stage === 'done') return;
      if (!handedOver) {
        rig.setTargets(1, 1, true);
        rig.setGate(1, true);
        handOver();
      }
      present();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      if (camOwned) { camOwned = false; cam.dispose(); }
      collider?.dispose(); collider = null;
      bannerDispose?.(); bannerDispose = null;
      if (handedOver && !presented) hud.showPrompt(null);
    },
  };
}
