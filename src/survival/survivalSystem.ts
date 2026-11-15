import type { GameState } from '../core/gameState';
import type { Heightmap } from '../data/heightmap';
import type { Pip } from '../pip/pip';
import type { Astronaut } from '../player/astronaut';
import type { DialogueBox } from '../ui/dialogueBox';
import { createResourceHud } from '../ui/resourceHud';
import { shouldStepSurvival } from '../ui/inputLock';
import type { Hud } from '../ui/hud';
import { SunlightCache } from '../world/lighting';
import type { Sky } from '../world/sky';
import { HLS_POS, zone } from '../world/zones';
import { applyRescue, needsRescue, panelFactor, stepResources, type Env, type Resources, type Upg } from './resources';

export type RescueKind = 'o2' | 'heat' | 'pip' | 'storm';

const FADE_S = 1.5;
const LANDER_AIR_M = 30;

/** Ties the pure resource rules to the world: real sunlight, the Dark Crater, camp, Pip (spec v3 §7.3). */
export class SurvivalSystem {
  resources: Resources = { o2: 100, heat: 100, pip: 100 };
  private readonly sun: SunlightCache;
  private readonly hudBars;
  private rescuing = 0;
  private rescueKind: RescueKind | null = null;
  private rescueTo: { x: number; z: number } | null = null;
  lastEnv: Env | null = null;
  /** Systems that must reset a half-done challenge when the player is rescued (winch, tow). */
  readonly onRescue: (() => void)[] = [];
  /** True while a story panel is open: no drain, no rescue (Plan 4). */
  paused = false;

  /** True during the rescue fade (the scene locks input meanwhile). */
  get fading(): boolean {
    return this.rescuing > 0;
  }

  constructor(
    hm: Heightmap,
    private readonly state: GameState,
    private readonly sky: Sky,
    private readonly pip: Pip,
    private readonly dialogue: DialogueBox,
    hud: Hud,
    private readonly upgrades: () => Upg,
    private readonly pipDust: () => number,
  ) {
    this.sun = new SunlightCache(hm);
    this.hudBars = createResourceHud(hud.ui);
  }

  private get sunAzEl(): { az: number; el: number } {
    const d = this.sky.sunDir;
    return { az: (Math.atan2(d.x, d.z) * 180) / Math.PI, el: this.sky.sunElevDeg };
  }

  /** Sky.sunDir is a unit vector toward the Sun (azimuth 0 = +z), so its azimuth is atan2(x, z). */
  env(player: Astronaut): Env {
    const p = player.position;
    const q = this.pip.position;
    const sun = this.sunAzEl;
    const dark = zone('darkCrater');
    const base = zone('base');
    const atCamp =
      Math.hypot(p.x - HLS_POS.x, p.z - HLS_POS.z) <= LANDER_AIR_M ||
      (this.state.modules.has('habitat') && Math.hypot(p.x - base.x, p.z - base.z) <= base.radius);
    return {
      playerInSun: this.sun.isSunlit(p.x, p.z, sun),
      inDarkCrater: Math.hypot(p.x - dark.x, p.z - dark.z) <= dark.radius,
      nearPip: Math.hypot(p.x - q.x, p.z - q.z) <= 6,
      atCamp,
      pipInSun: this.sun.isSunlit(q.x, q.z, sun),
      pipMoving: this.pip.moving,
      pipLamp: this.pip.lampOn,
      pipPanelFactor: panelFactor(this.pip.heading, sun.az),
      pipDust: this.pipDust(),
    };
  }

  /** Starts the fade-and-bring-home rescue for a reason other than an empty resource (e.g. a radiation storm). */
  rescue(kind: RescueKind, to?: { x: number; z: number }): void {
    if (this.rescuing > 0) return;
    this.rescueKind = kind;
    this.rescueTo = to ?? null;
    this.rescuing = FADE_S;
  }

  setHudVisible(visible: boolean): void { this.hudBars.setVisible(visible); }

  update(dt: number, player: Astronaut, showResources = true): void {
    this.hudBars.setVisible(showResources);
    if (this.rescuing > 0) {
      this.rescuing -= dt;
      // Fade to black, move everyone home at the darkest moment, fade back in.
      const k = this.rescuing / FADE_S;
      this.hudBars.fade(k > 0.5 ? 2 * (1 - k) : 2 * k);
      if (this.rescueKind && k <= 0.5) {
        const base = zone('base');
        const to = this.rescueTo ?? { x: base.x + 4, z: base.z + 4 };
        player.teleport(to.x, to.z);
        this.pip.root.position.set(to.x - 3, this.pip.root.position.y, to.z - 2);
        this.rescueTo = null;
        this.resources = applyRescue(this.state, this.resources);
        for (const f of this.onRescue) f();
        void this.dialogue.play(`rescue_${this.rescueKind}`);
        this.rescueKind = null;
      }
      if (this.rescuing <= 0) this.hudBars.fade(0);
      this.hudBars.update(this.resources);
      return;
    }
    if (!shouldStepSurvival(this.paused, false)) {
      this.hudBars.update(this.resources);
      return;
    }
    const env = this.env(player);
    this.lastEnv = env;
    this.resources = stepResources(this.resources, env, this.upgrades(), dt);
    if (this.resources.pip < 15) this.pip.setFace('worried');
    const need = needsRescue(this.resources, env.pipInSun);
    if (need) {
      this.rescueKind = need;
      this.rescuing = FADE_S;
    }
    this.hudBars.update(this.resources);
  }
}
