import {
  AbstractMesh, Axis, Color3, DynamicTexture, Mesh, MeshBuilder, PBRMaterial, Quaternion, Scene, SpotLight,
  StandardMaterial, Texture, TransformNode, Vector3,
} from '@babylonjs/core';
import { sampleHeight, type Heightmap } from '../data/heightmap';
import type { PipFace } from '../dialogue/runner';
import type { DustSystem } from '../fx/dustSystem';
import { loadModel, type LoadedModel } from '../models/loadModel';
import type { Astronaut } from '../player/astronaut';
import { PipBrain, type PipMode } from './brain';
import { blinkAmount, drawPipFace } from './faceArt';
import { ARM_POSES, blendPose, lookAngles, steerAngles, wheelSpin, type ArmAngles, type ArmPose } from './pipRig';

export type PipCommand = 'lift' | 'light' | 'scan' | 'pull' | 'open' | 'align' | 'berm' | 'wait' | 'come';

function mat(scene: Scene, name: string, color: Color3, rough = 0.6, metal = 0): PBRMaterial {
  const m = new PBRMaterial(name, scene);
  m.albedoColor = color;
  m.roughness = rough;
  m.metallic = metal;
  return m;
}

const FACE_W = 512;
const FACE_H = 256;
const FACE_FPS = 30;
const HEAD_HEIGHT_M = 1.25;

/**
 * Rotation signs for the GLB pivots. Babylon mirrors glTF's X axis when it converts to its left-handed
 * world, which flips the visible direction of yaw (Y) rotations; X rotations are unaffected.
 */
const SIGN = { steer: -1, pan: -1, armBase: -1 };

interface Rig {
  wheels: TransformNode[];
  steers: TransformNode[];
  mast: TransformNode;
  head: TransformNode;
  lidar: TransformNode;
  armBase: TransformNode;
  shoulder: TransformNode;
  elbow: TransformNode;
  wrist: TransformNode;
  grips: { node: TransformNode; x0: number; side: number }[];
}

const rotX = (a: number) => Quaternion.RotationAxis(Axis.X, a);
const rotY = (a: number) => Quaternion.RotationAxis(Axis.Y, a);

/**
 * Pip: VIPER-style four-wheel rover with a chibi face screen (spec v3 §4.1). Loads public/models/pip.glb;
 * if that fails, falls back to the Plan 1 placeholder body so the game still runs.
 */
export class Pip {
  readonly root: TransformNode;
  readonly meshes: AbstractMesh[] = [];
  mode: PipMode = 'follow';
  gotoTarget?: { x: number; z: number };
  /** Deck position while riding the lunar rover (mode 'ride', Plan 7). */
  rideAt: { x: number; y: number; z: number; yaw: number } | null = null;
  /** Set by other systems when a context action is available (e.g. 'lift' near a crate). */
  contextCommand: PipCommand | null = null;
  onCommand: (c: PipCommand) => void = () => {};
  face: PipFace = 'happy';
  /** True while Pip's dialogue line is on screen: the mouth moves. */
  talking = false;
  /** Shared lunar dust pool; set by the scene. Wheels spray ballistic grains while Pip moves. */
  dustSystem: DustSystem | null = null;
  /** 0..1 multiplier on driving speed (wheel slip on soft slopes). */
  speedFactor = 1;
  /** Wheels spin in place, digging and spraying dust (stuck on a slope). */
  spinning = false;
  /** Where a carried crate sits relative to Pip's root. */
  readonly carryOffset: Vector3;

  private readonly brain = new PipBrain();
  private readonly faceTex: DynamicTexture;
  private readonly lamp: SpotLight;
  private readonly rig: Rig | null;
  private readonly placeholderShoulder: TransformNode | null = null;
  private yaw = 0;
  private speed = 0;
  private parkedYaw: number | null = null;
  private asleep = false;
  private time = 0;
  private faceAcc = 1;
  private wheelRoll = 0;
  private steerFront = 0;
  private steerRear = 0;
  private pan = 0;
  private tilt = 0;
  private arm: ArmAngles = { ...ARM_POSES.stowed };
  private armTarget: ArmPose = 'stowed';
  private poseEndsAtS: number | null = null;
  private scanUntil = 0;

  static async create(scene: Scene, hm: Heightmap, start: { x: number; z: number }): Promise<Pip> {
    return new Pip(scene, hm, start, await loadModel(scene, 'pip'));
  }

  constructor(scene: Scene, private readonly hm: Heightmap, start: { x: number; z: number }, model: LoadedModel | null = null) {
    this.root = new TransformNode('pip', scene);
    this.faceTex = new DynamicTexture('pipFaceTex', { width: FACE_W, height: FACE_H }, scene, false, Texture.TRILINEAR_SAMPLINGMODE);
    const faceMat = new StandardMaterial('pipFaceMat', scene);
    faceMat.diffuseTexture = this.faceTex;
    faceMat.emissiveTexture = this.faceTex;
    faceMat.disableLighting = true;
    this.lamp = new SpotLight('pipLampLight', new Vector3(0, 0, 0), new Vector3(0, -0.25, 1), Math.PI / 3, 2, scene);
    this.lamp.intensity = 0;
    this.lamp.range = 40;

    if (model) {
      model.root.parent = this.root;
      this.meshes.push(...model.meshes);
      const screen = model.node('face_screen') as Mesh;
      screen.material = faceMat;
      // The canvas is drawn top-down while glTF UVs have V up: flip V (seen in-game: unflipped = upside down).
      this.faceTex.vScale = -1;
      this.faceTex.wrapV = Texture.WRAP_ADDRESSMODE;
      const head = model.node('head_tilt');
      this.lamp.parent = head;
      this.lamp.position.set(0, 0.1, 0.16);
      const n = (name: string) => model.node(name);
      this.rig = {
        wheels: ['FL', 'FR', 'RL', 'RR'].map((s) => n(`wheel_${s}`)),
        steers: ['FL', 'FR', 'RL', 'RR'].map((s) => n(`steer_${s}`)),
        mast: n('mast_pan'),
        head,
        lidar: n('lidar'),
        armBase: n('arm_base'),
        shoulder: n('arm_shoulder'),
        elbow: n('arm_elbow'),
        wrist: n('arm_wrist_pitch'),
        grips: [
          { node: n('grip_L'), x0: n('grip_L').position.x, side: 1 },
          { node: n('grip_R'), x0: n('grip_R').position.x, side: -1 },
        ],
      };
      this.carryOffset = new Vector3(0, 0.95, 1.45);
    } else {
      this.rig = null;
      this.placeholderShoulder = this.buildPlaceholder(scene, faceMat);
      this.lamp.parent = this.root;
      this.lamp.position.set(0, 1.1, 0.1);
      this.carryOffset = new Vector3(0, 1.75, 0.2);
    }
    this.root.position.set(start.x, sampleHeight(hm, start.x, start.z), start.z);
    this.redrawFace(0);
  }

  /** Plan 1 egg body, kept as the fallback when pip.glb cannot load. Returns the arm's shoulder pivot. */
  private buildPlaceholder(scene: Scene, faceMat: StandardMaterial): TransformNode {
    const white = mat(scene, 'pipWhite', new Color3(0.93, 0.93, 0.9), 0.4);
    const orange = mat(scene, 'pipOrange', new Color3(0.95, 0.45, 0.1), 0.5);
    const dark = mat(scene, 'pipDark', new Color3(0.12, 0.12, 0.13), 0.9);
    const panel = mat(scene, 'pipPanel', new Color3(0.05, 0.08, 0.25), 0.3, 0.6);
    const add = (m: Mesh, parent: TransformNode = this.root) => {
      m.parent = parent;
      this.meshes.push(m);
      return m;
    };
    const body = add(MeshBuilder.CreateSphere('pipBody', { diameterX: 0.7, diameterY: 0.85, diameterZ: 0.7, segments: 24 }, scene));
    body.position.y = 0.62;
    body.material = white;
    for (const side of [-1, 1]) {
      const tread = add(MeshBuilder.CreateBox('pipTread', { width: 0.18, height: 0.24, depth: 0.78 }, scene));
      tread.position.set(side * 0.3, 0.12, 0);
      tread.material = dark;
      const fin = add(MeshBuilder.CreateBox('pipFin', { width: 0.02, height: 0.5, depth: 0.36 }, scene));
      fin.position.set(side * 0.24, 0.85, -0.3);
      fin.rotation.z = side * 0.25;
      fin.material = panel;
    }
    const screen = add(MeshBuilder.CreatePlane('pipFace', { width: 0.4, height: 0.2 }, scene));
    screen.position.set(0, 0.74, 0.345);
    screen.rotation.y = Math.PI;
    screen.material = faceMat;
    const shoulder = new TransformNode('pipShoulder', scene);
    shoulder.parent = this.root;
    shoulder.position.set(0.38, 0.72, 0.05);
    const upper = add(MeshBuilder.CreateCylinder('pipArmUpper', { diameter: 0.07, height: 0.45 }, scene), shoulder);
    upper.position.y = -0.22;
    upper.material = white;
    const grip = add(MeshBuilder.CreateBox('pipGrip', { width: 0.12, height: 0.06, depth: 0.1 }, scene), shoulder);
    grip.position.set(0, -0.45, 0.2);
    grip.material = orange;
    return shoulder;
  }

  get position(): Vector3 {
    return this.root.position;
  }

  /** True when the real GLB loaded (false = placeholder body). */
  get hasModel(): boolean {
    return this.rig !== null;
  }

  setFace(f: PipFace): void {
    if (this.asleep && f !== 'sleep') return;
    if (f === this.face) return;
    this.face = f;
    this.faceAcc = 1; // redraw on the next frame
  }

  /** True while Pip is rolling (battery drain, dust). */
  get moving(): boolean {
    return this.speed > 0.05;
  }

  /** Body heading (0 = +z), used for wheel tracks and dust spray. */
  get heading(): number {
    return this.yaw;
  }

  /** Hibernate through the long night (sleep face, lamp off, stays put) or wake up. */
  sleep(on: boolean): void {
    if (on) {
      this.setFace('sleep');
      this.lamp.intensity = 0;
      this.mode = 'wait';
      this.asleep = true;
    } else {
      this.asleep = false;
      this.setFace('happy');
    }
  }

  get sleeping(): boolean {
    return this.asleep;
  }

  /** Park facing `yaw` (e.g. a side panel at the sunrise notch): Pip waits and turns in place. */
  parkYaw(yaw: number): void {
    this.mode = 'wait';
    this.parkedYaw = yaw;
  }

  get lampOn(): boolean {
    return this.lamp.intensity > 0;
  }

  /** Waves the arm for a couple of seconds (first meeting, happy moments). */
  wave(): void {
    this.setPose('wave', 2500);
  }

  setPose(p: ArmPose, holdMs?: number): void {
    this.armTarget = p;
    this.poseEndsAtS = holdMs ? this.time + holdMs / 1000 : null;
  }

  command(c: PipCommand): void {
    switch (c) {
      case 'wait':
        this.mode = 'wait';
        break;
      case 'come':
        this.mode = 'follow';
        break;
      case 'light':
        this.lamp.intensity = this.lampOn ? 0 : 60;
        break;
      case 'lift':
        this.setPose('lift');
        break;
      case 'open':
      case 'align':
      case 'berm':
        this.setPose('reach', 1500);
        break;
      case 'scan':
        this.scanUntil = this.time + 2.5;
        break;
    }
    this.onCommand(c);
  }

  /** Contact points of the four wheels on the ground (front/rear ±0.55 m, track ±0.62 m). */
  wheelWorldPositions(): Vector3[] {
    const p = this.root.position;
    const fx = Math.sin(this.yaw), fz = Math.cos(this.yaw);
    const rx = Math.cos(this.yaw), rz = -Math.sin(this.yaw);
    return [[0.55, -0.62], [0.55, 0.62], [-0.55, -0.62], [-0.55, 0.62]].map(([f, r]) => {
      const x = p.x + fx * f + rx * r;
      const z = p.z + fz * f + rz * r;
      return new Vector3(x, sampleHeight(this.hm, x, z), z);
    });
  }

  lowerArm(): void {
    this.setPose('stowed');
  }

  update(dt: number, player: Astronaut): void {
    this.time += dt;
    if (this.poseEndsAtS !== null && this.time >= this.poseEndsAtS) this.lowerArm();
    const out = this.brain.update({
      pip: { x: this.root.position.x, z: this.root.position.z },
      player: { x: player.position.x, z: player.position.z },
      playerYawRad: player.yaw,
      dt,
      mode: this.mode,
      gotoTarget: this.gotoTarget,
    });
    const p = this.root.position;
    if (out.teleportTo) {
      p.x = out.teleportTo.x;
      p.z = out.teleportTo.z;
    }
    let moving = false;
    let turnRate = 0;
    let travelled = 0;
    if (out.target) {
      const dx = out.target.x - p.x;
      const dz = out.target.z - p.z;
      const d = Math.hypot(dx, dz);
      if (d > 0.3) {
        // Ease the speed so Pip accelerates like something with mass (inertia is unchanged on the Moon).
        this.speed += (out.speedMs * this.speedFactor - this.speed) * Math.min(1, dt * 2);
        travelled = Math.min(d, this.speed * dt);
        p.x += (dx / d) * travelled;
        p.z += (dz / d) * travelled;
        let dy = Math.atan2(dx, dz) - this.yaw;
        dy = Math.atan2(Math.sin(dy), Math.cos(dy));
        const turn = dy * Math.min(1, dt * 6);
        this.yaw += turn;
        turnRate = dt > 0 ? turn / dt : 0;
        moving = true;
      }
    }
    if (!moving) this.speed = 0;
    if (this.mode !== 'wait') this.parkedYaw = null;
    if (!moving && this.parkedYaw !== null) {
      let dy = this.parkedYaw - this.yaw;
      dy = Math.atan2(Math.sin(dy), Math.cos(dy));
      const turn = dy * Math.min(1, dt * 2);
      this.yaw += turn;
      turnRate = dt > 0 ? turn / dt : 0;
      travelled += Math.abs(turn) * 0.6; // wheels roll while turning on the spot
    }
    if (this.mode === 'ride' && this.rideAt) {
      // On the rover's cargo deck (Plan 7): carried along, facing forward.
      p.x = this.rideAt.x;
      p.z = this.rideAt.z;
      this.yaw = this.rideAt.yaw;
      p.y = this.rideAt.y;
    } else p.y = sampleHeight(this.hm, p.x, p.z);
    this.root.rotation.y = this.yaw;
    if (moving && this.dustSystem) {
      for (const w of this.wheelWorldPositions()) this.dustSystem.trickle(w, this.yaw, this.speed, dt / 4);
    }
    if (this.spinning) {
      // Stuck: the wheels turn at full speed but the rover goes nowhere, throwing regolith backwards.
      travelled += 3 * dt;
      if (this.dustSystem) for (const w of this.wheelWorldPositions()) this.dustSystem.trickle(w, this.yaw, 3, dt / 4);
    }

    // Head: look at the player (or down at the ground while scanning).
    const headPos = { x: p.x, y: p.y + HEAD_HEIGHT_M, z: p.z };
    const scanning = this.time < this.scanUntil;
    const target = scanning
      ? { x: p.x + Math.sin(this.yaw) * 2.5, y: p.y, z: p.z + Math.cos(this.yaw) * 2.5 }
      : { x: player.position.x, y: player.position.y + 0.6, z: player.position.z };
    const want = lookAngles(headPos, target, this.yaw);
    const k = Math.min(1, dt * 4);
    this.pan += (want.pan - this.pan) * k;
    this.tilt += (want.tilt - this.tilt) * k;

    this.arm = blendPose(this.arm, ARM_POSES[this.armTarget], Math.min(1, dt * 3));
    this.applyRig(dt, travelled, turnRate);

    this.faceAcc += dt;
    if (this.faceAcc >= 1 / FACE_FPS) {
      this.faceAcc = 0;
      this.redrawFace(want.pan - this.pan);
    }
  }

  private applyRig(dt: number, travelled: number, turnRate: number): void {
    if (!this.rig) {
      if (this.placeholderShoulder) this.placeholderShoulder.rotation.x = -this.arm.shoulder * 1.3;
      return;
    }
    const r = this.rig;
    this.wheelRoll += wheelSpin(travelled);
    const s = steerAngles(turnRate, this.speed);
    const k = Math.min(1, dt * 8);
    this.steerFront += (s.front - this.steerFront) * k;
    this.steerRear += (s.rear - this.steerRear) * k;
    r.wheels.forEach((w) => (w.rotationQuaternion = rotX(this.wheelRoll)));
    r.steers.forEach((st, i) => (st.rotationQuaternion = rotY(SIGN.steer * (i < 2 ? this.steerFront : this.steerRear))));
    r.mast.rotationQuaternion = rotY(SIGN.pan * this.pan);
    r.head.rotationQuaternion = rotX(-this.tilt);
    r.lidar.rotationQuaternion = rotY(this.time * 3);
    r.armBase.rotationQuaternion = rotY(SIGN.armBase * this.arm.base);
    r.shoulder.rotationQuaternion = rotX(-this.arm.shoulder);
    r.elbow.rotationQuaternion = rotX(this.arm.elbow);
    r.wrist.rotationQuaternion = rotX(-this.arm.wristPitch);
    for (const g of r.grips) g.node.position.x = g.x0 + g.side * this.arm.grip * 0.015;
  }

  /** Redraws the chibi face; `gazeResidual` is how far the head still has to turn (eyes lead the head). */
  private redrawFace(gazeResidual: number): void {
    const ctx = this.faceTex.getContext() as CanvasRenderingContext2D;
    const wander = Math.sin(this.time * 0.37) * 0.25;
    drawPipFace(ctx, FACE_W, FACE_H, {
      expression: this.face,
      blink: this.face === 'sleep' || this.face === 'dots' ? 0 : blinkAmount(this.time, 7),
      lookX: Math.max(-1, Math.min(1, gazeResidual * 2 + wander)),
      lookY: Math.max(-1, Math.min(1, -this.tilt)),
      talk: this.talking ? Math.abs(Math.sin(this.time * 11)) : 0,
      t: this.time,
    });
    this.faceTex.update();
  }
}
