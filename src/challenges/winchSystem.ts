import { Color3, LinesMesh, Mesh, MeshBuilder, PBRMaterial, Scene, Vector3 } from '@babylonjs/core';
import { unlockCard, type GameState } from '../core/gameState';
import { sampleHeight, type Heightmap } from '../data/heightmap';
import type { ModuleSystem } from '../interact/moduleSystem';
import type { Pip } from '../pip/pip';
import type { Astronaut } from '../player/astronaut';
import type { Keyboard } from '../player/keyboard';
import type { DialogueBox } from '../ui/dialogueBox';
import type { Hud } from '../ui/hud';
import type { Sky } from '../world/sky';
import { WINCH_ANCHOR } from '../world/zones';
import { anchorPrompt, slopeDeg, Winch, wheelSlip, winchHoldsPip, winchPromptActive } from './winch';
import { tr } from '../i18n/i18n';

const PROMPT_RANGE_M = 6;
const STOP_SHORT_M = 2.5;

/**
 * Sunny Hill co-op (spec v3 §7, stop 3): Pip carrying the solar-tower crate digs in on the soft slope;
 * the player climbs, plants the anchor, and Pip winches itself and the crate up.
 */
export class WinchSystem {
  readonly winch = new Winch();
  private anchor: Mesh | null = null;
  private rope: LinesMesh | null = null;
  /** Where Pip dug in: held there until the winch frees it. */
  private stuckAt: { x: number; z: number } | null = null;
  /** True only on frames where the winch offered its Q (so 'pull' near MICA never starts the reel). */
  private pullOffered = false;

  constructor(
    private readonly scene: Scene,
    private readonly hm: Heightmap,
    private readonly state: GameState,
    private readonly modules: ModuleSystem,
    private readonly pip: Pip,
    private readonly dialogue: DialogueBox,
    private readonly hud: Hud,
    private readonly sky: Sky,
  ) {
    const prev = pip.onCommand;
    pip.onCommand = (c) => {
      prev(c);
      if (c === 'pull' && this.pullOffered && this.winch.state === 'anchored') {
        this.winch.startReel();
        this.pip.setFace('excited');
        this.hud.toast(tr('Pip reels in the winch cable…'), 3);
      }
    };
  }

  /** Re-reads the state (TypeScript narrows `winch.state` across the method calls that change it). */
  private stateNow(): string {
    return this.winch.state;
  }

  private anchorDist(p: { x: number; z: number }): number {
    return Math.hypot(p.x - WINCH_ANCHOR.x, p.z - WINCH_ANCHOR.z);
  }

  /** Returns the prompt to show (or null). */
  update(dt: number, player: Astronaut, keyboard: Keyboard): string | null {
    const w = this.winch;
    this.pullOffered = false;
    // The winch owns Pip while it holds it: re-assert every frame so no other system or stray Q frees it.
    if (winchHoldsPip(w.state)) this.pip.mode = 'task';
    if (w.state === 'stuck' && this.stuckAt) {
      this.pip.root.position.x = this.stuckAt.x;
      this.pip.root.position.z = this.stuckAt.z;
    }
    const carryingTower = this.modules.carryingId === 'solarTower';
    if (w.state === 'idle' && carryingTower && this.pip.moving) {
      const slip = wheelSlip(slopeDeg(this.hm, this.pip.position.x, this.pip.position.z, this.pip.heading), true);
      this.pip.speedFactor = 1 - slip * 0.85;
      w.onPipSlip(slip);
      if (this.stateNow() === 'stuck') {
        this.pip.mode = 'task';
        this.stuckAt = { x: this.pip.position.x, z: this.pip.position.z };
        this.pip.spinning = true;
        this.pip.speedFactor = 1;
        this.pip.setFace('worried');
        void this.dialogue.play('winch_stuck');
        this.hud.toast(tr('Pip is stuck on the soft slope. Climb to the top and plant the winch anchor.'), 6);
      }
    } else if (w.state === 'idle') {
      this.pip.speedFactor = 1;
    }

    const near = winchPromptActive(w.state, this.anchorDist(player.position), Math.hypot(player.position.x - this.pip.position.x, player.position.z - this.pip.position.z));
    if (w.state === 'stuck' && this.anchorDist(player.position) <= PROMPT_RANGE_M) {
      const ap = anchorPrompt(this.anchorDist(player.position));
      if (ap.canPlant && keyboard.consume('KeyE') && w.plantAnchor(this.anchorDist(player.position))) {
        this.placeAnchor();
        w.ropeLeftM = Math.max(0, this.anchorDist(this.pip.position) - STOP_SHORT_M);
        this.pip.spinning = false;
        this.stuckAt = null;
        this.pip.contextCommand = 'pull';
        this.pullOffered = true;
        void this.dialogue.play('winch_anchor');
      }
      return w.state === 'stuck' ? ap.text : tr('Q — "Pip, winch yourself up!"');
    }
    if (w.state === 'anchored') {
      this.drawRope();
      if (!near) return null;
      this.pip.contextCommand = 'pull';
      this.pullOffered = true;
      return tr('Q — "Pip, winch yourself up!"');
    }
    if (w.state === 'reeling') {
      const before = w.ropeLeftM;
      w.reel(dt);
      const step = before - w.ropeLeftM;
      const p = this.pip.root.position;
      const dx = WINCH_ANCHOR.x - p.x;
      const dz = WINCH_ANCHOR.z - p.z;
      const d = Math.hypot(dx, dz);
      if (d > 0.01) {
        p.x += (dx / d) * step;
        p.z += (dz / d) * step;
        p.y = sampleHeight(this.hm, p.x, p.z);
      }
      this.drawRope();
      if (this.stateNow() === 'done') this.finish();
    }
    return null;
  }

  /** Rescue mid-challenge: drop the crate back at the foot of the hill and start the climb over. */
  onRescue(): void {
    if (!winchHoldsPip(this.winch.state)) return;
    this.winch.reset();
    this.release();
    this.anchor?.dispose();
    this.anchor = null;
    this.modules.dropCarry('solarTower');
  }

  /** Demo skip: the winch is simply done. */
  forceFinish(): void {
    if (this.winch.state === 'done') return;
    this.winch.finishNow();
    this.release();
  }

  private release(): void {
    this.rope?.dispose();
    this.rope = null;
    this.stuckAt = null;
    this.pip.spinning = false;
    this.pip.speedFactor = 1;
    this.pip.mode = 'follow';
    if (this.pip.contextCommand === 'pull') this.pip.contextCommand = null;
  }

  private placeAnchor(): void {
    const stake = MeshBuilder.CreateCylinder('winchAnchor', { diameterTop: 0.04, diameterBottom: 0.1, height: 0.6, tessellation: 8 }, this.scene);
    const m = new PBRMaterial('winchAnchorMat', this.scene);
    m.albedoColor = new Color3(0.95, 0.45, 0.1);
    m.roughness = 0.6;
    stake.material = m;
    stake.position.set(WINCH_ANCHOR.x, sampleHeight(this.hm, WINCH_ANCHOR.x, WINCH_ANCHOR.z) + 0.2, WINCH_ANCHOR.z);
    this.sky.shadows.addShadowCaster(stake);
    this.anchor = stake;
  }

  private drawRope(): void {
    if (!this.anchor) return;
    const a = this.anchor.position.add(new Vector3(0, 0.25, 0));
    const b = this.pip.position.add(new Vector3(0, 0.45, 0));
    this.rope = MeshBuilder.CreateLines('winchRope', { points: [a, b], updatable: true, instance: this.rope ?? undefined }, this.scene);
    this.rope.color = new Color3(1, 0.6, 0.2);
  }

  private finish(): void {
    this.release();
    this.pip.setFace('happy');
    void this.dialogue.play('winch_done');
    if (unlockCard(this.state, 'spiritStuck')) this.hud.toast(tr('New discovery in your Science Notebook (Tab)'), 3);
  }
}
