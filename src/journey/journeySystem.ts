import { unlockCard, type GameState } from '../core/gameState';
import type { Pip } from '../pip/pip';
import type { Astronaut } from '../player/astronaut';
import type { DialogueBox } from '../ui/dialogueBox';
import type { Hud } from '../ui/hud';
import { discoverStops, PipFarWatcher, stopName, STOPS } from './stops';
import { tr } from '../i18n/i18n';
import { pipKnown } from '../story/pipMeeting';

/** Discovers stops as the player explores and keeps Pip talking like a companion (spec v3 §7, §7.2). */
export class JourneySystem {
  private readonly far = new PipFarWatcher();

  constructor(
    private readonly state: GameState,
    private readonly dialogue: DialogueBox,
    private readonly pip: Pip,
    private readonly hud: Hud,
  ) {}

  update(dt: number, player: Astronaut): void {
    // Pip is a stranger until the first meeting (Plan 7): stops are discovered after it, with Pip's lines.
    if (!pipKnown(this.state.flags)) return;
    for (const s of discoverStops(this.state, player.position, STOPS)) {
      this.hud.toast(tr('Discovered: {name}', { name: tr(stopName(s.id)) }), 4);
      void this.dialogue.play(s.lineId);
      if (s.cardId && unlockCard(this.state, s.cardId)) this.hud.toast(tr('New discovery in your Science Notebook (Tab)'), 3);
    }
    const d = Math.hypot(this.pip.position.x - player.position.x, this.pip.position.z - player.position.z);
    if (this.far.update(dt, d) && !this.dialogue.busy) {
      this.pip.setFace('worried');
      void this.dialogue.play('pipFar');
    }
  }
}
