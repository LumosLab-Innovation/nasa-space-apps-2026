import { setFlag, unlockCard, type GameState } from '../core/gameState';
import { checkOrder, memoryPhotos, type MemoryPhoto } from '../mica/memoryPuzzle';
import type { Pip } from '../pip/pip';
import type { DialogueBox } from './dialogueBox';
import type { Hud } from './hud';
import { readDigit } from './inputLock';
import type { StoryPanel } from './storyPanel';
import { tr } from '../i18n/i18n';

const W = 1000;
const H = 250;
const CELL = W / 5;

/** One of MICA's photos seen from above: the reference rock, its long shadow, a north arrow. */
export function drawMemoryPhoto(ctx: CanvasRenderingContext2D, x0: number, p: MemoryPhoto, label: string, first: boolean, picked: number | null): void {
  const s = CELL - 16;
  const x = x0 + 8;
  const y = 30;
  ctx.fillStyle = '#2a2a2c';
  ctx.fillRect(x, y, s, s);
  // grain noise so it reads as a photo of regolith (deterministic per photo)
  let seed = p.day * 977;
  for (let i = 0; i < 220; i++) {
    seed = (seed * 16807) % 2147483647;
    const gx = x + (seed % s);
    seed = (seed * 16807) % 2147483647;
    const gy = y + (seed % s);
    ctx.fillStyle = i % 2 ? '#3a3a3d' : '#232325';
    ctx.fillRect(gx, gy, 2, 2);
  }
  const cx = x + s / 2;
  const cy = y + s / 2;
  const a = (p.shadowAzDeg * Math.PI) / 180; // azimuth 0 = up (north), 90 = right (east)
  const len = s * 0.45;
  // Canvas y grows downward: along-shadow d = (sin a, −cos a), across it q = (cos a, sin a).
  const dx = Math.sin(a);
  const dy = -Math.cos(a);
  const qx = Math.cos(a);
  const qy = Math.sin(a);
  ctx.fillStyle = '#050506';
  ctx.beginPath();
  ctx.moveTo(cx + qx * 9, cy + qy * 9);
  ctx.lineTo(cx + dx * len + qx * 4, cy + dy * len + qy * 4);
  ctx.lineTo(cx + dx * len - qx * 4, cy + dy * len - qy * 4);
  ctx.lineTo(cx - qx * 9, cy - qy * 9);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#9b958c';
  ctx.beginPath();
  ctx.arc(cx, cy, 10, 0, Math.PI * 2);
  ctx.fill();
  // north arrow
  ctx.strokeStyle = '#ffb060';
  ctx.fillStyle = '#ffb060';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + s - 16, y + 34);
  ctx.lineTo(x + s - 16, y + 12);
  ctx.stroke();
  ctx.font = 'bold 12px system-ui';
  ctx.fillText(tr('N'), x + s - 20, y + 48);
  ctx.fillStyle = picked !== null ? '#7be08a' : 'white';
  ctx.font = 'bold 18px system-ui';
  ctx.fillText(picked !== null ? `${label}  ✓ #${picked}` : label, x, y - 8);
  if (first) {
    ctx.fillStyle = '#ffd27a';
    ctx.font = '13px system-ui';
    ctx.fillText(tr('FIRST (day 663)'), x, y + s + 18);
  }
}

/**
 * The memory puzzle panel (v2 scene 4.5): press 1–5 to pick the photos in time order. Solving it sets
 * `act4:memory` and plays MICA's recovered log.
 */
export function createMemoryPuzzleView(panel: StoryPanel, keyboard: { consume(code: string): boolean }, dialogue: DialogueBox, state: GameState, hud: Hud, pip: Pip) {
  const { photos, order } = memoryPhotos(Math.floor(Math.random() * 1e6));
  const firstIdx = order[0];
  let picked: number[] = [];
  let wrong = 0;
  let active = false;
  const canvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;

  const draw = () => {
    if (!canvas) return;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#0b0d12';
    ctx.fillRect(0, 0, W, H);
    photos.forEach((p, i) => drawMemoryPhoto(ctx, i * CELL, p, `${i + 1}`, i === firstIdx, picked.includes(i) ? picked.indexOf(i) + 1 : null));
    panel.setCanvas(canvas);
  };

  return {
    get active() {
      return active;
    },
    /** Chronological display indices (used by dev playtests and ?jump shortcuts). */
    get solution(): number[] {
      return [...order];
    },
    open() {
      if (active || state.flags.has('act4:memory')) return;
      active = true;
      picked = [firstIdx];
      wrong = 0;
      panel.show({
        title: tr("MICA's memory: photos of the same rock, dates corrupted"),
        body: tr('The first photo is marked. Press 1–5 to pick the others in the order they were taken.'),
        footer: tr('Clue: shadows point away from the Sun.'),
      });
      draw();
    },
    update(): void {
      if (!active) return;
      const k = readDigit(keyboard, 5);
      if (k === null || picked.includes(k - 1)) return;
      picked.push(k - 1);
      const r = checkOrder(picked, order);
      if (r === 'wrong') {
        wrong++;
        picked = picked.slice(0, -1);
        pip.setFace('curious');
        if (wrong >= 2) {
          picked = [firstIdx];
          wrong = 0;
          panel.setFooter(tr('Pip: The Sun creeps around the horizon about 12° a day, so shadows turn too: counter-clockwise on these photos. Start again from the first one!'));
        } else {
          panel.setFooter(tr('Not that one. Compare each shadow with the last photo you picked.'));
        }
      }
      draw();
      if (r === 'ok') {
        active = false;
        panel.hide();
        setFlag(state, 'act4:memory');
        pip.setFace('excited');
        if (unlockCard(state, 'shadowClock')) hud.toast(tr('New discovery in your Science Notebook (Tab)'), 3);
        // Queued together: the dialogue queue is serial, so the beacon line (queued next frame) comes after both.
        void dialogue.play('mica_logs');
        void dialogue.play('mica_mission');
      }
    },
  };
}
