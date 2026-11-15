import type { ICanvasRenderingContext } from '@babylonjs/core/Engines/ICanvas';
import { Container, Control, Grid, Rectangle, StackPanel, type AdvancedDynamicTexture } from '@babylonjs/gui';
import { getLang, tr } from '../i18n/i18n';
import { menuColors, menuGradient, menuLabel, menuRule } from './menuControls';

export const HUD_MARGIN = 18;
export const HUD_NARROW = 550;
export const HUD_ICON_SIZE = 44;
export const HUD_ICON_GAP = 7;

const MONO = 'Consolas, ui-monospace, monospace';
const BAR_SLOPE = Math.tan(24 * Math.PI / 180);

export function hudText(text: string, size: number, color: string = menuColors.text) {
  const label = menuLabel(text, size, color);
  label.textWrapping = false;
  label.shadowColor = '#010509';
  label.shadowBlur = 5;
  label.shadowOffsetY = 1;
  return label;
}

export function hudNumber(value: number, digits: number): string {
  const formatted = value.toFixed(digits);
  return getLang() === 'vi' ? formatted.replace('.', ',') : formatted;
}

export function hudStack(name: string): StackPanel {
  const stack = new StackPanel(name);
  stack.isHitTestVisible = false;
  return stack;
}

/** Layout tracks the fullscreen GUI texture. Disposing the control removes its resize observer. */
export function fitHud(ui: AdvancedDynamicTexture, control: Control, layout: (width: number, height: number) => void): void {
  const engine = ui.getScene()?.getEngine();
  const resize = () => {
    const { width, height } = ui.getSize();
    layout(width, height);
  };
  const observer = engine?.onResizeObservable.add(resize) ?? null;
  control.onDisposeObservable.addOnce(() => engine?.onResizeObservable.remove(observer));
  resize();
}

export function placeTopReadouts(ui: AdvancedDynamicTexture, stack: StackPanel, width: number): void {
  stack.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
  stack.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
  stack.left = HUD_MARGIN + 'px';
  fitHud(ui, stack, (canvasWidth) => {
    const narrow = canvasWidth <= HUD_NARROW;
    stack.left = (narrow ? 12 : HUD_MARGIN) + 'px';
    stack.top = (narrow ? 67 : HUD_MARGIN) + 'px';
    stack.width = Math.min(width, Math.max(1, canvasWidth - HUD_MARGIN * 2)) + 'px';
  });
  ui.addControl(stack);
}

export function hudHeading() {
  const heading = new Container();
  heading.height = '19px';
  heading.isHitTestVisible = false;
  const accent = menuRule(menuColors.red);
  accent.width = '11px';
  accent.height = '2px';
  accent.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
  heading.addControl(accent);
  const title = hudText('', 13);
  title.paddingLeft = '19px';
  title.fontWeight = '700';
  heading.addControl(title);
  const mode = hudText('', 12, menuColors.ice);
  mode.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
  mode.fontWeight = '650';
  heading.addControl(mode);
  return { control: heading, title, mode };
}

export function hudPair(first: Control, second: Control, height: number) {
  const row = new Grid();
  row.height = height + 'px';
  row.isHitTestVisible = false;
  row.addColumnDefinition(0.5);
  row.addColumnDefinition(14, true);
  row.addColumnDefinition(0.5);
  row.addControl(first, 0, 0);
  row.addControl(second, 0, 2);
  return row;
}

export function hudMetric(secondary = false) {
  const column = hudStack('hudMetric');
  column.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
  const label = hudText('', 12, menuColors.muted);
  label.height = '17px';
  column.addControl(label);

  const line = new Container();
  line.height = (secondary ? 20 : 28) + 'px';
  const size = secondary ? 16 : 22;
  const value = hudText('', size);
  const unit = hudText('', 11, menuColors.ice);
  value.fontFamily = unit.fontFamily = MONO;
  value.fontWeight = '700';
  value.horizontalAlignment = unit.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
  unit.paddingTop = (secondary ? 3 : 6) + 'px';
  line.addControl(value);
  line.addControl(unit);
  column.addControl(line);
  return {
    control: column,
    update(name: string, reading: string, units = '') {
      label.text = tr(name);
      value.text = reading;
      // Leave a small gap after the fixed-width numerals.
      const numberWidth = Math.ceil(reading.length * size * 0.56) + 2;
      value.width = numberWidth + 'px';
      unit.left = numberWidth + 5 + 'px';
      unit.width = '44px';
      unit.text = units;
      unit.isVisible = !!units;
    },
  };
}

function clamp01(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
}

/** A fullscreen GUI indicator, drawn in canvas coordinates without changing the layout bounds. */
export class SlantedBar extends Control {
  private from = 0;
  private to = 0;
  private fill = '';
  private needle: number | undefined;

  constructor(name: string, private readonly track: string, height: number) {
    super(name);
    this.isHitTestVisible = false;
    this.height = height + 'px';
  }

  update(from: number, to: number, fill: string, needle?: number): void {
    const start = clamp01(from);
    const end = clamp01(to);
    if (start === this.from && end === this.to && fill === this.fill && needle === this.needle) return;
    this.from = start;
    this.to = end;
    this.fill = fill;
    this.needle = needle;
    this.markAsDirty();
  }

  override _draw(context: ICanvasRenderingContext): void {
    const { left, top, width, height } = this._currentMeasure;
    const slant = Math.min(height * BAR_SLOPE, width / 2);
    const span = width - slant;
    const band = (from: number, to: number, color: string) => {
      if (from >= to) return;
      const start = left + from * span;
      const end = left + to * span;
      context.fillStyle = color;
      context.beginPath();
      context.moveTo(start + slant, top);
      context.lineTo(end + slant, top);
      context.lineTo(end, top + height);
      context.lineTo(start, top + height);
      context.closePath();
      context.fill();
    };
    context.save();
    this._applyStates(context);
    band(0, 1, this.track);
    band(this.from, this.to, this.fill);
    if (this.needle !== undefined) {
      context.fillStyle = '#FFFFFF';
      context.fillRect(left + slant / 2 + clamp01(this.needle) * span - 1, top, 2, height);
    }
    context.restore();
  }
}

export function hudMeter(name: string, tint: string) {
  const container = new Container();
  container.height = '26px';
  container.isHitTestVisible = false;
  const label = hudText('', 12, menuColors.muted);
  const percent = hudText('', 13);
  for (const text of [label, percent]) {
    text.height = '18px';
    text.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    container.addControl(text);
  }
  percent.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
  percent.fontFamily = MONO;
  percent.fontWeight = '700';
  const bar = new SlantedBar(name, '#172941', 6);
  bar.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
  container.addControl(bar);
  return {
    control: container,
    update(fraction: number, low = false, caption = name) {
      label.text = tr(caption);
      label.color = low ? '#FFC0BA' : menuColors.muted;
      percent.text = Math.round(clamp01(fraction) * 100) + '%';
      percent.color = low ? '#FFC0BA' : menuColors.text;
      bar.update(0, fraction, low ? '#FF857E' : tint);
    },
  };
}

export function hudNotice(name: string, style: 'solid' | 'message' = 'solid'): Rectangle {
  const box = new Rectangle(name);
  box.thickness = 1;
  box.color = '#5273A184';
  box.cornerRadius = 4;
  box.cornerRadiusY = 12;
  box.background = '#0A172CED';
  box.isHitTestVisible = false;
  if (style === 'message') {
    menuGradient(box, '#101F37F0', '#081427ED', {
      direction: 125,
      endStop: 0.72,
      border: ['#779AD0A0', '#45648655'],
    });
    box.shadowColor = '#0003';
    box.shadowBlur = 20;
    box.shadowOffsetY = 6;
  }
  return box;
}
