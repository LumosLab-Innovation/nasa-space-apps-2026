import { setFlag, unlockCard, type GameState } from '../core/gameState';
import { tr } from '../i18n/i18n';
import type { Pip } from '../pip/pip';
import type { DialogueBox } from '../ui/dialogueBox';
import type { Hud } from '../ui/hud';
import { PIP_HIDE_SPOT, PIP_PEEK_SPOT, meetStep, pipKnown, type MeetStage } from './pipMeeting';

const PEEK_SWAP_S = 2.6;

/**
 * The first meeting with Pip (Plan 7): Pip hides behind the habitat crate and leans out to look at the lander;
 * close enough, the suit radio picks up Pip muttering to its arm; E says hello.
 */
export function createPipMeeting(w: { state: GameState; dialogue: DialogueBox; hud: Hud; pip: Pip }) {
  const met = () => pipKnown(w.state.flags);
  let stage: MeetStage = met() ? 'done' : 'hidden';
  let peekT = 0;
  let out = false;

  const hideAt = (p: { x: number; z: number }) => {
    w.pip.gotoTarget = { ...p };
    w.pip.mode = 'goto';
  };
  if (stage !== 'done') {
    w.pip.root.position.x = PIP_HIDE_SPOT.x;
    w.pip.root.position.z = PIP_HIDE_SPOT.z;
    hideAt(PIP_HIDE_SPOT);
  }

  return {
    get stage(): MeetStage {
      return stage;
    },
    /** Continue from a save or a dev jump: the meeting already happened. */
    restore() {
      if (!met()) return;
      // The scene was built before the save was applied, so Pip was sent to hide: let it go.
      if (stage !== 'done' && w.pip.mode === 'goto') w.pip.mode = 'follow';
      stage = 'done';
    },
    /** Story beat, run before world interactions (it takes E while Pip is overheard). */
    update(dt: number, player: { position: { x: number; z: number } }, keyboard: { consume(code: string): boolean }, ctx: { descentActive: boolean; locked: boolean }): string | null {
      // Dev jumps and the demo set the flags after this was created: treat Pip as already met.
      if (stage !== 'done' && met() && stage !== 'greeted') {
        stage = 'done';
        if (w.pip.mode === 'goto') w.pip.mode = 'follow';
      }
      if (stage === 'done' || ctx.descentActive) return null;
      const d = Math.hypot(player.position.x - PIP_HIDE_SPOT.x, player.position.z - PIP_HIDE_SPOT.z);
      const ePressed = stage === 'overheard' && !ctx.locked && keyboard.consume('KeyE');
      const next = meetStep(stage, { playerDistM: d, ePressed, dialogueBusy: w.dialogue.busy, locked: ctx.locked });
      if (next !== stage) {
        stage = next;
        if (stage === 'overheard') {
          hideAt(PIP_PEEK_SPOT);
          w.pip.setFace('curious');
          w.hud.toast(tr('📻 Your suit radio picks up a small voice nearby…'), 4);
          void w.dialogue.play('pip_mutter');
        } else if (stage === 'greeted') {
          w.pip.mode = 'follow';
          w.pip.wave();
          void w.dialogue
            .play('pip_heard')
            .then(() => w.dialogue.play('houston_pip'))
            .then(() => w.dialogue.play('meetPip'))
            .then(() => w.dialogue.play('silenceExplain'))
            .then(() => {
              if (unlockCard(w.state, 'noSound')) w.hud.toast(tr('New discovery in your Science Notebook (Tab)'), 3);
            });
        } else if (stage === 'done') {
          setFlag(w.state, 'pip:met');
          return null;
        }
      }
      if (stage === 'peeking') {
        // Lean out to look at the lander, then duck back behind the crate.
        peekT += dt;
        if (peekT >= PEEK_SWAP_S) {
          peekT = 0;
          out = !out;
          hideAt(out ? PIP_PEEK_SPOT : PIP_HIDE_SPOT);
          w.pip.setFace(out ? 'curious' : 'worried');
        }
      }
      if (stage === 'overheard' && !w.dialogue.busy) return tr('E — say hello to Pip');
      return null;
    },
  };
}
