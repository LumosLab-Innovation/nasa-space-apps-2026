import {expect,it} from 'vitest';
import {Vector3,Quaternion} from '@babylonjs/core';
import {followCamera, transferLandingState, seedFlightFromBase, settleFlightRotation, separationOffsetKm} from '../src/landing/coherentMotion';
import {landStep} from '../src/landing/descent';
it('transfers actual arrival velocities and altitude without a nominal-state reset',()=>{
 const s=transferLandingState({h:287,vy:-19,vx:11,pitch:.08});
 expect(s.h).toBe(287);expect(s.vy).toBe(-19);expect(s.vx).toBe(11);
 expect(s.tiltDeg).toBeCloseTo(-.08*180/Math.PI);expect(s.fuelKg).toBe(10000);
});
it('an unsafe incoming tilt slews toward the control range instead of snapping at handoff',()=>{
 const s=transferLandingState({h:300,vy:-40,vx:100,pitch:1});
 const n=landStep(s,{throttle:0,tiltInput:0},1/60);
 expect(Math.abs(n.tiltDeg-s.tiltDeg)).toBeLessThanOrEqual(8/60+.0001);
});
it('camera follows constant motion without growing a lag and freezes on pause',()=>{
 let s={position:Vector3.Zero(),velocity:new Vector3(10,-20,0)};
 for(let i=1;i<=300;i++)s=followCamera(s,new Vector3(i/60*10,-i/60*20,0),new Vector3(10,-20,0),1/60);
 expect(s.position.subtract(new Vector3(50,-100,0)).length()).toBeLessThan(.001);
 expect(followCamera(s,new Vector3(80,-150,0),Vector3.Zero(),0)).toEqual(s);
});
it('camera damped response is consistent at 30 and 120 Hz without overshoot',()=>{
 function run(hz:number){let s={position:Vector3.Zero(),velocity:Vector3.Zero()};for(let i=0;i<hz;i++)s=followCamera(s,new Vector3(5,0,0),Vector3.Zero(),1/hz);return s.position.x;}
 expect(run(30)).toBeCloseTo(run(120),6);expect(run(30)).toBeGreaterThan(4.9);expect(run(30)).toBeLessThan(5);
});
it('seeds ignition from the transformed landing base, preserving the old visual centre',()=>{
 const ground=1737400,centre=new Vector3(-ground-15000,0,0),axis=new Vector3(0,0,1),half=2500;
 const base=centre.subtract(axis.scale(half)),velocity=new Vector3(0,0,-1680);
 const seed=seedFlightFromBase(base,velocity,ground);
 const r=ground+seed.flight.y,lon=seed.longitude*Math.PI/180;
 const rebuilt=new Vector3(-r*Math.cos(lon),0,-r*Math.sin(lon)).add(axis.scale(half));
 expect(rebuilt.subtract(centre).length()).toBeLessThan(.00001);
 expect(seed.flight.vx).toBeCloseTo(1680,1);
 expect(seed.flight.vy).toBeCloseTo(Vector3.Dot(velocity,base.normalizeToNew()),6);
});
it('settles full hull roll before handoff while keeping the physical thrust axis',()=>{
 const yaw=1.8,pitch=.3,target=Quaternion.RotationYawPitchRoll(yaw,0,pitch);
 const incoming=target.multiply(Quaternion.RotationAxis(Vector3.Up(),1.1));
 for(const u of [0,.2,.5,.8,1]){
  const q=settleFlightRotation(incoming,yaw,pitch,u);
  expect(Vector3.Up().applyRotationQuaternion(q).subtract(Vector3.Up().applyRotationQuaternion(incoming)).length()).toBeLessThan(1e-6);
 }
 expect(Math.abs(Quaternion.Dot(settleFlightRotation(incoming,yaw,pitch,1),target))).toBeCloseTo(1,7);
 expect(Math.abs(Quaternion.Dot(settleFlightRotation(incoming,yaw,pitch,0),incoming))).toBeCloseTo(1,7);
});
it('finishes cinematic separation with visible clearance and zero relative velocity before ignition',()=>{
 expect(separationOffsetKm(0)).toBe(0);expect(separationOffsetKm(6)).toBe(3);
 expect(separationOffsetKm(12)).toBe(3);
 expect(separationOffsetKm(.001)/.001).toBeLessThan(.00001);
 expect((separationOffsetKm(6)-separationOffsetKm(5.999))/.001).toBeLessThan(.00001);
});
