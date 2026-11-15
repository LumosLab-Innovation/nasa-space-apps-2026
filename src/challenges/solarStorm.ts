import { Color3, Mesh, MeshBuilder, PBRMaterial, Scene } from '@babylonjs/core';
import { STORM } from '../config/constants';
import { setFlag, unlockCard, type GameState } from '../core/gameState';
import { stormBlurb, type StormEvent } from '../data/donki';
import { sampleHeight, type Heightmap } from '../data/heightmap';
import type { Pip } from '../pip/pip';
import type { Astronaut } from '../player/astronaut';
import type { RescueKind } from '../survival/survivalSystem';
import type { DialogueBox } from '../ui/dialogueBox';
import type { Hud } from '../ui/hud';
import type { Sky } from '../world/sky';
import { HLS_POS, SHELTER_POS } from '../world/zones';
import { tr } from '../i18n/i18n';

/**
 * Act 4 radiation storm (v2 scene 4.2), based on a real DONKI solar energetic particle event.
 * Physics: storm protons arrive from almost every direction, so a boulder's shadow does not protect you;
 * a thick cover of regolith (the camp shelter) or the lander's hull does.
 */
export type StormPhase = 'idle' | 'warning' | 'storm' | 'clear';

export { STORM } from '../config/constants';
/** Keep the astronaut's head below the dome, including while jumping. */
const SHELTER_RADIUS_M = 2;
const DOME_HEIGHT_M = 4.2;
/** Right next to the lander's hull (9 m wide): its tanks and structure stop the protons. */
const LANDER_RADIUS_M = 6;
const START_DELAY_S = 15;

/** Leaving cover during the storm for this long counts as exposure (once per storm). */
export const STORM_OUTSIDE_S = 5;

/**
 * One storm step. `outS` is how long the player has been outside cover during the storm; `wasExposed` is
 * true once an exposure (and its rescue) already happened, so it never repeats.
 */
export function stormStep(
  phase: StormPhase, t: number, ev: 'start' | 'tick', sheltered: boolean, dt: number, outS = 0, wasExposed = false,
): { phase: StormPhase; t: number; exposed: boolean; outS: number } {
  if (ev === 'start') return phase === 'idle' ? { phase: 'warning', t: STORM.warningS, exposed: false, outS: 0 } : { phase, t, exposed: false, outS };
  if (phase === 'warning') {
    const left = t - dt;
    if (left > 0) return { phase, t: left, exposed: false, outS: 0 };
    return { phase: 'storm', t: STORM.stormS, exposed: !sheltered && !wasExposed, outS: 0 };
  }
  if (phase === 'storm') {
    const left = t - dt;
    if (left <= 0) return { phase: 'clear', t: 0, exposed: false, outS: 0 };
    const out = sheltered ? 0 : outS + dt;
    if (out >= STORM_OUTSIDE_S && !wasExposed) return { phase, t: left, exposed: true, outS: 0 };
    return { phase, t: left, exposed: false, outS: out };
  }
  return { phase, t, exposed: false, outS: 0 };
}

export function isSheltered(p: { x: number; z: number; y?: number }, groundY = 0): boolean {
  const radius = Math.hypot(p.x - SHELTER_POS.x, p.z - SHELTER_POS.z);
  const ceiling = groundY - 0.1 + DOME_HEIGHT_M * Math.sqrt(Math.max(0, 1 - radius ** 2 / 9));
  const head = (p.y ?? groundY + 1.2) + 1;
  return (
    (radius <= SHELTER_RADIUS_M && head <= ceiling && (p.y ?? groundY) >= groundY - 0.3) ||
    Math.hypot(p.x - HLS_POS.x, p.z - HLS_POS.z) <= LANDER_RADIUS_M
  );
}

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/** The regolith shelter at camp: a low dome of packed soil with a dark doorway (it exists from the start). */
function buildShelter(scene: Scene, hm: Heightmap, sky: Sky): Mesh {
  const y = sampleHeight(hm, SHELTER_POS.x, SHELTER_POS.z);
  const dome = MeshBuilder.CreateSphere('stormShelter', { diameter: 6, segments: 20, slice: 0.5 }, scene);
  dome.scaling.y = DOME_HEIGHT_M / 3;
  dome.position.set(SHELTER_POS.x, y - 0.1, SHELTER_POS.z);
  const m = new PBRMaterial('shelterMat', scene);
  m.albedoColor = new Color3(0.42, 0.41, 0.39);
  m.roughness = 1;
  m.metallic = 0;
  m.backFaceCulling = false; // seen from inside too
  dome.material = m;
  const door = MeshBuilder.CreateBox('shelterDoor', { width: 1.8, height: 2.6, depth: 0.6 }, scene);
  door.position.set(SHELTER_POS.x, y + 1.3, SHELTER_POS.z + 2.85);
  const dm = new PBRMaterial('shelterDoorMat', scene);
  dm.albedoColor = new Color3(0.03, 0.03, 0.035);
  dm.roughness = 1;
  door.material = dm;
  sky.shadows.addShadowCaster(dome);
  return dome;
}

export function createSolarStorm(
  scene: Scene, hm: Heightmap, sky: Sky, state: GameState, hud: Hud, dialogue: DialogueBox, pip: Pip,
  survival: { rescue(kind: RescueKind, to?: { x: number; z: number }): void },
  stormEvent: () => StormEvent | null,
  micaInCamp: () => boolean = () => false,
): { start(): void; restore(): void; update(dt: number, player: Astronaut): string | null; readonly phase: StormPhase; readonly leftS: number } {
  const dome = buildShelter(scene, hm, sky);
  let phase: StormPhase = 'idle';
  let t = 0;
  let delay = -1;
  let explained = false;
  let outS = 0;

  return {
    get phase() {
      return phase;
    },
    /** Seconds left in the current warning or storm (the music reads this). */
    get leftS() {
      return t;
    },
    start() {
      if (phase === 'idle' && delay < 0) delay = START_DELAY_S;
    },
    /** Continue from a save: a storm that already passed does not come back. */
    restore() {
      if (state.flags.has('storm:sheltered') || state.flags.has('storm:rescued')) phase = 'clear';
    },
    update(dt, player) {
      // Cut away the roof nearby so the third-person camera can show the astronaut and repair spots.
      dome.visibility = Math.hypot(player.position.x - SHELTER_POS.x, player.position.z - SHELTER_POS.z) < 5 ? 0.25 : 1;
      if (delay >= 0) {
        delay -= dt;
        if (delay < 0) {
          ({ phase, t } = stormStep(phase, t, 'start', false, 0));
          pip.setFace('scared');
          void dialogue.play('storm_warning');
          hud.toast(stormBlurb(stormEvent()), 8);
          if (unlockCard(state, 'lunarRadiation')) hud.toast(tr('New discovery in your Science Notebook (Tab)'), 3);
        }
        return null;
      }
      if (phase === 'idle' || phase === 'clear') return null;
      const safe = isSheltered(player.position, sampleHeight(hm, SHELTER_POS.x, SHELTER_POS.z));
      if (safe && !explained) {
        explained = true;
        void dialogue.play('storm_shelter');
        if (unlockCard(state, 'regolithShield')) hud.toast(tr('New discovery in your Science Notebook (Tab)'), 3);
      }
      const before = phase;
      const r = stormStep(phase, t, 'tick', safe, dt, outS, state.flags.has('storm:rescued'));
      phase = r.phase;
      t = r.t;
      outS = r.outS;
      if (r.exposed) {
        setFlag(state, 'storm:rescued');
        survival.rescue('storm', { x: SHELTER_POS.x, z: SHELTER_POS.z });
      }
      if (before === 'storm' && phase === 'clear') {
        if (!state.flags.has('storm:rescued')) setFlag(state, 'storm:sheltered');
        pip.setFace('happy');
        void dialogue.play(micaInCamp() ? 'storm_clear_camp' : 'storm_clear');
        return null;
      }
      if (phase === 'warning') {
        return safe
          ? tr('RADIATION STORM in {t} — you are under the regolith: stay here', { t: mmss(t) })
          : tr("RADIATION STORM in {t} — get inside the regolith shelter at camp, or press against the lander's hull", { t: mmss(t) });
      }
      return safe
        ? tr('Storm passing ({t}) · dose meter: low, the soil overhead is stopping the protons', { t: mmss(t) })
        : tr('Storm passing ({t}) · dose meter: HIGH', { t: mmss(t) });
    },
  };
}
