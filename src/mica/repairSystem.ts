import { Color3, Color4, LinesMesh, MeshBuilder, ParticleSystem, Scene, Vector3, DynamicTexture } from '@babylonjs/core';
import { setFlag, unlockCard, type GameState } from '../core/gameState';
import { sampleHeight, type Heightmap } from '../data/heightmap';
import { pickInteractable, type Interactable } from '../interact/resolver';
import type { Pip } from '../pip/pip';
import type { Astronaut } from '../player/astronaut';
import type { Keyboard } from '../player/keyboard';
import type { DialogueBox } from '../ui/dialogueBox';
import type { Hud } from '../ui/hud';
import { REPAIR_SPOT, zone } from '../world/zones';

export { REPAIR_SPOT };
import type { MicaSystem } from './micaSystem';
import { MAX_WARM_RATE_C_PER_S, MicaRepair, PIP_REACH_M } from './repair';
import { PendingApproach } from '../pip/pendingApproach';
import { tr } from '../i18n/i18n';

const TOW_GAP_M = 3;
const ARRIVE_RADIUS_M = 25; // anywhere well inside the 45 m camp zone counts as "home"

/** Act 4 (slice version): tow MICA to camp, clean, open, swap, warm, wake (spec §6 scenes 4.1, 4.3, 4.4). */
export class MicaRepairSystem {
  readonly repair = new MicaRepair();
  private readonly openReq = new PendingApproach(PIP_REACH_M);
  private towing = false;
  private pendingPull = false;
  /** Called once, the first time Pip hooks the tow line (the radiation storm starts soon after). */
  onTowStart: () => void = () => {};
  /** E on the awake MICA before its memory is restored (opens the photo puzzle, Plan 4). */
  onRestoreMemory: () => void = () => {};
  private towStarted = false;
  private warmHoldS = 0;
  private tether: LinesMesh | null = null;
  private readonly burst: ParticleSystem;

  constructor(
    private readonly scene: Scene,
    private readonly hm: Heightmap,
    private readonly state: GameState,
    private readonly micaSys: MicaSystem,
    private readonly dialogue: DialogueBox,
    private readonly pip: Pip,
    private readonly hud: Hud,
  ) {
    const prev = pip.onCommand;
    pip.onCommand = (c) => {
      prev(c);
      if (c === 'pull') this.requestPull();
      if (c === 'open') this.requestOpen();
    };
    // Dust leaping off MICA's panels when the shield pulses (charged grains pushed by the electric field).
    this.burst = new ParticleSystem('edsBurst', 400, scene);
    const tex = new DynamicTexture('edsTex', { width: 16, height: 16 }, scene, false);
    const ctx = tex.getContext() as CanvasRenderingContext2D;
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(8, 8, 7, 0, Math.PI * 2);
    ctx.fill();
    tex.hasAlpha = true;
    tex.update();
    this.burst.particleTexture = tex;
    this.burst.emitter = new Vector3(0, -1000, 0);
    this.burst.minEmitBox = new Vector3(-1.4, 0, -0.4);
    this.burst.maxEmitBox = new Vector3(1.4, 0, 0.4);
    this.burst.color1 = new Color4(0.6, 0.58, 0.55, 1);
    this.burst.color2 = new Color4(0.45, 0.44, 0.42, 1);
    this.burst.minSize = 0.02;
    this.burst.maxSize = 0.05;
    this.burst.minLifeTime = 0.6;
    this.burst.maxLifeTime = 1.1;
    this.burst.gravity = new Vector3(0, -1.62, 0);
    this.burst.direction1 = new Vector3(-0.6, 1.5, -0.6);
    this.burst.direction2 = new Vector3(0.6, 2.5, 0.6);
    this.burst.minEmitPower = 0.5;
    this.burst.maxEmitPower = 1.2;
    this.burst.manualEmitCount = 0;
    this.burst.start();
  }

  /** Fires the electrodynamic-dust-shield particle burst at a point (also used to clean Pip at camp). */
  burstAt(p: Vector3): void {
    this.burst.emitter = p.add(new Vector3(0, 0.8, 0));
    this.burst.manualEmitCount = 120;
  }

  private get micaPos(): Vector3 {
    return this.micaSys.mica.root.position;
  }

  private pipDist(): number {
    return Math.hypot(this.pip.position.x - this.micaPos.x, this.pip.position.z - this.micaPos.z);
  }

  private requestOpen(): void {
    if (this.repair.stage !== 'openPanel') return;
    if (this.openReq.request(this.pipDist()) === 'now') {
      this.openHatch();
      return;
    }
    this.pip.mode = 'goto';
    this.pip.gotoTarget = { x: this.micaPos.x + 1.5, z: this.micaPos.z };
    this.hud.toast(tr('Pip rolls up to MICA to reach the hatch…'), 3);
  }

  private openHatch(): void {
    if (!this.repair.pipOpen(this.pipDist())) return;
    this.micaSys.mica.setHatchOpen(true);
    this.pip.mode = 'follow';
    this.pip.gotoTarget = undefined;
    this.hud.toast(tr('Pip pops the hatch open. Now swap the damaged memory board (E).'), 4);
  }

  get isTowing(): boolean {
    return this.towing || this.pendingPull;
  }

  /** True only on frames where the tow Q was offered next to MICA (the winch also uses 'pull'). */
  private pullOffered = false;

  /** Rescue mid-tow: let go of MICA where it is; the player can come back and tow it again. */
  onRescue(): void {
    if (!this.towing && !this.pendingPull) return;
    this.towing = false;
    this.pendingPull = false;
    this.tether?.dispose();
    this.tether = null;
    this.pip.mode = 'follow';
    this.pip.gotoTarget = undefined;
  }

  private requestPull(): void {
    if (!this.pullOffered) return;
    if (this.towing || this.repair.stage !== 'towing' || !this.state.flags.has('act3:micaFound')) return;
    this.pendingPull = true;
    this.pip.mode = 'goto';
    this.pip.gotoTarget = { x: this.micaPos.x + 2, z: this.micaPos.z };
  }

  private interactables(): Interactable[] {
    if (!this.state.flags.has('act3:micaFound')) return [];
    const p = { x: this.micaPos.x, z: this.micaPos.z };
    const s = this.repair.stage;
    const one = (prompt: string): Interactable[] => [{ id: `mica:${s}`, ...p, enabled: true, prompt }];
    if (s === 'towing' && !this.towing && !this.pendingPull) return one(tr('Q — "Pip, tow MICA back to camp!"'));
    if (s === 'cleaning') return one(tr('E — pulse the Electrodynamic Dust Shield (dust {d}%)', { d: Math.round(this.repair.dust * 100) }));
    if (s === 'openPanel') return one(tr('Q — "Pip, open the hatch!"'));
    if (s === 'swapBoard') return one(tr('E — swap the radiation-damaged memory board'));
    if (s === 'warming') return one(tr('Hold E — warm the battery slowly'));
    if (s === 'awake' && this.woke && !this.state.flags.has('act4:memory') && !this.dialogue.busy) return one(tr("E — restore MICA's memory"));
    return [];
  }

  /** Returns the prompt to show (or null). */
  update(dt: number, player: Astronaut, keyboard: Keyboard): string | null {
    const s = this.repair.stage;
    this.pullOffered = false;
    if (this.pendingPull && this.pipDist() <= PIP_REACH_M) {
      this.pendingPull = false;
      this.towing = true;
      this.pip.mode = 'follow';
      this.pip.gotoTarget = undefined;
      this.pip.setFace('happy');
      this.hud.toast(tr('Pip hooks the tow line. Lead the way back to Shackleton Camp!'), 5);
      if (!this.towStarted) {
        this.towStarted = true;
        this.onTowStart();
      }
    }
    if (this.towing) this.followPip(dt);
    if (this.openReq.tick(this.pipDist())) this.openHatch();

    const here = pickInteractable(this.interactables(), { x: player.position.x, z: player.position.z }, player.yaw, 3.2);
    if (!here) return null;
    if (s === 'towing') {
      this.pip.contextCommand = 'pull';
      this.pullOffered = true;
    }
    if (s === 'openPanel') this.pip.contextCommand = 'open';
    let prompt = here.prompt;

    if (s === 'cleaning' && keyboard.consume('KeyE')) {
      this.repair.eds();
      this.micaSys.mica.dust = this.repair.dust;
      this.burst.emitter = this.micaPos.add(new Vector3(0, 0.8, 0));
      this.burst.manualEmitCount = 120;
      if (unlockCard(this.state, 'eds')) this.hud.toast(tr('New discovery in your Science Notebook (Tab)'), 3);
    } else if (s === 'swapBoard' && keyboard.consume('KeyE')) {
      this.repair.playerSwap();
      this.hud.toast(tr('New board in. Battery at -40 C: warm it gently. Heating too fast triggers the safety cutoff.'), 5);
    } else if (s === 'awake' && keyboard.consume('KeyE')) {
      this.onRestoreMemory();
      return null;
    } else if (s === 'warming') {
      if (keyboard.isHeld('KeyE')) {
        this.warmHoldS += dt;
        // Holding longer pushes more power into the heater; the player must ease off.
        const rate = 0.6 + this.warmHoldS * 0.5;
        this.repair.warm(rate, dt);
        prompt = tr('Battery {c} °C · heating {r} °C/s (max {max})', { c: this.repair.batteryC.toFixed(1), r: rate.toFixed(1), max: MAX_WARM_RATE_C_PER_S });
        if (this.repair.warning === 'tooFast') {
          prompt = tr('Safety cutoff: heating paused. Release E, then use short presses to warm gently.');
          this.pip.setFace('worried');
        }
      } else {
        this.warmHoldS = 0;
      }
      if (this.repair.stage === 'awake') void this.wake();
    }
    return prompt;
  }

  private followPip(dt: number): void {
    const m = this.micaSys.mica.root;
    const dx = this.pip.position.x - m.position.x;
    const dz = this.pip.position.z - m.position.z;
    const d = Math.hypot(dx, dz);
    if (d > TOW_GAP_M) {
      const step = Math.min(d - TOW_GAP_M, 4 * dt);
      m.position.x += (dx / d) * step;
      m.position.z += (dz / d) * step;
      this.micaSys.mica.rollWheels(step);
    }
    m.position.y = sampleHeight(this.hm, m.position.x, m.position.z);
    m.rotation.set(0, Math.atan2(dx, dz), 0);
    const a = this.pip.position.add(new Vector3(0, 0.5, 0));
    const b = m.position.add(new Vector3(0, 0.5, 0));
    this.tether = MeshBuilder.CreateLines('towLine', { points: [a, b], updatable: true, instance: this.tether ?? undefined }, this.scene);
    this.tether.color = new Color3(1, 0.6, 0.2);

    const base = zone('base');
    if (Math.hypot(m.position.x - base.x, m.position.z - base.z) < ARRIVE_RADIUS_M) {
      this.towing = false;
      this.tether.dispose();
      this.tether = null;
      m.position.set(REPAIR_SPOT.x, sampleHeight(this.hm, REPAIR_SPOT.x, REPAIR_SPOT.z), REPAIR_SPOT.z);
      this.repair.arriveAtBase();
      this.hud.toast(tr('MICA is home. First, shake the dust off its solar panels (E).'), 5);
    }
  }

  /** Demo shortcut: MICA parked at camp, cleaned, hatch open, and awake. */
  fastForwardWake(silent = false): void {
    const m = this.micaSys.mica;
    this.towing = false;
    this.tether?.dispose();
    this.tether = null;
    m.root.position.set(REPAIR_SPOT.x, sampleHeight(this.hm, REPAIR_SPOT.x, REPAIR_SPOT.z), REPAIR_SPOT.z);
    m.root.rotation.set(0, 0.6, 0);
    m.dust = 0;
    m.setHatchOpen(true);
    this.repair.stage = 'awake';
    if (silent) {
      // Continue from a save: MICA is simply awake (no wake-up conversation replay).
      this.woke = true;
      this.micaSys.mica.setAwake(true);
    } else void this.wake();
  }

  private woke = false;
  private async wake(): Promise<void> {
    if (this.woke) return;
    this.woke = true;
    this.micaSys.mica.setAwake(true);
    setFlag(this.state, 'act4:micaAwake');
    await this.dialogue.play('micaWake');
  }
}
