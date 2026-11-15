import { AdvancedDynamicTexture, Control, StackPanel, TextBlock } from '@babylonjs/gui';
import type { Scene } from '@babylonjs/core';
import type { DialogueRunner, Line, Speaker } from '../dialogue/runner';
import type { Pip } from '../pip/pip';
import { tr } from '../i18n/i18n';
import { gamePauseClock } from '../core/pause';
import { HUD_NARROW, fitHud, hudNotice } from './hudWidgets';

const NAME: Record<Speaker, string> = { pip: 'PIP', mica: 'MICA', houston: 'HOUSTON', commander: 'COMMANDER', player: 'YOU' };
const COLOR: Record<Speaker, string> = { pip: '#ffa040', mica: '#9fc4e8', houston: '#7be08a', commander: '#8fd3ff', player: '#ffffff' };

export interface DialogueBox {
  cancel(): void;
  play(id: string): Promise<void>;
  /** Called as each line appears (the music plays Pip's and MICA's motifs). */
  onLine: ((line: Line) => void) | null;
  readonly busy: boolean;
  readonly bottomInset: number;
  /** gamePauseClock.now(performance.now()) when the box last went idle (0 if never busy). */
  readonly idleSince: number;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Subtitle-style dialogue. Lines auto-advance (reading time) and Enter skips ahead. Houston lines wait for the radio delay. */
export function createDialogueBox(ui: AdvancedDynamicTexture, scene: Scene, runner: DialogueRunner, pip: Pip, onSurface = false): DialogueBox {
  const box = hudNotice('dialogue', 'message');
  box.height = '1px';
  box.adaptHeightToChildren = true;
  box.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
  box.isVisible = false;
  fitHud(ui, box, (width) => {
    const aboveResources = onSurface && width < 760;
    box.width = Math.min(510, Math.max(1, width - (onSurface && !aboveResources ? 454 : 32))) + 'px';
    box.top = (aboveResources ? (width <= HUD_NARROW ? -212 : -162) : -32) + 'px';
  });
  const stack = new StackPanel();
  stack.paddingTop = stack.paddingBottom = '6px';
  box.addControl(stack);
  const who = new TextBlock('who', '');
  who.height = '20px';
  who.fontSize = 12;
  who.fontWeight = 'bold';
  who.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
  who.paddingLeft = '18px';
  stack.addControl(who);
  const text = new TextBlock('what', '');
  text.fontSize = 15;
  text.color = 'white';
  text.textWrapping = true;
  text.resizeToFit = true;
  text.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
  text.paddingLeft = text.paddingRight = '18px';
  stack.addControl(text);
  const waiting = new TextBlock('radio', '');
  waiting.height = '20px';
  waiting.isVisible = false;
  waiting.fontSize = 14;
  waiting.color = '#7be08a';
  waiting.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
  waiting.paddingLeft = '18px';
  stack.addControl(waiting);
  ui.addControl(box);

  let skip = false;
  let cancelled = false;
  const nextLine = (event: KeyboardEvent) => {
    if (event.code === 'Enter' && !event.repeat && !gamePauseClock.isPaused) skip = true;
  };
  window.addEventListener('keydown', nextLine);
  scene.onDisposeObservable.addOnce(() => window.removeEventListener('keydown', nextLine));

  const wait = async (ms: number, skippable: boolean) => {
    skip = false;
    const end = gamePauseClock.now(performance.now()) + ms;
    while (!cancelled && !scene.isDisposed && (gamePauseClock.isPaused || (gamePauseClock.now(performance.now()) < end && (!skippable || !skip)))) {
      await sleep(50);
    }
  };

  const pending = new Map<string, Promise<void>>();
  let idleSince = 0;
  let queue = Promise.resolve();

  async function show(line: Line): Promise<void> {
    if (line.face && line.speaker === 'pip') pip.setFace(line.face);
    if (line.pauseBeforeMs) {
      // Silence beats keep the box hidden; Houston shows the radio delay ticking.
      if (line.speaker === 'houston') {
        box.isVisible = true;
        who.text = tr(NAME.houston);
        who.color = COLOR.houston;
        text.text = '…';
        waiting.isVisible = true;
        waiting.text = tr('radio signal travelling {s} s round trip…', { s: (line.pauseBeforeMs / 1000).toFixed(1) });
      } else {
        box.isVisible = false;
      }
      await wait(line.pauseBeforeMs, false);
      if (scene.isDisposed || cancelled) return;
    }
    waiting.isVisible = false;
    if (!line.text) return;
    box.isVisible = true;
    who.text = tr(NAME[line.speaker]);
    who.color = COLOR[line.speaker];
    text.text = line.text;
    pip.talking = line.speaker === 'pip';
    api.onLine?.(line);
    await wait(1800 + line.text.length * 45, true);
    pip.talking = false;
  }

  const api: DialogueBox = {
    cancel() { cancelled=true;pending.clear();pip.talking=false;box.isVisible=false;window.removeEventListener('keydown',nextLine); },
    onLine: null,
    get busy() {
      return pending.size > 0;
    },
    get bottomInset() {
      return box.isVisible ? box.heightInPixels - box.topInPixels : 0;
    },
    get idleSince() {
      return idleSince;
    },
    play(id: string) {
      if (cancelled || scene.isDisposed) return Promise.resolve();
      const existing = pending.get(id);
      if (existing) return existing;
      const next = queue.then(async () => {
        while (gamePauseClock.isPaused && !scene.isDisposed && !cancelled) await sleep(50);
        if (scene.isDisposed || cancelled) return;
        let line: Line | null = runner.start(id);
        while (line) {
          await show(line);
          if (scene.isDisposed || cancelled) return;
          line = runner.next();
        }
        box.isVisible = false;
      }).finally(() => {
        pending.delete(id);
        if (!pending.size) {
          box.isVisible = false;
          pip.talking = false;
          idleSince = gamePauseClock.now(performance.now());
        }
      });
      pending.set(id, next);
      // A failed script must not prevent later dialogue from playing; its caller still receives the error.
      queue = next.catch(() => {});
      return next;
    },
  };
  return api;
}
