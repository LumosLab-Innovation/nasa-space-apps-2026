import { latLonToSphere, MOON_R_KM } from '../landing/moonMath';

export const ORBIT_SUN_LON = -46.527;
const DEG = Math.PI / 180;
export interface HeightGrid {
  width: number; height: number; west: number; east: number; north: number; south: number;
  samples: Uint16Array;
}
export type Elevation = (lat: number, lon: number) => number;
export const elevationKm = (sample: number) => sample / 2000 - 10;

export function sampleGrid(g: HeightGrid, lat: number, lon: number): number {
  const x = Math.max(0, Math.min(g.width - 1, (lon - g.west) / (g.east - g.west) * (g.width - 1)));
  const y = Math.max(0, Math.min(g.height - 1, (g.north - lat) / (g.north - g.south) * (g.height - 1)));
  const a = Math.min(g.width - 2, Math.floor(x)), b = Math.min(g.height - 2, Math.floor(y));
  const u = x - a, v = y - b, d = g.samples, w = g.width;
  return elevationKm((d[b*w+a]*(1-u)+d[b*w+a+1]*u)*(1-v)+(d[(b+1)*w+a]*(1-u)+d[(b+1)*w+a+1]*u)*v);
}

/** Decode the v1 gzip + uint16 row-delta format without changing any elevation bits. */
export async function decodeOrbitalSamples(bytes: ArrayBuffer): Promise<Uint16Array> {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
  const raw = await new Response(stream).arrayBuffer();
  const globalCount = 720 * 360;
  if (raw.byteLength !== 2 * (globalCount + 768 * 768)) throw new Error('Incomplete NASA LOLA elevation data');
  const samples = new Uint16Array(raw);
  let offset = 0;
  for (const [width,height] of [[720,360],[768,768]]) {
    for (let row=0;row<height;row++) {
      let previous = 0;
      for (let col=0;col<width;col++,offset++) {
        previous = (previous+samples[offset])&65535;
        samples[offset] = previous;
      }
    }
  }
  return samples;
}

export async function readOrbitalElevation(bytes: ArrayBuffer): Promise<Elevation> {
  const samples = await decodeOrbitalSamples(bytes);
  const globalCount = 720 * 360;
  const global: HeightGrid = { width: 720, height: 360, west: -180+.25, east: 180-.25, north: 90-.25, south: -90+.25, samples: samples.subarray(0, globalCount) };
  const local: HeightGrid = { width: 768, height: 768, west: 12+1/64, east: 36-1/64, north: 12-1/64, south: -12+1/64, samples: samples.subarray(globalCount) };
  return (lat, lon) => {
    lon = ((lon + 180) % 360 + 360) % 360 - 180;
    const coarse = sampleGrid(global, lat, lon);
    const edge = Math.min(lon-12, 36-lon, lat+12, 12-lat);
    if (edge <= 0) return coarse;
    const t = Math.min(1, edge / .75), blend = t*t*(3-2*t);
    return coarse + (sampleGrid(local, lat, lon) - coarse) * blend;
  };
}

export function lunarCoordinates(p: { x: number; y: number; z: number }) {
  const radius = Math.hypot(p.x, p.y, p.z);
  return { lat: Math.asin(p.y / radius) / DEG, lon: Math.atan2(-p.z, -p.x) / DEG, radius };
}
export function terrainClearance(p: { x: number; y: number; z: number }, elevation: Elevation): number {
  const c = lunarCoordinates(p);
  return c.radius - MOON_R_KM - elevation(c.lat, c.lon);
}

function axis(sections: [number, number, number][]) {
  const values: number[] = [];
  for (const [start, end, step] of sections) for (let i = 0; i < Math.round((end-start)/step); i++) values.push(start+i*step);
  values.push(sections.at(-1)![1]);
  return values;
}

const detailLats=axis([[-12,-8,.5],[-8,-4,.25],[-4,4,1/32],[4,8,.25],[8,12,.5]]);
const detailLons=axis([[12,16,.25],[16,30,1/32],[30,36,.25]]);
function cell(values:number[],v:number){let lo=0,hi=values.length-1;while(hi-lo>1){const mid=(lo+hi)>>1;if(values[mid]<=v)lo=mid;else hi=mid;}return [values[lo],values[hi]];}
/** Ray/triangle plane of the mesh actually drawn, including the coarse globe's chord sag. */
export function renderedSurfaceRadius(lat:number,lon:number,elevation:Elevation):number {
  const local=lat>=-12&&lat<=12&&lon>=12&&lon<=36;
  const [south,north]=local?cell(detailLats,lat):[Math.floor(lat/2)*2,Math.floor(lat/2)*2+2];
  const [west,east]=local?cell(detailLons,lon):[Math.floor(lon/2)*2,Math.floor(lon/2)*2+2];
  const point=(a:number,b:number)=>{
    const raw=(x:number,y:number)=>latLonToSphere(x,y,MOON_R_KM+elevation(x,y));
    if(local&&(Math.abs(a)===12||b===12||b===36)){
      const edge=Math.abs(a)===12,v=edge?b:a,low=Math.floor(v/2)*2,t=(v-low)/2;
      const p=raw(edge?a:low,edge?low:b),q=raw(edge?a:low+2,edge?low+2:b);
      return {x:p.x+(q.x-p.x)*t,y:p.y+(q.y-p.y)*t,z:p.z+(q.z-p.z)*t};
    }
    return raw(a,b);
  };
  const u=(lon-west)/(east-west),v=(north-lat)/(north-south);
  const a=point(north,u+v<=1?west:east),b=point(south,west),c=point(u+v<=1?north:south,east);
  const ab={x:b.x-a.x,y:b.y-a.y,z:b.z-a.z},ac={x:c.x-a.x,y:c.y-a.y,z:c.z-a.z};
  const n={x:ab.y*ac.z-ab.z*ac.y,y:ab.z*ac.x-ab.x*ac.z,z:ab.x*ac.y-ab.y*ac.x};
  const d=latLonToSphere(lat,lon,1);
  return (n.x*a.x+n.y*a.y+n.z*a.z)/(n.x*d.x+n.y*d.y+n.z*d.z);
}
export function renderedTerrainClearance(p:{x:number;y:number;z:number},elevation:Elevation){
  const c=lunarCoordinates(p);return c.radius-renderedSurfaceRadius(c.lat,c.lon,elevation);
}

/** Static mesh: ~330k triangles, one draw call, no subdivisions or allocations in the flight loop. */
export function buildOrbitalGeometry(elevation: Elevation) {
  const positions: number[] = [], uvs: number[] = [], indices: number[] = [];
  const point = (lat: number, lon: number) => latLonToSphere(lat, lon, MOON_R_KM+elevation(lat,lon));
  const append = (lats: number[], lons: number[], local: boolean) => {
    const base = positions.length/3, w = lons.length;
    for (const lat of lats) for (const lon of lons) {
      let p = point(lat, lon);
      // Match the coarse mesh's straight edge segments exactly: no T-junction cracks.
      const edgeLat = local && (lat === -12 || lat === 12);
      const edgeLon = local && (lon === 12 || lon === 36);
      if (edgeLat || edgeLon) {
        const value = edgeLat ? lon : lat, low = Math.floor(value/2)*2, t=(value-low)/2;
        const a = point(edgeLat ? lat : low, edgeLat ? low : lon);
        const b = point(edgeLat ? lat : low+2, edgeLat ? low+2 : lon);
        p = { x:a.x+(b.x-a.x)*t, y:a.y+(b.y-a.y)*t, z:a.z+(b.z-a.z)*t };
      }
      positions.push(p.x,p.y,p.z);
      uvs.push((lon+180)/360,(90-lat)/180);
    }
    for (let y=0;y<lats.length-1;y++) for (let x=0;x<w-1;x++) {
      if (!local && lats[y] <= 12 && lats[y+1] >= -12 && lons[x] >= 12 && lons[x+1] <= 36) continue;
      const a=base+y*w+x;
      indices.push(a,a+w,a+1,a+1,a+w,a+w+1);
    }
  };
  append(axis([[-90,90,2]]).reverse(), axis([[-180,180,2]]), false);
  append(axis([[-12,-8,.5],[-8,-4,.25],[-4,4,1/32],[4,8,.25],[8,12,.5]]).reverse(),
    axis([[12,16,.25],[16,30,1/32],[30,36,.25]]), true);
  return { positions, uvs, indices };
}
