import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { setLang, tr } from '../src/i18n/i18n';
import { VI } from '../src/i18n/vi';
import { compass, daysText, formatDay } from '../src/story/timeText';

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? files(p) : p.endsWith('.ts') ? [p] : [];
  });
}

/** Every literal first argument of tr('…'), tr("…") or tr(`…`) in src/. */
function trKeys(): { key: string; file: string }[] {
  const out: { key: string; file: string }[] = [];
  const re = /\btr\(\s*(['"`])((?:\\.|(?!\1)[\s\S])*?)\1/g;
  for (const file of files('src')) {
    const src = readFileSync(file, 'utf8');
    for (const m of src.matchAll(re)) out.push({ key: m[2].replace(/\\n/g, '\n').replace(/\\(['"`\\])/g, '$1'), file });
  }
  return out;
}

afterEach(() => setLang('en'));

describe('Vietnamese UI text (plan 6a, task 3)', () => {
  it('every tr() string in the game has a Vietnamese translation', () => {
    const keys = trKeys();
    expect(keys.length).toBeGreaterThan(150);
    const missing = keys.filter((k) => !(k.key in VI)).map((k) => `${k.file}: ${k.key}`);
    expect(missing).toEqual([]);
  });

  it('tr() keys use {name} placeholders, never ${} (a template would make a different key every time)', () => {
    const bad = trKeys().filter((k) => k.key.includes('${')).map((k) => `${k.file}: ${k.key}`);
    expect(bad).toEqual([]);
  });

  it('each translation keeps the same {placeholders} as its English key', () => {
    const ph = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');
    const bad = Object.entries(VI).filter(([en, vi]) => ph(en) !== ph(vi)).map(([en]) => en);
    expect(bad).toEqual([]);
  });

  it('dates, directions and night lengths read naturally in Vietnamese', () => {
    setLang('vi');
    expect(formatDay(Date.parse('2028-11-29T19:20Z'))).toBe('29 tháng 11 năm 2028');
    expect(compass(147)).toBe('đông nam');
    expect(compass(0)).toBe('bắc');
    expect(daysText(86)).toBe('ba ngày rưỡi');
    expect(daysText(72)).toBe('ba ngày');
    expect(tr('Resume')).toBe('Tiếp tục');
  });
});

import { DEMO_HINTS } from '../src/demo/demoDirector';
import { NAMES } from '../src/interact/moduleSystem';
import { UPGRADE_TEXT } from '../src/pip/upgrades';
import { SAMPLE_NAME } from '../src/science/scienceSystem';
import { TAG_TEXT } from '../src/ui/notebook';
import { ZONES } from '../src/world/zones';

describe('name tables translated where they are shown (tr(name))', () => {
  it('module, sample, zone, upgrade, card-tag names and demo hints all have Vietnamese', () => {
    const all = [
      ...Object.values(NAMES), ...Object.values(SAMPLE_NAME), ...ZONES.map((z) => z.name), ...Object.values(UPGRADE_TEXT),
      ...Object.values(TAG_TEXT), ...Object.values(DEMO_HINTS).filter((h): h is string => !!h), 'Suit O2', 'Suit heat', 'Pip battery',
    ];
    expect(all.filter((s) => !(s in VI))).toEqual([]);
  });
});

import cardsEn from '../src/content/cards.en.json';
import cardsVi from '../src/content/cards.vi.json';
import { cardsFor, linesFor } from '../src/content/content';
import { LINES } from '../src/content/lines.en';
import { LINES_VI } from '../src/content/lines.vi';

describe('Vietnamese dialogue and knowledge cards (plan 6a, task 4)', () => {
  it('lines.vi has every line of lines.en, same speaker, face and flags, none left empty', () => {
    expect(Object.keys(LINES_VI)).toEqual(Object.keys(LINES));
    for (const id of Object.keys(LINES)) {
      const en = LINES[id];
      const vi = LINES_VI[id];
      expect(vi.length, id).toBe(en.length);
      en.forEach((l, i) => {
        expect({ s: vi[i].speaker, f: vi[i].face, flag: vi[i].setFlag, p: vi[i].pauseBeforeMs }, `${id}[${i}]`).toEqual({ s: l.speaker, f: l.face, flag: l.setFlag, p: l.pauseBeforeMs });
        expect(!!vi[i].text, `${id}[${i}]`).toBe(!!l.text);
      });
    }
  });

  it('cards.vi keeps every card id, tag and source, with Vietnamese title and body', () => {
    expect(cardsVi.map((c) => c.id)).toEqual(cardsEn.map((c) => c.id));
    cardsEn.forEach((c, i) => {
      expect(cardsVi[i].tag).toBe(c.tag);
      expect(cardsVi[i].source).toEqual(c.source);
      expect(cardsVi[i].title.length).toBeGreaterThan(0);
      expect(cardsVi[i].body).not.toBe(c.body);
    });
  });

  it('linesFor / cardsFor pick the language', () => {
    expect(linesFor('en')).toBe(LINES);
    expect(linesFor('vi')).toBe(LINES_VI);
    expect(cardsFor('vi')[0].id).toBe(cardsEn[0].id);
    expect(cardsFor('vi')[0].title).toBe(cardsVi[0].title);
  });
});
