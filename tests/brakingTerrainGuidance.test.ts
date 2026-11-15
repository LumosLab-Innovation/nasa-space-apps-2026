import { expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { readOrbitalElevation, renderedSurfaceRadius } from '../src/world/orbitalTerrain';
import { stepFlight, type FlightState } from '../src/landing/guidedFlight';
import { flightWarp } from '../src/landing/descentGeometry';

// Reproduce the reported 10 km burn on the real LOLA route, rather than flat terrain.
const base=[-1620761.2899737174,0,-659919.4335979708];
const seed:FlightState={x:10.57618527074,y:13845.86691111,vx:1678.75947308,vy:-23.3357714,
 pitch:1.57001063058,throttle:.00315,fuelKg:89999.98927297,t:.0063};

it.each([30,60,120])('keeps the high burn stable over crater slopes at %i FPS and preserves the low approach',async hz=>{
 const bytes=readFileSync('public/textures/moon/lola-elevation-delta-v1.bin');
 const elevation=await readOrbitalElevation(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength));
 const radius=1737400,datum=Math.hypot(...base)-seed.y;
 const origin=Math.atan2(-base[2],-base[0])*180/Math.PI-seed.x/radius*180/Math.PI;
 let s={...seed},realTime=0,entry=0,previousPitch:number|undefined,variation=0;
 let minPitch=90,maxPitch=0,h=seed.y;
 for(let i=0;i<hz*150;i++){
  const lon=origin+s.x/radius*180/Math.PI;
  const ground=renderedSurfaceRadius(0,lon,elevation)*1000-datum;
  h=s.y-ground;if(h<=300)break;
  if(h<=1000&&!entry)entry=realTime;
  if(h<12000&&h>8000){
   const pitch=s.pitch*180/Math.PI;
   if(previousPitch!==undefined)variation+=Math.abs(pitch-previousPitch);
   previousPitch=pitch;minPitch=Math.min(minPitch,pitch);maxPitch=Math.max(maxPitch,pitch);
  }
  const previousY=s.y;
  const warp=flightWarp(Math.max(0,realTime-2.4),h);
  const priorPitch=s.pitch;
  s=stepFlight(s,{assist:true,throttle:0,ground,attitudeTimeScale:1/warp},warp/hz);
  if(h>5000&&s.y-ground>5000)expect(Math.abs(s.pitch-priorPitch)).toBeLessThanOrEqual(6*Math.PI/180/hz+1e-8);
  expect(s.y).toBeLessThan(previousY); // Actual radial descent must not bob upward.
  realTime+=1/hz;
 }
 expect(h).toBeLessThanOrEqual(300);
 expect(maxPitch-minPitch).toBeLessThan(2);
 expect(variation).toBeLessThan(3);
 expect(realTime-entry).toBeGreaterThanOrEqual(18);
 expect(realTime-entry).toBeLessThanOrEqual(22);
 expect(s.fuelKg).toBeGreaterThan(0);
});

