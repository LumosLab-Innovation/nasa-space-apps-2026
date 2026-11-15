import type { Scene } from '@babylonjs/core/scene';
import { Button } from '@babylonjs/gui/2D/controls/button';
import { Control } from '@babylonjs/gui/2D/controls/control';
import { LinearGradient } from '@babylonjs/gui/2D/controls/gradient/LinearGradient';
import { Rectangle } from '@babylonjs/gui/2D/controls/rectangle';
import { ScrollViewer } from '@babylonjs/gui/2D/controls/scrollViewers/scrollViewer';
import { StackPanel } from '@babylonjs/gui/2D/controls/stackPanel';
import { TextBlock } from '@babylonjs/gui/2D/controls/textBlock';
import type { AdvancedDynamicTexture } from '@babylonjs/gui/2D/advancedDynamicTexture';
import { MenuHistory, menuKeyAction } from '../core/pause';

export const menuColors = {
  space: '#060D1D', panel: '#101D36', background: '#11203B', blue: '#0032A0',
  red: '#E4002B', text: '#FFFFFF', muted: '#B7C7DF', ice: '#A8CDFF', border: '#5275AC',
} as const;

export function menuRule(color: string): Rectangle {
  const rule = new Rectangle();
  rule.thickness = 0;
  rule.background = color;
  rule.isHitTestVisible = false;
  return rule;
}

/** Keep the gradient aligned to the rectangle as the GUI moves or wraps text. */
export function menuGradient(
  control: Rectangle, start: string, end: string,
  options: { direction?: number | 'diagonal'; endStop?: number; border?: readonly [string, string] } = {},
): void {
  const { direction = 90, endStop = 1, border } = options;
  const radians = direction === 'diagonal' ? 0 : direction * Math.PI / 180;
  const dx = Math.sin(radians);
  const dy = -Math.cos(radians);
  control.onBeforeDrawObservable.add(() => {
    const halfWidth = control.widthInPixels / 2;
    const halfHeight = control.heightInPixels / 2;
    const halfLength = halfWidth * Math.abs(dx) + halfHeight * Math.abs(dy);
    const offsetX = direction === 'diagonal' ? halfWidth : dx * halfLength;
    const offsetY = direction === 'diagonal' ? halfHeight : dy * halfLength;
    const left = control.centerX - offsetX;
    const top = control.centerY - offsetY;
    const right = control.centerX + offsetX;
    const bottom = control.centerY + offsetY;
    const current = control.backgroundGradient;
    const sameBounds = current instanceof LinearGradient && current.x0 === left && current.y0 === top
      && current.x1 === right && current.y1 === bottom;
    if (!sameBounds) {
      const gradient = new LinearGradient(left, top, right, bottom);
      gradient.addColorStop(0, start);
      gradient.addColorStop(endStop, end);
      control.backgroundGradient = gradient;
    }
    if (border) {
      if (control.color === menuColors.ice) {
        if (control.gradient) control.gradient = null;
      } else if (!sameBounds || !control.gradient) {
        const stroke = new LinearGradient(left, top, right, bottom);
        stroke.addColorStop(0, border[0]);
        stroke.addColorStop(1, border[1]);
        control.gradient = stroke;
      }
    }
  });
}

export function menuLabel(text: string, size = 16, color: string = menuColors.text): TextBlock {
  const label = new TextBlock(undefined, text);
  label.fontFamily = 'Inter, system-ui, sans-serif';
  label.fontSize = size;
  label.color = color;
  label.textWrapping = true;
  label.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
  label.isHitTestVisible = false;
  return label;
}

export interface MenuInput {
  readonly id: string;
  readonly control: Control;
  readonly action?: () => void;
  readonly adjust?: (direction: number) => void;
  top?: number;
  bottom?: number;
}

interface MenuButtonStyle {
  tone?: 'primary' | 'risk' | 'quiet' | 'selected' | 'toolbar';
  note?: string;
  centered?: boolean;
  fontSize?: number;
  inset?: number;
  icon?: string;
  accent?: boolean;
  titleAction?: boolean;
}

export function menuButton(
  id: string, text: string, action: () => void,
  style: MenuButtonStyle = {},
): MenuInput & { control: Button } {
  const button = new Button(id);
  const tone = style.tone;
  const fills = {
    primary: menuColors.blue, risk: '#0B172B', quiet: '#0A162C85',
    selected: '#183979', toolbar: '#0B1C37F2',
  };
  button.background = tone ? fills[tone] : '#0B1830';
  button.color = tone === 'primary' || tone === 'selected' ? '#6B9BE9' : '#3D5683';
  button.cornerRadius = 3;
  button.cornerRadiusY = 12;
  button.thickness = 1;
  button.isPointerBlocker = true;
  button.hoverCursor = 'pointer';
  button.width = 1;
  button.height = '44px';

  if (style.titleAction) {
    const primary = tone === 'primary';
    menuGradient(button, primary ? '#1649AF' : '#162741E8', primary ? '#082C80' : '#091427E6', {
      direction: 'diagonal',
      border: primary ? ['#A1C6FFDF', '#4B76BE75'] : ['#7C9FC88C', '#30496C50'],
    });
  } else if (tone === 'primary') {
    menuGradient(button, menuColors.blue, '#1546AD');
  }
  if (tone === 'quiet' && !style.titleAction) {
    button.color = 'transparent';
    const underline = menuRule('#7D9AC24B');
    underline.height = '1px';
    underline.top = '1px';
    underline.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    button.addControl(underline);
  }
  if (style.accent || tone === 'risk') {
    const accent = menuRule(tone === 'risk' ? menuColors.red : '#B4D5FF');
    accent.width = '3px';
    accent.left = '-1px';
    accent.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    button.addControl(accent);
  }

  const inset = style.inset ?? 12;
  const leadingIcon = style.icon && tone === 'toolbar';
  const label = menuLabel(text, style.fontSize ?? 17);
  label.fontWeight = '650';
  if (style.centered) label.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
  label.paddingLeft = (leadingIcon ? inset + 28 : inset) + 'px';
  label.paddingRight = (style.icon && !leadingIcon ? inset + 28 : inset) + 'px';
  if (style.note) {
    label.height = '28px';
    label.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    label.top = style.icon ? '12px' : '5px';
    const note = menuLabel(style.note, style.icon ? 15 : 12, '#D4E5FF');
    note.height = '30px';
    note.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    note.top = style.icon ? '-8px' : '-4px';
    note.paddingLeft = label.paddingLeft;
    note.paddingRight = label.paddingRight;
    button.addControl(note);
  }
  button.addControl(label);
  if (style.icon) {
    const icon = menuLabel(style.icon, 21, menuColors.ice);
    icon.fontFamily = 'Segoe UI Symbol, system-ui, sans-serif';
    if (leadingIcon) {
      icon.width = '22px';
      icon.left = '17px';
      icon.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
      icon.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    } else {
      icon.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
      icon.paddingRight = inset + 'px';
    }
    button.addControl(icon);
  }
  button.onPointerClickObservable.add((event, state) => {
    if (event.buttonIndex === 0 && state.target === button) queueMicrotask(action);
  });
  return { id, control: button, action };
}

export class MenuColumn {
  readonly stack = new StackPanel();
  readonly inputs: MenuInput[] = [];
  height = 0;

  constructor(readonly width: number, spacing = 8) {
    this.stack.width = width + 'px';
    this.stack.spacing = spacing;
    this.stack.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
  }

  add(control: Control, height: number, inputs: MenuInput[] = []): void {
    const top = this.height + (this.stack.children.length ? this.stack.spacing : 0);
    this.height = top + height;
    control.height = height + 'px';
    this.stack.addControl(control);
    for (const input of inputs) {
      input.top = top + (input.top ?? 0);
      input.bottom = top + (input.bottom ?? height);
      this.inputs.push(input);
    }
  }

  title(text: string): void {
    const compact = this.width < 275;
    const label = menuLabel(text, compact ? 25 : 36);
    label.fontWeight = '700';
    this.add(label, compact ? 64 : 44);
  }

  button(input: MenuInput, height = 44): void {
    this.add(input.control, height, [input]);
  }
}

/** Babylon canvas controls share the same focus order for Tab, arrows and pointer interaction. */
export class MenuKeys {
  private inputs: MenuInput[] = [];
  private index = -1;
  private restoreColor: (() => void) | undefined;

  constructor(
    private readonly active: () => boolean,
    private readonly back: () => void,
    private readonly focusChanged?: (input: MenuInput) => void,
  ) {
    window.addEventListener('keydown', this.onKey, true);
  }

  get focusedId(): string | undefined {
    return this.inputs[this.index]?.id;
  }

  setInputs(inputs: MenuInput[], focus?: string, showFocus = true): void {
    this.restoreColor?.();
    this.restoreColor = undefined;
    this.inputs = inputs;
    this.index = -1;
    inputs.forEach((item, index) => item.control.onPointerDownObservable.add(() => this.focusIndex(index)));
    if (showFocus && inputs.length) {
      this.focusIndex(Math.max(0, inputs.findIndex((input) => input.id === focus)));
    }
  }

  focus(id: string): void {
    this.focusIndex(this.inputs.findIndex((input) => input.id === id));
  }

  private focusIndex(index: number): void {
    const item = this.inputs[index];
    if (!item || index === this.index) return;
    this.restoreColor?.();
    this.index = index;
    const old = item.control.color;
    item.control.color = menuColors.ice;
    this.restoreColor = () => { item.control.color = old; };
    this.focusChanged?.(item);
  }

  private readonly onKey = (event: KeyboardEvent): void => {
    if (!this.active() || event.altKey || event.ctrlKey || event.metaKey || /^F\d+$/.test(event.code)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const repeat = menuKeyAction(event) === 'swallow';
    const item = this.inputs[this.index];
    if (event.code === 'Escape' && !repeat) return this.back();
    if ((event.code === 'Enter' || event.code === 'Space') && !repeat) {
      if (item?.action) item.action();
      else if (!item) this.focusIndex(0);
      return;
    }
    if (event.code === 'ArrowLeft' || event.code === 'ArrowRight') {
      item?.adjust?.(event.code === 'ArrowRight' ? 1 : -1);
    }
    if (!this.inputs.length || !['Tab', 'ArrowDown', 'ArrowUp'].includes(event.code)) return;
    const step = event.shiftKey || event.code === 'ArrowUp' ? -1 : 1;
    const next = this.index < 0 ? (step > 0 ? 0 : this.inputs.length - 1) : (this.index + step + this.inputs.length) % this.inputs.length;
    this.focusIndex(next);
  };

  dispose(): void {
    window.removeEventListener('keydown', this.onKey, true);
    this.setInputs([]);
  }
}

export function revealMenuInput(scroll: ScrollViewer, contentHeight: number, viewHeight: number, input: MenuInput): void {
  if (input.top === undefined || input.bottom === undefined) return;
  const range = contentHeight - viewHeight;
  if (range <= 0) return;
  const bar = scroll.verticalBar;
  const top = bar.value * range;
  if (input.top < top) bar.value = input.top / range;
  else if (input.bottom > top + viewHeight) bar.value = (input.bottom - viewHeight) / range;
}

export type MenuPage = 'pause' | 'settings' | 'flight' | 'confirm-new' | 'confirm-exit';

export class MenuDialog {
  private readonly scrim = new Rectangle('missionMenuScrim');
  private readonly history: MenuHistory<MenuPage>;
  private readonly keys: MenuKeys;
  private panel?: Rectangle;
  private scroll?: ScrollViewer;
  private scrollHeight = 0;
  private viewHeight = 0;

  constructor(
    private readonly ui: AdvancedDynamicTexture,
    private readonly scene: Scene,
    private readonly render: (page: MenuPage, column: MenuColumn) => void,
    onChange?: (open: boolean) => void,
  ) {
    this.history = new MenuHistory(onChange);
    this.scrim.width = this.scrim.height = 1;
    this.scrim.thickness = 0;
    this.scrim.background = 'rgba(3,8,19,0.70)';
    this.scrim.isPointerBlocker = true;
    this.scrim.isVisible = false;
    this.scrim.zIndex = 1000;
    ui.addControl(this.scrim);
    this.keys = new MenuKeys(() => this.isOpen, () => this.back(), (input) => this.reveal(input));
    const engine = scene.getEngine();
    const resize = engine.onResizeObservable.add(() => this.refresh());
    scene.onDisposeObservable.addOnce(() => {
      engine.onResizeObservable.remove(resize);
      this.keys.dispose();
      this.history.close();
    });
  }

  get isOpen(): boolean {
    return this.history.current !== undefined;
  }

  open(page: MenuPage): void {
    this.history.open(page);
    this.refresh(page.startsWith('confirm') ? 'back' : '');
  }

  back(): void {
    const previous = this.history.current;
    this.history.back();
    this.refresh(previous === 'settings' ? 'settings' : '');
    if (!this.isOpen) this.focusCanvas();
  }

  close(): void {
    this.history.close();
    this.refresh();
    this.focusCanvas();
  }

  private focusCanvas(): void {
    this.scene.getEngine().getRenderingCanvas()?.focus({ preventScroll: true });
  }

  refresh(focus = this.keys.focusedId): void {
    this.keys.setInputs([]);
    this.panel?.dispose();
    this.panel = undefined;
    this.scroll = undefined;
    const page = this.history.current;
    this.scrim.isVisible = page !== undefined;
    if (!page) return;
    const { width, height } = this.ui.getSize();
    const settings = page === 'settings';
    const panelWidth = Math.min(settings ? 818 : page === 'pause' ? 438 : 602, Math.max(180, width - 32));
    const padding = panelWidth < 420 ? 16 : 30;
    const column = new MenuColumn(panelWidth - padding * 2 - (settings ? 2 : 12), settings ? 20 : 10);
    this.render(page, column);
    const panel = new Rectangle('missionMenuPanel');
    this.panel = panel;
    panel.width = panelWidth + 'px';
    const panelHeight = Math.min(column.height + padding * 2, Math.max(120, height - 28));
    panel.height = panelHeight + 'px';
    panel.background = menuColors.panel;
    panel.color = '#5783BE';
    panel.thickness = 1;
    panel.cornerRadius = 4;
    panel.cornerRadiusY = 20;
    panel.shadowColor = '#000A';
    panel.shadowBlur = 38;
    panel.shadowOffsetY = 15;
    menuGradient(panel, '#172B51', menuColors.panel, { direction: 'diagonal', endStop: 0.64 });

    const leftPause = page === 'pause' && width >= 680 && height > 400;
    if (leftPause) {
      panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
      panel.left = '35px';
    }
    this.scrim.background = 'rgba(3,8,19,0.69)';
    this.scrim.backgroundGradient = null;
    if (leftPause) {
      const gradient = new LinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, '#030815C7');
      gradient.addColorStop(0.56, '#03081578');
      gradient.addColorStop(1, '#03081545');
      this.scrim.backgroundGradient = gradient;
    }
    this.scrim.addControl(panel);
    const trim = menuRule(page.startsWith('confirm') ? menuColors.red : '#6DA1FF');
    trim.height = '2px';
    trim.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    panel.addControl(trim);
    this.viewHeight = panelHeight - padding * 2;
    if (column.height > this.viewHeight) {
      const scroll = new ScrollViewer('missionMenuScroll');
      this.scroll = scroll;
      this.scrollHeight = column.height;
      scroll.height = this.viewHeight + 'px';
      scroll.width = panelWidth - padding * 2 + (settings ? 10 : 0) + 'px';
      if (settings) scroll.left = '5px';
      scroll.barSize = 7;
      scroll.barColor = menuColors.border;
      scroll.barBackground = menuColors.space;
      scroll.thickness = 0;
      scroll.addControl(column.stack);
      panel.addControl(scroll);
    } else {
      column.stack.top = padding - panel.thickness + 'px';
      panel.addControl(column.stack);
    }
    this.keys.setInputs(column.inputs, focus);
  }

  private reveal(input: MenuInput): void {
    if (this.scroll) revealMenuInput(this.scroll, this.scrollHeight, this.viewHeight, input);
  }
}
