import { VI } from './vi';

/**
 * Language setting (Plan 6a). UI text is written in English in the code and wrapped in tr(); the Vietnamese
 * table maps each English string to its translation. `{name}` marks a value filled in at run time.
 */
export type Lang = 'en' | 'vi';

let current: Lang = 'en';
const listeners = new Set<(l: Lang) => void>();

export const getLang = (): Lang => current;

export function setLang(l: Lang): void {
  if (l === current) return;
  current = l;
  for (const f of listeners) f(l);
}

/** Called after every language change (dialogue script, cards, open panels refresh themselves). */
export function onLangChange(f: (l: Lang) => void): () => void {
  listeners.add(f);
  return () => { listeners.delete(f); };
}

export function tr(en: string, vars?: Record<string, string | number>): string {
  const s = current === 'vi' ? (VI[en] ?? en) : en;
  return vars ? s.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m)) : s;
}

interface KV { getItem(k: string): string | null; setItem(k: string, v: string): void }
const KEY = 'pipmica.lang';

/** The remembered language, or null the very first time (use the browser language). */
export function loadLang(storage: KV | null | undefined): Lang | null {
  try {
    const v = storage?.getItem(KEY);
    return v === 'en' || v === 'vi' ? v : null;
  } catch {
    return null;
  }
}

export function saveLang(storage: KV | null | undefined, l: Lang): void {
  try {
    storage?.setItem(KEY, l);
  } catch {
    /* blocked storage: the choice lasts for this session */
  }
}

export const safeStorage = (): Storage | null => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};
