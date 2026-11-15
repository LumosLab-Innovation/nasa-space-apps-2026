import { Color3, MeshBuilder, PBRMaterial, Quaternion, TransformNode, Vector3, type Scene } from '@babylonjs/core';
import { setFlag, unlockCard, type GameState } from '../core/gameState';
import { sampleHeight, type Heightmap } from '../data/heightmap';
import type { DustSystem } from '../fx/dustSystem';
import type { TrailRenderer } from '../fx/trailRenderer';
import { StampSpacer } from '../fx/trails';
import { tr } from '../i18n/i18n';
import { loadModel, type LoadedModel } from '../models/loadModel';
import type { Pip } from '../pip/pip';
import type { Astronaut } from '../player/astronaut';
import { clampToWorld } from '../player/movement';
import { pipKnown, type MeetStage } from '../story/pipMeeting';
import type { DialogueBox } from '../ui/dialogueBox';
import type { Hud } from '../ui/hud';
import { HLS_POS, SHELTER_POS, zone } from '../world/zones';
import { ROVER, ROVER_PARK, canBoard, canLeave, initRover, roverArrival, roverStep, type RoverGround, type RoverState } from './rover';

type Stage = 'stowed' | 'lowering' | 'parked';
type Seat = { x: number; y: number; z: number; yaw: number };

/** Next to the lander (outside its 8 m keep-out ring), where the rover comes down after the first meeting. */
const DEPLOY = { x: HLS_POS.x + 10, z: HLS_POS.z + 4 };
const LOWER_S = 5;
const LOWER_FROM_M = 9;
const WHEEL_R = 0.41;
const CARD_AFTER_M = 150;

/** Keep-out areas: the Dark Crater floor (+10 m of rim), the shelter, the lander. */
export function roverForbidden(x: number, z: number): boolean {
  const dark = zone('darkCrater');
  if (Math.hypot(x - dark.x, z - dark.z) < dark.radius + 10) return true;
  if (Math.hypot(x - SHELTER_POS.x, z - SHELTER_POS.z) < 10) return true;
  if (Math.hypot(x - HLS_POS.x, z - HLS_POS.z) < 8) return true;
  const c = clampToWorld(x, z);
  return c.x !== x || c.z !== z;
}

/**
 * The Artemis lunar rover in the scene (Plan 7): lowered from the lander after the first meeting (or parked
 * at camp on continue), E to climb in or out, W/S/A/D to drive, Pip rides on the cargo deck.
 */
export async function createRoverSystem(w: {
  scene: Scene; hm: Heightmap; state: GameState; player: Astronaut; pip: Pip; hud: Hud; dialogue: DialogueBox;
  dust: DustSystem; tracks: TrailRenderer; pipBusy: () => boolean; walkReason: () => string | null; meeting: { readonly stage: MeetStage };
}) {
  const ground: RoverGround = {
    height: (x, z) => sampleHeight(w.hm, x, z),
    slopeDeg: (x, z, yaw) => {
      const fx = Math.sin(yaw) * 1.2, fz = Math.cos(yaw) * 1.2;
      const dh = sampleHeight(w.hm, x + fx, z + fz) - sampleHeight(w.hm, x - fx, z - fz);
      return (Math.atan(Math.abs(dh) / 2.4) * 180) / Math.PI;
    },
    forbidden: roverForbidden,
  };

  const holder = new TransformNode('rover', w.scene);
  const model: LoadedModel | null = await loadModel(w.scene, 'rover');
  let wheels: TransformNode[] = [];
  let steers: TransformNode[] = [];
  if (model) {
    model.root.parent = holder;
    wheels = ['wheel_FL', 'wheel_FR', 'wheel_RL', 'wheel_RR'].map((n) => model.node(n));
    steers = ['steer_FL', 'steer_FR'].map((n) => model.node(n));
  } else {
    // Placeholder body when rover.glb cannot load.
    const body = MeshBuilder.CreateBox('roverBody', { width: 1.8, height: 0.3, depth: 3.4 }, w.scene);
    body.parent = holder;
    body.position.y = 0.7;
    const m = new PBRMaterial('roverPlaceholder', w.scene);
    m.albedoColor = new Color3(0.75, 0.76, 0.78);
    m.roughness = 0.6;
    body.material = m;
  }
  const meshes = holder.getChildMeshes(false);
  holder.setEnabled(false);

  let stage: Stage = 'stowed';
  let s: RoverState = initRover(ROVER_PARK.x, ROVER_PARK.z, 0);
  let lowerT = 0;
  let driving = false;
  let pipRiding = false;
  let spin = 0;
  let steerShown = 0;
  let drivenM = 0;
  let blockedToastT = 0;
  let sprayCarry = 0;
  const spacers = [0, 1, 2, 3].map(() => new StampSpacer(0.3));

  const place = (y?: number) => {
    holder.position.set(s.x, y ?? sampleHeight(w.hm, s.x, s.z) + s.bounceY, s.z);
    // Babylon: +rotation.x pitches the nose down, so a nose-up pitch is negative; +roll lifts the right side
    // (checked in the browser: all four wheels touch a side slope).
    holder.rotationQuaternion = Quaternion.RotationYawPitchRoll(s.yaw, -s.pitch, s.roll);
  };
  const park = (x: number, z: number, yaw: number) => {
    s = initRover(x, z, yaw);
    stage = 'parked';
    holder.setEnabled(true);
    place();
  };
  const seat = (name: 'seat_driver' | 'seat_cargo'): Seat => {
    if (model) {
      holder.computeWorldMatrix(true);
      const n = model.node(name);
      n.computeWorldMatrix(true);
      const p = n.getAbsolutePosition();
      return { x: p.x, y: p.y, z: p.z, yaw: s.yaw };
    }
    const f = name === 'seat_driver' ? -0.3 : 1.0;
    return { x: s.x - Math.sin(s.yaw) * f, y: holder.position.y + 0.85, z: s.z - Math.cos(s.yaw) * f, yaw: s.yaw };
  };
  const right = () => ({ x: Math.cos(s.yaw), z: -Math.sin(s.yaw) });
  const fwd = () => ({ x: Math.sin(s.yaw), z: Math.cos(s.yaw) });

  const releasePip = () => {
    if (!pipRiding) return;
    pipRiding = false;
    w.pip.rideAt = null;
    if (w.pip.mode === 'ride') {
      const f = fwd(), r = right();
      w.pip.root.position.x = s.x - f.x * 3 + r.x * 1.2;
      w.pip.root.position.z = s.z - f.z * 3 + r.z * 1.2;
      w.pip.mode = 'follow';
    }
  };
  const takePip = () => {
    if (pipRiding) return;
    const ok = canBoard({ distM: 0, pipMode: w.pip.mode, pipBusy: w.pipBusy() }).pip;
    if (!ok) return;
    pipRiding = true;
    w.pip.mode = 'ride';
  };
  const board = () => {
    const reason = w.walkReason();
    if (reason) { w.hud.toast(reason, 4); return; }
    driving = true;
    w.player.setRide(seat('seat_driver'));
    if (unlockCard(w.state, 'artemisLTV')) w.hud.toast(tr('New discovery in your Science Notebook (Tab)'), 3);
    takePip();
    if (!pipRiding && pipKnown(w.state.flags) && !w.pip.sleeping) w.hud.toast(tr('Pip is busy and stays behind'), 3);
    w.hud.toast(tr('W/S drive · A/D steer · E get out when stopped'), 5);
  };
  const leave = () => {
    driving = false;
    s.speed = 0;
    const r = right();
    // The driver sits on the left: step out on that side.
    w.player.setRide(null);
    w.player.teleport(s.x - r.x * 1.9, s.z - r.z * 1.9);
    releasePip();
  };

  return {
    get driving(): boolean {
      return driving;
    },
    get stage(): Stage {
      return stage;
    },
    get state(): RoverState {
      return s;
    },
    meshes,
    /** Continue from a save: the meeting already happened, so the rover waits at camp. */
    restore(at: 'hls' | 'camp') {
      if (at === 'camp') park(ROVER_PARK.x, ROVER_PARK.z, 0);
    },
    /** Puts the parked rover somewhere (demo and dev checks). */
    placeAt(x: number, z: number, yaw: number) {
      const wasDriving = driving;
      park(x, z, yaw);
      if (wasDriving) w.player.setRide(seat('seat_driver'));
    },
    /** Rescue or a story jump moves the player: get out first. */
    forceLeave() {
      if (driving) leave();
    },
    /** E prompt to climb in, offered after every other interaction (call only when the world takes input). */
    boardPrompt(): string | null {
      if (stage !== 'parked' || driving) return null;
      const d = Math.hypot(w.player.position.x - s.x, w.player.position.z - s.z);
      if (!canBoard({ distM: d, pipMode: w.pip.mode, pipBusy: w.pipBusy() }).player) return null;
      const reason = w.walkReason();
      return reason ?? tr('E — drive the rover');
    },
    board,
    update(dt: number, keyboard: { consume(code: string): boolean; moveInput(): { forward: number; right: number } }, ctx: { locked: boolean }): string | null {
      blockedToastT = Math.max(0, blockedToastT - dt);
      // Arrives after the first meeting: lowered from the lander, Pip helps; or already parked (dev jumps).
      const arrival = stage === 'stowed' ? roverArrival(w.meeting.stage, w.state.flags) : 'wait';
      if (arrival !== 'wait') {
        if (arrival === 'lower') {
          stage = 'lowering';
          lowerT = 0;
          s = initRover(DEPLOY.x, DEPLOY.z, Math.PI / 2);
          holder.setEnabled(true);
          w.hud.toast(tr('🚙 The rover is coming down from the lander…'), 5);
          if (w.pip.mode === 'follow') {
            w.pip.gotoTarget = { x: DEPLOY.x - 3, z: DEPLOY.z - 2 };
            w.pip.mode = 'goto';
          }
        } else park(ROVER_PARK.x, ROVER_PARK.z, 0);
      }
      if (stage === 'lowering') {
        lowerT += dt;
        const k = Math.min(1, lowerT / LOWER_S);
        const g = sampleHeight(w.hm, s.x, s.z);
        place(g + LOWER_FROM_M * (1 - k * k * (3 - 2 * k)));
        if (k >= 1) {
          stage = 'parked';
          setFlag(w.state, 'rover:deployed');
          w.dust.burst(new Vector3(s.x, g, s.z), 1.2);
          if (w.pip.mode === 'goto') w.pip.mode = 'follow';
          if (unlockCard(w.state, 'artemisLTV')) w.hud.toast(tr('New discovery in your Science Notebook (Tab)'), 3);
          void w.dialogue.play('rover_ready');
        }
        return null;
      }
      if (stage !== 'parked') return null;

      // Something else moved the player (rescue, story jump) or took Pip: keep the rover's view in sync.
      if (driving && !w.player.riding) {
        driving = false;
        releasePip();
      }
      if (pipRiding && w.pip.mode !== 'ride') {
        pipRiding = false;
        w.pip.rideAt = null;
      }
      // A storm, the cargo countdown, the tow or the winch needs the astronaut on foot.
      if (driving && w.walkReason()) {
        leave();
        w.hud.toast(tr('This needs you on foot: you climb out of the rover'), 4);
      }

      let thr = 0;
      let steer = 0;
      if (driving && !ctx.locked) {
        const m = keyboard.moveInput();
        thr = m.forward;
        steer = m.right;
      }
      const before = s;
      s = roverStep(s, { throttle: thr, steer }, ground, dt);
      if (driving && thr !== 0 && before.speed !== 0 && s.speed === 0 && blockedToastT === 0) {
        const f = Math.sign(before.speed) * 1.5;
        const ax = s.x + Math.sin(s.yaw) * f, az = s.z + Math.cos(s.yaw) * f;
        w.hud.toast(roverForbidden(ax, az) ? tr('The rover cannot go there') : tr('Too steep for the rover'), 3);
        blockedToastT = 3;
      }
      place();
      const moved = Math.hypot(s.x - before.x, s.z - before.z);
      drivenM += moved;
      if (drivenM >= CARD_AFTER_M && unlockCard(w.state, 'apolloLRV')) w.hud.toast(tr('New discovery in your Science Notebook (Tab)'), 3);

      // Wheels roll with the distance; the front pair steers.
      spin += (s.speed * dt) / WHEEL_R;
      steerShown += (steer * ROVER.steerRad - steerShown) * Math.min(1, dt * 8);
      for (const wh of wheels) wh.rotationQuaternion = Quaternion.RotationAxis(Vector3.Right(), spin);
      for (const st of steers) st.rotationQuaternion = Quaternion.RotationAxis(Vector3.Up(), steerShown);

      // Tracks and two dust rooster tails from the rear wheels, more the faster it goes.
      const f = fwd(), r = right();
      const wheelAt = (fo: number, ro: number) => {
        const x = s.x + f.x * fo + r.x * ro, z = s.z + f.z * fo + r.z * ro;
        return new Vector3(x, sampleHeight(w.hm, x, z), z);
      };
      const ws = [wheelAt(1.15, -1), wheelAt(1.15, 1), wheelAt(-1.15, -1), wheelAt(-1.15, 1)];
      if (Math.abs(s.speed) > 0.05) {
        ws.forEach((p, i) => {
          if (spacers[i].feed(p.x, p.z)) w.tracks.stamp(p.x, p.z, s.yaw);
        });
        // ~12 grains per metre per rear wheel, thrown back along the direction of travel.
        sprayCarry += Math.abs(s.speed) * dt * 12;
        const n = Math.floor(sprayCarry);
        sprayCarry -= n;
        const travel = s.speed >= 0 ? s.yaw : s.yaw + Math.PI;
        if (n > 0) {
          w.dust.spray(ws[2], travel, Math.abs(s.speed), n);
          w.dust.spray(ws[3], travel, Math.abs(s.speed), n);
        }
      }

      if (driving) {
        w.player.setRide(seat('seat_driver'));
        if (!pipRiding) takePip();
      }
      if (pipRiding) w.pip.rideAt = seat('seat_cargo');

      if (driving && !ctx.locked) {
        if (canLeave(s)) {
          if (keyboard.consume('KeyE')) {
            leave();
            return null;
          }
          return tr('E — get out');
        }
      }
      return null;
    },
  };
}
