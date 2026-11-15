import { Color3, Mesh, MeshBuilder, PBRMaterial, Scene, TransformNode } from '@babylonjs/core';
import { setFlag, unlockCard, type GameState } from '../core/gameState';
import { sampleHeight, type Heightmap } from '../data/heightmap';
import { loadModel } from '../models/loadModel';
import { addCasters } from '../models/optimize';
import type { Astronaut } from '../player/astronaut';
import type { Keyboard } from '../player/keyboard';
import type { DialogueBox } from '../ui/dialogueBox';
import type { Hud } from '../ui/hud';
import type { Sky } from '../world/sky';
import { FLAG_SPOT } from '../world/zones';
import { tr } from '../i18n/i18n';

const REACH_M = 2.5;
const RISE_S = 1.5;
const POLE_M = 2.4;

/** Pure rule: the flag goes up once (flag `flag:planted`). */
export function tryPlant(state: GameState): boolean {
  return setFlag(state, 'flag:planted');
}

/** Artemis IV flag next to the lander (spec v3 §6): a continuation of 1969, at the south pole. */
export function createFlagPlant(
  scene: Scene, hm: Heightmap, sky: Sky, state: GameState, dialogue: DialogueBox, hud: Hud,
): { restore(): void; update(dt: number, player: Astronaut, keyboard: Keyboard): string | null } {
  const groundY = sampleHeight(hm, FLAG_SPOT.x, FLAG_SPOT.z);

  const root = new TransformNode('artemisFlag', scene);
  root.position.set(FLAG_SPOT.x, groundY - POLE_M, FLAG_SPOT.z);
  root.rotation.y = 0.6;
  root.setEnabled(false);
  let rising = -1;

  const dress = async () => {
    const model = await loadModel(scene, 'flag');
    if (model) {
      model.root.parent = root;
      addCasters(sky.shadows, model.meshes, 0.05);
      return;
    }
    const pole = MeshBuilder.CreateCylinder('flagPole', { diameter: 0.04, height: POLE_M }, scene);
    pole.position.y = POLE_M / 2;
    const cloth: Mesh = MeshBuilder.CreateBox('flagCloth', { width: 0.9, height: 0.6, depth: 0.01 }, scene);
    cloth.position.set(0.48, POLE_M - 0.35, 0);
    const red = new PBRMaterial('flagRed', scene);
    red.albedoColor = new Color3(0.7, 0.1, 0.12);
    cloth.material = red;
    for (const m of [pole, cloth]) {
      m.parent = root;
      sky.shadows.addShadowCaster(m);
    }
  };

  return {
    /** Continue from a save: the flag stands where it was planted. */
    restore() {
      if (!state.flags.has('flag:planted')) return;
      root.position.y = groundY;
      root.setEnabled(true);
      void dress();
    },
    update(dt, player, keyboard) {
      if (rising >= 0) {
        rising = Math.min(RISE_S, rising + dt);
        const k = rising / RISE_S;
        root.position.y = groundY - POLE_M * (1 - k * (2 - k)); // ease-out rise
        if (rising >= RISE_S) rising = -2;
      }
      if (state.flags.has('flag:planted')) return null;
      if (Math.hypot(player.position.x - FLAG_SPOT.x, player.position.z - FLAG_SPOT.z) > REACH_M) return null;
      if (keyboard.consume('KeyE') && tryPlant(state)) {
        root.setEnabled(true);
        void dress();
        rising = 0;
        void dialogue.play('flag_plant');
        if (unlockCard(state, 'apolloFlags')) hud.toast(tr('New discovery in your Science Notebook (Tab)'), 3);
        return null;
      }
      return tr('E — plant the Artemis IV flag');
    },
  };
}
