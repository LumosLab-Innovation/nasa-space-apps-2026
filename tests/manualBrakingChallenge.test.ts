import { flightWarp } from '../src/landing/descentGeometry';
import { BrakingFailureMonitor } from '../src/landing/assistedFlight';
import { expect, it } from 'vitest';
import { flightStart, flightReference, stepFlight, availableThrust } from '../src/landing/guidedFlight';

it.each([30, 60, 120])('gives the player gradual direct thrust authority at %i FPS', fps => {
  for (const warp of [1, 4]) {
    for (const held of [false, true]) {
      let s={...flightStart(),throttle:.5};
      for(let i=0;i<fps/2;i++) s=stepFlight(s,{assist:false,lightAssist:true,throttle:held?1:0,attitudeTimeScale:1/warp},warp/fps);
      expect(s.throttle).toBeCloseTo(held?.56:.45,6);
    }
  }
});

it('keeps horizontal speed error out of manual throttle and pitch guidance', () => {
  const ref=flightReference(3000);
  const s={...flightStart(),y:3000,vx:ref.vx,vy:ref.vy,throttle:.5,pitch:Math.atan2(-ref.ax,1.62+ref.ay)};
  const cmd={assist:false,lightAssist:true,throttle:1,attitudeTimeScale:1/4};
  const a=stepFlight(s,cmd,.1),b=stepFlight({...s,vx:ref.vx*1.5},cmd,.1);
  expect(a.throttle).toBeCloseTo(b.throttle,10);
  expect(a.pitch).toBeCloseTo(b.pitch,10);
  const autoA=stepFlight(s,{...cmd,assist:true},.1),autoB=stepFlight({...s,vx:ref.vx*1.5},{...cmd,assist:true},.1);
  expect(Math.abs(autoA.pitch-autoB.pitch)).toBeGreaterThan(.001);
});

it('preserves entry thrust, respects pause, fuel and ramp limits', () => {
  const s={...flightStart(),throttle:.65};
  const cmd={assist:false,lightAssist:true,throttle:1};
  expect(stepFlight(s,cmd,0)).toEqual(s);
  expect(stepFlight(s,cmd,1/60).throttle).toBeCloseTo(.652,6);
  expect(stepFlight({...s,throttle:.9999},cmd,1/60).throttle).toBe(1);
  expect(stepFlight({...s,throttle:.0001},{...cmd,throttle:0},1/60).throttle).toBe(0);
  expect(stepFlight({...s,fuelKg:0},cmd,1/60).throttle).toBe(0);
  let released=s;
  for(let i=0;i<60*8;i++)released=stepFlight(released,{...cmd,throttle:0},1/60);
  expect(released.throttle).toBe(0);
});

it('rewards closing actual speed error even as the target speed falls', () => {
  const monitor=new BrakingFailureMonitor();
  for(let i=0;i<120;i++)expect(monitor.update(1/60,3000,300,150,-50)).toBeNull();
  // Absolute mismatch falls 10 m/s each second, but the ratio grows as the
  // target shrinks. The player must not lose while actually correcting it.
  for(let i=0;i<600;i++) {
    const t=i/60, reference=150-12*t, error=150-10*t;
    expect(monitor.update(1/60,3000-100*t,reference+error,reference,-50)).toBeNull();
  }
});

// Checkpoints approximate the fuel remaining on the real route, not arbitrary dry masses.
it.each([10000,3000,800])('permits delayed correction from both sides at %i m', height => {
  for(const ratio of [.75,1.25]){
    const ref=flightReference(height),fuel=height>5000?65000:height>1000?29000:15000;
    let s={...flightStart(),y:height,vx:ref.vx*ratio,vy:ref.vy,fuelKg:fuel,
      throttle:Math.min(1,Math.hypot(ref.ax,1.62+ref.ay)*(120000+fuel)/availableThrust(height)),
      pitch:Math.atan2(-ref.ax,Math.max(.05,1.62+ref.ay))};
    const monitor=new BrakingFailureMonitor();
    let recovered=false;
    for(let frame=0;frame<60*30&&s.y>300;frame++){
      const t=frame/60,warp=flightWarp(10,s.y,false);
      // Two seconds continuing the wrong input, then correcting deliberately.
      const held=t<2?ratio<1:ratio>1;
      s=stepFlight(s,{assist:false,lightAssist:true,throttle:held?1:0,attitudeTimeScale:1/warp},warp/60);
      const target=flightReference(s.y).vx;
      expect(monitor.update(1/60,s.y,s.vx,target,s.vy),JSON.stringify({height,ratio,t,s})).toBeNull();
      if(Math.abs(s.vx-target)<=Math.max(3,target*.18)){recovered=true;break;}
    }
    expect(recovered).toBe(true);
  }
});

it.each([false,true])('does not fly the whole challenge for a constant held=%s input', held=>{
  let s=flightStart(),failure:string|null=null;const monitor=new BrakingFailureMonitor();
  for(let frame=0;frame<60*360&&s.y>300;frame++){
    const warp=flightWarp(frame/60,s.y,false);
    s=stepFlight(s,{assist:false,lightAssist:true,throttle:held?1:0,attitudeTimeScale:1/warp},warp/60);
    failure=monitor.update(1/60,s.y,s.vx,flightReference(s.y).vx,s.vy);
    if(failure)break;
  }
  expect(failure).not.toBeNull();
});

it.each([10000,3000,800])('makes prolonged uncorrected input leave green at %i m',height=>{
  for(const held of [false,true]){
    const ref=flightReference(height),fuel=height>5000?65000:height>1000?29000:15000;
    let s={...flightStart(),y:height,vx:ref.vx,vy:ref.vy,fuelKg:fuel,
      throttle:Math.min(1,Math.hypot(ref.ax,1.62+ref.ay)*(120000+fuel)/availableThrust(height)),
      pitch:Math.atan2(-ref.ax,Math.max(.05,1.62+ref.ay))};
    let departure:number|null=null;
    for(let frame=0;frame<60*15&&s.y>300;frame++){
      const warp=flightWarp(10,s.y,false);
      s=stepFlight(s,{assist:false,lightAssist:true,throttle:held?1:0,attitudeTimeScale:1/warp},warp/60);
      const target=flightReference(s.y).vx;
      if(Math.abs(s.vx-target)>Math.max(3,target*.18)){departure=frame/60;break;}
    }
    expect(departure).not.toBeNull();
    expect(departure!).toBeGreaterThan(2); // No immediate cliff from a settled state.
    expect(departure!).toBeLessThan(height>5000?12:5);
  }
});
