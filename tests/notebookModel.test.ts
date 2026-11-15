import { describe, expect, it } from 'vitest';
import { cardsFor, type CardText } from '../src/content/content';
import { albumView, dayLabel, keyAction } from '../src/ui/notebookModel';

const en = cardsFor('en');

describe('albumView (unlocked pages first, in unlock order, then locked "?" tiles)', () => {
  it('orders pages by the unlock order, not the card file order', () => {
    const ids = [en[5].id, en[0].id, en[20].id];
    const v = albumView(en, ids);
    expect(v.pages.map((c) => c.id)).toEqual(ids);
    expect(v.locked).toBe(34 - 3);
  });

  it('skips unknown and duplicate ids', () => {
    const v = albumView(en, new Set(['nope', en[2].id, 'alsoUnknown', en[1].id]));
    expect(v.pages.map((c) => c.id)).toEqual([en[2].id, en[1].id]);
    expect(v.locked).toBe(34 - 2);
    expect(albumView(en, [en[3].id, en[3].id]).pages).toHaveLength(1);
  });

  it('nothing unlocked: every card is a locked tile', () => {
    expect(albumView(en, [])).toEqual({ pages: [], locked: 34 });
  });

  it('uses the language of the cards it is given (Vietnamese titles)', () => {
    const vi = cardsFor('vi');
    const id = 'apollo11Site';
    const pages = albumView(vi, [id]).pages as CardText[];
    expect(pages[0].title).toBe(vi.find((c) => c.id === id)!.title);
    expect(pages[0].title).not.toBe(en.find((c) => c.id === id)!.title);
  });
});

describe('keyAction (the overlay owns its keys)', () => {
  it('grid: Tab and Escape close the notebook', () => {
    expect(keyAction('grid', 'Tab', 2, 5)).toEqual({ mode: 'closed', index: 2, consumed: true });
    expect(keyAction('grid', 'Escape', 2, 5)).toEqual({ mode: 'closed', index: 2, consumed: true });
  });

  it('grid: arrows move the focused tile (clamped; index === count is the sources button), Enter opens it', () => {
    expect(keyAction('grid', 'ArrowRight', 1, 3)).toEqual({ mode: 'grid', index: 2, consumed: true });
    expect(keyAction('grid', 'ArrowRight', 3, 3)).toEqual({ mode: 'grid', index: 3, consumed: true });
    expect(keyAction('grid', 'ArrowLeft', 0, 3)).toEqual({ mode: 'grid', index: 0, consumed: true });
    expect(keyAction('grid', 'Enter', 1, 3)).toEqual({ mode: 'page', index: 1, consumed: true });
    expect(keyAction('grid', 'Enter', 3, 3)).toEqual({ mode: 'credits', index: 3, consumed: true });
    expect(keyAction('grid', 'Enter', 0, 0)).toEqual({ mode: 'credits', index: 0, consumed: true });
  });

  it('page: Escape and Tab go back to the grid', () => {
    expect(keyAction('page', 'Escape', 4, 6)).toEqual({ mode: 'grid', index: 4, consumed: true });
    expect(keyAction('page', 'Tab', 4, 6)).toEqual({ mode: 'grid', index: 4, consumed: true });
  });

  it('page: arrows move between pages and never wrap', () => {
    expect(keyAction('page', 'ArrowRight', 2, 6)).toEqual({ mode: 'page', index: 3, consumed: true });
    expect(keyAction('page', 'ArrowRight', 5, 6)).toEqual({ mode: 'page', index: 5, consumed: true });
    expect(keyAction('page', 'ArrowLeft', 3, 6)).toEqual({ mode: 'page', index: 2, consumed: true });
    expect(keyAction('page', 'ArrowLeft', 0, 6)).toEqual({ mode: 'page', index: 0, consumed: true });
  });

  it('any other key is swallowed with the mode unchanged (WASD, E, Q, Space never reach the game)', () => {
    for (const mode of ['grid', 'page', 'credits'] as const) {
      for (const key of ['w', 'a', 's', 'd', 'e', 'q', ' ', 'ArrowUp', 'Shift', 'j']) {
        expect(keyAction(mode, key, 1, 4)).toEqual({ mode, index: 1, consumed: true });
      }
    }
  });

  it('credits: Escape and Tab go back to the grid', () => {
    expect(keyAction('credits', 'Escape', 3, 3)).toEqual({ mode: 'grid', index: 3, consumed: true });
    expect(keyAction('credits', 'Tab', 3, 3)).toEqual({ mode: 'grid', index: 3, consumed: true });
  });
});

describe('dayLabel (mission day and UTC time of the unlock)', () => {
  const start = Date.parse('2028-11-29T19:20:00Z');
  const at = start + 26.5 * 3_600_000;
  const hhmm = new Date(at).toISOString().slice(11, 16);

  it('English and Vietnamese', () => {
    expect(dayLabel(at, start, 'en')).toBe('Day 2 · ' + hhmm);
    expect(dayLabel(at, start, 'vi')).toBe('Ngày 2 · ' + hhmm);
  });

  it('the first moments of the mission are day 1', () => {
    expect(dayLabel(start, start, 'en')).toBe('Day 1 · 19:20');
    expect(dayLabel(start + 86_400_000 - 1, start, 'en')).toMatch(/^Day 1 · /);
    expect(dayLabel(start + 86_400_000, start, 'en')).toMatch(/^Day 2 · /);
  });

  it('a photo from before the landing (the Eagle, in orbit) is still day 1', () => {
    expect(dayLabel(start - 10 * 60_000, start, 'en')).toBe('Day 1 · 19:10');
    expect(dayLabel(start - 3 * 86_400_000, start, 'vi')).toMatch(/^Ngày 1 · /);
  });
});
