import { AdvancedDynamicTexture, Control, Rectangle, ScrollViewer, StackPanel, TextBlock } from '@babylonjs/gui';
import type { GameState } from '../core/gameState';
import { tr } from '../i18n/i18n';
import { fitHud } from './hudWidgets';

export interface Card {
  id: string;
  title: string;
  body: string;
  tag: 'real' | 'fiction' | 'debated';
  source: { label: string; url: string };
}

const TAG_COLOR: Record<Card['tag'], string> = { real: '#7be08a', fiction: '#ffa040', debated: '#ffd27a' };
export const TAG_TEXT: Record<Card['tag'], string> = { real: 'REAL', fiction: 'FICTION', debated: 'STILL DEBATED' };

function tb(text: string, size: number, color = 'white', bold = false): TextBlock {
  const t = new TextBlock();
  t.text = text;
  t.fontSize = size;
  t.color = color;
  t.fontWeight = bold ? 'bold' : 'normal';
  t.textWrapping = true;
  t.resizeToFit = true;
  t.width = 1;
  t.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
  return t;
}

/** Science Notebook (Tab): unlocked knowledge cards with Real/Fiction tags and NASA sources (spec §5.7). */
export function createNotebook(ui: AdvancedDynamicTexture, state: GameState, cards: Card[]): { toggle(): void; readonly open: boolean } {
  const panel = new Rectangle('notebook');
  panel.width = '720px';
  panel.height = '80%';
  panel.cornerRadius = 12;
  panel.thickness = 1;
  panel.color = '#2a3a50';
  panel.background = 'rgba(6,10,18,0.92)';
  panel.isVisible = false;
  panel.zIndex = 60;
  ui.addControl(panel);
  const title = tb(tr('SCIENCE NOTEBOOK'), 22, '#8fd3ff', true);
  title.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
  title.top = '14px';
  panel.addControl(title);
  const scroll = new ScrollViewer('notebookScroll');
  scroll.top = '56px';
  scroll.height = '82%';
  scroll.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
  scroll.thickness = 0;
  scroll.barColor = '#2a3a50';
  scroll.barSize = 8;
  scroll.paddingLeft = scroll.paddingRight = '16px';
  panel.addControl(scroll);
  const list = new StackPanel();
  list.width = '680px';
  scroll.addControl(list);
  fitHud(ui, panel, (width) => {
    const w = Math.min(720, width - 24);
    panel.width = w + 'px';
    title.width = w - 44 + 'px';
    list.width = w - 48 + 'px';
  });

  function render(): void {
    list.clearControls();
    const unlocked = cards.filter((c) => state.unlockedCards.has(c.id));
    const count = tb(tr('{n} / {total} discoveries · Samples {s} · Data logs {d}', { n: unlocked.length, total: cards.length, s: state.samples.size, d: state.dataLogs.size }), 15, '#b8c7d9');
    count.paddingBottom = '12px';
    list.addControl(count);
    if (unlocked.length === 0) list.addControl(tb(tr('Explore with Pip to fill this notebook.'), 17, '#b8c7d9'));
    for (const c of unlocked) {
      const tag = tb(tr(TAG_TEXT[c.tag]), 13, TAG_COLOR[c.tag], true);
      tag.paddingTop = '10px';
      list.addControl(tag);
      list.addControl(tb(c.title, 19, 'white', true));
      list.addControl(tb(c.body, 16, '#dde6f0'));
      const src = tb(tr('Source: {label}', { label: c.source.label }), 13, '#8fa3b8');
      src.paddingBottom = '10px';
      src.color = '#9ddcff';
      src.hoverCursor = 'pointer';
      src.onPointerClickObservable.add(() => {
        if (/^https?:\/\//.test(c.source.url)) window.open(c.source.url, '_blank', 'noopener,noreferrer');
      });
      list.addControl(src);
    }
    const moonCredit = tb(tr('Moon imagery and relief: NASA SVS (LRO/LOLA), NASA/JPL Moon Trek (LROC WAC)'), 13, '#8fa3b8');
    moonCredit.paddingTop = '12px';
    list.addControl(moonCredit);
    list.addControl(tb(tr('Earth imagery: NASA Scientific Visualization Studio (Blue Marble)'), 13, '#8fa3b8'));
    list.addControl(tb(tr('Orion model reference: NASA / ESA (European Service Module)'), 13, '#8fa3b8'));
    list.addControl(tb(tr('Exhaust references: NASA (RCS / plume-surface interaction), ESA (Orion). HLS nozzle layout and visible glow are illustrative.'), 13, '#8fa3b8'));
  }

  return {
    get open() {
      return panel.isVisible;
    },
    toggle() {
      panel.isVisible = !panel.isVisible;
      if (panel.isVisible) render();
    },
  };
}
