import { Color3, MeshBuilder, StandardMaterial, Vector3, type Scene } from '@babylonjs/core';
import { setFlag, unlockCard, type GameState } from '../core/gameState';
import { sampleHeight, type Heightmap } from '../data/heightmap';
import type { DustCoat } from '../fx/dustCoat';
import type { DustSystem } from '../fx/dustSystem';
import type { Pip } from '../pip/pip';
import type { DialogueBox } from '../ui/dialogueBox';
import type { Hud } from '../ui/hud';
import { horizonElevationDeg } from '../world/lighting';
import { tr } from '../i18n/i18n';

type P2 = { x: number; z: number };

/**
 * Where the uncrewed cargo lander comes down: flat ground about 650 m north of camp, in its line of sight
 * (picked with scripts/scout-cargo.ts on the real LOLA heightmap).
 */
export const CARGO_SITE: P2 = { x: -10, z: 350 };
/** Plume ejecta leave the pad almost flat (1–3°), so a low ridge is enough cover. */
const EJECTA_MARGIN_DEG = 1;
const PLUME_HEIGHT_M = 2;
const PIP_EYE_M = 1;

/** Whether the cargo countdown offers Q to send Pip to cover (never while the winch holds Pip). */
export function cargoOffersQ(s: { pipSafe: boolean; hasShelter: boolean; nearPip: boolean; pipMode: string; winchBusy: boolean }): boolean {
  return !s.pipSafe && s.hasShelter && s.nearPip && s.pipMode !== 'goto' && !s.winchBusy;
}

export function slopeDeg(hm: Heightmap, x: number, z: number, d = 10): number {
  const gx = (sampleHeight(hm, x + d, z) - sampleHeight(hm, x - d, z)) / (2 * d);
  const gz = (sampleHeight(hm, x, z + d) - sampleHeight(hm, x, z - d)) / (2 * d);
  return (Math.atan(Math.hypot(gx, gz)) * 180) / Math.PI;
}

/** Only in Act 2 (two modules up, MICA not found yet), once, and never while the winch or a crate is busy. */
export function cargoShouldStart(s: { modules: number; act3Started: boolean; winchBusy: boolean; carrying: boolean; done: boolean }): boolean {
  return s.modules >= 2 && !s.act3Started && !s.winchBusy && !s.carrying && !s.done;
}

/**
 * True when terrain between `target` and the landing `site` blocks the low-angle ejecta: the horizon toward
 * the site (up to just before it) stands at least 1° above the line to the plume 2 m over the pad.
 */
export function ejectaShielded(hm: Heightmap, target: P2, site: P2): boolean {
  const dx = site.x - target.x;
  const dz = site.z - target.z;
  const dist = Math.hypot(dx, dz);
  if (dist < 30) return false;
  const az = (Math.atan2(dx, dz) * 180) / Math.PI;
  const eye = sampleHeight(hm, target.x, target.z) + PIP_EYE_M;
  const toPlume = (Math.atan2(sampleHeight(hm, site.x, site.z) + PLUME_HEIGHT_M - eye, dist) * 180) / Math.PI;
  const ridge = horizonElevationDeg(hm, target.x, target.z, az, PIP_EYE_M, dist - 20, 5);
  return ridge >= toPlume + EJECTA_MARGIN_DEG;
}

/** The shielded spot closest to `from`, searched on rings out to `radiusM`, or null. */
export function nearestShelter(hm: Heightmap, from: P2, site: P2, radiusM: number): P2 | null {
  for (let r = 5; r <= radiusM; r += 5) {
    const n = Math.max(8, Math.round((2 * Math.PI * r) / 5));
    for (let i = 0; i < n; i++) {
      const a = (i / n) * 2 * Math.PI;
      const p = { x: from.x + r * Math.sin(a), z: from.z + r * Math.cos(a) };
      if (ejectaShielded(hm, p, site)) return p;
    }
  }
  return null;
}

// ---------- the event (Babylon) ----------

export const CARGO = { warnS: 90, descentS: 10, startH: 400, towerReachM: 6, delayAfterReadyS: 20 } as const;

export interface CargoWorld {
  scene: Scene;
  hm: Heightmap;
  state: GameState;
  dialogue: DialogueBox;
  hud: Hud;
  pip: Pip;
  dust: DustSystem;
  pipCoat: DustCoat;
  /** Where the built solar tower stands, or null while it is not installed. */
  towerSite: () => P2 | null;
  winchBusy: () => boolean;
  carrying: () => boolean;
  locked: () => boolean;
}

export type CargoPhase = 'idle' | 'warning' | 'descent' | 'after' | 'done';

/** Act 2E: an uncrewed cargo lander comes down 650 m away; stow the panels and hide Pip from the ejecta. */
export function createCargoLanding(w: CargoWorld) {
  let phase: CargoPhase = 'idle';
  let readyT = 0;
  let t = 0;
  let shelter: P2 | null = null;
  let shelterFrom: P2 | null = null;
  let sentPip = false;
  let plumeAcc = 0;
  const groundY = sampleHeight(w.hm, CARGO_SITE.x, CARGO_SITE.z);

  // A plain cargo lander: steel cylinder and a flame, visible from camp as it comes down.
  const ship = MeshBuilder.CreateCylinder('cargoLander', { diameter: 7, height: 22, tessellation: 20 }, w.scene);
  const m = new StandardMaterial('cargoMat', w.scene);
  m.diffuseColor = new Color3(0.75, 0.76, 0.8);
  // A little self-light so the 22 m ship reads against the black sky from 650 m away.
  m.emissiveColor = new Color3(0.25, 0.25, 0.27);
  ship.material = m;
  ship.isVisible = false;
  ship.isPickable = false;
  const flame = MeshBuilder.CreateCylinder('cargoFlame', { diameterTop: 3, diameterBottom: 10, height: 14, tessellation: 16 }, w.scene);
  const fm = new StandardMaterial('cargoFlameMat', w.scene);
  fm.emissiveColor = new Color3(0.7, 0.82, 1);
  fm.disableLighting = true;
  fm.alpha = 0.35;
  flame.material = fm;
  flame.isVisible = false;
  flame.isPickable = false;

  const place = (h: number) => {
    ship.position.set(CARGO_SITE.x, groundY + h + 11, CARGO_SITE.z);
    flame.position.set(CARGO_SITE.x, groundY + h - 7, CARGO_SITE.z);
  };
  const pipShielded = () => ejectaShielded(w.hm, { x: w.pip.position.x, z: w.pip.position.z }, CARGO_SITE);

  const land = () => {
    phase = 'after';
    t = 0;
    setFlag(w.state, 'cargo:landed');
    const tower = w.towerSite();
    const stowed = w.state.flags.has('cargo:towerStowed');
    const safe = pipShielded();
    if (safe) setFlag(w.state, 'cargo:pipShielded');
    if (tower && !stowed) setFlag(w.state, 'cargo:towerDusty');
    if (unlockCard(w.state, 'apollo12Surveyor')) w.hud.toast(tr('New discovery in your Science Notebook (Tab)'), 3);
    const lines: string[] = [];
    if (safe) lines.push('cargo_pip_safe');
    else {
      w.pipCoat.level = Math.max(w.pipCoat.level, 0.8);
      w.pip.setFace('dizzy');
      w.dust.burst(new Vector3(w.pip.position.x, sampleHeight(w.hm, w.pip.position.x, w.pip.position.z), w.pip.position.z), 4);
      lines.push('cargo_pip_dusty', w.state.modules.has('habitat') ? 'cargo_pip_eds' : 'cargo_pip_noeds');
    }
    if (tower && !stowed) lines.push('cargo_tower_dusty');
    // Only undo our own 'hide' order: a crate lift or the winch keeps its Pip mode.
    if (sentPip && w.pip.mode === 'goto') w.pip.mode = 'follow';
    void lines.reduce<Promise<void>>((p, id) => p.then(() => w.dialogue.play(id)), Promise.resolve());
  };

  return {
    /** Continue from a save: the cargo lander that already came down stands at its site. */
    restore() {
      if (!w.state.flags.has('cargo:landed')) return;
      phase = 'done';
      place(0);
      ship.isVisible = true;
    },
    get phase(): CargoPhase {
      return phase;
    },
    /** Seconds left before touchdown during the warning, else null (the music reads this). */
    get countdownLeftS(): number | null {
      return phase === 'warning' ? Math.max(0, CARGO.warnS - t) : null;
    },
    update(dt: number, player: { position: { x: number; z: number } }, keyboard: { consume(code: string): boolean }): string | null {
      if (phase === 'done') return null;
      if (phase === 'idle') {
        const ok = cargoShouldStart({
          modules: w.state.modules.size, act3Started: w.state.flags.has('act3:micaFound'), winchBusy: w.winchBusy(),
          carrying: w.carrying(), done: w.state.flags.has('cargo:landed'),
        });
        readyT = ok ? readyT + dt : 0;
        if (readyT < CARGO.delayAfterReadyS || w.dialogue.busy || w.locked()) return null;
        phase = 'warning';
        t = 0;
        void w.dialogue.play('cargo_warn');
        if (w.towerSite()) void w.dialogue.play('cargo_stow_tower');
        return null;
      }
      t += dt;
      if (phase === 'warning') {
        if (t >= CARGO.warnS) {
          phase = 'descent';
          t = 0;
          ship.isVisible = flame.isVisible = true;
          return null;
        }
        const head = tr('CARGO LANDER in {s} s', { s: Math.ceil(CARGO.warnS - t) });
        const tower = w.towerSite();
        const stowed = w.state.flags.has('cargo:towerStowed');
        if (tower && !stowed && Math.hypot(player.position.x - tower.x, player.position.z - tower.z) <= CARGO.towerReachM) {
          if (keyboard.consume('KeyE')) {
            setFlag(w.state, 'cargo:towerStowed');
            w.hud.toast(tr('Solar panels folded flat, edge-on to the landing site'), 4);
            return null;
          }
          return `${head}   ·   ${tr('E — stow the solar tower panels')}`;
        }
        const pipSafe = pipShielded();
        const nearPip = Math.hypot(player.position.x - w.pip.position.x, player.position.z - w.pip.position.z) <= 12;
        // The nearest cover is searched around where Pip is now (again once Pip has moved 10 m).
        if (!pipSafe && (!shelterFrom || Math.hypot(w.pip.position.x - shelterFrom.x, w.pip.position.z - shelterFrom.z) > 10)) {
          shelterFrom = { x: w.pip.position.x, z: w.pip.position.z };
          shelter = nearestShelter(w.hm, shelterFrom, CARGO_SITE, 60) ?? nearestShelter(w.hm, shelterFrom, CARGO_SITE, 150);
        }
        if (shelter && cargoOffersQ({ pipSafe, hasShelter: true, nearPip, pipMode: w.pip.mode, winchBusy: w.winchBusy() })) {
          if (keyboard.consume('KeyQ')) {
            w.pip.gotoTarget = { ...shelter };
            w.pip.mode = 'goto';
            sentPip = true;
            void w.dialogue.play('cargo_pip_hide');
            return null;
          }
          return `${head}   ·   ${tr('Q — "Pip, hide behind that ridge!"')}`;
        }
        const todo = [tower && !stowed ? tr('stow the solar tower') : null, pipSafe ? null : tr('hide Pip behind a ridge (go to Pip)')].filter(Boolean);
        return todo.length ? `${head}   ·   ${todo.join(' · ')}` : `${head}   ·   ${tr('ready: watch it land in the north')}`;
      }
      if (phase === 'descent') {
        const k = Math.min(1, t / CARGO.descentS);
        // Slows toward the ground like a real powered descent.
        place(CARGO.startH * (1 - k) ** 2);
        plumeAcc += dt;
        if (k > 0.6 && plumeAcc >= 0.1) {
          plumeAcc = 0;
          w.dust.plume(new Vector3(CARGO_SITE.x, groundY, CARGO_SITE.z), 120, 40);
        }
        if (k >= 1) {
          flame.isVisible = false;
          land();
        }
        return null;
      }
      if (phase === 'after' && t > 20) phase = 'done';
      return null;
    },
    /** After the winch block (which resets Pip's speed every frame): a dust-coated Pip rolls slower. */
    lateUpdate(): void {
      if (w.pipCoat.level > 0.5 && !w.winchBusy() && !w.carrying()) w.pip.speedFactor = 0.6;
    },
    /** E at the solar tower while it is dusty: brush it once to bring fast charging back. */
    brushPrompt(player: { position: { x: number; z: number } }, keyboard: { consume(code: string): boolean }): string | null {
      const tower = w.towerSite();
      if (!tower || !w.state.flags.has('cargo:towerDusty')) return null;
      if (Math.hypot(player.position.x - tower.x, player.position.z - tower.z) > CARGO.towerReachM) return null;
      if (keyboard.consume('KeyE')) {
        w.state.flags.delete('cargo:towerDusty');
        setFlag(w.state, 'cargo:towerBrushed');
        void w.dialogue.play('cargo_tower_brushed');
        return null;
      }
      return tr('E — brush the dust off the solar tower');
    },
  };
}
