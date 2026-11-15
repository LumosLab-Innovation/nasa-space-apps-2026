import { AdvancedDynamicTexture, Control } from '@babylonjs/gui';
import type { Scene } from '@babylonjs/core';
import { gamePauseClock } from '../core/pause';
import { tr } from '../i18n/i18n';
import { HUD_MARGIN, HUD_NARROW, fitHud, hudHeading, hudMetric, hudNotice, hudNumber, hudPair, hudStack, hudText, placeTopReadouts } from './hudWidgets';
import { menuColors } from './menuControls';

export interface SurfaceReadout {
  nowMs: number;
  modules: number;
  samples: number;
  sunElevation: number;
  earthElevation: number;
}

export interface Hud {
  ui: AdvancedDynamicTexture;
  showPrompt(text: string | null, dialogueInset?: number): void;
  toast(text: string, seconds?: number): void;
  setStatus(status: SurfaceReadout | null): void;
  setHint(text: string | null): void;
}

export function createHud(scene: Scene): Hud {
  const ui = AdvancedDynamicTexture.CreateFullscreenUI('hud', true, scene);
  // UI must stay readable when Pip's thermal post-process is on.
  if (ui.layer) ui.layer.applyPostProcess = false;

  const status = hudStack('surfaceStatus');
  status.spacing = 4;
  status.isVisible = false;
  placeTopReadouts(ui, status, 258);
  const heading = hudHeading();
  const modules = hudMetric();
  const samples = hudMetric();
  const time = hudText('', 12, menuColors.muted);
  const environment = hudText('', 12, menuColors.ice);
  time.height = environment.height = '16px';
  status.addControl(heading.control);
  status.addControl(hudPair(modules.control, samples.control, 45));
  status.addControl(time);
  status.addControl(environment);

  const prompt = hudNotice('prompt', 'message');
  prompt.height = '38px';
  prompt.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
  prompt.isVisible = false;
  const keycap = hudNotice('promptKeycap');
  keycap.background = '#162A45';
  keycap.cornerRadius = keycap.cornerRadiusY = 3;
  keycap.height = '21px';
  keycap.left = '10px';
  keycap.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
  const key = hudText('', 12, menuColors.ice);
  key.fontWeight = '700';
  key.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
  keycap.addControl(key);
  prompt.addControl(keycap);
  const promptText = hudText('', 14);
  promptText.textWrapping = true;
  promptText.paddingRight = '12px';
  prompt.addControl(promptText);
  let canvasWidth = 0;
  let lastPrompt = '';
  let promptWidth = 0;
  fitHud(ui, prompt, (width) => {
    canvasWidth = width;
    prompt.width = Math.min(promptWidth, Math.max(1, width - 24)) + 'px';
  });
  ui.addControl(prompt);

  const toastText = hudText('', 18, '#FFD27A');
  const hint = hudText('', 16, '#9FE7FF');
  for (const message of [toastText, hint]) {
    message.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    message.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    message.textWrapping = true;
    message.resizeToFit = true;
    ui.addControl(message);
  }
  fitHud(ui, toastText, (width) => {
    const inline = width >= 1050;
    toastText.width = hint.width = Math.min(510, width - 32) + 'px';
    toastText.top = (inline ? 18 : width <= HUD_NARROW ? 189 : 135) + 'px';
    hint.top = (inline ? 49 : width <= HUD_NARROW ? 232 : 174) + 'px';
  });
  toastText.alpha = 0;
  hint.isVisible = false;

  let toastLeft = 0;
  scene.onBeforeRenderObservable.add(() => {
    if (toastLeft <= 0 || gamePauseClock.isPaused) return;
    toastLeft -= scene.getEngine().getDeltaTime() / 1000;
    toastText.alpha = Math.min(1, Math.max(0, toastLeft));
  });

  let minute = -1;
  let utcText = '';
  return {
    ui,
    showPrompt(text, dialogueInset = 0) {
      prompt.isVisible = text !== null;
      if (text === null) return;
      const aboveDialogue = dialogueInset > 0 && dialogueInset < 150;
      prompt.top = -(aboveDialogue ? dialogueInset + 8 : HUD_MARGIN) + 'px';
      if (text === lastPrompt) return;
      lastPrompt = text;
      const match = /^([\w/+ ]{1,14}) — (.+)$/.exec(text);
      const keyText = match?.[1] ?? '';
      const keyWidth = keyText ? Math.max(22, keyText.length * 8 + 10) : 0;
      keycap.isVisible = !!keyText;
      keycap.width = keyWidth + 'px';
      key.text = keyText;
      promptText.text = match?.[2] ?? text;
      promptText.paddingLeft = (keyWidth ? keyWidth + 20 : 12) + 'px';
      const context = ui.getContext();
      context.save();
      context.font = '14px Inter, system-ui, sans-serif';
      const width = context.measureText(promptText.text).width;
      context.restore();
      promptWidth = Math.ceil(width) + (keyWidth ? keyWidth + 34 : 26);
      prompt.width = Math.min(promptWidth, Math.max(1, canvasWidth - 24)) + 'px';
    },
    toast(text, seconds = 4) {
      // Discoveries are announced by the notebook polaroid fly-in instead of a text toast.
      if (text === tr('New discovery in your Science Notebook (Tab)') || text === tr('New discoveries in your Science Notebook (Tab)')) return;
      toastText.text = text;
      toastLeft = seconds;
      toastText.alpha = 1;
    },
    setStatus(readout) {
      status.isVisible = readout !== null;
      if (!readout) return;
      heading.title.text = tr('Surface exploration').toUpperCase();
      modules.update('Module', String(readout.modules), '/ 4');
      samples.update('Samples', String(readout.samples), '/ 6');
      const nextMinute = Math.floor(readout.nowMs / 60000);
      if (nextMinute !== minute) {
        minute = nextMinute;
        const iso = new Date(readout.nowMs).toISOString();
        utcText = iso.slice(0, 10) + ' · ' + iso.slice(11, 16) + ' UTC';
      }
      time.text = utcText;
      environment.text = tr('Sun {sun}°   Earth {earth}°', {
        sun: hudNumber(readout.sunElevation, 2),
        earth: hudNumber(readout.earthElevation, 1),
      });
    },
    setHint(text) {
      hint.isVisible = text !== null;
      if (text !== null) hint.text = text;
    },
  };
}
