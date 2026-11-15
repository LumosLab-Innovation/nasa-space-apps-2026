import { gzipSync } from 'node:zlib';

/** Lossless uint16 LE row deltas. Dimensions are part of the v1 asset format. */
export function encodeOrbitalHeightmap(raw) {
  if (raw.length !== (720*360+768*768)*2) throw Error('Unexpected orbital heightmap dimensions');
  const delta = Buffer.alloc(raw.length);
  let offset = 0;
  for (const [width,height] of [[720,360],[768,768]]) {
    for (let row=0;row<height;row++) {
      let previous = 0;
      for (let col=0;col<width;col++,offset+=2) {
        const value = raw.readUInt16LE(offset);
        delta.writeUInt16LE((value-previous)&65535,offset);
        previous = value;
      }
    }
  }
  return gzipSync(delta, { level: 9 });
}
