// Fetch Sun & Earth azimuth/elevation as seen from the landing site (JPL Horizons API).
// Usage: node scripts/fetch-horizons.mjs
import { mkdir, writeFile } from 'node:fs/promises';

const SITE_COORD = '222.7,-89.45,0'; // east lon (deg), lat (deg), altitude (km) — keep in sync with src/config/constants.ts
const START = '2028-01-01';
const STOP = '2029-01-01';
const OUT = 'public/data/ephemeris';

async function fetchBody(command) {
  const params = new URLSearchParams({
    format: 'json',
    COMMAND: `'${command}'`,
    OBJ_DATA: 'NO',
    MAKE_EPHEM: 'YES',
    EPHEM_TYPE: 'OBSERVER',
    CENTER: "'coord@301'",
    COORD_TYPE: 'GEODETIC',
    SITE_COORD: `'${SITE_COORD}'`,
    START_TIME: `'${START}'`,
    STOP_TIME: `'${STOP}'`,
    STEP_SIZE: "'1 h'",
    QUANTITIES: "'4'",
    CSV_FORMAT: 'YES',
    ANG_FORMAT: 'DEG',
  });
  const url = `https://ssd.jpl.nasa.gov/api/horizons.api?${params}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Horizons HTTP ${res.status}`);
  const body = await res.json();
  if (!body.result) throw new Error(`Horizons error: ${JSON.stringify(body).slice(0, 300)}`);
  return { url, text: body.result };
}

function parse(text) {
  const start = text.indexOf('$$SOE');
  const end = text.indexOf('$$EOE');
  if (start < 0 || end < 0) throw new Error(`No ephemeris table:\n${text.slice(0, 1500)}`);
  return text
    .slice(start + 5, end)
    .trim()
    .split('\n')
    .map((line) => {
      const cols = line.split(',').map((c) => c.trim());
      // cols: date, solar-presence flag, lunar-presence flag, azimuth, elevation, ...
      const t = Date.parse(cols[0].replace(/^(\d{4})-(\w{3})-(\d{2}) (\d{2}:\d{2})$/, '$2 $3 $1 $4 UTC'));
      return { t, az: Number(cols[3]), el: Number(cols[4]) };
    });
}

await mkdir(OUT, { recursive: true });
const sources = [];
for (const [name, command] of [['sun', '10'], ['earth', '399']]) {
  const { url, text } = await fetchBody(command);
  const rows = parse(text);
  if (rows.some((r) => Number.isNaN(r.t) || Number.isNaN(r.az) || Number.isNaN(r.el))) {
    throw new Error(`Parse failure in ${name}: ${JSON.stringify(rows.slice(0, 2))}`);
  }
  await writeFile(`${OUT}/${name}.json`, JSON.stringify(rows));
  const els = rows.map((r) => r.el);
  console.log(`${name}: ${rows.length} samples, elevation ${Math.min(...els).toFixed(2)}..${Math.max(...els).toFixed(2)} deg`);
  sources.push(`- ${name}: ${url}`);
}
await writeFile(
  `${OUT}/SOURCES.md`,
  `# Ephemeris sources\n\nNASA/JPL Horizons System (https://ssd.jpl.nasa.gov/horizons/), fetched ${new Date().toISOString().slice(0, 10)}.\nObserver: lunar surface, geodetic ${SITE_COORD} (east lon, lat, km). Approximate Shackleton–de Gerlache connecting ridge.\nQuantity 4: apparent azimuth & elevation, 1-hour step, ${START} to ${STOP}.\n\n${sources.join('\n')}\n`,
);
