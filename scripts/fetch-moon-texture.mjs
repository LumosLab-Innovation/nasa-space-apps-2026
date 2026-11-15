// Downloads the NASA SVS CGI Moon Kit colour map (2k) used by the orbital landing intro (Plan 5).
// Source: https://svs.gsfc.nasa.gov/4720 — credit "NASA's Scientific Visualization Studio".
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const URL_ = 'https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/lroc_color_2k.jpg';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'public', 'textures', 'moon');

/** Width and height from the first SOFn marker of a JPEG. */
function jpegSize(buf) {
  if (buf[0] !== 0xff || buf[1] !== 0xd8) throw new Error('not a JPEG');
  let i = 2;
  while (i < buf.length) {
    if (buf[i] !== 0xff) throw new Error(`bad marker at ${i}`);
    const m = buf[i + 1];
    const len = buf.readUInt16BE(i + 2);
    if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) {
      return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
    }
    i += 2 + len;
  }
  throw new Error('no SOF marker');
}

const res = await fetch(URL_);
if (!res.ok) throw new Error(`HTTP ${res.status} for ${URL_}`);
const buf = Buffer.from(await res.arrayBuffer());
const { w, h } = jpegSize(buf);
if (w !== 2048 || h !== 1024) throw new Error(`expected 2048×1024, got ${w}×${h}`);
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'lroc_color_2k.jpg'), buf);
writeFileSync(
  join(outDir, 'SOURCES.md'),
  `# Moon textures\n\n` +
    `- \`lroc_color_2k.jpg\` (${w}×${h}, ${(buf.length / 1024).toFixed(0)} KB)\n` +
    `  - Source: ${URL_}\n` +
    `  - Page: https://svs.gsfc.nasa.gov/4720 (CGI Moon Kit)\n` +
    `  - Downloaded: ${new Date().toISOString().slice(0, 10)}\n` +
    `  - Credit: NASA's Scientific Visualization Studio. Colour map built from LRO Camera (LROC) Wide Angle Camera mosaics.\n`,
);
console.log(`saved lroc_color_2k.jpg ${w}×${h} ${(buf.length / 1024).toFixed(0)} KB`);
