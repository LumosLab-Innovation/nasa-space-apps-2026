import { Color3, MeshBuilder, PBRMaterial, Scene, TransformNode } from '@babylonjs/core';
import { setFlag, unlockCard, type GameState } from '../core/gameState';
import { sampleAt, type Ephemeris } from '../data/ephemeris';
import { sampleHeight, type Heightmap } from '../data/heightmap';
import type { GameClock } from '../core/clock';
import { loadModel } from '../models/loadModel';
import { addCasters } from '../models/optimize';
import type { Pip } from '../pip/pip';
import type { Astronaut } from '../player/astronaut';
import type { Keyboard } from '../player/keyboard';
import type { DialogueBox } from '../ui/dialogueBox';
import type { Hud } from '../ui/hud';
import { earthVisible } from '../world/lighting';
import type { Sky } from '../world/sky';
import { RELAY_SPOT } from '../world/zones';
import { tr } from '../i18n/i18n';

export type RelayState = 'packed' | 'deployed' | 'aligned';
export type RelayReason = 'ok' | 'noEarth' | 'needPip' | 'nothing';

const REACH_M = 3;
const PIP_NEAR_M = 4;

/** Pure rule for the Earth View Peak relay (spec v3 §7, stop 6). */
export function relayStep(state: RelayState, action: 'deploy' | 'align', earthUp: boolean, pipNear: boolean): { next: RelayState; reason: RelayReason } {
  if (action === 'deploy' && state === 'packed') return earthUp ? { next: 'deployed', reason: 'ok' } : { next: 'packed', reason: 'noEarth' };
  if (action === 'align' && state === 'deployed') return pipNear ? { next: 'aligned', reason: 'ok' } : { next: 'deployed', reason: 'needPip' };
  return { next: state, reason: 'nothing' };
}

/** What the relay offers while packed: E to deploy, or why it cannot be deployed yet. */
export function relayPrompt(state: RelayState, earthUp: boolean): string | null {
  if (state !== 'packed') return null;
  return earthUp ? tr('E — deploy the comms relay') : tr('Earth is below the horizon from here right now: wait for it to rise');
}

/** Relay kit on the peak: deploy it (E) while Earth is in view, then have Pip align the dish (Q). */
export function createEarthRelay(
  scene: Scene, hm: Heightmap, sky: Sky, state: GameState, dialogue: DialogueBox, hud: Hud, pip: Pip, eph: Ephemeris, clock: GameClock,
): { restore(): void; update(player: Astronaut, keyboard: Keyboard): string | null } {
  let rs: RelayState = 'packed';
  const groundY = sampleHeight(hm, RELAY_SPOT.x, RELAY_SPOT.z);
  const kit = MeshBuilder.CreateBox('relayKit', { width: 0.8, height: 0.5, depth: 0.6 }, scene);
  const km = new PBRMaterial('relayKitMat', scene);
  km.albedoColor = new Color3(0.9, 0.9, 0.88);
  km.roughness = 0.5;
  kit.material = km;
  kit.position.set(RELAY_SPOT.x, groundY + 0.25, RELAY_SPOT.z);
  sky.shadows.addShadowCaster(kit);
  const root = new TransformNode('relay', scene);
  root.position.set(RELAY_SPOT.x, groundY, RELAY_SPOT.z);

  // Ray-marched at most once per simulated hour.
  let earthHour = -1;
  let earthCached = true;
  const earthUp = () => {
    const h = Math.floor(clock.nowMs / 3600_000);
    if (h !== earthHour) {
      earthHour = h;
      earthCached = earthVisible(hm, RELAY_SPOT.x, RELAY_SPOT.z, sampleAt(eph.earth, clock.nowMs));
    }
    return earthCached;
  };
  let toldNoEarth = false;
  const pipNear = () => Math.hypot(pip.position.x - RELAY_SPOT.x, pip.position.z - RELAY_SPOT.z) <= PIP_NEAR_M;

  const prev = pip.onCommand;
  pip.onCommand = (c) => {
    prev(c);
    if (c !== 'align' || rs !== 'deployed') return;
    const r = relayStep(rs, 'align', earthUp(), pipNear());
    rs = r.next;
    if (r.reason === 'needPip') hud.toast(tr('Pip needs to be right next to the dish to align it.'), 4);
    if (rs === 'aligned') {
      setFlag(state, 'relay:aligned');
      void dialogue.play('relay_align');
      hud.toast(tr('Relay aligned: Map unlocked (M) · Pip LIDAR range 150 m'), 6);
      if (unlockCard(state, 'earthVisibility')) hud.toast(tr('New discovery in your Science Notebook (Tab)'), 3);
    }
  };

  return {
    /** Continue from a save: the dish is up and aligned. */
    restore() {
      if (!state.flags.has('relay:aligned') || rs === 'aligned') return;
      rs = 'aligned';
      kit.dispose();
      void loadModel(scene, 'relay').then((m) => {
        if (!m) return;
        m.root.parent = root;
        addCasters(sky.shadows, m.meshes, 0.05);
      });
    },
    update(player, keyboard) {
      const d = Math.hypot(player.position.x - RELAY_SPOT.x, player.position.z - RELAY_SPOT.z);
      if (rs === 'aligned' || d > REACH_M + 3) {
        if (pip.contextCommand === 'align') pip.contextCommand = null;
        return null;
      }
      if (rs === 'packed') {
        if (d > REACH_M) return null;
        const up = earthUp();
        if (!up) {
          if (!toldNoEarth) {
            toldNoEarth = true;
            void dialogue.play('relay_noEarth');
          }
          return relayPrompt(rs, false);
        }
        if (keyboard.consume('KeyE')) {
          const r = relayStep(rs, 'deploy', up, pipNear());
          rs = r.next;
          kit.dispose();
          void loadModel(scene, 'relay').then((m) => {
            if (!m) return;
            m.root.parent = root;
            addCasters(sky.shadows, m.meshes, 0.05);
          });
          void dialogue.play('relay_deploy');
        }
        return relayPrompt(rs, true);
      }
      pip.contextCommand = 'align';
      return tr('Q — "Pip, align the dish with Earth!"');
    },
  };
}
