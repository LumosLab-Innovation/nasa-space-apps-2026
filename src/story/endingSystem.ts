import { ArcRotateCamera, Vector3, type Scene, type TransformNode } from '@babylonjs/core';
import type { GameClock } from '../core/clock';
import { setFlag, type GameState } from '../core/gameState';
import type { CampNight } from '../data/night';
import { sampleHeight, type Heightmap } from '../data/heightmap';
import type { DustSystem } from '../fx/dustSystem';
import type { Mica } from '../mica/mica';
import type { Pip } from '../pip/pip';
import type { Astronaut } from '../player/astronaut';
import type { DialogueBox } from '../ui/dialogueBox';
import type { Hud } from '../ui/hud';
import type { InputLock } from '../ui/inputLock';
import type { StoryPanel } from '../ui/storyPanel';
import { landerSite } from '../world/landerSite';
import type { Act5Director, Act5Stage } from './act5';
import { missionRecord, realStories } from './ending';
import { readDigit } from '../ui/inputLock';
import { formatDay, sendClock } from './timeText';
import { tr } from '../i18n/i18n';
import type { HlsRig } from '../models/hlsRig';

const MIN = 60_000;
const MICA_REACH_M = 3.5;
const HLS_REACH_M = 9;
const LIFTOFF_S = 10;
const LIFTOFF_ACCEL = 3;
const PLUME_S = 3;

/** True when a point is within `reach` metres of where the lander actually stands. */
export const nearLander = (p: { x: number; z: number }, reach: number): boolean => {
  const s = landerSite();
  return Math.hypot(p.x - s.x, p.z - s.z) <= reach;
};

export interface EndingWorld {
  scene: Scene;
  hm: Heightmap;
  clock: GameClock;
  state: GameState;
  dialogue: DialogueBox;
  hud: Hud;
  pip: Pip;
  mica: () => Mica;
  dust: DustSystem;
  lock: InputLock;
  panel: StoryPanel;
  hls: TransformNode;
  hlsRig?: HlsRig;
  totalCards: number;
  cards: { id: string; title: string; body: string }[];
}

/**
 * Dawn through the notch, MICA's data home before Earth sets, farewell, liftoff and the Mission Record
 * (v2 K.1–K.5). Driven by act5's director from the 'dawn' stage on.
 */
export function createEnding(w: EndingWorld, d: Act5Director, night: CampNight | null) {
  let enteredDawn = false;
  let woke = false;
  let commsBack = false;
  let liftT = -1;
  let plumeAcc = 0;
  let cam: ArcRotateCamera | null = null;
  let recordShown = false;
  let hls0 = 0;

  const hoursToEarthSet = () => (night ? Math.max(0, (night.earthSetMs - w.clock.nowMs) / 3600_000) : 20);

  // The five real stories (K.5) are read right here: the record panel holds the input lock, so the
  // notebook (Tab) is not reachable from it (final review, Plan 4).
  const stories = realStories(w.cards);
  const showRecord = () => {
    for (const s of stories) w.state.unlockedCards.add(s.id);
    const r = missionRecord(w.state, w.totalCards);
    w.panel.show({
      title: tr('MISSION RECORD · Artemis IV · Shackleton Camp'),
      body: [...r.lines, '', ...r.decisions].join('\n'),
      options: stories.map((s) => s.title),
      footer: tr('Press 1–5 to read a real story · R — play again\n"Dust, darkness and silence are still unsolved problems. Maybe you will be the one to solve them."'),
    });
  };
  const showStory = (i: number) => {
    const s = stories[i];
    w.panel.show({ title: s.title, body: s.body, footer: tr('0 — back to the Mission Record · 1–5 another story · R — play again') });
  };

  return {
    update(stage: Act5Stage, dt: number, player: Astronaut, keyboard: { consume(code: string): boolean }): string | null {
      const pos = player.position;
      if (stage === 'dawn') {
        if (!enteredDawn) {
          enteredDawn = true;
          if (night) {
            w.clock.jumpTo(night.dawnMs - 90 * MIN);
            w.clock.fastForwardTo(night.dawnMs + 20 * MIN, 15);
          }
          w.hud.toast(night ? tr('{date} · the night is ending', { date: formatDay(night.dawnMs) }) : tr('The night is ending'), 5);
        }
        if (!woke && !w.clock.fastForwarding && (!night || w.clock.nowMs >= night.dawnMs)) {
          woke = true;
          w.pip.sleep(false);
          const good = w.state.flags.has('act5:notchCorrect');
          void w.dialogue.play(good ? 'dawn_pip_good' : 'dawn_pip_late').then(() => {
            const m = w.mica();
            if (w.state.flags.has('act5:micaSlept')) {
              m.setAwake(true);
              return w.dialogue.play('dawn_mica_slept');
            }
            return w.dialogue.play('dawn_mica_kept');
          });
          d.next('dawnDone');
        }
        return null;
      }
      if (stage === 'sendData') {
        // Story first: Earth never sets while MICA's data is still waiting (ledger ruling, Plan 5).
        if (night) w.clock.capAt(sendClock(w.clock.nowMs, night.earthSetMs));
        const m = w.mica().root.position;
        if (Math.hypot(pos.x - m.x, pos.z - m.z) > MICA_REACH_M || w.dialogue.busy) {
          return tr("Send MICA's data before Earth sets (in {h} h): go to MICA", { h: hoursToEarthSet().toFixed(0) });
        }
        if (w.state.flags.has('act5:commsOff') && !commsBack) {
          if (keyboard.consume('KeyE')) {
            commsBack = true;
            void w.dialogue.play('comms_on');
            return null;
          }
          return tr('E — power the comms back on');
        }
        if (keyboard.consume('KeyE')) {
          setFlag(w.state, 'ending:dataSent');
          void w.dialogue.play('send_data');
          d.next('dataSent');
          return null;
        }
        return tr("E — send MICA's data to Houston (Earth sets in {h} h)", { h: hoursToEarthSet().toFixed(0) });
      }
      if (stage === 'farewell') {
        if (!nearLander(pos, HLS_REACH_M)) return tr('Time to go home: walk to the lander');
        if (w.dialogue.busy) return null;
        if (keyboard.consume('KeyE')) {
          w.lock.push('liftoff');
          void w.dialogue.play('farewell').then(() => {
            // Wide shot from 120 m: the lander rises on its plume while Pip waves and MICA blinks.
            const target = w.hls.position.add(new Vector3(0, 20, 0));
            cam = new ArcRotateCamera('liftoffCam', Math.PI * 0.25, 1.35, 120, target, w.scene);
            cam.maxZ = 8000;
            w.scene.activeCamera = cam;
            // Between the camera (alpha 45°) and the lander, so both robots are in the shot.
            const site = landerSite();
            const side = { x: site.x + 26, z: site.z + 26 };
            w.pip.root.position.set(side.x, sampleHeight(w.hm, side.x, side.z), side.z);
            w.pip.mode = 'wait';
            w.mica().root.position.set(side.x + 4, sampleHeight(w.hm, side.x + 4, side.z - 3), side.z - 3);
            player.root.setEnabled(false);
            hls0 = w.hls.position.y;
            liftT = 0;
            w.hlsRig?.setTargets(1, 0);
            d.next('boarded');
          });
          return null;
        }
        return tr('E — take the elevator back to Starship');
      }
      if (stage === 'liftoff') {
        if (liftT < 0) return null;
        if (w.hlsRig && !w.hlsRig.elevatorStowed) return null;
        liftT += dt;
        w.hls.position.y = hls0 + 0.5 * LIFTOFF_ACCEL * liftT * liftT;
        if (w.hls.position.y - hls0 > 2) w.hlsRig?.setTargets(0, 0);
        // The camera tilts up slowly instead of chasing the ship, so it climbs out of frame.
        if (cam) cam.target = new Vector3(landerSite().x, hls0 + 20 + Math.min(w.hls.position.y - hls0, 80) * 0.5, landerSite().z);
        if (liftT < PLUME_S) {
          plumeAcc += dt;
          while (plumeAcc >= 0.1) {
            plumeAcc -= 0.1;
            w.dust.plume(new Vector3(landerSite().x, hls0, landerSite().z), 25, 70);
          }
        }
        if (Math.floor(liftT * 2) !== Math.floor((liftT - dt) * 2)) w.pip.wave();
        if (liftT >= LIFTOFF_S) {
          w.lock.pop('liftoff');
          d.next('liftoffDone');
        }
        return null;
      }
      if (stage === 'record') {
        if (!recordShown) {
          recordShown = true;
          showRecord();
        }
        const k = readDigit(keyboard, stories.length);
        if (k) showStory(k - 1);
        if (keyboard.consume('Digit0') || keyboard.consume('Numpad0')) showRecord();
        if (keyboard.consume('KeyR')) location.reload();
        return null;
      }
      return null;
    },
  };
}
