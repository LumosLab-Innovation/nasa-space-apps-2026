import { Color3, MeshBuilder, PBRMaterial, Scene, StandardMaterial } from '@babylonjs/core';
import { addSample, setFlag, unlockCard, type GameState } from '../core/gameState';
import { sampleHeight, type Heightmap } from '../data/heightmap';
import type { Pip } from '../pip/pip';
import type { Upgrades } from '../pip/upgrades';
import type { Astronaut } from '../player/astronaut';
import type { Keyboard } from '../player/keyboard';
import type { DialogueBox } from '../ui/dialogueBox';
import type { Hud } from '../ui/hud';
import { ICE_SPOT, zone } from '../world/zones';
import { pipComeHint } from '../pip/qCommand';
import { tr } from '../i18n/i18n';

/** Ice can be sampled only in Pip's light, with Pip and the player both right there (spec v3 §7, stop 8). */
export function iceCollectable(pipLampOn: boolean, pipDistM: number, playerDistM: number): boolean {
  return pipLampOn && pipDistM <= 8 && playerDistM <= 2.5;
}

/** Which line fits: ice found with/without MICA awake; MICA waking with/without the ice already in hand. */
export function iceLines(moment: 'found' | 'micaWakes', other: boolean): string {
  if (moment === 'found') return other ? 'ice_found' : 'ice_found_alone';
  return other ? 'mica_ice_done' : 'mica_ice';
}

/**
 * Dark Crater: never sunlit in 2028, about −230 °C. Pip lights the way; once MICA is awake it radios the
 * spot where it found the hydrogen signal, and the player samples the icy regolith.
 */
export function createDarkCrater(
  scene: Scene, hm: Heightmap, state: GameState, dialogue: DialogueBox, hud: Hud, pip: Pip, upgrades: () => Upgrades,
): { restore(): void; update(player: Astronaut, keyboard: Keyboard): string | null } {
  const groundY = sampleHeight(hm, ICE_SPOT.x, ICE_SPOT.z);
  const ice = MeshBuilder.CreatePolyhedron('iceRegolith', { type: 2, size: 0.18 }, scene);
  const im = new PBRMaterial('iceMat', scene);
  im.albedoColor = new Color3(0.78, 0.84, 0.9);
  im.roughness = 0.25;
  im.metallic = 0.1;
  ice.material = im;
  ice.position.set(ICE_SPOT.x, groundY + 0.12, ICE_SPOT.z);

  // MICA's waypoint, shown after it wakes: a thin orange beam visible from far away.
  const beacon = MeshBuilder.CreateCylinder('iceBeacon', { diameter: 0.15, height: 40, tessellation: 8 }, scene);
  const bm = new StandardMaterial('iceBeaconMat', scene);
  bm.emissiveColor = new Color3(1, 0.55, 0.15);
  bm.disableLighting = true;
  bm.alpha = 0.6;
  beacon.material = bm;
  beacon.position.set(ICE_SPOT.x, groundY + 20, ICE_SPOT.z);
  beacon.isVisible = false;
  beacon.isPickable = false;

  let inside = false;
  let micaToldUs = false;
  let announcedHeater: boolean | null = null;
  let litByUs = false;

  return {
    /** Continue from a save: the ice already sampled is gone. */
    restore() {
      // MICA already radioed the ice beacon before the save.
      micaToldUs = state.flags.has('act4:memory');
      if (micaToldUs && !state.samples.has('iceRegolith')) beacon.isVisible = true;
      if (!state.samples.has('iceRegolith')) return;
      ice.setEnabled(false);
      beacon.isVisible = false;
    },
    update(player, keyboard) {
      // MICA radios the spot once its memory is restored (Plan 4: the photo puzzle unlocks the log).
      if (!micaToldUs && state.flags.has('act4:memory')) {
        micaToldUs = true;
        beacon.isVisible = !state.samples.has('iceRegolith');
        void dialogue.play(iceLines('micaWakes', state.samples.has('iceRegolith')));
      }
      const d = zone('darkCrater');
      const now = Math.hypot(player.position.x - d.x, player.position.z - d.z) <= d.radius;
      if (now && !inside) {
        pip.setFace('scared');
        if (!pip.lampOn) {
          pip.command('light');
          litByUs = true;
        }
        // Speak on the first entry, and again only if the heater situation changed since.
        const heater = upgrades().heater;
        if (announcedHeater !== heater) {
          announcedHeater = heater;
          void dialogue.play(heater ? 'dark_enter' : 'dark_noHeater');
        }
      } else if (!now && inside && litByUs) {
        if (pip.lampOn) pip.command('light'); // back in the light: save Pip's battery
        litByUs = false;
      }
      inside = now;
      if (state.samples.has('iceRegolith')) return null;

      const playerDist = Math.hypot(player.position.x - ICE_SPOT.x, player.position.z - ICE_SPOT.z);
      if (playerDist > 2.5) return null;
      const pipDist = Math.hypot(pip.position.x - ICE_SPOT.x, pip.position.z - ICE_SPOT.z);
      if (!iceCollectable(pip.lampOn, pipDist, playerDist)) {
        // Pip parked at camp (e.g. after the sunrise notch): say how to call it, not "wait" (final review, Plan 4).
        const come = pipComeHint(pip.mode, pipDist, 8);
        if (come) return come;
        if (!pip.lampOn) pip.contextCommand = 'light';
        return pip.lampOn ? tr('Wait for Pip: you need its light to see the ice') : tr('Q — "Pip, light!"');
      }
      if (keyboard.consume('KeyE')) {
        const started = player.beginInteraction({
          kind: 'sample', id: 'iceRegolith', target: ice.position,
          valid: () => !state.samples.has('iceRegolith') && iceCollectable(pip.lampOn, Math.hypot(pip.position.x - ICE_SPOT.x, pip.position.z - ICE_SPOT.z), Math.hypot(player.position.x - ICE_SPOT.x, player.position.z - ICE_SPOT.z)),
          onAcquire: () => ice.setEnabled(false),
          onCancel: () => { if (!ice.isDisposed() && !state.samples.has('iceRegolith')) ice.setEnabled(true); },
          onCommit: () => {
            if (!addSample(state, 'iceRegolith')) return;
            setFlag(state, 'act4:ice');
            ice.setEnabled(false);
            beacon.isVisible = false;
            pip.setFace('excited');
            void dialogue.play(iceLines('found', state.flags.has('act4:micaAwake')));
            if (unlockCard(state, 'lcrossIce')) hud.toast(tr('New discovery in your Science Notebook (Tab)'), 3);
          },
        });
        return started ? null : tr('Move closer and stand still to reach the sample');
      }
      return tr('E — sample the icy regolith');
    },
  };
}
