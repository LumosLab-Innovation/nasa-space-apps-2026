import { reducedCameraMotion } from '../core/accessibility';
import {
  ArcRotateCamera, Axis, CharacterSupportedState, Color3, Mesh, MeshBuilder, PBRMaterial,
  PhysicsCharacterController, Quaternion, Scene, SpotLight, TransformNode, Vector3,
} from '@babylonjs/core';
import { loadModel, type LoadedModel } from '../models/loadModel';
import { initGait, stepGait, type GaitState } from './gait';
import { LUNAR_G } from '../config/constants';
import { sampleHeight, type Heightmap } from '../data/heightmap';
import { LandingDetector } from './landing';
import { clampToWorld, computeMoveVelocity, isBelowGround, JUMP_SPEED_MS, LOPE_SPEED_MS, WALK_SPEED_MS, type MoveInput } from './movement';

const HEIGHT = 1.9;
const RADIUS = 0.35;
const GRAVITY = new Vector3(0, -LUNAR_G, 0);
const DOWN = new Vector3(0, -1, 0);
const UP = new Vector3(0, 1, 0);
/** Ground travel between footfalls for the placeholder body (the GLB body uses its gait phase instead). */
const STEP_M = 0.7;

interface Limbs {
  pelvis: TransformNode;
  pelvisY0: number;
  thighL: TransformNode;
  thighR: TransformNode;
  shinL: TransformNode;
  shinR: TransformNode;
  upperL: TransformNode;
  upperR: TransformNode;
  foreL: TransformNode;
  foreR: TransformNode;
  spine: TransformNode;
  neck: TransformNode;
  ankleL: TransformNode;
  ankleR: TransformNode;
  wristL: TransformNode;
  wristR: TransformNode;
}

const rotX = (a: number) => Quaternion.RotationAxis(Axis.X, a);

/**
 * Third-person astronaut with a Havok character controller under lunar gravity. Body: AxEMU-style GLB
 * (public/models/astronaut.glb) with a procedural lunar walk/lope; falls back to the Plan 1 capsule.
 */
export class Astronaut {
  readonly camera: ArcRotateCamera;
  readonly root: Mesh;
  private readonly cc: PhysicsCharacterController;
  private facingYaw = 0;
  private readonly landing = new LandingDetector();
  private stepDistM = 0;
  private nextFoot: 'L' | 'R' = 'L';
  /** Fired when the astronaut pushes off the ground. */
  onJump: (speedMs: number) => void = () => {};
  /** Fired on touchdown with the vertical speed just before contact. */
  onLand: (impactSpeedMs: number) => void = () => {};
  /** Fired every STEP_M of ground travel (alternating feet). */
  onStep: (foot: 'L' | 'R') => void = () => {};

  private readonly limbs: Limbs | null = null;
  private gait: GaitState = initGait(0);
  /** Seat on the lunar rover while driving (Plan 7), or null on foot. */
  private seat: { x: number; y: number; z: number; yaw: number } | null = null;

  static async create(scene: Scene, hm: Heightmap, spawn: Vector3): Promise<Astronaut> {
    return new Astronaut(scene, hm, spawn, await loadModel(scene, 'astronaut'));
  }

  constructor(scene: Scene, private readonly hm: Heightmap, spawn: Vector3, model: LoadedModel | null = null) {
    const start = new Vector3(spawn.x, sampleHeight(hm, spawn.x, spawn.z) + HEIGHT / 2 + 0.2, spawn.z);
    this.cc = new PhysicsCharacterController(start, { capsuleHeight: HEIGHT, capsuleRadius: RADIUS }, scene);

    this.root = MeshBuilder.CreateCapsule('astronaut', { height: HEIGHT, radius: RADIUS }, scene);
    this.root.position.copyFrom(start);
    // Helmet lamps (real Artemis suits carry them): the only light inside the long polar shadows.
    const lamp = new SpotLight('helmetLamp', new Vector3(0, HEIGHT / 2 - 0.15, 0.25), new Vector3(0, -0.35, 1), Math.PI / 2.6, 1.5, scene);
    lamp.parent = this.root;
    lamp.intensity = 25;
    lamp.range = 30;
    lamp.diffuse = new Color3(1, 0.97, 0.9);
    if (model) {
      this.root.isVisible = false;
      model.root.parent = this.root;
      model.root.position.y = -HEIGHT / 2;
      lamp.parent = model.node('helmet');
      lamp.position.set(0, 0.17, 0.12);
      const n = (name: string) => model.node(name);
      const pelvis = n('pelvis');
      this.limbs = {
        pelvis,
        pelvisY0: pelvis.position.y,
        thighL: n('thigh_L'),
        thighR: n('thigh_R'),
        shinL: n('shin_L'),
        shinR: n('shin_R'),
        upperL: n('upperArm_L'),
        upperR: n('upperArm_R'),
        foreL: n('foreArm_L'),
        foreR: n('foreArm_R'),
        spine: n('spine'),
        neck: n('neck'),
        ankleL: n('ankle_L'),
        ankleR: n('ankle_R'),
        wristL: n('wrist_L'),
        wristR: n('wrist_R'),
      };
    } else {
      this.buildPlaceholder(scene);
    }

    this.camera = new ArcRotateCamera('cam', -Math.PI / 2, 1.25, 7, start.add(new Vector3(0, 1, 0)), scene);
    this.camera.lowerRadiusLimit = 3;
    this.camera.upperRadiusLimit = 25;
    this.camera.lowerBetaLimit = 0.3;
    this.camera.upperBetaLimit = 1.65;
    this.camera.minZ = 0.1;
    this.camera.maxZ = 6000;
    this.camera.inputs.removeByType('ArcRotateCameraKeyboardMoveInput');
    this.camera.attachControl(scene.getEngine().getRenderingCanvas()!, true);
  }

  /** Plan 1 capsule body, kept as the fallback when astronaut.glb cannot load. */
  private buildPlaceholder(scene: Scene): void {
    const suit = new PBRMaterial('suit', scene);
    suit.albedoColor = new Color3(0.92, 0.92, 0.9);
    suit.roughness = 0.8;
    suit.metallic = 0;
    this.root.material = suit;
    const helmet = MeshBuilder.CreateSphere('helmet', { diameter: 0.5 }, scene);
    helmet.parent = this.root;
    helmet.position.set(0, HEIGHT / 2 - 0.2, 0.02);
    helmet.material = suit;
    const visor = MeshBuilder.CreateSphere('visor', { diameter: 0.42, slice: 0.5 }, scene);
    visor.parent = helmet;
    visor.rotation.x = -Math.PI / 2;
    visor.position.z = 0.06;
    const gold = new PBRMaterial('visorGold', scene);
    gold.albedoColor = new Color3(0.9, 0.65, 0.2);
    gold.metallic = 1;
    gold.roughness = 0.15;
    visor.material = gold;
    const pack = MeshBuilder.CreateBox('lifePack', { width: 0.55, height: 0.7, depth: 0.25 }, scene);
    pack.parent = this.root;
    pack.position.set(0, 0.25, -0.3);
    pack.material = suit;
  }

  get position(): Vector3 {
    return this.root.position;
  }

  /** Puts the astronaut on the ground at (x, z), at rest (rescue, demo jumps). */
  teleport(x: number, z: number): void {
    const p = new Vector3(x, sampleHeight(this.hm, x, z) + HEIGHT / 2 + 0.2, z);
    this.cc.setPosition(p);
    this.cc.setVelocity(Vector3.Zero());
    this.root.position.copyFrom(p);
    this.seat = null;
    this.gait = initGait(this.facingYaw);
  }

  /** Sit in the rover's driver seat (updated every frame while driving) or stand up (null). */
  setRide(at: { x: number; y: number; z: number; yaw: number } | null): void {
    this.seat = at;
  }

  get riding(): boolean {
    return this.seat !== null;
  }

  /** Facing direction: 0 = north (+z), π/2 = east (+x). */
  get yaw(): number {
    return this.facingYaw;
  }

  /** Camera heading in the same yaw convention. */
  get cameraYaw(): number {
    return Math.atan2(-Math.cos(this.camera.alpha), -Math.sin(this.camera.alpha));
  }

  update(dt: number, input: MoveInput): void {
    if (dt <= 0) return;
    if (this.seat) {
      this.updateSeated(dt);
      return;
    }
    const support = this.cc.checkSupport(dt, DOWN);
    const h = computeMoveVelocity(input, this.cameraYaw, input.lope ? LOPE_SPEED_MS : WALK_SPEED_MS);
    const current = this.cc.getVelocity();
    const supported = support.supportedState === CharacterSupportedState.SUPPORTED;
    const impact = this.landing.update(supported, current.y);
    if (impact !== null) this.onLand(impact);
    let next: Vector3;
    if (supported) {
      const desired = new Vector3(h.x, 0, h.z);
      const forward = desired.lengthSquared() > 0 ? desired.normalizeToNew() : new Vector3(Math.sin(this.facingYaw), 0, Math.cos(this.facingYaw));
      next = this.cc.calculateMovement(dt, forward, support.averageSurfaceNormal, current, support.averageSurfaceVelocity, desired, UP);
      next.subtractInPlace(support.averageSurfaceVelocity);
      if (input.jump) {
        next.y = JUMP_SPEED_MS;
        this.onJump(JUMP_SPEED_MS);
      }
    } else {
      // In the air: keep momentum (no air drag on the Moon), slight steering, gravity.
      next = current.add(GRAVITY.scale(dt));
      next.x += (h.x - next.x) * Math.min(1, dt * 0.5);
      next.z += (h.z - next.z) * Math.min(1, dt * 0.5);
    }
    this.cc.setVelocity(next);
    this.cc.integrate(dt, support, GRAVITY);

    const p = this.cc.getPosition();
    const c = clampToWorld(p.x, p.z);
    const ground = sampleHeight(this.hm, c.x, c.z);
    if (isBelowGround(p.y, ground)) {
      this.cc.setPosition(new Vector3(c.x, ground + HEIGHT / 2 + 0.2, c.z));
      this.cc.setVelocity(Vector3.Zero());
    } else if (c.x !== p.x || c.z !== p.z) {
      this.cc.setPosition(new Vector3(c.x, p.y, c.z));
    }
    const moved = Math.hypot(this.cc.getPosition().x - this.root.position.x, this.cc.getPosition().z - this.root.position.z);
    // Facing turns smoothly at a capped rate (gait.ts); the movement direction still follows the keys at once.
    const desiredYaw = Math.hypot(h.x, h.z) > 0.01 ? Math.atan2(h.x, h.z) : this.gait.yaw;
    const at = this.cc.getPosition();
    const g = stepGait(this.gait, {
      pos: { x: at.x, y: at.y - HEIGHT / 2, z: at.z },
      speedMs: moved < 1 ? moved / dt : 0,
      lope: !!input.lope,
      supported,
      vy: this.cc.getVelocity().y,
      groundAt: (x, z) => sampleHeight(this.hm, x, z),
      desiredYaw,
      dt,
    });
    this.gait = g.st;
    this.facingYaw = g.st.yaw;
    if (this.limbs) {
      this.applyPose();
      for (const foot of g.planted) this.onStep(foot);
    } else if (supported && moved < 1) {
      this.stepDistM += moved;
      if (this.stepDistM >= STEP_M) {
        this.stepDistM -= STEP_M;
        this.onStep(this.nextFoot);
        this.nextFoot = this.nextFoot === 'L' ? 'R' : 'L';
      }
    }
    this.root.position.copyFrom(this.cc.getPosition());
    this.root.rotation.y = this.facingYaw;
    this.camera.target.copyFrom(this.root.position.add(new Vector3(0, 0.8, 0)));
  }

  /**
   * Driving: the body sits in the seat (hips and knees bent, hands on the hand controller); the physics
   * capsule waits where the player climbed in until teleport() puts it next to the rover again. The camera
   * swings round behind the rover while it is moving; stopped, the player can look around freely.
   */
  private updateSeated(dt: number): void {
    const at = this.seat!;
    // Feet-level root sits 0.82 m below the seat surface, the capsule centre HEIGHT/2 above that.
    this.root.position.set(at.x, at.y - 0.82 + HEIGHT / 2, at.z);
    this.facingYaw = at.yaw;
    this.gait.yaw = at.yaw;
    this.root.rotation.y = at.yaw;
    if (this.limbs) {
      this.gait.pose = {
        ...this.gait.pose,
        hipL: 1.45, hipR: 1.45, kneeL: 1.45, kneeR: 1.45, ankleL: 0, ankleR: 0,
        shoulderL: 0.55, shoulderR: 0.55, elbowL: 1.0, elbowR: 1.0, wristL: 0.2, wristR: 0.2,
        bob: 0, spine: -0.08, neck: 0.05, roll: 0, lean: 0, crouch: 0,
      };
      this.applyPose();
    }
    const moving = Math.hypot(at.x - this.lastSeat.x, at.z - this.lastSeat.z) > 0.3 * dt;
    this.lastSeat = { x: at.x, z: at.z };
    if (moving && !reducedCameraMotion()) {
      const behind = Math.atan2(-Math.cos(at.yaw), -Math.sin(at.yaw));
      const d = Math.atan2(Math.sin(behind - this.camera.alpha), Math.cos(behind - this.camera.alpha));
      this.camera.alpha += d * Math.min(1, dt * 1.5);
      if (this.camera.radius < 9) this.camera.radius += (9 - this.camera.radius) * Math.min(1, dt * 2);
    }
    this.camera.target.copyFrom(this.root.position.add(new Vector3(0, 0.8, 0)));
  }
  private lastSeat = { x: 0, z: 0 };

  /** Puts the gait pose (gait.ts) on the GLB pivots. Footfalls (onStep) fire when a foot plants. */
  private applyPose(): void {
    const l = this.limbs!;
    const p = this.gait.pose;
    l.pelvis.position.y = l.pelvisY0 + p.bob;
    l.spine.rotationQuaternion = Quaternion.RotationYawPitchRoll(0, p.spine, p.roll);
    l.neck.rotationQuaternion = rotX(p.neck);
    l.thighL.rotationQuaternion = rotX(-p.hipL);
    l.thighR.rotationQuaternion = rotX(-p.hipR);
    l.shinL.rotationQuaternion = rotX(p.kneeL);
    l.shinR.rotationQuaternion = rotX(p.kneeR);
    l.ankleL.rotationQuaternion = rotX(-p.ankleL);
    l.ankleR.rotationQuaternion = rotX(-p.ankleR);
    l.upperL.rotationQuaternion = rotX(-p.shoulderL);
    l.upperR.rotationQuaternion = rotX(-p.shoulderR);
    l.foreL.rotationQuaternion = rotX(-p.elbowL);
    l.foreR.rotationQuaternion = rotX(-p.elbowR);
    l.wristL.rotationQuaternion = rotX(-p.wristL);
    l.wristR.rotationQuaternion = rotX(-p.wristR);
  }
}
