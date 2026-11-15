import { firstSampleLine, pipCanScan } from './scienceRules';
import { Color3, Mesh, MeshBuilder, PBRMaterial, Scene, Vector3 } from '@babylonjs/core';
import { addSample, logData, unlockCard, type GameState, type SampleId } from '../core/gameState';
import { sampleHeight, type Heightmap } from '../data/heightmap';
import type { Script } from '../dialogue/runner';
import { shadowLength } from '../physics/lunar';
import { pickInteractable, type Interactable } from '../interact/resolver';
import type { Pip } from '../pip/pip';
import type { Astronaut } from '../player/astronaut';
import type { Keyboard } from '../player/keyboard';
import type { DialogueBox } from '../ui/dialogueBox';
import type { Hud } from '../ui/hud';
import type { Sky } from '../world/sky';
import { ANTENNA_SPOT, EXPERIMENT_SPOT, REF_ROCK_SPOT, SAMPLE_SPOTS } from '../world/zones';

export { ANTENNA_SPOT, EXPERIMENT_SPOT, REF_ROCK_SPOT };
import { startHammerFeather } from './experiments';
import { glassBeadsVisible } from '../challenges/freshCrater';
import { tr } from '../i18n/i18n';

const SAMPLE_COLOR: Record<string, Color3> = {
  anorthosite: new Color3(0.86, 0.86, 0.84),
  breccia: new Color3(0.32, 0.31, 0.3),
  glassBeads: new Color3(0.75, 0.42, 0.16),
  regolith: new Color3(0.45, 0.44, 0.42),
  freshCrater: new Color3(0.7, 0.7, 0.68),
};
export const SAMPLE_NAME: Record<string, string> = {
  anorthosite: 'white anorthosite',
  breccia: 'impact breccia',
  glassBeads: 'glass beads',
  regolith: 'surface regolith',
  freshCrater: 'fresh-crater rock',
};

const SCAN_GLOW_S = 5;

/** Act 1 science moments: hammer & feather, shadow quiz, first samples, radio delay (spec §6 scenes 1.2–1.6). */
export class ScienceSystem {
  private readonly rocks = new Map<SampleId, Mesh>();
  private readonly glow = new Map<SampleId, number>();
  private experimentDone = false;
  private experimentRunning = false;
  private antennaDone = false;
  private shadowDone = false;
  private introStarted = false;
  /** Pip's LIDAR reach; grows to 150 m once the relay on Earth View Peak is aligned (spec v3 §7.1). */
  lidarRangeM = 60;
  /** Pip's thermal view is on (the glass beads only show through it). */
  thermalOn = false;

  constructor(
    private readonly scene: Scene,
    private readonly hm: Heightmap,
    private readonly state: GameState,
    private readonly script: Script,
    private readonly dialogue: DialogueBox,
    private readonly pip: Pip,
    private readonly sky: Sky,
    private readonly hud: Hud,
  ) {
    // The ice sample lives in the Dark Crater and has its own rules (darkCrater challenge).
    for (const s of SAMPLE_SPOTS.filter((x) => x.sampleId !== 'iceRegolith')) {
      const rock = MeshBuilder.CreatePolyhedron(`sample-${s.sampleId}`, { type: 2, size: 0.12 }, scene);
      const m = new PBRMaterial(`sampleMat-${s.sampleId}`, scene);
      m.albedoColor = SAMPLE_COLOR[s.sampleId];
      m.roughness = 0.9;
      rock.material = m;
      rock.position.set(s.x, sampleHeight(hm, s.x, s.z) + 0.08, s.z);
      rock.rotation.set(Math.random() * 3, Math.random() * 3, 0);
      sky.shadows.addShadowCaster(rock);
      this.rocks.set(s.sampleId, rock);
    }
    const refRock = MeshBuilder.CreateBox('refRock', { width: 0.7, height: 1, depth: 0.6 }, scene);
    refRock.position.set(REF_ROCK_SPOT.x, sampleHeight(hm, REF_ROCK_SPOT.x, REF_ROCK_SPOT.z) + 0.45, REF_ROCK_SPOT.z);
    refRock.material = new PBRMaterial('refRockMat', scene);
    (refRock.material as PBRMaterial).albedoColor = new Color3(0.5, 0.49, 0.47);
    (refRock.material as PBRMaterial).roughness = 1;
    refRock.receiveShadows = true;
    sky.shadows.addShadowCaster(refRock);
    const mast = MeshBuilder.CreateCylinder('tmpAntenna', { diameter: 0.08, height: 1.8 }, scene);
    mast.position.set(ANTENNA_SPOT.x, sampleHeight(hm, ANTENNA_SPOT.x, ANTENNA_SPOT.z) + 0.9, ANTENNA_SPOT.z);
    mast.isVisible = false;
    sky.shadows.addShadowCaster(mast);
    this.antennaMast = mast;
  }

  private readonly antennaMast: Mesh;

  private interactables(): Interactable[] {
    const list: Interactable[] = [];
    if (!this.experimentDone && !this.experimentRunning)
      list.push({ id: 'experiment', ...EXPERIMENT_SPOT, enabled: true, prompt: tr('E — drop the hammer and the feather') });
    if (!this.shadowDone) list.push({ id: 'shadow', ...REF_ROCK_SPOT, enabled: true, prompt: tr('E — measure this rock and its shadow') });
    if (!this.antennaDone) list.push({ id: 'antenna', ...ANTENNA_SPOT, enabled: true, prompt: tr('E — deploy the radio antenna') });
    for (const [id, rock] of this.rocks) {
      if (rock.isEnabled() && rock.isVisible) list.push({ id: `sample:${id}`, x: rock.position.x, z: rock.position.z, enabled: true, prompt: tr('E — collect sample: {name}', { name: tr(SAMPLE_NAME[id]) }) });
    }
    return list;
  }

  /** Returns the prompt to show (or null). Consumes E when it acts. */
  update(dt: number, player: Astronaut, keyboard: Keyboard): string | null {
    const beads = this.rocks.get('glassBeads');
    if (beads?.isEnabled()) {
      beads.isVisible = glassBeadsVisible(this.thermalOn, Math.hypot(beads.position.x - player.position.x, beads.position.z - player.position.z));
    }
    // The first meeting with Pip (and meetPip / silenceExplain) moved to story/pipMeetingSystem.ts (Plan 7).

    if (keyboard.consume('KeyR') && pipCanScan(this.state.flags)) this.scan(player);
    for (const [id, left] of this.glow) {
      const rock = this.rocks.get(id)!;
      const mat = rock.material as PBRMaterial;
      const t = left - dt;
      if (t <= 0) {
        this.glow.delete(id);
        mat.emissiveColor = Color3.Black();
      } else {
        this.glow.set(id, t);
        mat.emissiveColor = new Color3(0.2, 0.6, 1).scale(0.5 + 0.5 * Math.sin(t * 8));
      }
    }

    const here = pickInteractable(this.interactables(), { x: player.position.x, z: player.position.z }, player.yaw);
    if (!here) return null;
    if (keyboard.consume('KeyE')) {
      if (here.id === 'experiment') void this.runExperiment();
      else if (here.id === 'shadow') void this.shadowQuiz();
      else if (here.id === 'antenna') void this.deployAntenna();
      else if (here.id.startsWith('sample:')) {
        const id = here.id.slice(7) as SampleId, rock = this.rocks.get(id)!;
        if (!player.beginInteraction({
          kind: 'sample', id, target: rock.position,
          valid: () => !rock.isDisposed() && !this.state.samples.has(id),
          onAcquire: () => rock.setEnabled(false),
          onCancel: () => { if (!rock.isDisposed() && !this.state.samples.has(id)) rock.setEnabled(true); },
          onCommit: () => this.collect(id),
        })) return tr('Move closer and stand still to reach the sample');
      }
    }
    return here.prompt;
  }

  private unlock(card: string): void {
    if (unlockCard(this.state, card)) this.hud.toast(tr('New discovery in your Science Notebook (Tab)'), 3);
  }

  private scan(player: Astronaut): void {
    this.pip.command('scan');
    this.pip.setFace('curious');
    const near = [...this.rocks.entries()]
      .filter(([, r]) => r.isEnabled() && r.isVisible)
      .map(([id, r]) => ({ id, d: Math.hypot(r.position.x - player.position.x, r.position.z - player.position.z) }))
      .filter((x) => x.d < this.lidarRangeM)
      .sort((a, b) => a.d - b.d)
      .slice(0, 3);
    near.forEach((n) => this.glow.set(n.id, SCAN_GLOW_S));
    this.hud.toast(near.length ? tr(near.length > 1 ? "Pip's LIDAR found {n} samples nearby" : "Pip's LIDAR found {n} sample nearby", { n: near.length }) : tr('Pip: "Nothing interesting within {m} m. Just a lot of grey."', { m: this.lidarRangeM }), 3);
  }

  /** Continue from a save: collected rocks are gone, the intro and experiment do not replay. */
  restore(): void {
    for (const id of this.state.samples) this.rocks.get(id as SampleId)?.setEnabled(false);
    this.introStarted = this.state.flags.has('dialogue:meetPip:done');
    this.experimentDone = this.state.unlockedCards.has('hammerFeather');
    this.shadowDone = this.state.dataLogs.has('sunAngleShadow');
    this.antennaDone = this.state.dataLogs.has('commDelay');
    if (this.antennaDone) this.antennaMast.isVisible = true;
  }

  private collect(id: SampleId): void {
    const rock = this.rocks.get(id)!;
    rock.setEnabled(false);
    this.glow.delete(id);
    if (!addSample(this.state, id)) return;
    this.hud.toast(tr('Sample bagged: {name} — photo, position and notes saved', { name: tr(SAMPLE_NAME[id]) }), 3);
    if (id === 'anorthosite') this.unlock('anorthosite');
    const line = firstSampleLine(id, this.state.flags);
    if (line) void this.dialogue.play(line);
  }

  private async runExperiment(): Promise<void> {
    this.experimentRunning = true;
    await this.dialogue.play('hammerFeatherIntro').catch(() => {});
    const at = new Vector3(EXPERIMENT_SPOT.x, 0, EXPERIMENT_SPOT.z);
    const r = await startHammerFeather(this.scene, at, sampleHeight(this.hm, at.x, at.z));
    this.hud.toast(tr('Hammer: {h} s · Feather: {f} s · (Earth: hammer 0.55 s, feather much slower)', { h: r.hammerS.toFixed(2), f: r.featherS.toFixed(2) }), 7);
    this.experimentRunning = false;
    this.experimentDone = true;
    this.unlock('hammerFeather');
    await this.dialogue.play('hammerFeatherResult');
  }

  private async shadowQuiz(): Promise<void> {
    this.shadowDone = true;
    // Use the live Sun from real ephemeris data (ledger ruling, Task 5) instead of a fixed 38 m.
    const len = shadowLength(1, this.sky.sunElevDeg);
    const answer = Number.isFinite(len)
      ? tr('About {m} meters! The Sun is only {deg} degrees above the horizon right now.', { m: Math.round(len), deg: this.sky.sunElevDeg.toFixed(2) })
      : tr('It has no end right now — the Sun is below the horizon, so everything here is shadow!');
    this.script.shadowQuiz[1] = { ...this.script.shadowQuiz[1], text: answer };
    await this.dialogue.play('shadowQuiz');
    logData(this.state, 'sunAngleShadow');
    this.unlock('longShadows');
  }

  private async deployAntenna(): Promise<void> {
    this.antennaDone = true;
    this.antennaMast.isVisible = true;
    if (this.sky.earthElevDeg <= 0) {
      this.hud.toast(tr('Earth is below the horizon — no direct link to Houston right now.'), 5);
      return;
    }
    await this.dialogue.play('houstonWelcome');
    logData(this.state, 'commDelay');
    this.unlock('lightDelay');
  }
}
