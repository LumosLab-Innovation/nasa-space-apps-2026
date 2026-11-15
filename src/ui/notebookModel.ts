import type { CardText } from '../content/content';

/** Pure rules of the notebook album (tests/notebookModel.test.ts); the DOM lives in notebook.ts. */

export type NotebookMode = 'grid' | 'page' | 'credits';
export type NotebookKey = 'ArrowLeft' | 'ArrowRight' | 'Escape' | 'Tab' | 'Enter';

/** Unlocked cards as pages in unlock order (unknown or repeated ids skipped), plus how many "?" tiles follow. */
export function albumView(cards: CardText[], unlockedInOrder: Iterable<string>): { pages: CardText[]; locked: number } {
  const byId = new Map(cards.map((c) => [c.id, c]));
  const pages: CardText[] = [];
  const seen = new Set<string>();
  for (const id of unlockedInOrder) {
    const card = byId.get(id);
    if (!card || seen.has(id)) continue;
    seen.add(id);
    pages.push(card);
  }
  return { pages, locked: cards.length - pages.length };
}

/**
 * What a key does while the notebook is open. `count` = unlocked pages. In the grid, `index` is the focused
 * tile and `index === count` is the "Photo and data sources" button. Every key is consumed so none reaches
 * the game; arrows clamp, never wrap.
 */
export function keyAction(mode: NotebookMode, key: string, index: number, count: number): { mode: NotebookMode | 'closed'; index: number; consumed: boolean } {
  const clamp = (i: number, max: number) => Math.max(0, Math.min(max, i));
  if (mode === 'grid') {
    if (key === 'Tab' || key === 'Escape') return { mode: 'closed', index, consumed: true };
    if (key === 'ArrowRight') return { mode, index: clamp(index + 1, count), consumed: true };
    if (key === 'ArrowLeft') return { mode, index: clamp(index - 1, count), consumed: true };
    if (key === 'Enter') return { mode: index < count ? 'page' : 'credits', index, consumed: true };
    return { mode, index, consumed: true };
  }
  if (key === 'Tab' || key === 'Escape') return { mode: 'grid', index, consumed: true };
  if (mode === 'page' && key === 'ArrowRight') return { mode, index: clamp(index + 1, count - 1), consumed: true };
  if (mode === 'page' && key === 'ArrowLeft') return { mode, index: clamp(index - 1, count - 1), consumed: true };
  return { mode, index, consumed: true };
}

const DAY_MS = 86_400_000;

/** Handwritten polaroid label: mission day (1-based) and UTC game time, e.g. "Day 2 · 21:50". */
export function dayLabel(clockMs: number, missionStartMs: number, lang: 'en' | 'vi'): string {
  // Photos from before the landing (the Eagle, taken in orbit) still belong to day 1.
  const day = Math.max(1, Math.floor((clockMs - missionStartMs) / DAY_MS) + 1);
  const hhmm = new Date(clockMs).toISOString().slice(11, 16);
  return `${lang === 'vi' ? 'Ngày' : 'Day'} ${day} · ${hhmm}`;
}
