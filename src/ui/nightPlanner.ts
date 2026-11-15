import { gamePauseClock } from '../core/pause';
import type { GameClock } from '../core/clock';
import { setFlag, unlockCard, type GameState } from '../core/gameState';
import type { CampNight } from '../data/night';
import type { Mica } from '../mica/mica';
import type { Pip } from '../pip/pip';
import { leaksFixed } from '../story/heatLeaks';
import { NIGHT, budget, nightDays, nightDialogue, perDay, resolveNight, type NightPlan } from '../story/nightBudget';
import type { DialogueBox } from './dialogueBox';
import type { Hud } from './hud';
import { enterAllowed, readDigit } from './inputLock';
import type { StoryPanel } from './storyPanel';
import { tr } from '../i18n/i18n';

const TURN_S = 8;

type Phase = 'idle' | 'plan' | 'offer' | 'turns';

/**
 * The long night (v2 scenes 5.2–5.5): set the energy budget, face MICA's offer if it does not fit, then
 * watch four night-days pass while the clock jumps through the real night.
 */
export function createNightPlanner(
  panel: StoryPanel, keyboard: { consume(code: string): boolean }, state: GameState, dialogue: DialogueBox, hud: Hud,
  pip: Pip, mica: () => Mica, clock: GameClock, night: CampNight | null, onPlanned: () => void, onDone: () => void,
) {
  let phase: Phase = 'idle';
  let plan: NightPlan = { lights: true, comms: true, mica: true };
  let final: NightPlan = plan;
  let turn = 0;
  let turnT = 0;
  const hours = night?.hours ?? 86;
  const days = nightDays(hours);
  const leaks = () => leaksFixed(state.flags);
  const onoff = (b: boolean) => (b ? tr('ON') : tr('off'));
  const outcome = (p: NightPlan) => [
    tr('MICA {m} · Lights {l} · Comms {c} · Freezer {f}', { m: p.mica ? tr('kept warm') : tr('asleep'), l: onoff(p.lights), c: onoff(p.comms), f: onoff(p.freezer !== false) }),
    tr('Total demand: {need}% / {cap}%', { need: budget(p, leaks(), days).need, cap: NIGHT.capacity }),
  ].join('\n');
  const dataCost = () => state.dataLogs.size
    ? tr('Freezer off: lose the most recent science data log. Collected samples stay in your notebook.')
    : tr('Freezer off: no data log to lose. Collected samples stay in your notebook.');
  const preview = (keepMica: boolean) => {
    const r = resolveNight({ ...plan, mica: keepMica }, leaks(), days);
    return outcome(r.plan) + (r.dataLost ? '\n' + dataCost() : '');
  };

  const planBody = () => {
    const b = budget(plan, leaks(), days);
    const heat = NIGHT.shelterHeat - NIGHT.perLeakSaved * leaks();
    return [
      tr('Battery reserve: {cap}%   ·   Night: {h} hours = {d} night-days', { cap: NIGHT.capacity, h: hours.toFixed(0), d: days }),
      tr('Shelter heater {heat}%/day (heat leaks sealed: {l}/3) · Pip battery warmer {p}% · MICA battery warmer {m}%', { heat, l: leaks(), p: NIGHT.pipWarm, m: NIGHT.micaWarm }),
      tr('Sample freezer: {f}%/day', { f: NIGHT.freezer }),
      tr('Lights {lp}% ({lo}) · Comms with Houston {cp}% ({co})', { lp: NIGHT.lights, lo: onoff(plan.lights), cp: NIGHT.comms, co: onoff(plan.comms) }),
      tr('NEED: {need}% of {cap}%  →  {verdict}', { need: b.need, cap: NIGHT.capacity, verdict: b.enough ? tr('enough for everyone') : tr('NOT ENOUGH') }),
    ].join('\n');
  };
  const showPlan = () =>
    panel.show({
      title: tr('The long night: energy budget'),
      body: planBody(),
      options: [tr('Lights: {s}', { s: onoff(plan.lights) }), tr('Comms: {s} — Earth stays up, but every watt counts. Houston will understand.', { s: onoff(plan.comms) })],
      footer: tr('Press 1 or 2 to switch · Enter to confirm'),
    });

  const startTurns = () => {
    phase = 'turns';
    turn = 0;
    turnT = TURN_S; // first turn starts at once
    onPlanned();
  };

  const commit = (keepMica: boolean) => {
    const r = resolveNight({ ...plan, mica: keepMica }, leaks(), days);
    final = r.plan;
    setFlag(state, keepMica ? 'act5:keptMica' : 'act5:micaSlept');
    if (!final.comms) setFlag(state, 'act5:commsOff');
    if (!final.lights) setFlag(state, 'act5:lightsOff');
    if (r.dataLost) {
      setFlag(state, 'act5:freezerOff');
      const last = [...state.dataLogs].pop();
      if (last) {
        state.dataLogs.delete(last);
        setFlag(state, 'act5:dataLost');
        hud.toast(tr('Sample freezer switched off to keep MICA warm: one science data log lost'), 6);
      } else {
        hud.toast(tr('Sample freezer switched off to keep MICA warm (no data logs on board yet)'), 6);
      }
    }
    panel.show({
      title: tr('Night plan confirmed'),
      body: outcome(final),
      footer: r.dataLost
        ? (state.flags.has('act5:dataLost') ? tr('One science data log lost; collected samples kept.') : tr('No data log lost; collected samples kept.'))
        : tr('Science data preserved. The night is beginning…'),
    });
    startTurns();
  };

  return {
    get active() {
      return phase !== 'idle';
    },
    open() {
      if (phase !== 'idle') return;
      phase = 'plan';
      plan = { lights: true, comms: true, mica: true };
      showPlan();
    },
    update(dt: number): void {
      if (phase === 'plan') {
        const k = readDigit(keyboard, 2);
        if (k === 1) plan = { ...plan, lights: !plan.lights };
        if (k === 2) plan = { ...plan, comms: !plan.comms };
        if (k) showPlan();
        if (enterAllowed(dialogue.busy, dialogue.idleSince, gamePauseClock.now(performance.now())) && keyboard.consume('Enter')) {
          if (budget(plan, leaks(), days).enough) {
            void dialogue.play('mica_enough');
            commit(true);
          } else {
            phase = 'offer';
            panel.show({
              title: tr('Not enough energy for all three'),
              body: tr('MICA: "Analysis: energy insufficient for three. I am an old robot. Proposal: shut me down to save energy for you."\n(Keeping MICA warm needs {need}% of {cap}%.)', { need: perDay({ ...plan, mica: true }, leaks()) * days, cap: NIGHT.capacity }),
              options: [tr("Keep MICA warm, we'll make it work") + '\n' + preview(true), tr('Let MICA sleep until dawn') + '\n' + preview(false)],
              footer: tr('Press 1 or 2'),
            });
            void dialogue.play('mica_offer');
          }
        }
        return;
      }
      if (phase === 'offer') {
        const k = readDigit(keyboard, 2);
        if (k === 1) {
          void dialogue.play('mica_kept');
          commit(true);
        } else if (k === 2) {
          void dialogue.play('mica_slept').then(() => mica().setAwake(false));
          commit(false);
        }
        return;
      }
      if (phase === 'turns') {
        turnT += dt;
        if (turnT < TURN_S || dialogue.busy) return;
        turnT = 0;
        if (turn >= days) {
          phase = 'idle';
          panel.hide();
          if (unlockCard(state, 'lunarNight')) hud.toast(tr('New discovery in your Science Notebook (Tab)'), 3);
          onDone();
          return;
        }
        turn++;
        if (night) clock.jumpTo(night.sunsetMs + ((turn - 0.5) / days) * (night.dawnMs - night.sunsetMs));
        const left = Math.max(0, NIGHT.capacity - perDay(final, leaks()) * turn);
        panel.show({
          title: tr('Night day {t}/{d}', { t: turn, d: days }),
          body: tr('Battery reserve: {left}%   ·   Outside: about −200 °C\nShelter warm · Pip {pip} · MICA {mica} · Lights {l} · Comms {c}', { left, pip: turn === 1 ? tr('getting sleepy') : tr('hibernating'), mica: final.mica ? tr('kept warm') : tr('asleep'), l: onoff(final.lights), c: onoff(final.comms) }),
          footer: tr('Sample freezer: {s} · Total demand: {need}% / {cap}%', { s: onoff(final.freezer !== false), need: budget(final, leaks(), days).need, cap: NIGHT.capacity }),
        });
        const spoken = dialogue.play(nightDialogue(turn, final));
        if (turn === 1) void spoken.then(() => pip.sleep(true));
      }
    },
  };
}
