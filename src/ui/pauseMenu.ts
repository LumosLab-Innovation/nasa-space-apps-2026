import type { Scene } from '@babylonjs/core';
import { Control, StackPanel, type AdvancedDynamicTexture } from '@babylonjs/gui';
import type { Music } from '../audio/musicEngine';
import { gamePauseClock } from '../core/pause';
import { onLangChange, tr } from '../i18n/i18n';
import { MenuDialog, menuButton, menuColors, menuLabel, menuRule } from './menuControls';
import { HUD_ICON_GAP, HUD_ICON_SIZE, HUD_MARGIN, HUD_NARROW, fitHud, hudNotice, hudText } from './hudWidgets';
import { createMenuSettings, type MenuPhase } from './menuSettings';

export interface PauseMenu {
  readonly isOpen: boolean;
  open(): void;
  close(): void;
}

interface MissionMenuOptions {
  enabled?: () => boolean;
  music: Music | null;
  phase: () => Exclude<MenuPhase, 'main'>;
  hasSave: () => boolean;
  onRestart?: () => void;
  onSkip?: () => void;
  onMainMenu: () => void;
  onChange?: (open: boolean) => void;
}

export function createPauseMenu(ui: AdvancedDynamicTexture, scene: Scene, opts: MissionMenuOptions): PauseMenu {
  const settings = createMenuSettings(opts.music);
  let animationScale = scene.animationTimeScale;
  const dialog = new MenuDialog(ui, scene, (page, column) => {
    const phase = opts.phase();
    if (page === 'settings') return settings(column, phase, (focus) => dialog.refresh(focus), () => dialog.back());
    if (page === 'pause') {
      column.title(tr('Mission paused'));
      column.button(menuButton('resume', tr('Resume mission'), () => dialog.close(), { tone: 'primary' }));
      column.button(menuButton('settings', tr('Settings'), () => dialog.open('settings')));
      if (phase !== 'surface' && opts.onSkip) {
        column.button(menuButton('skip', tr('Skip landing'), () => {
          dialog.close();
          opts.onSkip?.();
        }, { tone: 'risk' }));
      }
      if (phase === 'surface' && opts.onRestart && opts.hasSave()) {
        column.button(menuButton('restart', tr('Restart from checkpoint'), opts.onRestart));
      }
      column.button(menuButton('main', tr('Main menu'), () => dialog.open('confirm-exit'), { tone: 'risk' }));
    } else if (page === 'confirm-exit') {
      column.title(tr('Return to the main menu?'));
      const message = opts.hasSave()
        ? tr('When you continue, you will return to the last checkpoint.')
        : tr('Progress in this mission will be lost.');
      column.add(menuLabel(message, 15, menuColors.muted), 60);
      column.button(menuButton('back', tr('Stay in mission'), () => dialog.back(), { tone: 'primary' }));
      column.button(menuButton('exit', tr('Main menu'), opts.onMainMenu, { tone: 'risk' }));
    }
  }, (open) => {
    if (open) clearToolbar();
    gamePauseClock.setPaused(open, performance.now());
    if (open) animationScale = scene.animationTimeScale;
    scene.animationTimeScale = open ? 0 : animationScale;
    opts.music?.duck(open);
    opts.onChange?.(open);
  });

  const bar = new StackPanel('missionMenuButtons');
  bar.isVertical = false;
  bar.spacing = HUD_ICON_GAP;
  bar.height = HUD_ICON_SIZE + 'px';
  bar.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
  bar.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
  bar.zIndex = 950;

  const tooltip = hudNotice('missionMenuTooltip');
  tooltip.width = '120px';
  tooltip.height = '26px';
  tooltip.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
  tooltip.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
  tooltip.zIndex = 951;
  tooltip.isVisible = false;
  const tooltipText = hudText('', 12);
  tooltipText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
  tooltip.addControl(tooltipText);
  const items = [
    { label: 'Pause', button: menuButton('pauseButton', '', () => dialog.open('pause'), { tone: 'toolbar' }) },
    { label: 'Settings', button: menuButton('settingsButton', '', () => dialog.open('settings'), { tone: 'toolbar' }) },
  ];
  const pauseIcon = items[0].button.control;
  for (const offset of [-4, 4]) {
    const stroke = menuRule('#C7DFFF');
    stroke.width = '4px';
    stroke.height = '15px';
    stroke.left = offset + 'px';
    pauseIcon.addControl(stroke);
  }
  const gear = hudText('⚙', 22, '#C7DFFF');
  gear.fontFamily = 'Segoe UI Symbol, system-ui, sans-serif';
  gear.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
  items[1].button.control.addControl(gear);
  for (const item of items) {
    item.button.control.width = item.button.control.height = HUD_ICON_SIZE + 'px';
    bar.addControl(item.button.control);
  }

  let focused = -1;
  let hovered = -1;
  let margin = HUD_MARGIN;
  const updateTooltip = () => {
    const index = hovered >= 0 ? hovered : focused;
    tooltip.isVisible = index >= 0 && !dialog.isOpen;
    if (index >= 0) {
      tooltipText.text = tr(items[index].label);
      tooltip.left = -(margin + (index === 0 ? HUD_ICON_SIZE + HUD_ICON_GAP : 0)) + 'px';
    }
    items.forEach(({ button }, index) => {
      button.control.color = index === focused || index === hovered ? menuColors.ice : '#5577A7';
    });
  };
  function clearToolbar(): void {
    focused = hovered = -1;
    updateTooltip();
  }
  items.forEach(({ button }, index) => {
    button.control.onPointerEnterObservable.add(() => { hovered = index; updateTooltip(); });
    button.control.onPointerOutObservable.add(() => { if (hovered === index) hovered = -1; updateTooltip(); });
  });

  // Tab alone remains the Science Notebook shortcut. Shift+Tab enters the two HUD buttons.
  const onKey = (event: KeyboardEvent) => {
    if (opts.enabled?.() === false) return;
    if (dialog.isOpen || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.code === 'Tab' && (event.shiftKey || focused >= 0)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (!event.repeat) focused = focused === 0 ? 1 : 0;
      updateTooltip();
    } else if (focused >= 0 && (event.code === 'Enter' || event.code === 'Space')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (!event.repeat) items[focused].button.action?.();
    } else if (focused >= 0) {
      focused = -1;
      updateTooltip();
    }
  };
  const clearKeyboardFocus = () => { focused = -1; updateTooltip(); };
  window.addEventListener('keydown', onKey, true);
  window.addEventListener('pointerdown', clearKeyboardFocus, true);
  window.addEventListener('blur', clearToolbar);
  const translate = () => {
    for (const { label, button } of items) button.control.accessibilityTag = { description: tr(label) };
    updateTooltip();
    dialog.refresh();
  };
  const language = onLangChange(translate);
  scene.onDisposeObservable.addOnce(() => {
    window.removeEventListener('keydown', onKey, true);
    window.removeEventListener('pointerdown', clearKeyboardFocus, true);
    window.removeEventListener('blur', clearToolbar);
    language();
  });
  fitHud(ui, bar, (width) => {
    margin = width <= HUD_NARROW ? 12 : HUD_MARGIN;
    bar.top = margin + 'px';
    bar.left = -margin + 'px';
    tooltip.top = margin + HUD_ICON_SIZE + 6 + 'px';
    updateTooltip();
  });
  ui.addControl(bar);
  ui.addControl(tooltip);
  translate();

  return {
    get isOpen() { return dialog.isOpen; },
    open() { if (!dialog.isOpen) dialog.open('pause'); },
    close() { if (dialog.isOpen) dialog.close(); },
  };
}
