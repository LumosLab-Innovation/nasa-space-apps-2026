import {
  ArcRotateCamera, Quaternion, Color3, MeshBuilder, StandardMaterial, Vector3, type Mesh, type Scene, type TransformNode,
} from '@babylonjs/core';
import { Control, Rectangle, TextBlock, type AdvancedDynamicTexture } from '@babylonjs/gui';
import { setFlag, unlockCard, type GameState } from '../core/gameState';
import { sampleHeight, type Heightmap } from '../data/heightmap';
import type { DustSystem } from '../fx/dustSystem';
import type { Pip } from '../pip/pip';
import type { Astronaut } from '../player/astronaut';
import { createDescentHud } from '../ui/descentHud';
import type { DialogueBox } from '../ui/dialogueBox';
import type { Hud } from '../ui/hud';
import type { InputLock } from '../ui/inputLock';
import { HLS_POS, PLAYER_SPAWN } from '../world/zones';
import {
  LAND, autopilot, fuelSecondsLeft, landStart, landStep, retryLand, touchdown, type LandAttempt, type Touchdown,
} from './descent';
import { tr } from '../i18n/i18n';
import { gamePauseClock } from '../core/pause';
import type { HlsRig } from '../models/hlsRig';
import { type FlightPresentation, type DescentHandoff } from './descentBridge';
import type { Disembark } from './disembark';
import type { CamPose } from './disembarkTimeline';
import type { MoveInput } from '../player/movement';
import { setLanderSite } from '../world/landerSite';
import { landingCamera } from './descentCamera';
import { FailureCameraShake } from './failureCameraShake';
import { LandingCameraShake } from './landingCameraShake';
import { reducedCameraMotion } from '../core/accessibility';
import { transferLandingState } from './coherentMotion';
import {SpacecraftExhaust} from '../fx/spacecraftExhaust';
import { FlightExplosion } from '../fx/flightExplosion';
import { createFlightFailureDialog } from '../ui/flightFailure';
import { assistedLandingInput, manualTouchdown, MANUAL_THROTTLE_RATE, FailureAttempt, type FlightFailureReason } from './assistedFlight';

export { introMode } from './introMode';

const PLUME_START_M = 20;
/**
 * Dust particles per 0.1 s under the engines: none above 20 m, more the lower and harder the burn.
 * The plume throws dust out almost flat along the ground (spec v3 §5), so it keeps going at contact.
 */
/** Skipping after CONTACT keeps the landing and its discoveries. */
export function escapeKeepsLanding(phase: 'flying' | 'contact' | 'failed' | 'done'): boolean {
  return phase === 'contact';
}

export function plumeRate(h: number, throttle: number): number {
  if (h >= PLUME_START_M || throttle <= 0) return 0;
  const near=1-Math.max(0,h)/PLUME_START_M;
  const contact=Math.max(0,Math.min(1,(10-h)/7));
  const densityBoost=1+.5*contact*contact*(3-2*contact);
  return Math.round(66*Math.min(1,throttle)*near*near*(3-2*near)*densityBoost);
}

const CARD_S = 4.5;
const STILL_MOVE: MoveInput = { forward: 0, right: 0, jump: false, lope: false };
type DescentKeys = { isHeld(code: string): boolean; consume(code: string): boolean; reset?(): void; moveInput?(): MoveInput };

export interface DescentWorld {
  scene: Scene;
  hm: Heightmap;
  ui: AdvancedDynamicTexture;
  state: GameState;
  dust: DustSystem;
  hud: Hud;
  dialogue: DialogueBox;
  lock: InputLock;
  player: Astronaut;
  pip: Pip;
  onPause?: () => void;
  onExplosion?: () => void;
}

export interface FinalDescent {
  warmExhaust():Promise<void>;
  readonly exhaustDiagnostics:SpacecraftExhaust['diagnostics'];
  readonly active: boolean;
  /** True while the elevator disembark is alive (before or after the hand-over); keep calling update. */
  readonly busy: boolean;
  /** Prompt owned by the disembark (e.g. the first-step hint); null when none. */
  readonly prompt: string | null;
  readonly cinematic: boolean;
  readonly bridgeTime: number;
  present(pose: FlightPresentation): void;
  beginBridge(handoff: DescentHandoff): void;
  resetPreparation(): void;
  clearExhaust(): void;
  setPaused(paused: boolean): void;
  /** 'flying', 'contact' (ok, card showing), 'failed' (explaining, then retry) or 'done'. */
  readonly phase: 'flying' | 'contact' | 'failed' | 'done';
  readonly state: LandAttempt['state'];
  update(dt: number, keyboard: DescentKeys): void;
  skip(): void;
}

/**
 * Interaction 2 of the landing (v2 M5–M6): fly the HLS from 300 m onto the real landing site. Space is
 * thrust, A/D tilt, H the autopilot. Bad touchdowns explain (Odysseus) and retry with full fuel.
 */
export function createFinalDescent(w: DescentWorld, hls: TransformNode, opts: { assist: boolean; rig?: HlsRig; groundY?: number; prepared?: boolean; onTouchdown?:()=>void; disembark?: (ctx: { hls: TransformNode; rig: HlsRig; from: CamPose; commit: () => void }) => Disembark }): FinalDescent {
  const groundY = opts.groundY ?? sampleHeight(w.hm, HLS_POS.x, HLS_POS.z);
  const groundTilt = hls.rotation.clone();
  opts.rig?.setTargets(0, 0, true);
  if (!opts.prepared) opts.rig?.setTargets(1, 0);
  const yaw = hls.rotation.y;
  // Drift and tilt act along the ship's own X axis.
  const side = new Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
  let attempt: LandAttempt = { state: landStart(), attempts: 0 };
  let offset = 0;
  let arrivalBase=new Vector3(HLS_POS.x,groundY,HLS_POS.z);
  let throttle = 0;
  let auto = opts.assist;
  let phase: FinalDescent['phase'] = 'flying';
  let phaseT = 0;
  let plumeAcc = 0;
  let active = true;
  let disembark: Disembark | undefined;
  const cameraShake = new LandingCameraShake();
  const failureShake = new FailureCameraShake();

  const bridgeT = 5;
  let waiting = !!opts.prepared;
  const failure = new FailureAttempt();
  let resetInput: (() => void) | undefined;
  let readyTime = 0;

  w.lock.push('landing');
  w.player.root.setEnabled(false);
  // Pip may be heading to its hiding spot for the first-meeting beat; put it back exactly as it was.
  const pipBefore = { mode: w.pip.mode, gotoTarget: w.pip.gotoTarget };
  w.pip.mode = 'wait';
  const prevCam = w.scene.activeCamera;
  const initialCamera = landingCamera(300);
  const cam = new ArcRotateCamera('descentCam', yaw + Math.PI * 0.75, initialCamera.beta, initialCamera.radius, hls.position.clone(), w.scene);
  cam.maxZ = 900000;
  cam.minZ = 0.5;
  w.scene.activeCamera = cam;

  const hud = createDescentHud(w.ui, w.dialogue);
  const exhaust=new SpacecraftExhaust(w.scene,opts.rig?.exhaustMount??hls,opts.rig?.exhaustNozzles()??[],(x,z)=>sampleHeight(w.hm,x,z));

  const explosion = new FlightExplosion(w.scene);
  const failureDialog = createFlightFailureDialog(w.ui, w.scene, automatic => {
    if (failure.choose()) retry(automatic);
  }, () => w.onPause?.());

  const card = new Rectangle('landingCard');
  card.width = card.height = 1;
  card.thickness = 0;
  card.background = 'black';
  card.alpha = 0;
  card.isVisible = false;
  card.zIndex = 100;
  const cardText = new TextBlock('landingCardText', tr('Sea of Tranquility, 1969…\n\nSouth Pole, 2028.'));
  cardText.color = 'white';
  cardText.fontSize = 34;
  cardText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
  card.addControl(cardText);
  w.ui.addControl(card);

  if (!opts.prepared) void w.dialogue.play(auto ? 'land_start_auto' : 'land_start');

  const place = () => {
    const s = attempt.state;
    const pos = new Vector3(arrivalBase.x, groundY + s.h, arrivalBase.z).add(side.scale(offset));
    hls.position.copyFrom(pos);

    hls.rotation.x = phase === 'contact' ? groundTilt.x : 0;
    hls.rotation.z = phase === 'contact' ? groundTilt.z : -((s.tiltDeg) * Math.PI) / 180;
  };

  const finish = (withCard: boolean, handOver = false) => {
    if (!active) return;
    waiting = false;hls.rotationQuaternion=null;hls.scaling.setAll(1);
    active = false;
    phase = 'done';
    // After a disembark the ship stays where it touched down; otherwise it snaps to the nominal site.
    if (handOver) setLanderSite({ x: hls.position.x, z: hls.position.z });
    else hls.position.set(HLS_POS.x, groundY, HLS_POS.z);
    hls.rotation.copyFrom(groundTilt);
    // An immediate setTargets would close the front gate the disembark just opened; the rig is already deployed.
    if (!handOver) opts.rig?.setTargets(1, 1, true);
    exhaust.dispose();
    explosion.dispose(); failureDialog.dispose();
    hud.dispose();
    // The title card fades out over the first second of Act 1.
    if (handOver) card.dispose();
    else {
      const fadeObs = w.scene.onBeforeRenderObservable.add(() => {
        if (gamePauseClock.isPaused) return;
        card.alpha -= w.scene.getEngine().getDeltaTime() / 1000;
        if (card.alpha <= 0 || !card.isVisible) {
          card.dispose();
          w.scene.onBeforeRenderObservable.remove(fadeObs);
        }
      });
      // The disembark already swapped to the player camera; only the old paths restore the previous one.
      w.scene.activeCamera = prevCam;
    }
    w.scene.physicsEnabled = !gamePauseClock.isPaused;
    if (!handOver && !gamePauseClock.isPaused) prevCam?.attachControl(w.scene.getEngine().getRenderingCanvas()!, true);
    cam.dispose();
    w.player.root.setEnabled(true);
    if (!handOver) w.player.teleport(PLAYER_SPAWN.x, PLAYER_SPAWN.z);
    w.pip.mode = pipBefore.mode; w.pip.gotoTarget = pipBefore.gotoTarget;
    w.lock.pop('landing');
    // Landed or skipped, Act 1 begins (autosave starts from here); the discoveries need a real landing.
    setFlag(w.state, 'landing:done');
    if (withCard) {
      for (const id of ['apollo11Site', 'alarm1202', 'rocketEquation']) unlockCard(w.state, id);
      // After a disembark the toast is shown by the disembark itself, after the first step.
      if (!handOver) w.hud.toast(tr('New discoveries in your Science Notebook (Tab)'), 4);
    }
  };

  const ensureDisembark = () => {
    if (disembark || !opts.rig || !opts.disembark) return;
    opts.rig.setTargets(1, 1);
    const t = cam.target;
    disembark = opts.disembark({
      hls, rig: opts.rig, from: { alpha: cam.alpha, beta: cam.beta, radius: cam.radius, target: [t.x, t.y, t.z] },
      commit: () => finish(true, true),
    });
  };
  const runDisembark = (dt: number, keyboard: DescentKeys) => {
    if (!disembark) return;
    disembark.update(dt, keyboard.moveInput?.() ?? STILL_MOVE);
    if (disembark.stage === 'done') {
      if (active) finish(true, true);
      disembark.dispose();
      disembark = undefined;
    }
  };

  const fail = (reason: FlightFailureReason) => {
    if (!failure.fail(reason)) return;
    phase = 'failed'; phaseT = 0;
    failureShake.start(cam, Vector3.Zero(), reducedCameraMotion());
    throttle = 0; exhaust.reset(); exhaust.update(0, 0, false); resetInput?.();
    w.dialogue.interrupt?.(); hud.alarm(null);
    explosion.start(hls.position.add(new Vector3(0, 25, 0)), 16, Vector3.Zero(), (x, z) => sampleHeight(w.hm, x, z));
    hls.setEnabled(false);
    w.onExplosion?.();
  };
  const retry = (automatic: boolean) => {
    resetInput?.(); failureDialog.hide(); failure.reset(); explosion.reset(); failureShake.reset();
    w.dialogue.interrupt?.(); exhaust.reset();
    attempt = retryLand(attempt); auto = automatic;
    offset = 0; phaseT = 0; plumeAcc = 0; readyTime = .5;
    arrivalBase.set(HLS_POS.x, groundY, HLS_POS.z);
    throttle = 0;
    phase = 'flying';
    hls.setEnabled(true); hls.rotationQuaternion = null; hls.scaling.setAll(1);
    opts.rig?.setTargets(1, 0, true);
    cameraShake.reset(); place();
    hud.alarm(null);
    void w.dialogue.play(auto ? 'land_start_auto' : 'land_start');
  };

  place();
  cam.target = hls.position.add(new Vector3(0, initialCamera.targetHeight, 0));
  return {
    warmExhaust:async()=>{ await Promise.all([exhaust.warm(), explosion.warm()]); },
    get exhaustDiagnostics(){return exhaust.diagnostics;},
    get cinematic() { return waiting; },
    get bridgeTime() { return bridgeT; },
    setPaused(_paused) {},
    present(data) {
      hls.position.copyFromFloats(...data.position as [number,number,number]);
      hls.rotationQuaternion=Quaternion.FromArray(data.rotation);hls.scaling.setAll(data.scale);
      opts.rig?.restoreMotion(data.rig);opts.rig?.update(0);
      cam.fov=data.fov;cam.upVector=Vector3.FromArray(data.up);
      cam.setTarget(Vector3.FromArray(data.target));cam.setPosition(Vector3.FromArray(data.camera));
      throttle=data.throttle;if(data.exhaust)exhaust.present(data.exhaust);
    },
    clearExhaust() { exhaust.reset(); exhaust.update(0, 0, false); },
    resetPreparation() {
      waiting = true; offset = phaseT = throttle = plumeAcc = 0;
      failure.reset(); failureDialog.hide(); explosion.reset(); failureShake.reset(); exhaust.reset(); exhaust.update(0, 0, false);
      attempt = { state: landStart(), attempts: 0 };
      arrivalBase.set(HLS_POS.x, groundY, HLS_POS.z);
      phase = 'flying'; hls.setEnabled(true); hls.rotationQuaternion = null; hls.scaling.setAll(1);
      opts.rig?.setTargets(0, 0, true); place();
      cam.upVector = Vector3.Up();
      cam.target = hls.position.add(new Vector3(0, initialCamera.targetHeight, 0));
      cam.alpha = yaw + Math.PI * .75; cam.beta = initialCamera.beta; cam.radius = initialCamera.radius;
    },
    beginBridge(data) {
      this.present(data.presentation);
      auto = data.assist ?? opts.assist;
      waiting=false;phaseT=0;offset=0;
      cameraShake.reset();
      const p=data.presentation;
      const axis=Vector3.Up().applyRotationQuaternion(Quaternion.FromArray(p.rotation));
      const pitch=Math.atan2(-Vector3.Dot(axis,side),axis.y);
      arrivalBase.set(p.position[0],groundY,p.position[2]);
      attempt.state=transferLandingState({h:p.position[1]-groundY,vy:p.vy,vx:p.vx,pitch});
      hls.rotationQuaternion=null;hls.rotation.set(0,yaw,pitch);hls.scaling.setAll(1);
      hud.showLand({...attempt.state,fuelMaxKg:LAND.fuelKg,throttle,autopilot:auto});
      void w.dialogue.play(auto?'land_start_auto':'land_start');
    },
    get active() {
      return active;
    },
    get busy() {
      return disembark !== undefined;
    },
    get prompt() {
      return disembark?.prompt ?? null;
    },
    get phase() {
      return phase;
    },
    get state() {
      return attempt.state;
    },
    update(dt, keyboard) {
      if (!active && disembark) { if (!gamePauseClock.isPaused) runDisembark(dt, keyboard); return; }
      if (!active || waiting) return;
      if (gamePauseClock.isPaused) return;
      resetInput = () => keyboard.reset?.();
      if (phase === 'failed') {
        failure.update(dt); explosion.update(dt); failureShake.update(dt);
        if (failure.canChoose && !failureDialog.visible) {
          resetInput(); failureDialog.show(failure.reason!);
        }
        return;
      }
      if (readyTime > 0) { readyTime -= dt; resetInput(); dt = 0; }
      phaseT += dt;
      const s = attempt.state;
      if (phase === 'flying') {
        if (keyboard.consume('KeyH')) auto = !auto;
        let input: { throttle: number; tiltInput: number };
        if (auto) {
          input = autopilot({...s,h:Math.max(0,groundY+s.h-sampleHeight(w.hm,hls.position.x,hls.position.z))});
          throttle = s.fuelKg > 0 ? throttle + Math.max(-MANUAL_THROTTLE_RATE * dt, Math.min(MANUAL_THROTTLE_RATE * dt, input.throttle - throttle)) : 0;
          input.throttle = throttle;
        } else {
          const steering = (keyboard.isHeld('KeyD') ? 1 : 0) - (keyboard.isHeld('KeyA') ? 1 : 0);
          const assisted = assistedLandingInput({...s, h: Math.max(0, groundY+s.h-sampleHeight(w.hm,hls.position.x,hls.position.z))}, keyboard.isHeld('Space'), steering);
          throttle = s.fuelKg > 0 ? throttle + Math.max(-MANUAL_THROTTLE_RATE * dt, Math.min(MANUAL_THROTTLE_RATE * dt, assisted.throttle - throttle)) : 0;
          input = { ...assisted, throttle };
        }
        const n = landStep(s, input, dt);
        if (n.fuelKg <= 0) { throttle = 0; input.throttle = 0; exhaust.reset(); }
        offset += (s.vx+n.vx)*.5*dt;
        attempt = { ...attempt, state: n };
        place();
        // Do not freeze horizontal motion at the old 30 m clamp. Leaving the playable map fails/retries.
        if(Math.abs(hls.position.x)>700||Math.abs(hls.position.z)>700){throttle=0;fail('outside');return;}
        const floor=sampleHeight(w.hm,hls.position.x,hls.position.z);
        const footFloor=opts.rig?.contactHeight((x,z)=>sampleHeight(w.hm,x,z)) ?? floor;
        const clearance=groundY+n.h-footFloor;
        const result = (auto ? touchdown : manualTouchdown)({...n,h:clearance});
        if (result) {
          if(result==='ok')exhaust.update(0,throttle,false,true);
          attempt = { ...attempt, state: { ...n, h: footFloor-groundY } };
          throttle = 0;
          if (result === 'ok') {
            phase = 'contact';
            phaseT = 0;
            opts.onTouchdown?.();
            void w.dialogue.play('land_ok');
          } else { fail(result === 'tipped' ? 'tipped' : 'impact'); return; }
        }
        // Low dust clumps strengthen below 20 m, especially during the final five metres.
        const rate = plumeRate(Math.max(0,clearance), input.throttle);
        plumeAcc += dt;
        if (plumeAcc >= 0.1) {
          plumeAcc = 0;
          if (rate > 0) w.dust.plume(new Vector3(hls.position.x, floor, hls.position.z), 18 + 10 * input.throttle, rate);
        }
        hud.showLand({ ...n, h: Math.max(0, n.h+sampleHeight(w.hm,HLS_POS.x,HLS_POS.z)-floor), fuelMaxKg: LAND.fuelKg, throttle: input.throttle, autopilot: auto });
      } else if (phase === 'contact') {
        // M6: like Apollo, the fuel left is read out as seconds of hover.
        hud.alarm(phaseT < 3 ? tr('CONTACT LIGHT · ENGINE STOP\nFUEL LEFT: {s} s of hover', { s: Math.round(fuelSecondsLeft(attempt.state.fuelKg)) }) : null);
        plumeAcc+=dt;if(plumeAcc>=.1){plumeAcc=0;const rate=plumeRate(0,exhaust.state.power);if(rate)w.dust.plume(new Vector3(hls.position.x,sampleHeight(w.hm,hls.position.x,hls.position.z),hls.position.z),18+10*exhaust.state.power,rate);}
        // Show the full mechanical deployment before fading to exploration.
        if (phaseT >= 1) { opts.rig?.setTargets(1, 1); ensureDisembark(); }
        const ready = !opts.rig || opts.rig.elevatorDeployed;
        const cardAt = opts.rig ? 14 : 3;
        if (!disembark && ready && phaseT > cardAt) {
          card.isVisible = true;
          card.alpha = Math.min(1, phaseT - cardAt);
        }
        if (!disembark && ready && phaseT >= cardAt + CARD_S) finish(true);

      }
      if (!active) return;
      // Keep the earlier close landing composition; the bridge shares its endpoint and velocity.
      place();
      exhaust.update(dt,phase==='flying'?throttle:0,phase==='flying',phase==='contact');
      if (disembark) { runDisembark(dt, keyboard); return; }
      const framing = landingCamera(attempt.state.h);
      const alpha=yaw+Math.PI*.75;
      const clearance=Math.max(0,hls.position.y-sampleHeight(w.hm,hls.position.x,hls.position.z));
      const shake=reducedCameraMotion()?{x:0,y:0}:cameraShake.step(dt,clearance,throttle,phase==='contact');
      const target=hls.position.add(new Vector3(0,framing.targetHeight,0));
      // Translate camera and target together in the view plane. Rebuild from the
      // unshaken target every frame so no drift, orbit rotation or zoom accumulates.
      target.x+=Math.sin(alpha)*shake.x-Math.cos(alpha)*Math.cos(framing.beta)*shake.y;
      target.y+=Math.sin(framing.beta)*shake.y;
      target.z-=Math.cos(alpha)*shake.x+Math.sin(alpha)*Math.cos(framing.beta)*shake.y;
      cam.target = target;
      // ArcRotateCamera's target setter recomputes angles from the previous camera position.
      // Restore the chase orientation so falling targets do not progressively tilt the shot.
      cam.alpha = alpha;
      cam.beta = framing.beta;
      cam.radius = framing.radius;
    },
    skip() {
      if (disembark) { if (active) disembark.skip(); return; }
      if (phase === 'contact' && opts.rig && opts.disembark) { ensureDisembark(); (disembark as Disembark | undefined)?.skip(); return; }
      if (phase !== 'failed') finish(escapeKeepsLanding(phase));
    },
  };
}
