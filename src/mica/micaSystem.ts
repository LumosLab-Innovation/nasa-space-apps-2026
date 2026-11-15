import { addCasters } from '../models/optimize';
import type { Scene } from '@babylonjs/core';
import { setFlag, unlockCard, type GameState } from '../core/gameState';
import type { Heightmap } from '../data/heightmap';
import type { Pip } from '../pip/pip';
import type { Astronaut } from '../player/astronaut';
import type { DialogueBox } from '../ui/dialogueBox';
import type { Hud } from '../ui/hud';
import type { Sky } from '../world/sky';
import { createTracks } from '../world/tracks';
import { MICA_POS, TRACKS_PATH } from '../world/zones';
import { Mica } from './mica';
import { nextMicaStage, type MicaStage } from './sequence';
import { tr } from '../i18n/i18n';

/** Act 3: noticing the tracks, following them, and finding MICA (spec §6 scenes 3.1–3.4). */
export class MicaSystem {
  readonly mica: Mica;
  stage: MicaStage = 'hidden';
  /** True during the silent beat so the scene can hide HUD chatter. */
  silent = false;

  constructor(
    scene: Scene,
    hm: Heightmap,
    private readonly state: GameState,
    private readonly dialogue: DialogueBox,
    private readonly pip: Pip,
    private readonly sky: Sky,
    private readonly hud: Hud,
    mica?: Mica,
  ) {
    const tracks = createTracks(scene, TRACKS_PATH, hm);
    void tracks;
    this.mica = mica ?? new Mica(scene, hm, MICA_POS);
    addCasters(sky.shadows, this.mica.meshes);
  }

  update(player: Astronaut): void {
    const p = { x: player.position.x, z: player.position.z };
    const next = nextMicaStage(this.stage, this.state, p, TRACKS_PATH[0], MICA_POS);
    if (next === this.stage) return;
    const prev = this.stage;
    this.stage = next;
    if (next === 'tracksSeen') {
      this.pip.setFace('curious');
      void this.dialogue.play('tracksFound');
    } else if (next === 'following') {
      void this.dialogue.play('followTracks').then(() => {
        if (unlockCard(this.state, 'tracksLast')) this.hud.toast(tr('New discovery in your Science Notebook (Tab)'), 3);
      });
    } else if (next === 'found') {
      void this.found(prev);
    }
  }

  private async found(prev: MicaStage): Promise<void> {
    setFlag(this.state, prev === 'hidden' ? 'act3:micaFoundDirect' : 'act3:micaFoundViaTracks');
    this.silent = true;
    this.pip.mode = 'wait';
    this.hud.showPrompt(null);
    await this.dialogue.play('micaFound');
    this.silent = false;
    this.pip.mode = 'follow';
    // Houston can only answer while Earth is above the horizon (real ephemeris).
    await this.dialogue.play(this.sky.earthElevDeg > 0 ? 'micaIdentify' : 'micaIdentifyEarthDown');
    setFlag(this.state, 'act3:micaFound');
    for (const card of ['apollo17Dust', 'micaFiction']) unlockCard(this.state, card);
    this.hud.toast(tr('New discoveries in your Science Notebook (Tab)'), 3);
    this.hud.toast(tr('Ask Pip to tow MICA back to camp: stand by MICA and press Q'), 6);
  }
}
