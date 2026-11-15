import { expect, it } from 'vitest';
import { flightReference, flightStart, stepFlight } from '../src/landing/guidedFlight';
import { flightWarp } from '../src/landing/descentGeometry';
import { BrakingFailureMonitor } from '../src/landing/assistedFlight';

it.each([30,60,120].flatMap(fps=>[.8,1].map(reaction=>({fps,reaction}))))('lets a player reacting every $reaction seconds complete braking at $fps FPS', ({fps,reaction})=>{
  let s=flightStart(), held=false, nextDecision=0, failure:string|null=null, time=0, lastError=0, lastDecision=0;
  const monitor=new BrakingFailureMonitor();
  for(;time<360&&s.y>300;time+=1/fps){
    // A player watches both gauge position and direction, easing before overshoot.
    // This observer runs only in the test; gameplay has no speed controller.
    if(time+1e-8>=nextDecision){
      const error=s.vx-flightReference(s.y).vx;
      const trend=(error-lastError)/Math.max(reaction,time-lastDecision);
      held=error+3*trend>0;lastError=error;lastDecision=time;nextDecision+=reaction;
    }
    const warp=flightWarp(time,s.y,false);
    s=stepFlight(s,{assist:false,lightAssist:true,throttle:held?1:0,attitudeTimeScale:1/warp},warp/fps);
    failure=monitor.update(1/fps,s.y,s.vx,flightReference(s.y).vx,s.vy);
    if(failure)break;
  }
  expect({failure,h:s.y,vx:s.vx,vy:s.vy,time}).toMatchObject({failure:null});
  expect(s.y).toBeLessThanOrEqual(300);
  expect(Math.abs(s.vx)).toBeLessThanOrEqual(12);
  expect(s.vy).toBeGreaterThanOrEqual(-25);
});


it('slows manual playback without changing the automatic or low-approach pace',()=>{
  expect(flightWarp(10,5000,false)).toBe(4);
  expect(flightWarp(10,5000,true)).toBe(10);
  expect(flightWarp(10,1000,false)).toBe(1);
});

it('does not expire the failure countdown while the player is steadily recovering',()=>{
  const monitor=new BrakingFailureMonitor();
  for(let i=0;i<300;i++)expect(monitor.update(1/60,5000,200,100,-12)).toBeNull();
  for(let i=0;i<600;i++)expect(monitor.update(1/60,5000,200-i/30,100,-12)).toBeNull();
  // Once recovery stops, a sustained severe error still fails.
  let result:string|null=null;
  for(let i=0;i<370;i++)result=monitor.update(1/60,5000,180,100,-12);
  expect(result).toBe('brakingFast');
});

it.each([.75,1.25])('returns a speed ratio %s to green when the player follows the cue', ratio=>{
  const ref=flightReference(5000);
  let s={...flightStart(),y:5000,vx:ref.vx*ratio,vy:ref.vy,throttle:.7,fuelKg:50000,pitch:Math.atan2(-ref.ax,1.62+ref.ay)};
  const monitor=new BrakingFailureMonitor();
  let recovered=false;
  for(let i=0;i<60*15;i++){
    const warp=flightWarp(10,s.y,false);
    s=stepFlight(s,{assist:false,lightAssist:true,throttle:ratio>1?1:0,attitudeTimeScale:1/warp},warp/60);
    const target=flightReference(s.y).vx;
    expect(monitor.update(1/60,s.y,s.vx,target,s.vy)).toBeNull();
    if(Math.abs(s.vx-target)<=Math.max(3,target*.18)){recovered=true;break;}
  }
  expect(recovered).toBe(true);
});
