import { AdvancedDynamicTexture, Control, Image, Rectangle, ScrollViewer, StackPanel, TextBlock } from '@babylonjs/gui';
import type { InputLock } from './inputLock';
import { fitHud } from './hudWidgets';

export interface StoryPanelOptions {
  title: string;
  body?: string;
  options?: string[];
  canvas?: HTMLCanvasElement;
  footer?: string;
}

export interface StoryPanel {
  show(opts: StoryPanelOptions): void;
  hide(): void;
  readonly open: boolean;
  setBody(text: string): void;
  setCanvas(c: HTMLCanvasElement): void;
  setOptions(options: string[]): void;
  setFooter(text: string): void;
}

function tb(size: number, color = 'white', bold = false): TextBlock {
  const t = new TextBlock();
  t.fontSize = size;
  t.color = color;
  t.fontWeight = bold ? 'bold' : 'normal';
  t.fontFamily = 'system-ui, sans-serif';
  t.textWrapping = true;
  t.resizeToFit = true;
  t.width = 1;
  t.paddingTop = '6px';
  t.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
  return t;
}

/**
 * Centre-screen panel for Plan 4's story moments (memory photos, horizon, night budget, mission record).
 * Choices are number keys and Enter: the mouse is busy orbiting the camera. Showing it holds the input lock.
 */
export function createStoryPanel(ui: AdvancedDynamicTexture, lock: InputLock): StoryPanel {
  const box = new Rectangle('storyPanel');
  box.width = '820px';
  box.cornerRadius = 12;
  box.thickness = 1;
  box.color = 'rgba(255,170,80,0.5)';
  box.background = 'rgba(4,6,12,0.97)';
  box.isVisible = false;
  // Top-anchored so the subtitle box at the bottom stays readable under it.
  box.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
  box.top = '64px';
  box.zIndex = 50;
  ui.addControl(box);
  const stack = new StackPanel();
  stack.paddingTop = stack.paddingBottom = '16px';
  const scroll = new ScrollViewer('storyScroll');
  scroll.thickness = 0;
  scroll.barColor = '#8fd3ff';
  scroll.barSize = 8;
  scroll.paddingLeft = scroll.paddingRight = '22px';
  box.addControl(scroll);
  scroll.addControl(stack);
  const title = tb(24, '#ffb060', true);
  const body = tb(18, '#e8eef5');
  const img = new Image('storyPanelImg');
  img.width = '760px';
  img.height = '320px';
  img.stretch = Image.STRETCH_UNIFORM;
  img.isVisible = false;
  const opts = tb(19, 'white');
  const footer = tb(15, '#9fb2c8');
  for (const c of [title, body, img, opts, footer]) stack.addControl(c);
  let imageRatio = 0;
  let contentWidth = 760;
  let maxHeight = 650;
  fitHud(ui, box, (width, height) => {
    const panelWidth = Math.min(820, width - 24);
    contentWidth = panelWidth - 56;
    box.width = panelWidth + 'px';
    maxHeight = Math.max(160, Math.min(650, height - 190));
    box.height = maxHeight + 'px';
    box.top = width < 550 ? '60px' : '64px';
    stack.width = contentWidth + 'px';
    img.width = contentWidth + 'px';
    img.height = contentWidth * imageRatio + 'px';
    title.fontSize = width < 550 ? 20 : 24;
    body.fontSize = opts.fontSize = width < 550 ? 16 : 18;
  });
  ui.getScene()?.onAfterRenderObservable.add(() => {
    if (!box.isVisible) return;
    const height = Math.min(maxHeight, Math.max(150, stack.heightInPixels + 8));
    if (Math.abs(box.heightInPixels - height) > 1) box.height = height + 'px';
  });

  let open = false;
  const set = (t: TextBlock, text: string | undefined) => {
    t.text = text ?? '';
    t.isVisible = !!text;
  };
  const panel: StoryPanel = {
    get open() {
      return open;
    },
    show(o) {
      set(title, o.title);
      set(body, o.body);
      panel.setOptions(o.options ?? []);
      set(footer, o.footer);
      if (o.canvas) panel.setCanvas(o.canvas);
      else img.isVisible = false;
      box.isVisible = true;
      scroll.verticalBar.value = 0;
      if (!open) lock.push('storyPanel');
      open = true;
    },
    hide() {
      box.isVisible = false;
      if (open) lock.pop('storyPanel');
      open = false;
    },
    setBody(text) {
      set(body, text);
    },
    setCanvas(c) {
      imageRatio = c.height / c.width;
      img.height = `${Math.round(contentWidth * imageRatio)}px`;
      img.source = c.toDataURL();
      img.isVisible = true;
    },
    setOptions(options) {
      set(opts, options.length ? options.map((s, i) => `${i + 1} — ${s}`).join('\n') : undefined);
    },
    setFooter(text) {
      set(footer, text);
    },
  };
  return panel;
}
