import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { cardsFor } from '../src/content/content';

/** Size of a lossy WebP (VP8) file from its header. */
function imageSize(buf: Buffer): { w: number; h: number } {
  return { w: buf.readUInt16LE(26) & 0x3fff, h: buf.readUInt16LE(28) & 0x3fff };
}

describe('notebook photo album content', () => {
  for (const lang of ['en', 'vi'] as const) {
    describe(lang, () => {
      const cards = cardsFor(lang);
      it('has 34 cards with Pip notes', () => {
        expect(cards).toHaveLength(34);
        for (const c of cards) expect(c.pipNote.length, c.id).toBeGreaterThan(0);
      });
      it('has the expected photo set', () => {
        const by = (id: string) => cards.find((c) => c.id === id)!;
        expect(by('micaFiction').photo).toBeNull();
        expect(by('apollo11Site').photo!.nasaId).toBe('as11-40-5927');
        expect(by('tracksLast').photo!.nasaId).toBe('as11-40-5878');
        expect(cards.filter((c) => c.photo !== null)).toHaveLength(23);
      });
      it('has valid photo files and metadata', () => {
        for (const c of cards) {
          if (!c.photo) continue;
          const p = c.photo;
          expect(existsSync('public/' + p.file), p.file).toBe(true);
          expect(existsSync('public/' + p.thumb), p.thumb).toBe(true);
          expect(p.credit.length).toBeGreaterThan(0);
          expect(p.caption.length).toBeGreaterThan(0);
          expect(p.width).toBeGreaterThan(0);
          expect(p.height).toBeGreaterThan(0);
          expect(Math.max(p.width, p.height)).toBeLessThanOrEqual(960);
          const t = imageSize(readFileSync('public/' + p.thumb));
          expect(Math.max(t.w, t.h)).toBeLessThanOrEqual(256);
          expect(Math.abs(t.w / t.h - p.width / p.height) / (p.width / p.height), p.thumb).toBeLessThan(0.01);
        }
      });
    });
  }
  it('EN and VI photos differ only by caption', () => {
    const vi = cardsFor('vi');
    for (const c of cardsFor('en')) {
      const v = vi.find((x) => x.id === c.id)!;
      if (!c.photo) { expect(v.photo).toBeNull(); continue; }
      expect({ ...c.photo, caption: '' }).toEqual({ ...v.photo!, caption: '' });
    }
  });
  it('keeps notebook images under 1.35 MB', () => {
    const dir = 'public/textures/notebook';
    const total = readdirSync(dir).reduce((s, f) => s + statSync(`${dir}/${f}`).size, 0);
    expect(total).toBeLessThanOrEqual(1_350_000);
  });
});
