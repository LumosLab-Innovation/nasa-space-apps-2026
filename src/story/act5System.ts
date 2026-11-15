import { gamePauseClock } from '../core/pause';
import { Control, Rectangle, TextBlock, type AdvancedDynamicTexture } from '@babylonjs/gui';
import type { GameClock } from '../core/clock';
import { setFlag, type GameState } from '../core/gameState';
import type { CampNight } from '../data/night';
import type { Pip } from '../pip/pip';
import type { Astronaut } from '../player/astronaut';
import type { DialogueBox } from '../ui/dialogueBox';
import type { Hud } from '../ui/hud';
import { enterAllowed, type InputLock } from '../ui/inputLock';
import { SHELTER_POS, zone } from '../world/zones';
import { formatDay } from './timeText';
import { Act5Director, nightBlockers, type Act5Stage } from './act5';
import { tr } from '../i18n/i18n';

const H = 3600_000;
const TITLE_S = 5;
const SHELTER_REACH_M = 5;

export interface Act5World {
  ui: AdvancedDynamicTexture;
  clock: GameClock;
  state: GameState;
  dialogue: DialogueBox;
  hud: Hud;
  pip: Pip;
  lock: InputLock;
  towing: () => boolean;
  stormActive: () => boolean;
}

/** Later tasks plug the story panels in here (horizon view, night planner, dawn/ending). */
export interface Act5Hooks {
  /** E at the shelter during prep (Task 6: the horizon view). */
  openHorizon(): void;
  /** Called once the sunset fast-forward finished (Task 8: night planner). */
  openPlanner(): void;
  /** Called every frame from 'night' on (Tasks 8–9). Returns a prompt or null. */
  updateLate(stage: Act5Stage, dt: number, player: Astronaut, keyboard: { consume(code: string): boolean }): string | null;
  /** Extra checklist lines for the prep hint (Task 7: heat leaks). */
  prepExtras(): string[];
  /** Extra prompt during prep, shown next to the shelter prompt (Task 7: heat leaks). */
  prepPrompt(player: Astronaut): string | null;
}

/** Act 5: the 11-week jump to the real camp night, then the prep checklist at the shelter. */
export function createAct5System(w: Act5World, night: CampNight | null) {
  const d = new Act5Director();
  const hooks: Act5Hooks = {
    openHorizon: () => setFlag(w.state, 'act5:notchChosen'),
    openPlanner: () => {
      d.next('plannerDone');
    },
    updateLate: () => null,
    prepExtras: () => [],
    prepPrompt: () => null,
  };
  if (!night) console.warn('No real camp night found in the ephemeris: Act 5 runs without its time jump.');

  // Full-screen title card ("11 weeks later…").
  const card = new Rectangle('act5Title');
  card.width = card.height = 1;
  card.thickness = 0;
  card.background = 'black';
  card.alpha = 0;
  card.isVisible = false;
  card.zIndex = 100;
  const cardText = new TextBlock('act5TitleText', '');
  cardText.color = 'white';
  cardText.fontSize = 34;
  cardText.fontFamily = 'system-ui, sans-serif';
  cardText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
  card.addControl(cardText);
  w.ui.addControl(card);

  let titleT = -1;
  let jumped = false;
  let ffWaiting = false;

  const inCamp = (p: { x: number; z: number }) => {
    const b = zone('base');
    return Math.hypot(p.x - b.x, p.z - b.z) <= b.radius;
  };
  const atShelter = (p: { x: number; z: number }) => Math.hypot(p.x - SHELTER_POS.x, p.z - SHELTER_POS.z) <= SHELTER_REACH_M;

  const checklist = () => {
    const box = (ok: boolean) => (ok ? '[x]' : '[ ]');
    const f = w.state.flags;
    return [
      tr('BEFORE THE SUN HIDES'),
      `${box(f.has('act5:notchChosen'))} ${tr('Horizon view at the shelter: where will the Sun rise again?')}`,
      ...hooks.prepExtras(),
      `${box(w.state.samples.has('iceRegolith'))} ${tr("Ice sample from the Dark Crater (MICA's beacon)")}`,
      tr('Then: Enter at the shelter to begin the long night'),
    ].join('   ·   ');
  };

  return {
    director: d,
    hooks,
    get stage(): Act5Stage {
      return d.stage;
    },
    update(dt: number, player: Astronaut, keyboard: { consume(code: string): boolean }): string | null {
      if (d.stage === 'waiting') {
        const ok = d.canStart({
          memory: w.state.flags.has('act4:memory'),
          inCamp: inCamp(player.position),
          dialogueBusy: w.dialogue.busy,
          towing: w.towing(),
          locked: w.lock.locked,
          stormActive: w.stormActive(),
        });
        if (!ok) return null;
        d.next('start');
        setFlag(w.state, 'act5:started');
        titleT = 0;
        if (night) {
          const at = night.sunsetMs - 6 * H;
          const weeks = Math.max(1, Math.round((at - w.clock.nowMs) / (7 * 24 * H)));
          cardText.text = tr('{weeks} weeks later…\n{date}', { weeks, date: formatDay(at) });
        } else cardText.text = tr('Weeks later…');
        card.isVisible = true;
        w.lock.push('act5Title');
        return null;
      }
      if (d.stage === 'titleCard') {
        titleT += dt;
        card.alpha = Math.min(1, titleT / 1, (TITLE_S - titleT) / 1);
        if (!jumped && titleT >= 1) {
          jumped = true;
          if (night) w.clock.jumpTo(night.sunsetMs - 6 * H);
          w.pip.root.position.set(player.position.x + 2, w.pip.root.position.y, player.position.z - 2);
        }
        if (titleT >= TITLE_S) {
          card.isVisible = false;
          w.lock.pop('act5Title');
          d.next('titleDone');
          void w.dialogue.play('act5_bridge');
          void w.dialogue.play('act5_news');
        }
        return null;
      }
      if (d.stage === 'prep') {
        // The checklist banner hides while a panel is up (it sits above the panel).
        w.hud.setHint(w.lock.locked ? null : checklist());
        if (w.lock.locked) return null;
        const extra = hooks.prepPrompt(player);
        if (!atShelter(player.position)) return extra;
        if (keyboard.consume('KeyE')) {
          hooks.openHorizon();
          return null;
        }
        // Next to a heat leak only its prompt shows (E for the horizon view still works).
        const join = (s: string) => extra ?? s;
        const blockers = nightBlockers({ notchChosen: w.state.flags.has('act5:notchChosen'), ice: w.state.samples.has('iceRegolith') });
        if (blockers.length) {
          if (enterAllowed(w.dialogue.busy, w.dialogue.idleSince, gamePauseClock.now(performance.now())) && keyboard.consume('Enter')) w.hud.toast(tr('Not yet. Before the night: {list}', { list: blockers.join(', ') }), 4);
          return join(tr('E — horizon view   ·   still to do: {list}', { list: blockers.join(', ') }));
        }
        if (enterAllowed(w.dialogue.busy, w.dialogue.idleSince, gamePauseClock.now(performance.now())) && keyboard.consume('Enter')) {
          d.next('beginNight');
          w.hud.setHint(null);
          // Into the shelter for the night; the 12 s sunset fast-forward plays without input.
          player.teleport(SHELTER_POS.x, SHELTER_POS.z);
          w.lock.push('sunsetFF');
          // Watch the shadow swallow the camp: run the clock fast until just after the real sunset.
          if (night) w.clock.fastForwardTo(Math.max(w.clock.nowMs, night.sunsetMs + 2 * H), 12);
          ffWaiting = true;
          void w.dialogue.play('act5_sunset');
          return null;
        }
        return join(tr('E — horizon view   ·   Enter — begin the long night'));
      }
      if (d.stage === 'nightPlanner') {
        if (ffWaiting && !w.clock.fastForwarding) {
          ffWaiting = false;
          w.lock.pop('sunsetFF');
          hooks.openPlanner();
        }
        return null;
      }
      return hooks.updateLate(d.stage, dt, player, keyboard);
    },
  };
}
