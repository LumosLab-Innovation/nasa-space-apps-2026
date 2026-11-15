// Rebuild: node scripts/build-orbital-terrain.mjs
// NASA SVS LOLA, not a brightness-derived height map. Downloads are development-only.
import { fromUrl } from 'geotiff';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { encodeOrbitalHeightmap } from './heightmap-codec.mjs';
import { spawnSync } from 'node:child_process';

const BASE = 'https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/';
const OUT = 'public/textures/moon';
await mkdir('.superpowers', { recursive: true });
await mkdir(OUT, { recursive: true });
const width = 1536, height = 1536, left = 192 * 64, top = 78 * 64;
async function cached(name, build) {
  try { return await readFile(`.superpowers/${name}`); }
  catch { const b = await build(); await writeFile(`.superpowers/${name}`, b); return b; }
}
const region = await cached('lola-tranquility-source.u16', async () => {
  const url = `${BASE}ldem_64_uint.tif`;
  const im = await (await fromUrl(url)).getImage();
  const offsets = await im.fileDirectory.loadValue('StripOffsets');
  const counts = await im.fileDirectory.loadValue('StripByteCounts');
  const result = Buffer.alloc(width * height * 2);
  // Four contiguous range requests avoid thousands of per-strip HTTP round trips.
  await Promise.all([0, 384, 768, 1152].map(async (r) => {
    const first = offsets[top+r], last = offsets[top+r+383]+counts[top+r+383]-1;
    const res = await fetch(url, { headers: { Range: `bytes=${first}-${last}` } });
    if (res.status !== 206) throw Error(`NASA range request failed: ${res.status}`);
    const bytes = Buffer.from(await res.arrayBuffer());
    if (bytes.length !== last-first+1) throw Error('Incomplete NASA elevation range');
    for (let y = 0; y < 384; y++) {
      const start = offsets[top+r+y]-first + left*2;
      bytes.copy(result, (r+y)*width*2, start, start+width*2);
    }
  }));
  return result;
});
const global = await cached('lola-global-source.u16', async () => {
  const im = await (await fromUrl(`${BASE}ldem_4_uint.tif`)).getImage();
  const [r] = await im.readRasters();
  return Buffer.from(r.buffer, r.byteOffset, r.byteLength);
});
// Match the rendered grid; retain the full-resolution source for normals/shadows below.
function halfGrid(bytes, w, h) {
  const src = new Uint16Array(bytes.buffer, bytes.byteOffset, bytes.byteLength/2);
  const dst = new Uint16Array(w*h/4);
  for(let y=0;y<h/2;y++) for(let x=0;x<w/2;x++) {
    const a=2*y*w+2*x;
    dst[y*w/2+x]=Math.round((src[a]+src[a+1]+src[a+w]+src[a+w+1])/4);
  }
  return Buffer.from(dst.buffer);
}
await writeFile(`${OUT}/lola-elevation-delta-v1.bin`, encodeOrbitalHeightmap(Buffer.concat([halfGrid(global,1440,720), halfGrid(region,width,height)])));
const regional = new Uint16Array(region.buffer, region.byteOffset, region.byteLength/2);
const coarse = new Uint16Array(global.buffer, global.byteOffset, global.byteLength/2);
const DEG = Math.PI/180, R = 1737.4;
function sample(data, w, h, x, y) {
  x = Math.max(0,Math.min(w-1,x)); y = Math.max(0,Math.min(h-1,y));
  const a = Math.min(w-2,Math.floor(x)), b = Math.min(h-2,Math.floor(y));
  const u=x-a,v=y-b;
  return ((data[b*w+a]*(1-u)+data[b*w+a+1]*u)*(1-v)+(data[(b+1)*w+a]*(1-u)+data[(b+1)*w+a+1]*u)*v)/2000-10;
}
function elev(lat, lon) {
  if (lon >= 12 && lon <= 36 && lat >= -12 && lat <= 12) return sample(regional,width,height,(lon-12)*64-.5,(12-lat)*64-.5);
  return sample(coarse,1440,720,(lon+180)*4-.5,(90-lat)*4-.5);
}
// Match ORBIT_SUN_LON in orbitalTerrain.ts. A staged evening Sun, not an ephemeris claim.
const sunLon = -46.527*DEG;
const sun = [-Math.cos(sunLon),0,-Math.sin(sunLon)];
const map = Buffer.alloc(width*height*3);
let min=Infinity,max=-Infinity,shadowed=0;
for(let y=0;y<height;y++) {
  const lat=12-(y+.5)/64, phi=lat*DEG, cos=Math.cos(phi), sin=Math.sin(phi);
  const spacing=R*DEG/64;
  for(let x=0;x<width;x++) {
    const lon=12+(x+.5)/64, lam=lon*DEG;
    const h=elev(lat,lon); min=Math.min(min,h);max=Math.max(max,h);
    const nx=-(elev(lat,lon+1/64)-elev(lat,lon-1/64))/(2*spacing*cos);
    const ny=-(elev(lat+1/64,lon)-elev(lat-1/64,lon))/(2*spacing);
    const norm=Math.hypot(nx,ny,1);
    const px=-(R+h)*cos*Math.cos(lam),py=(R+h)*sin,pz=-(R+h)*cos*Math.sin(lam);
    let vis=1;
    for(let s=.7;s<=40;s+=.7+s*.035) {
      const qx=px+sun[0]*s,qy=py,qz=pz+sun[2]*s,rad=Math.hypot(qx,qy,qz);
      if(rad-R>max+8) break;
      const qlat=Math.asin(qy/rad)/DEG,qlon=Math.atan2(-qz,-qx)/DEG;
      const gap=rad-R-elev(qlat,qlon)+.015;
      vis=Math.min(vis,Math.max(0,Math.min(1,gap/(s*.00465))));
      if(vis===0)break;
    }
    if(vis<.5)shadowed++;
    const i=(y*width+x)*3;
    map[i]=Math.round((nx/norm*.5+.5)*255);
    map[i+1]=Math.round((ny/norm*.5+.5)*255);
    map[i+2]=Math.round(vis*255);
  }
  if(y%384===0)console.log(`Baking DEM normals/shadows ${Math.round(y/height*100)}%`);
}
await writeFile('.superpowers/lola-relief.rgb',map);
const py=spawnSync('py',['-c',`from PIL import Image\nim=Image.frombytes('RGB',(${width},${height}),open('.superpowers/lola-relief.rgb','rb').read())\nim.save('${OUT}/lola-relief.webp',lossless=True,method=6)`],{stdio:'inherit'});
if(py.status!==0)throw Error('Pillow lossless map encoding failed');
console.log(JSON.stringify({source:BASE+'ldem_64_uint.tif',width,height,minKm:min,maxKm:max,apolloKm:elev(.674,23.473),shadowedPixels:shadowed}));
