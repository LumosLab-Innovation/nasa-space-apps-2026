import { addCasters, mergeStatic } from '../models/optimize';
import { Axis, Color3, Mesh, MeshBuilder, PBRMaterial, Quaternion, Scene, StandardMaterial, TransformNode, Vector3 } from '@babylonjs/core';
import { loadModel } from '../models/loadModel';
import type { EventBus, GameEvents } from '../core/events';
import { installModule, type GameState, type ModuleId } from '../core/gameState';
import { sampleHeight, type Heightmap } from '../data/heightmap';
import type { Pip } from '../pip/pip';
import { pipComeHint } from '../pip/qCommand';
import type { Astronaut } from '../player/astronaut';
import type { Keyboard } from '../player/keyboard';
import type { Hud } from '../ui/hud';
import type { Sky } from '../world/sky';
import { CRATES } from '../world/zones';
import { liftTargetFrom, ModuleInstall, PIP_REACH_M } from './moduleInstall';
import { pickInteractable, type Interactable } from './resolver';
import { tr } from '../i18n/i18n';

export const NAMES: Record<ModuleId, string> = {
  solarTower: 'Vertical Solar Tower',
  radiator: 'Thermal Radiator',
  habitat: 'Habitat Module',
  antenna: 'Comms Antenna',
};
const PIP_AT_SITE_M = 6;

interface Entry {
  install: ModuleInstall;
  /** Pivot at the crate's centre; holds the GLB body (or the placeholder box). */
  crate: TransformNode;
  cratePos: { x: number; z: number };
  site: { x: number; z: number };
  marker: Mesh;
  built: TransformNode | null;
}

function pbr(scene: Scene, name: string, c: Color3, rough = 0.7, metal = 0): PBRMaterial {
  const m = new PBRMaterial(name, scene);
  m.albedoColor = c;
  m.roughness = rough;
  m.metallic = metal;
  return m;
}

/** Glue between ModuleInstall state machines, the 3D world, Pip and the HUD (spec §6 Act 2, §5.3 co-op). */
export class ModuleSystem {
  readonly entries = new Map<ModuleId, Entry>();
  private carrying: ModuleId | null = null;

  /** True while Pip is carrying a crate (it will not ride the rover then). */
  get pipCarrying(): boolean {
    return this.carrying !== null;
  }
  private pendingLift: ModuleId | null = null;
  /** Turns the built solar tower's panel to face a world yaw (null until built). */
  private aimPanel: ((yaw: number) => void) | null = null;
  /** The crate the player is standing at this frame (set in update, read when Q fires). */
  private liftHere: ModuleId | null = null;

  constructor(
    private readonly scene: Scene,
    private readonly hm: Heightmap,
    private readonly state: GameState,
    private readonly bus: EventBus<GameEvents>,
    private readonly pip: Pip,
    private readonly sky: Sky,
    private readonly hud: Hud,
  ) {
    const crateMat = pbr(scene, 'crate', new Color3(0.85, 0.85, 0.82));
    const markerMat = new StandardMaterial('siteMarker', scene);
    markerMat.emissiveColor = new Color3(1, 0.6, 0.15);
    markerMat.disableLighting = true;
    markerMat.alpha = 0.8;
    for (const c of CRATES) {
      const crate = new TransformNode(`crate-${c.moduleId}`, scene);
      crate.position.set(c.x, sampleHeight(hm, c.x, c.z) + 0.45, c.z);
      void loadModel(scene, 'crate').then((model) => {
        if (crate.isDisposed()) return model?.root.dispose();
        if (model) {
          model.root.parent = crate;
          model.root.position.y = -0.45;
          // Static prop: bake into one mesh (one draw call, one shadow caster) that rides on the pivot.
          const body = mergeStatic(model.root, `crateBody-${c.moduleId}`);
          if (body) {
            body.setParent(crate);
            model.root.dispose();
            sky.shadows.addShadowCaster(body);
          }
        } else {
          const box = MeshBuilder.CreateBox(`crateBox-${c.moduleId}`, { width: 1.2, height: 0.9, depth: 1.2 }, scene);
          box.material = crateMat;
          box.receiveShadows = true;
          box.parent = crate;
          sky.shadows.addShadowCaster(box);
        }
      });
      const marker = MeshBuilder.CreateTorus(`site-${c.moduleId}`, { diameter: 3, thickness: 0.12, tessellation: 40 }, scene);
      marker.material = markerMat;
      marker.position.set(c.site.x, sampleHeight(hm, c.site.x, c.site.z) + 0.1, c.site.z);
      marker.isVisible = false;
      this.entries.set(c.moduleId, { install: new ModuleInstall(c.moduleId), crate, cratePos: { x: c.x, z: c.z }, site: c.site, marker, built: null });
    }
    const prev = pip.onCommand;
    pip.onCommand = (cmd) => {
      prev(cmd);
      if (cmd === 'lift') this.requestLift();
    };
  }

  /** Demo shortcut: the crate is opened and Pip is already carrying it. */
  forceCarry(id: ModuleId): void {
    const e = this.entries.get(id)!;
    if (this.carrying || e.install.stage === 'installed') return;
    e.install.stage = 'lifted';
    this.carrying = id;
    e.crate.parent = this.pip.root;
    e.crate.position.copyFrom(this.pip.carryOffset);
    e.crate.rotation.set(0, 0, 0);
    e.marker.isVisible = true;
    this.pip.setPose('lift');
  }

  /** Demo shortcut: install a module immediately (whether or not it is being carried). */
  forceInstall(id: ModuleId, quiet = false): void {
    const e = this.entries.get(id)!;
    if (e.install.stage === 'installed') return;
    if (this.carrying !== id && this.carrying) return;
    this.carrying = id;
    e.install.stage = 'installed';
    this.finish(id, quiet);
  }

  /** Rescue: Pip lets go of this crate and it goes back where it was dropped, ready to lift again. */
  dropCarry(id: ModuleId): void {
    if (this.carrying !== id) return;
    const e = this.entries.get(id)!;
    e.crate.parent = null;
    e.crate.position.set(e.cratePos.x, sampleHeight(this.hm, e.cratePos.x, e.cratePos.z) + 0.45, e.cratePos.z);
    e.crate.rotation.set(0, 0, 0);
    e.install.stage = 'needsLift';
    e.marker.isVisible = false;
    this.carrying = null;
    this.pip.lowerArm();
  }

  /** The module crate Pip is carrying right now, if any. */
  get carryingId(): ModuleId | null {
    return this.carrying;
  }

  private interactables(): Interactable[] {
    const list: Interactable[] = [];
    for (const [id, e] of this.entries) {
      const s = e.install.stage;
      if (s === 'crate') list.push({ id: `crate:${id}`, x: e.cratePos.x, z: e.cratePos.z, enabled: this.carrying === null, prompt: tr('E — open crate: {name}', { name: tr(NAMES[id]) }) });
      if (s === 'needsLift') list.push({ id: `lift:${id}`, x: e.cratePos.x, z: e.cratePos.z, enabled: this.carrying === null, prompt: tr('Q — "Pip, lift!"') });
      if (s === 'lifted' || s === 'aligning') list.push({ id: `site:${id}`, x: e.site.x, z: e.site.z, enabled: true, prompt: tr('Hold E — align and lock') });
    }
    return list;
  }

  private requestLift(): void {
    const id = this.liftHere;
    if (!id || this.carrying) return;
    const e = this.entries.get(id)!;
    if (e.install.stage !== 'needsLift') return;
    this.pendingLift = id;
    this.pip.mode = 'goto';
    this.pip.gotoTarget = { x: e.cratePos.x - 1.2, z: e.cratePos.z };
    this.pip.setFace('curious');
  }

  private pipDistTo(p: { x: number; z: number }): number {
    return Math.hypot(this.pip.position.x - p.x, this.pip.position.z - p.z);
  }

  /** Returns the prompt to show (or null). */
  update(dt: number, player: Astronaut, keyboard: Keyboard): string | null {
    // Pip walking over to lift a crate.
    if (this.pendingLift) {
      const e = this.entries.get(this.pendingLift)!;
      if (e.install.pipLift(this.pipDistTo(e.cratePos))) {
        this.carrying = this.pendingLift;
        this.pendingLift = null;
        e.crate.parent = this.pip.root;
        e.crate.position.copyFrom(this.pip.carryOffset);
        e.crate.rotation.set(0, 0, 0);
        e.marker.isVisible = true;
        this.pip.mode = 'follow';
        this.pip.gotoTarget = undefined;
        this.pip.setFace('happy');
        this.hud.toast(tr('Pip is carrying the {name}. Lead the way to the orange ring!', { name: tr(NAMES[this.carrying]) }));
      }
    }

    const here = pickInteractable(this.interactables(), { x: player.position.x, z: player.position.z }, player.yaw);
    this.liftHere = liftTargetFrom(here?.id ?? null);
    this.pip.contextCommand = this.liftHere ? 'lift' : null;
    let prompt = here?.prompt ?? null;

    if (here?.id.startsWith('crate:') && keyboard.consume('KeyE')) {
      this.entries.get(here.id.slice(6) as ModuleId)!.install.playerUse();
      this.hud.toast(tr('Crate open. Too heavy to carry alone — ask Pip!'));
    }

    if (this.carrying) {
      const e = this.entries.get(this.carrying)!;
      const onSite = here?.id === `site:${this.carrying}`;
      const pipNear = this.pipDistTo(e.site) <= PIP_AT_SITE_M;
      if (onSite && !pipNear) prompt = pipComeHint(this.pip.mode, this.pipDistTo(e.site), PIP_AT_SITE_M) ?? tr('Wait for Pip to bring the module');
      if (onSite && pipNear && keyboard.isHeld('KeyE')) {
        e.install.holdAlign(dt);
        prompt = tr('Aligning… {pct}%', { pct: Math.min(100, Math.round((e.install.alignProgressS / 1.5) * 100)) });
      } else {
        e.install.releaseAlign();
      }
      if (e.install.stage === 'installed') {
        this.finish(this.carrying);
        // Step clear on the camera side so the new structure occludes neither the suit nor the view.
        player.teleport(e.site.x + 6 * Math.cos(player.camera.alpha), e.site.z + 6 * Math.sin(player.camera.alpha));
      }
    }
    // The vertical solar panel keeps turning toward the Sun as it circles the horizon.
    this.aimPanel?.(Math.atan2(this.sky.sunDir.x, this.sky.sunDir.z));
    return prompt;
  }

  private finish(id: ModuleId, quiet = false): void {
    const e = this.entries.get(id)!;
    e.crate.dispose();
    e.marker.isVisible = false;
    this.carrying = null;
    this.pip.lowerArm();
    e.built = this.buildModule(id, e.site);
    if (installModule(this.state, id)) this.bus.emit('moduleInstalled', id);
    if (!quiet) this.hud.toast(tr('{name} installed!', { name: tr(NAMES[id]) }));
  }

  private buildModule(id: ModuleId, site: { x: number; z: number }): TransformNode {
    const root = new TransformNode(`module-${id}`, this.scene);
    root.position.set(site.x, sampleHeight(this.hm, site.x, site.z), site.z);
    void loadModel(this.scene, id).then((model) => {
      if (!model) {
        this.buildPlaceholderModule(id, root);
        return;
      }
      model.root.parent = root;
      if (id !== 'solarTower') {
        const body = mergeStatic(model.root, `moduleBody-${id}`);
        if (body) this.sky.shadows.addShadowCaster(body);
        return;
      }
      // The solar tower's panel turns, so it stays unmerged; only its big parts cast shadows.
      addCasters(this.sky.shadows, model.meshes);
      const pivot = model.node('panel_pivot');
      // Babylon mirrors glTF X, so a glTF yaw of −ψ points the panel at world yaw ψ.
      this.aimPanel = (yaw) => (pivot.rotationQuaternion = Quaternion.RotationAxis(Axis.Y, -yaw));
    });
    return root;
  }

  /** Plan 1 primitive modules, kept as the fallback when a module GLB cannot load. */
  private buildPlaceholderModule(id: ModuleId, root: TransformNode): void {
    const scene = this.scene;
    const white = pbr(scene, `${id}-white`, new Color3(0.9, 0.9, 0.88), 0.5);
    const solar = pbr(scene, `${id}-cells`, new Color3(0.05, 0.08, 0.25), 0.25, 0.6);
    const parts: Mesh[] = [];
    const add = (m: Mesh) => {
      m.parent = root;
      m.receiveShadows = true;
      parts.push(m);
      return m;
    };
    if (id === 'solarTower') {
      const mast = add(MeshBuilder.CreateCylinder('mast', { diameter: 0.25, height: 8 }, scene));
      mast.position.y = 4;
      mast.material = white;
      const panel = add(MeshBuilder.CreateBox('vsatPanel', { width: 2.4, height: 5, depth: 0.08 }, scene));
      panel.position.y = 5.2;
      panel.material = solar;
      this.aimPanel = (yaw) => (panel.rotation.y = yaw);
    } else if (id === 'radiator') {
      const frame = add(MeshBuilder.CreateBox('radFrame', { width: 3, height: 2, depth: 0.1 }, scene));
      frame.position.y = 1.4;
      frame.material = white;
    } else if (id === 'habitat') {
      const hab = add(MeshBuilder.CreateCylinder('hab', { diameter: 4, height: 8 }, scene));
      hab.rotation.z = Math.PI / 2;
      hab.position.y = 2.2;
      hab.material = white;
    } else {
      const pole = add(MeshBuilder.CreateCylinder('antPole', { diameter: 0.15, height: 3 }, scene));
      pole.position.y = 1.5;
      pole.material = white;
    }
    parts.forEach((m) => this.sky.shadows.addShadowCaster(m));
  }
}
