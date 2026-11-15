import type { Music } from './musicEngine';
import { loadVolume } from '../core/pause';
import { tr } from '../i18n/i18n';
import { loadMusicOn, saveMusicOn, type MusicInputs } from './musicMood';

const storage = (): Storage | null => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

/** Browsers only start audio after a user gesture: unlock on the first key press or click. */
export function attachMusicUnlock(music: Music): void {
  music.setOn(loadMusicOn(storage()));
  music.setVolume(loadVolume(storage()));
  const go = () => {
    music.unlock();
    window.removeEventListener('keydown', go, true);
    window.removeEventListener('pointerdown', go);
  };
  window.addEventListener('keydown', go, true);
  window.addEventListener('pointerdown', go);
}

/** B: music on/off, remembered for this browser. Returns the toast text. */
export function toggleMusic(music: Music): string {
  const on = !music.on;
  music.setOn(on);
  saveMusicOn(storage(), on);
  return tr('Music {state} · B', { state: tr(on ? 'on' : 'off') });
}

const WONDER_S = 20;
const PIP_MOTIF_EVERY_S = 60;
const MICA_MOTIF_EVERY_S = 20;

/**
 * Turns surface events into music inputs that need memory: the 20 s "wonder" after a new stop or the flag,
 * the 2 s held breath after CONTACT, and rate-limited character motifs.
 */
export function createMusicMemory() {
  let flagsSeen = 0;
  let wonderT = 0;
  let pipT = PIP_MOTIF_EVERY_S;
  let micaT = MICA_MOTIF_EVERY_S;
  return {
    /** Call each frame with the number of 'stop:*' + 'flag:planted' flags. */
    wonder(dt: number, milestoneCount: number): boolean {
      if (milestoneCount > flagsSeen) {
        wonderT = WONDER_S;
        flagsSeen = milestoneCount;
      }
      wonderT = Math.max(0, wonderT - dt);
      return wonderT > 0;
    },
    tickMotifs(dt: number): void {
      pipT += dt;
      micaT += dt;
    },
    /** True (and resets the timer) when a character's motif may play now. */
    motifReady(who: 'pip' | 'mica'): boolean {
      if (who === 'pip' && pipT >= PIP_MOTIF_EVERY_S) {
        pipT = 0;
        return true;
      }
      if (who === 'mica' && micaT >= MICA_MOTIF_EVERY_S) {
        micaT = 0;
        return true;
      }
      return false;
    },
  };
}

export type { MusicInputs };
