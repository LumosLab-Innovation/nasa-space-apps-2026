import { setFlag, unlockCard, type GameState } from '../core/gameState';
import type { Ephemeris } from '../data/ephemeris';
import type { Heightmap } from '../data/heightmap';
import type { CampNight } from '../data/night';
import type { Mica } from '../mica/mica';
import type { Pip } from '../pip/pip';
import { drawHorizon, horizonProfile, notchCandidates, parkYawForSunAz, sunPath } from '../story/sunriseNotch';
import { SHELTER_POS, zone } from '../world/zones';
import type { DialogueBox } from './dialogueBox';
import type { Hud } from './hud';
import { readDigit } from './inputLock';
import type { StoryPanel } from './storyPanel';
import { tr } from '../i18n/i18n';

const W = 760;
const H = 250;

/** The horizon view at the shelter (Act 5 prep): pick 1–4 where the Sun will come back. */
export function createHorizonView(
  panel: StoryPanel, keyboard: { consume(code: string): boolean }, hm: Heightmap, e: Ephemeris, night: CampNight,
  state: GameState, dialogue: DialogueBox, hud: Hud, pip: Pip, mica: () => Mica, nowMs: () => number,
) {
  const at = zone('base');
  let profile: ReturnType<typeof horizonProfile> | null = null; // ray-marched once, on first open
  const path = sunPath(e, night);
  let cands: ReturnType<typeof notchCandidates> | null = null;
  let active = false;
  const canvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;

  return {
    get active() {
      return active;
    },
    open() {
      if (active) return;
      profile ??= horizonProfile(hm, at);
      cands ??= notchCandidates(profile, night);
      active = true;
      const first = !state.flags.has('dialogue:notch_intro:done');
      panel.show({
        title: tr('Horizon view: where will the Sun rise again?'),
        body: tr('Real hills around camp (LOLA) and the real Sun (JPL). Filled dot: Sun visible · hollow: hidden.'),
        options: cands.azDeg.map((az, i) => tr('{letter}: aim at {az}°', { letter: 'ABCD'[i], az })),
        footer: tr('Press 1–4 to aim Pip and MICA at a notch · Esc to close'),
      });
      if (canvas) {
        canvas.width = W;
        canvas.height = H;
        drawHorizon(canvas.getContext('2d')!, W, H, profile, path, nowMs(), cands.azDeg);
        panel.setCanvas(canvas);
      }
      if (first) void dialogue.play('notch_intro');
    },
    update(): void {
      if (!active || !cands) return;
      if (keyboard.consume('Escape')) {
        active = false;
        panel.hide();
        return;
      }
      const k = readDigit(keyboard, 4);
      if (k === null) return;
      const i = k - 1;
      const az = cands.azDeg[i];
      for (const f of [...state.flags]) if (f.startsWith('act5:notch:')) state.flags.delete(f);
      state.flags.delete('act5:notchCorrect');
      setFlag(state, `act5:notch:${i}`);
      setFlag(state, 'act5:notchChosen');
      if (i === cands.correct) setFlag(state, 'act5:notchCorrect');
      // Park Pip beside the shelter with a side panel facing the notch; MICA turns the same way.
      pip.root.position.set(SHELTER_POS.x + 5, pip.root.position.y, SHELTER_POS.z + 3);
      pip.parkYaw(parkYawForSunAz(az));
      mica().root.rotation.y = parkYawForSunAz(az);
      active = false;
      panel.hide();
      void dialogue.play('notch_pick');
      if (unlockCard(state, 'peaksOfLight')) hud.toast(tr('New discovery in your Science Notebook (Tab)'), 3);
    },
  };
}
