import { reducedCameraMotion } from '../core/accessibility';
import {
  ArcRotateCamera, Axis, CharacterSupportedState, Color3, Mesh, MeshBuilder, PBRMaterial,
  PhysicsCharacterController, Quaternion, Scene, SpotLight, TransformNode, Vector3,
} from '@babylonjs/core';
import { loadModel, type LoadedModel } from '../models/loadModel';
import { initGait, stepGait, STANDING_POSE, type GaitState } from './gait';
import { AstronautAction, type ActionRequest } from './astronautAction';
import { AstronautRig } from './astronautRig';
import { tr } from '../i18n/i18n';
import { LUNAR_G } from '../config/constants';
import { sampleHeight, type Heightmap } from '../data/heightmap';
import { PLAYER_HEIGHT_M } from '../landing/disembarkTimeline';
import { LandingDetector } from './landing';
import { clampToWorld, computeMoveVelocity, isBelowGround, JUMP_SPEED_MS, LOPE_SPEED_MS, WALK_SPEED_MS, type MoveInput } from './movement';

import { resolveFootprint, type Footprint, type XZ } from './footprintCollision';

/**
 * How far the astronaut may start an action and how it walks into its stance. Module installs accept any start
 * inside the 2.5 m "Hold E" prompt radius and walk there at normal speed; sample collection keeps its short reach.
 */
export function interactionReach(kind: 'install' | 'sample') {
  return kind === 'install'
    ? { stance: .40, minStart: .05, maxStart: 2.5, speed: WALK_SPEED_MS, timeout: (d: number) => 1 + d / WALK_SPEED_MS }
    : { stance: .48, minStart: Math.max(.05, .48 - .45), maxStart: .48 + .45, speed: .45, timeout: (_d: number) => 2.5 };
}

type MoveBaseline = { forward: number; right: number };
/**
 * Movement that cancels an interaction. Keys already held when it started (the player was walking when they held E)
 * are ignored until released; a new direction, a re-press or a jump cancels.
 */
export function moveCancel(baseline: MoveBaseline | null, input: MoveInput): { cancel: boolean; baseline: MoveBaseline } {
  if (!baseline) return { cancel: !!input.jump, baseline: { forward: input.forward, right: input.right } };
  const next = { forward: input.forward === 0 ? 0 : baseline.forward, right: input.right === 0 ? 0 : baseline.right };
  const fresh = (now: number, was: number) => now !== 0 && now !== was;
  return { cancel: !!input.jump || fresh(input.forward, baseline.forward) || fresh(input.right, baseline.right), baseline: next };
}

/**
 * The stance point to walk to, or null when the action cannot start from here. Installs compare the stance ground
 * with the connector's ground (the player may stand on a slope); samples compare it with the player's own footing.
 */
export function canStartInteraction(kind: 'install' | 'sample', player: XZ, target: XZ, groundAt: (x: number, z: number) => number): XZ | null {
  const r = interactionReach(kind);
  const dx = player.x - target.x, dz = player.z - target.z, distance = Math.hypot(dx, dz);
  if (distance < r.minStart || distance > r.maxStart) return null;
  const x = target.x + dx / distance * r.stance, z = target.z + dz / distance * r.stance;
  const reference = kind === 'install' ? groundAt(target.x, target.z) : groundAt(player.x, player.z);
  if (Math.abs(groundAt(x, z) - reference) > .22) return null;
  return { x, z };
}

const HEIGHT = PLAYER_HEIGHT_M;

/** Capsule-centre height while riding: standing on a floor at at.y, or seated 0.82 m below the seat surface. */
export function rideRootY(at: { y: number }, standing: boolean): number {
  return standing ? at.y + HEIGHT / 2 : at.y - 0.82 + HEIGHT / 2;
}
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
export interface AstronautInteraction extends ActionRequest { target: Vector3; valid: () => boolean }

/**
 * Third-person astronaut with a Havok character controller under lunar gravity. Body: AxEMU-style GLB
 * (public/models/astronaut.glb) with a procedural lunar walk/lope; falls back to the Plan 1 capsule.
 */
export class Astronaut {
  readonly camera: ArcRotateCamera;
  readonly root: Mesh;
  private readonly cc: PhysicsCharacterController;
  private footprintObstacle: (() => Footprint | null) | null = null;
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
  private readonly rig: AstronautRig | null = null;
  private readonly action = new AstronautAction();
  private interaction: AstronautInteraction | null = null;
  private approach: { x: number; z: number; remaining: number; settled: number; speed: number } | null = null;
  private moveBaseline: { forward: number; right: number } | null = null;
  private actionHeld = false;
  private actionBlocked = false;
  private supported = false;
  /** Seat on the lunar rover while driving (Plan 7), or null on foot. */
  private seat: { x: number; y: number; z: number; yaw: number; standing?: boolean } | null = null;

  static async create(scene: Scene, hm: Heightmap, spawn: Vector3): Promise<Astronaut> {
    const player = new Astronaut(scene, hm, spawn, await loadModel(scene, 'astronaut'));
    await player.rig?.warm();
    return player;
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
      if (model.skeletons?.length) this.rig = new AstronautRig(model);
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
    scene.onDisposeObservable.addOnce(() => { this.cancelInteraction(); this.rig?.dispose(); });
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

  setFootprintObstacle(provider: () => Footprint | null): void {
    this.footprintObstacle = provider;
    this.enforceFootprint();
  }

  /** Recheck after towing, teleporting or opening a modal, without changing camera framing. */
  enforceFootprint(): void {
    this.constrainFootprint(this.cc.getPosition(), true);
  }

  private constrainFootprint(from: XZ, syncVisual = false): void {
    if (this.seat) return;
    const footprint = this.footprintObstacle?.();
    if (!footprint) return;
    const p = this.cc.getPosition();
    const result = resolveFootprint(from, p, footprint, 0.5);
    if (Math.hypot(result.x - p.x, result.z - p.z) < 1e-7) return;
    const next = new Vector3(result.x, Math.max(p.y, sampleHeight(this.hm, result.x, result.z) + HEIGHT / 2), result.z);
    this.cc.setPosition(next);
    const velocity = this.cc.getVelocity().clone();
    for (const normal of result.contacts) {
      const inward = velocity.x * normal.x + velocity.z * normal.z;
      if (inward < 0) { velocity.x -= normal.x * inward; velocity.z -= normal.z * inward; }
    }
    this.cc.setVelocity(velocity);
    if (syncVisual) {
      this.root.position.copyFrom(next);
      this.camera.target.copyFrom(next.add(new Vector3(0, 0.8, 0)));
    }
  }

  private floorOverride: ((x: number, z: number) => number | null) | null = null;

  /** Walking surface above the terrain (e.g. the elevator car deck); null clears it. Ground = max(terrain, override). */
  setFloorOverride(fn: ((x: number, z: number) => number | null) | null): void { this.floorOverride = fn; }

  private groundAt(x: number, z: number): number {
    const terrain = sampleHeight(this.hm, x, z);
    const o = this.floorOverride?.(x, z);
    return o == null ? terrain : Math.max(terrain, o);
  }

  /** Puts the astronaut on the ground at (x, z), at rest (rescue, demo jumps). */
  teleport(x: number, z: number): void {
    this.cancelInteraction();
    const p = new Vector3(x, sampleHeight(this.hm, x, z) + HEIGHT / 2 + 0.2, z);
    this.cc.setPosition(p);
    this.cc.setVelocity(Vector3.Zero());
    this.root.position.copyFrom(p);
    this.seat = null;
    this.gait = initGait(this.facingYaw);
    this.enforceFootprint();
  }

  /** Sit in the rover's driver seat (updated every frame while driving) or stand up (null). */
  setRide(at: { x: number; y: number; z: number; yaw: number; standing?: boolean } | null): void {
    if (at) this.cancelInteraction();
    this.seat = at;
  }

  /** Stands the astronaut on a floor at height y (e.g. the elevator car), ending any ride. */
  placeOnFloor(x: number, y: number, z: number, yaw: number): void {
    this.cancelInteraction();
    this.seat = null;
    const p = new Vector3(x, y + HEIGHT / 2, z);
    this.cc.setPosition(p);
    this.cc.setVelocity(Vector3.Zero());
    this.root.position.copyFrom(p);
    this.facingYaw = yaw;
    this.gait = initGait(yaw);
    this.root.rotation.y = yaw;
    this.camera.target.copyFrom(p.add(new Vector3(0, 0.8, 0)));
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

  get interactionBusy(): boolean { return this.interaction !== null; }
  get interactionPrompt(): string | null {
    if (!this.interaction) return null;
    if (this.approach) return tr('Finding a steady footing…');
    return this.interaction.kind === 'sample' ? tr('Collecting and bagging sample…') : tr('Aligning… {pct}%', { pct: Math.round((this.action.snapshot?.progress ?? 0) * 100) });
  }
  beginInteraction(request: AstronautInteraction): boolean {
    if (this.interactionBusy || this.seat || !this.supported || !request.valid()) return false;
    const kind = request.kind === 'sample' ? 'sample' : 'install';
    const stand = canStartInteraction(kind, this.position, request.target, (x, z) => sampleHeight(this.hm, x, z));
    if (!stand) return false;
    const reach = interactionReach(kind);
    this.interaction = { ...request, target: request.target.clone() };
    this.approach = { ...stand, remaining: reach.timeout(Math.hypot(this.position.x - stand.x, this.position.z - stand.z)), settled: 0, speed: reach.speed };
    return true;
  }
  updateInteraction(_dt: number, held: boolean, blocked: boolean): void {
    this.actionHeld = held; this.actionBlocked = blocked;
    if (blocked && !this.action.snapshot?.committed) this.cancelInteraction();
  }
  cancelInteraction(): void {
    const pending = this.approach ? this.interaction : null;
    this.approach = null; this.interaction = null;
    this.action.cancel(); pending?.onCancel?.();
    this.rig?.clearAction();
  }

  update(dt: number, input: MoveInput): void {
    if (dt <= 0) return;
    if (this.seat) {
      this.updateSeated(dt);
      return;
    }
    const support = this.cc.checkSupport(dt, DOWN);
    let cancel = !!(input.forward || input.right || input.jump);
    if (this.interaction) ({ cancel, baseline: this.moveBaseline } = moveCancel(this.moveBaseline, input));
    else this.moveBaseline = null;
    if (this.approach && (cancel || this.actionBlocked || !this.interaction!.valid() || (this.interaction!.kind === 'install' && !this.actionHeld))) this.cancelInteraction();
    const move = this.interactionBusy ? { forward: 0, right: 0, jump: false } : input;
    const h = computeMoveVelocity(move, this.cameraYaw, input.lope ? LOPE_SPEED_MS : WALK_SPEED_MS);
    if (this.approach) {
      const dx = this.approach.x - this.position.x, dz = this.approach.z - this.position.z;
      const distance = Math.hypot(dx, dz);
      const speed = Math.min(this.approach.speed, distance * 3);
      if (distance > .015) { h.x = dx / distance * speed; h.z = dz / distance * speed; }
      this.approach.remaining -= dt;
    }
    const current = this.cc.getVelocity();
    const supported = support.supportedState === CharacterSupportedState.SUPPORTED;
    this.supported = supported;
    const impact = this.landing.update(supported, current.y);
    if (impact !== null) this.onLand(impact);
    let next: Vector3;
    if (supported) {
      const desired = new Vector3(h.x, 0, h.z);
      const forward = desired.lengthSquared() > 0 ? desired.normalizeToNew() : new Vector3(Math.sin(this.facingYaw), 0, Math.cos(this.facingYaw));
      next = this.cc.calculateMovement(dt, forward, support.averageSurfaceNormal, current, support.averageSurfaceVelocity, desired, UP);
      next.subtractInPlace(support.averageSurfaceVelocity);
      if (move.jump) {
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
    const ground = this.groundAt(c.x, c.z);
    if (isBelowGround(p.y, ground)) {
      this.cc.setPosition(new Vector3(c.x, ground + HEIGHT / 2 + 0.2, c.z));
      this.cc.setVelocity(Vector3.Zero());
    } else if (c.x !== p.x || c.z !== p.z) {
      this.cc.setPosition(new Vector3(c.x, p.y, c.z));
    }
    this.constrainFootprint(this.root.position);
    const moved = Math.hypot(this.cc.getPosition().x - this.root.position.x, this.cc.getPosition().z - this.root.position.z);
    // Facing turns smoothly at a capped rate (gait.ts); the movement direction still follows the keys at once.
    const desiredYaw = this.interaction ? Math.atan2(this.interaction.target.x - this.position.x, this.interaction.target.z - this.position.z) : Math.hypot(h.x, h.z) > 0.01 ? Math.atan2(h.x, h.z) : this.gait.yaw;
    const at = this.cc.getPosition();
    const g = stepGait(this.gait, {
      pos: { x: at.x, y: at.y - HEIGHT / 2, z: at.z },
      speedMs: moved < 1 ? moved / dt : 0,
      lope: !!input.lope,
      supported,
      vy: this.cc.getVelocity().y,
      groundAt: (x, z) => this.groundAt(x, z),
      desiredYaw,
      dt,
    });
    this.gait = g.st;
    this.facingYaw = g.st.yaw;
    if (this.approach) {
      const settled = Math.hypot(at.x - this.approach.x, at.z - this.approach.z) < .035;
      const aligned = Math.abs(Math.atan2(Math.sin(desiredYaw - this.facingYaw), Math.cos(desiredYaw - this.facingYaw))) < .06;
      this.approach.settled = settled && aligned && supported && moved / dt < .08 ? this.approach.settled + dt : 0;
      if (this.approach.settled >= .35) { this.action.start(this.interaction!); this.approach = null; }
      else if (this.approach.remaining <= 0 || !supported) this.cancelInteraction();
    }
    if (this.action.busy && this.interaction) {
      const valid = supported && this.interaction.valid() && Math.hypot(at.x - this.interaction.target.x, at.z - this.interaction.target.z) < 1.15;
      this.action.update(dt, { held: this.actionHeld, valid, cancel });
      if (!this.action.busy) this.interaction = null;
    }
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
    this.rig?.apply(dt, this.action.snapshot, this.interaction?.target ?? null, this.root, this.gait.phase, moved / dt > .1, (x, z) => this.groundAt(x, z));
    this.camera.target.copyFrom(this.root.position.add(new Vector3(0, 0.8, 0)));
  }

  /**
   * Driving: the body sits in the seat (hips and knees bent, hands on the hand controller); the physics
   * capsule waits where the player climbed in until teleport() puts it next to the rover again. The camera
   * swings round behind the rover while it is moving; stopped, the player can look around freely.
   */
  private updateSeated(dt: number): void {
    const at = this.seat!;
    const standing = !!at.standing;
    // Seated: feet-level root sits 0.82 m below the seat surface; standing: feet on the floor.
    this.root.position.set(at.x, rideRootY(at, standing), at.z);
    this.facingYaw = at.yaw;
    this.gait.yaw = at.yaw;
    this.root.rotation.y = at.yaw;
    if (standing) {
      this.lastSeat = { x: at.x, z: at.z };
      if (this.limbs) {
        this.gait.pose = { ...STANDING_POSE };
        this.applyPose();
      }
      this.camera.target.copyFrom(this.root.position.add(new Vector3(0, 0.8, 0)));
      return;
    }
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
    this.rig?.reset();
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
