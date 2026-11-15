import type { CardText } from '../content/content';
import { reducedCameraMotion } from '../core/accessibility';
import type { GameState } from '../core/gameState';
import { getLang, onLangChange, tr } from '../i18n/i18n';
import type { PhotoStore } from '../save/photoStore';
import { createImagePreloader, domImageLoader } from './imagePreload';
import { albumView, dayLabel, keyAction, type NotebookMode } from './notebookModel';
import './notebook.css';

/** Kept for existing imports; the notebook shows the full card text (content.ts). */
export type Card = CardText;

const TAG_COLOR: Record<Card['tag'], string> = { real: '#7be08a', fiction: '#ffa040', debated: '#ffd27a' };
export const TAG_TEXT: Record<Card['tag'], string> = { real: 'REAL', fiction: 'FICTION', debated: 'STILL DEBATED' };

const BASE = import.meta.env.BASE_URL;
const OWN_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'Escape', 'Tab', 'Enter']);

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

function button(cls: string, text: string, onClick: () => void): HTMLButtonElement {
  const b = el('button', cls, text);
  b.type = 'button';
  b.onclick = (e) => { e.stopPropagation(); onClick(); };
  return b;
}

/**
 * An image inside a paper-coloured placeholder that already has the image's aspect ratio (`ar` = width / height),
 * so the layout never jumps; the picture decodes asynchronously and fades in once loaded (instantly if cached).
 */
function photoBox(src: string, alt: string, ar: number, cls = ''): HTMLElement {
  const box = el('span', `nb-ph ${ar >= 1 ? 'nb-wide' : 'nb-tall'} ${cls}`.trim());
  box.style.setProperty('--ar', String(ar > 0 && Number.isFinite(ar) ? ar : 1));
  const i = el('img');
  i.decoding = 'async';
  i.alt = alt;
  i.src = src;
  if (i.complete && i.naturalWidth > 0) box.classList.add('nb-ready');
  else {
    i.addEventListener('load', () => box.classList.add('nb-ready'), { once: true });
    i.addEventListener('error', () => box.classList.add('nb-failed'), { once: true });
  }
  box.append(i);
  return box;
}

/**
 * Science Notebook (Tab) as a photo album (spec 2026-11-15-notebook-photo-album): a polaroid grid of discoveries in
 * unlock order, then "?" tiles; each opens a paper journal spread with the NASA photo, the player's polaroid, a Pip
 * note and the source. DOM overlay above the canvas; while open it owns the keyboard (pattern: missionGuide.ts).
 */
export function createNotebook(opts: { state: GameState; cards: () => CardText[]; store: PhotoStore; missionStartMs: number }): {
  toggle(): void; readonly open: boolean; refresh(): void; dispose(): void;
  /** Load the thumbnails of every unlocked card in the background (when idle). Cheap; safe to call every frame. */
  preload(): void;
} {
  const { state, store } = opts;
  const images = createImagePreloader(domImageLoader);
  const thumbUrls = () => albumView(opts.cards(), state.unlockedCards).pages.flatMap((c) => (c.photo ? [BASE + c.photo.thumb] : []));
  let preloadScheduled = false;
  const preload = () => {
    if (preloadScheduled) return;
    preloadScheduled = true;
    const run = () => { preloadScheduled = false; images.want(thumbUrls()); };
    if (typeof requestIdleCallback === 'function') requestIdleCallback(run, { timeout: 500 });
    else setTimeout(run, 0);
  };
  const root = el('div', 'notebook-album');
  root.hidden = true;
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  const wrap = el('div', 'nb-wrap');
  const header = el('header', 'nb-hdr');
  const heading = el('h2');
  const counts = el('span', 'nb-counts');
  const headerActions = el('div', 'nb-actions');
  const sourcesBtn = button('nb-btn', '', () => go('credits', pages.length));
  const closeBtn = button('nb-btn nb-close', '×', () => close());
  headerActions.append(sourcesBtn, closeBtn);
  header.append(heading, counts, headerActions);
  const body = el('div', 'nb-body');
  const hint = el('p', 'nb-hint');
  wrap.append(header, body, hint);
  root.append(wrap);
  root.addEventListener('click', (e) => { if (e.target === root) close(); });
  document.body.append(root);

  let open = false;
  let mode: NotebookMode = 'grid';
  let index = 0;
  let allCards: CardText[] = [];
  let pages: CardText[] = [];
  let locked = 0;
  let tiles: HTMLElement[] = [];

  const lang = () => getLang();
  const photoOf = (id: string) => store.get(id);

  function render(): void {
    allCards = opts.cards();
    const view = albumView(allCards, state.unlockedCards);
    pages = view.pages;
    locked = view.locked;
    index = Math.max(0, Math.min(index, mode === 'page' ? pages.length - 1 : pages.length));
    if (mode === 'page' && pages.length === 0) mode = 'grid';
    root.classList.toggle('nb-still', reducedCameraMotion());
    root.setAttribute('aria-label', tr('ASTRONAUT NOTEBOOK'));
    heading.textContent = tr('ASTRONAUT NOTEBOOK');
    counts.textContent = tr('{n} / {total} discoveries · Samples {s} · Data logs {d}', { n: pages.length, total: pages.length + locked, s: state.samples.size, d: state.dataLogs.size });
    sourcesBtn.textContent = tr('Photo and data sources');
    closeBtn.setAttribute('aria-label', tr('Close notebook'));
    closeBtn.title = tr('Close notebook');
    body.replaceChildren();
    tiles = [];
    if (mode === 'grid') renderGrid();
    else if (mode === 'page') renderPage(pages[index]);
    else renderCredits();
    hint.textContent = mode === 'grid' ? tr('← → choose · Enter open · Esc / Tab close') : tr('Esc / Tab: back to album');
    body.scrollTop = 0; // before focusing, so a focused grid tile further down scrolls itself into view
    focusCurrent();
  }

  function renderGrid(): void {
    if (pages.length === 0) body.append(el('p', 'nb-empty', tr('Explore with Pip to fill this notebook.')));
    const grid = el('div', 'nb-grid');
    pages.forEach((card, i) => {
      const tile = el('button', 'nb-tile');
      tile.type = 'button';
      const sq = el('div', 'nb-sq');
      const mine = photoOf(card.id);
      if (card.photo) sq.append(photoBox(BASE + card.photo.thumb, card.title, card.photo.width / card.photo.height));
      else if (mine) { sq.classList.add('nb-mine'); sq.append(photoBox(mine.jpeg, card.title, 1)); }
      else sq.classList.add('nb-blank');
      tile.append(sq, el('p', '', card.title));
      if (!store.isSeen(card.id)) {
        const dot = el('span', 'nb-new');
        dot.title = tr('New page');
        tile.append(dot);
        tile.setAttribute('aria-label', `${card.title} (${tr('New page')})`);
      }
      tile.onclick = (e) => { e.stopPropagation(); go('page', i); };
      tile.onfocus = () => { if (mode === 'grid') index = i; };
      tiles.push(tile);
      grid.append(tile);
    });
    for (let i = 0; i < locked; i++) {
      const tile = el('div', 'nb-tile nb-locked');
      tile.setAttribute('aria-label', tr('Locked discovery'));
      tile.append(el('div', 'nb-sq', '?'), el('p', '', '???'));
      grid.append(tile);
    }
    body.append(grid);
  }

  function polaroid(id: string, cls: string): HTMLElement {
    const pol = el('div', cls);
    const mine = photoOf(id);
    const snap = el('div', 'nb-snap');
    if (mine) snap.append(photoBox(mine.jpeg, tr('Your photo'), 4 / 3, 'nb-fill'));
    else snap.append(el('span', 'nb-hand', tr('No photo yet')));
    pol.append(snap, el('span', 'nb-hand nb-day', mine ? dayLabel(mine.clockMs, opts.missionStartMs, lang()) : ''));
    return pol;
  }

  function renderPage(card: CardText): void {
    store.markSeen(card.id);
    // Neighbouring spreads load in the background so ← / → show their photo at once.
    images.want([pages[index + 1], pages[index - 1]].flatMap((c) => (c?.photo ? [BASE + c.photo.file] : [])));
    const book = el('div', 'nb-book');
    book.tabIndex = -1;
    const left = el('div', 'nb-pg nb-left');
    const lower = el('div', 'nb-lower');
    if (card.photo) {
      const p = card.photo;
      const frame = el('figure', 'nb-photo');
      frame.append(el('span', 'nb-tape'), photoBox(BASE + p.file, p.caption, p.width / p.height));
      const cap = el('figcaption', 'nb-cap');
      cap.append(el('span', '', p.caption), el('span', 'nb-credit', tr('Photo: {credit} · {id}', { credit: p.credit, id: p.nasaId })));
      lower.append(cap, polaroid(card.id, 'nb-pol'));
      left.append(frame, lower);
    } else {
      // No verified NASA image (MICA is fiction): the player's own picture fills the photo slot, labelled as in-game.
      const big = polaroid(card.id, 'nb-pol nb-pol-big');
      const cap = el('p', 'nb-cap', tr('In-game photo from your mission'));
      left.append(big, cap);
    }
    const right = el('div', 'nb-pg nb-right');
    const top = el('div', 'nb-top');
    const stamp = el('span', 'nb-stamp', tr(TAG_TEXT[card.tag]));
    stamp.style.setProperty('--tag', TAG_COLOR[card.tag]);
    top.append(stamp, el('span', 'nb-pageno', tr('Page {i} / {n}', { i: index + 1, n: pages.length })));
    const note = el('p', 'nb-hand nb-note', `Pip: “${card.pipNote}”`);
    right.append(top, el('h3', '', card.title), el('p', 'nb-text', card.body));
    if (card.pipNote) right.append(note);
    const src = el('a', 'nb-src', tr('Source: {label}', { label: card.source.label }));
    if (/^https?:\/\//.test(card.source.url)) {
      src.href = card.source.url;
      src.target = '_blank';
      src.rel = 'noopener noreferrer';
    }
    src.onclick = (e) => e.stopPropagation();
    const nav = el('div', 'nb-nav');
    const prev = button('nb-arrow', '◀', () => go('page', index - 1));
    const next = button('nb-arrow', '▶', () => go('page', index + 1));
    prev.disabled = index === 0;
    next.disabled = index >= pages.length - 1;
    prev.setAttribute('aria-label', tr('Previous page'));
    next.setAttribute('aria-label', tr('Next page'));
    const back = button('nb-link', tr('Back to album'), () => go('grid', index));
    nav.append(prev, back, next);
    right.append(src, nav);
    book.append(left, right);
    body.append(book);
  }

  function renderCredits(): void {
    const sheet = el('div', 'nb-book nb-credits');
    sheet.tabIndex = -1;
    const col = el('div', 'nb-pg');
    col.append(el('h3', '', tr('Photo and data sources')), el('h4', '', tr('Notebook photos')));
    // Every NASA image credit: unlocked pages first (with title), then the rest without title so nothing is spoiled.
    const unlocked = new Set(pages.map((c) => c.id));
    const credited = [...pages, ...allCards.filter((c) => !unlocked.has(c.id))].filter((c) => c.photo);
    const list = el('ul');
    for (const c of credited) {
      const p = c.photo!;
      const li = el('li');
      const credit = `${p.credit} · ${p.nasaId}`;
      const a = el('a', '', unlocked.has(c.id) ? `${c.title} — ${credit}` : credit);
      if (/^https?:\/\//.test(p.url)) { a.href = p.url; a.target = '_blank'; a.rel = 'noopener noreferrer'; }
      a.onclick = (e) => e.stopPropagation();
      li.append(a);
      list.append(li);
    }
    col.append(list, el('h4', '', tr('Game imagery and models')));
    const game = el('ul');
    for (const line of [
      tr('Moon imagery and relief: NASA SVS (LRO/LOLA), NASA/JPL Moon Trek (LROC WAC)'),
      tr('Earth imagery: NASA Scientific Visualization Studio (Blue Marble)'),
      tr('Orion model reference: NASA / ESA (European Service Module)'),
      tr('Exhaust references: NASA (RCS / plume-surface interaction), ESA (Orion). HLS nozzle layout and visible glow are illustrative.'),
    ]) game.append(el('li', '', line));
    const all = el('a', 'nb-src', tr('All NASA sources and credits ↗'));
    all.href = `${BASE}sources.html`;
    all.target = '_blank';
    all.rel = 'noopener noreferrer';
    all.onclick = (e) => e.stopPropagation();
    col.append(game, all, button('nb-link', tr('Back to album'), () => go('grid', pages.length)));
    sheet.append(col);
    body.append(sheet);
  }

  function focusCurrent(): void {
    if (!open) return;
    if (mode === 'grid') (index < pages.length ? tiles[index] : sourcesBtn)?.focus();
    else (body.firstElementChild as HTMLElement | null)?.focus({ preventScroll: true });
  }

  function go(next: NotebookMode, i: number): void {
    if (next === 'page' && (i < 0 || i >= pages.length)) return;
    const rerender = next !== mode || next !== 'grid';
    mode = next;
    index = i;
    if (rerender) render();
    else focusCurrent();
  }

  function setOpen(value: boolean): void {
    if (open === value) return;
    open = value;
    root.hidden = !open;
    if (open) {
      mode = 'grid';
      index = 0;
      render();
    } else {
      body.replaceChildren();
      tiles = [];
      (document.getElementById('game') as HTMLElement | null)?.focus();
    }
  }
  const close = () => setOpen(false);

  const onKey = (e: KeyboardEvent) => {
    if (!open) return;
    const r = keyAction(mode, e.key, index, pages.length);
    if (!r.consumed) return;
    // The game never sees a key while the album is open; browser shortcuts (Ctrl/Alt/Meta, F-keys) keep working.
    e.stopImmediatePropagation();
    if (OWN_KEYS.has(e.key) || !(e.ctrlKey || e.metaKey || e.altKey || /^F\d+$/.test(e.key))) e.preventDefault();
    if (e.repeat && (e.key === 'Tab' || e.key === 'Escape' || e.key === 'Enter')) return; // a held Tab must not reopen/close
    if (r.mode === 'closed') close();
    else if (r.mode !== mode || r.index !== index) go(r.mode, r.index);
  };
  window.addEventListener('keydown', onKey, true);
  const offLang = onLangChange(() => { if (open) render(); });

  return {
    get open() { return open; },
    toggle() { setOpen(!open); },
    preload,
    refresh() { if (open) render(); },
    dispose() {
      setOpen(false);
      window.removeEventListener('keydown', onKey, true);
      offLang();
      root.remove();
    },
  };
}
