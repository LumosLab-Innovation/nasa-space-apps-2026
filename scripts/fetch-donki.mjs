// Cache real NASA DONKI solar energetic particle (SEP) events for the Act 4 radiation storm.
// Usage: node scripts/fetch-donki.mjs
// DONKI moved to ccmc.gsfc.nasa.gov/DONKI-API on 2026-09-30; each request may span at most 60 days.
import { mkdir, writeFile } from 'node:fs/promises';

const BASE = 'https://ccmc.gsfc.nasa.gov/DONKI-API/get/SEP';
const FROM = Date.parse('2024-01-01T00:00Z');
const TO = Date.parse('2025-12-31T00:00Z');
const DAY = 86400_000;
const OUT = 'public/data/donki';
const ymd = (t) => new Date(t).toISOString().slice(0, 10);

async function get(url) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(60_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 120)}`);
      const text = await res.text();
      return text.trim() ? JSON.parse(text) : [];
    } catch (err) {
      console.warn(`attempt ${attempt} failed for ${url}: ${err.message}`);
    }
  }
  throw new Error(`DONKI unavailable: ${url}`);
}

const byId = new Map();
const urls = [];
for (let a = FROM; a <= TO; a += 59 * DAY) {
  const b = Math.min(TO, a + 58 * DAY);
  const url = `${BASE}?startDate=${ymd(a)}&endDate=${ymd(b)}`;
  urls.push(url);
  const rows = await get(url);
  for (const r of rows) if (r?.sepID) byId.set(r.sepID, r);
  console.log(`${ymd(a)}..${ymd(b)}: ${rows.length}`);
}
const all = [...byId.values()].sort((x, y) => Date.parse(x.eventTime) - Date.parse(y.eventTime));
await mkdir(OUT, { recursive: true });
await writeFile(`${OUT}/sep.json`, JSON.stringify(all));
await writeFile(
  `${OUT}/SOURCES.md`,
  `# DONKI solar energetic particle events\n\n` +
    `Source: NASA CCMC DONKI (Space Weather Database Of Notifications, Knowledge, Information), ${BASE}\n\n` +
    `Fetched ${new Date().toISOString().slice(0, 10)} with scripts/fetch-donki.mjs, ${ymd(FROM)} to ${ymd(TO)} in ${urls.length} requests of at most 60 days.\n\n` +
    `Events: ${all.length} (unique sepID). File: sep.json (raw DONKI records).\n`,
);
console.log(`saved ${all.length} events`);
