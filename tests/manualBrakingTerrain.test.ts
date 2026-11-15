import {expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {readOrbitalElevation,renderedSurfaceRadius} from '../src/world/orbitalTerrain';
import {flightReference,stepFlight,type FlightState} from '../src/landing/guidedFlight';
import {flightWarp} from '../src/landing/descentGeometry';
import {BrakingFailureMonitor} from '../src/landing/assistedFlight';

const base=[-1620761.2899737174,0,-659919.4335979708];
const seed:FlightState={x:10.57618527074,y:13845.86691111,vx:1678.75947308,vy:-23.3357714,
 pitch:1.57001063058,throttle:.00315,fuelKg:89999.98927297,t:.0063};
it.each([30,60,120])('supports deliberate manual inputs on the real LOLA route at %i FPS',async hz=>{
  const bytes=readFileSync('public/textures/moon/lola-elevation-delta-v1.bin');
  const elevation=await readOrbitalElevation(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength));
  const radius=1737400,datum=Math.hypot(...base)-seed.y;
  const origin=Math.atan2(-base[2],-base[0])*180/Math.PI-seed.x/radius*180/Math.PI;
  const groundAt=(x:number)=>renderedSurfaceRadius(0,origin+x/radius*180/Math.PI,elevation)*1000-datum;
  let s={...seed},next=0,lastError=0,lastDecision=0,held=false,failure:string|null=null;
  const monitor=new BrakingFailureMonitor();
  for(let frame=0;frame<hz*360&&s.y-groundAt(s.x)>300;frame++){
    const time=frame/hz,ground=groundAt(s.x),height=s.y-ground;
    if(time+1e-8>=next){
      const error=s.vx-flightReference(height).vx;
      const trend=(error-lastError)/Math.max(.8,time-lastDecision);
      held=error+3*trend>0;lastError=error;lastDecision=time;next+=.8;
    }
    const warp=flightWarp(Math.max(0,time-2.4),height,false);
    s=stepFlight(s,{assist:false,lightAssist:true,throttle:held?1:0,ground,attitudeTimeScale:1/warp},warp/hz);
    const clearance=s.y-groundAt(s.x);
    failure=monitor.update(1/hz,clearance,s.vx,flightReference(clearance).vx,s.vy);
    if(failure)break;
  }
  expect(failure,JSON.stringify({s,clearance:s.y-groundAt(s.x)})).toBeNull();
  expect(s.y-groundAt(s.x)).toBeLessThanOrEqual(300);
  expect(Math.abs(s.vx)).toBeLessThanOrEqual(12);
  expect(s.vy).toBeGreaterThanOrEqual(-25);
  expect(s.fuelKg).toBeGreaterThan(0);
});
