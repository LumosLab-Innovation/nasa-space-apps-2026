import { expect, it } from 'vitest';
import { flightStart, stepFlight, nominalApproach, flightReference, type FlightState } from '../src/landing/guidedFlight';
import { HLS } from '../src/landing/descent';

it('limits high-burn attitude motion in playback seconds even at x10 simulation speed',()=>{
 const s={...flightStart(),y:13000,vx:1418,vy:-75,throttle:.7};
 const n=stepFlight(s,{assist:true,throttle:0,attitudeTimeScale:.1},10/60);
 expect(Math.abs(n.pitch-s.pitch)).toBeLessThanOrEqual((6*Math.PI/180)/60+1e-8);
 expect(n.pitch).toBeLessThan(s.pitch);
});
it('holds the outgoing attitude when the high-burn guidance requests negligible thrust',()=>{
 const s={...flightStart(),y:16000,vy:-23};
 const n=stepFlight(s,{assist:true,throttle:0},2);
 expect(n.pitch).toBeCloseTo(s.pitch,6);
});

function run(hz=60,manual=false) {
 let s=flightStart(), entry=0, end=0, minFuel=s.fuelKg, maxForce=0;
 const samples:FlightState[]=[];
 for(let i=0;i<hz*650 && s.y>300;i++) {
  const previous=s;
  s=stepFlight(s,{assist:!manual,throttle:0},1/hz);
  if(previous.y>1000 && s.y<=1000)entry=s.t;
  minFuel=Math.min(minFuel,s.fuelKg);
  maxForce=Math.max(maxForce,s.throttle*HLS.maxThrustN);
  if(s.y<=1000)samples.push(s);
 }
 end=s.t;
 return {s,entry,seconds:end-entry,minFuel,maxForce,samples};
}
it.each([30,60,120])('flies the full nominal approach in 18–22 seconds at %i FPS without a velocity reset',hz=>{
 const r=run(hz);
 expect(r.entry).toBeGreaterThan(0);
 expect(r.seconds).toBeGreaterThanOrEqual(18);expect(r.seconds).toBeLessThanOrEqual(22);
 expect(r.s.vy).toBeCloseTo(-12,0);expect(r.s.vx).toBeCloseTo(4,0);
 expect(Math.abs(r.s.pitch)).toBeLessThan(.06);
 expect(r.minFuel).toBeGreaterThan(0);expect(r.maxForce).toBeLessThanOrEqual(HLS.maxThrustN);
 for(let i=1;i<r.samples.length;i++)expect(r.samples[i].y).toBeLessThan(r.samples[i-1].y);
});
it('integrates reported velocities, ramps ignition, consumes actual thrust fuel',()=>{
 let s=flightStart();
 for(let i=0;i<180;i++){
  const n=stepFlight(s,{assist:true,throttle:0},1/120);
  expect(n.x-s.x).toBeCloseTo((n.vx+s.vx)/2/120,6);
  expect(n.y-s.y).toBeCloseTo((n.vy+s.vy)/2/120,6);
  expect(Math.abs(n.throttle-s.throttle)).toBeLessThanOrEqual(1/60*.65+1e-8);
  expect(n.fuelKg).toBeLessThanOrEqual(s.fuelKg);
  s=n;
 }
 expect(s.vx).toBeLessThan(1680);expect(s.throttle).toBeGreaterThan(.2);
});
it('no thrust really freefalls and keeps horizontal inertia; empty fuel does too',()=>{
 const a={...flightStart(),y:1000,vy:-32,vx:172};
 const n=stepFlight(a,{assist:false,throttle:0},1);
 expect(n.vy).toBeCloseTo(-33.62,5);expect(n.vx).toBe(172);expect(n.fuelKg).toBe(a.fuelKg);
 const dry=stepFlight({...a,fuelKg:0},{assist:true,throttle:1},1);
 expect(dry.vy).toBeCloseTo(n.vy,5);expect(dry.throttle).toBe(0);
});
it('is stable across frame rates and long frames; zero dt freezes all motion',()=>{
 const a=run(30),b=run(120);
 expect(Math.abs(a.seconds-b.seconds)).toBeLessThan(.1);
 expect(Math.abs(a.s.vx-b.s.vx)).toBeLessThan(.1);
 const s=flightStart();expect(stepFlight(s,{assist:true,throttle:0},0)).toEqual(s);
 const whole=stepFlight(s,{assist:true,throttle:0},.1);
 let parts=s;for(let i=0;i<12;i++)parts=stepFlight(parts,{assist:true,throttle:0},1/120);
 expect(whole.y).toBeCloseTo(parts.y,6);expect(whole.vx).toBeCloseTo(parts.vx,6);
});
it('continues braking across 1 km instead of standing upright then tipping back into a second burn',()=>{
 expect(nominalApproach(1000).ax).toBeLessThan(-3);
 expect(Math.abs(flightReference(1000.01).ax-nominalApproach(1000).ax)).toBeLessThan(.01);
 let previous=Infinity;
 for(let h=1000;h>=300;h-=10){const r=nominalApproach(h),tilt=Math.atan2(-r.ax,1.62+r.ay);expect(tilt).toBeLessThanOrEqual(previous+.001);previous=tilt;}
});

