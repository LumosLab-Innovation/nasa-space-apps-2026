import type { Script } from '../dialogue/runner';
import type { Lang } from '../i18n/i18n';
import cardsEn from './cards.en.json';
import cardsVi from './cards.vi.json';
import { LINES } from './lines.en';
import { LINES_VI } from './lines.vi';

export interface CardPhoto { file: string; thumb: string; caption: string; credit: string; nasaId: string; url: string; width: number; height: number }
export interface CardText { id: string; title: string; body: string; tag: 'real' | 'fiction' | 'debated'; source: { label: string; url: string }; pipNote: string; photo: CardPhoto | null }

/** Dialogue script for a language (same ids and line counts: tests/i18n.test.ts). */
export const linesFor = (l: Lang): Script => (l === 'vi' ? LINES_VI : LINES);

/** Knowledge cards for a language (same ids, tags and sources). */
export const cardsFor = (l: Lang): CardText[] => (l === 'vi' ? cardsVi : cardsEn) as CardText[];

/** Base-URL-prefixed thumbnail urls of every card that has a photo (preloaded on the loading screen). */
export const notebookThumbUrls = (cards: CardText[]): string[] =>
  cards.flatMap((c) => (c.photo ? [import.meta.env.BASE_URL + c.photo.thumb] : []));
