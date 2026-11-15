import { tr } from '../i18n/i18n';
import { formatDay } from '../story/timeText';

/**
 * Real solar energetic particle (SEP) events from NASA's DONKI database (spec v3 §3, v2 §8): try the live
 * API first, fall back to the copy cached by scripts/fetch-donki.mjs. Never invents an event.
 * DONKI moved to ccmc.gsfc.nasa.gov/DONKI-API on 2026-09-30; one request may span at most 60 days.
 */
export interface StormEvent {
  id: string;
  timeMs: number;
  instrument: string | null;
  link: string | null;
}

type FetchFn = (url: string, init?: { signal?: AbortSignal }) => Promise<{ ok: boolean; json(): Promise<unknown> }>;

const LIVE = 'https://ccmc.gsfc.nasa.gov/DONKI-API/get/SEP';
const DAY = 86400_000;
const TIMEOUT_MS = 4000;

export function parseSep(json: unknown): StormEvent[] {
  if (!Array.isArray(json)) return [];
  const out: StormEvent[] = [];
  for (const r of json) {
    if (!r || typeof r !== 'object') continue;
    const rec = r as { sepID?: unknown; eventTime?: unknown; instruments?: unknown; link?: unknown };
    if (typeof rec.sepID !== 'string' || typeof rec.eventTime !== 'string') continue;
    const timeMs = Date.parse(rec.eventTime);
    if (Number.isNaN(timeMs)) continue;
    const first = Array.isArray(rec.instruments) ? (rec.instruments[0] as { displayName?: unknown } | undefined) : undefined;
    out.push({
      id: rec.sepID,
      timeMs,
      instrument: typeof first?.displayName === 'string' ? first.displayName : null,
      link: typeof rec.link === 'string' ? rec.link : null,
    });
  }
  return out.sort((a, b) => a.timeMs - b.timeMs);
}

/** The latest event actually measured by a spacecraft; DONKI also lists model forecasts ("MODEL: ..."). */
export function pickStorm(events: StormEvent[]): StormEvent | null {
  const measured = events.filter((e) => !e.instrument?.startsWith('MODEL'));
  const pool = measured.length ? measured : events;
  return pool.length ? pool[pool.length - 1] : null;
}

const ymd = (t: number) => new Date(t).toISOString().slice(0, 10);

async function getJson(fetchFn: FetchFn, url: string): Promise<unknown> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    const res = await fetchFn(url, { signal: ctl.signal });
    if (!res.ok) throw new Error(`HTTP error for ${url}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

export async function loadStormEvent(
  fetchFn: FetchFn = fetch as unknown as FetchFn,
  nowMs = Date.now(),
): Promise<{ event: StormEvent | null; source: 'live' | 'cache' | 'none' }> {
  const isModel = (e: StormEvent) => !!e.instrument?.startsWith('MODEL');
  let live: StormEvent | null = null;
  try {
    live = pickStorm(parseSep(await getJson(fetchFn, `${LIVE}?startDate=${ymd(nowMs - 59 * DAY)}&endDate=${ymd(nowMs)}`)));
    if (live && !isModel(live)) return { event: live, source: 'live' };
  } catch {
    /* fall through to the cache */
  }
  // Live had nothing measured (or failed): a measured event from the cache beats a model forecast.
  let cached: StormEvent | null = null;
  try {
    const base = (import.meta as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? '/';
    cached = pickStorm(parseSep(await getJson(fetchFn, `${base}data/donki/sep.json`)));
  } catch {
    /* no cache */
  }
  if (cached && !isModel(cached)) return { event: cached, source: 'cache' };
  if (live) return { event: live, source: 'live' };
  if (cached) return { event: cached, source: 'cache' };
  return { event: null, source: 'none' };
}


export function stormBlurb(ev: StormEvent | null): string {
  if (!ev) return tr('Based on the kind of solar particle events NASA tracks in its DONKI database');
  const d = new Date(ev.timeMs);
  const date = formatDay(ev.timeMs);
  return tr("Based on a real solar energetic particle event recorded by NASA's DONKI on {date}{inst}", { date, inst: ev.instrument ? ` (${ev.instrument})` : '' });
}
