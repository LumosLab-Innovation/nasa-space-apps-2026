import {describe,it,expect} from 'vitest';
import {landingGearPose,stepLandingGear} from '../src/demo/hlsLandingGearMotion';
describe('enclosed landing gear',()=>{
 it('opens doors before legs and unfolds pads only after legs clear the hull',()=>{
  expect(landingGearPose(0)).toEqual({door:0,leg:0,foot:0});
  expect(landingGearPose(1)).toEqual({door:1,leg:1,foot:1});
  for(let i=0;i<=1000;i++){
   const p=landingGearPose(i/1000);
   if(p.leg>0)expect(p.door).toBe(1);
   if(p.foot>0)expect(p.leg).toBe(1);
   if(p.door<1)expect(p.leg).toBe(0);
  }
 });
 it('stops gently at all joints and freezes with dt0',()=>{
  for(const t of [0,.22,.78,1]){
   const a=landingGearPose(t-1e-5),b=landingGearPose(t+1e-5);
   for(const key of ['door','leg','foot'] as const)expect(Math.abs(a[key]-b[key])).toBeLessThan(1e-7);
  }
  expect(stepLandingGear({position:.5,velocity:.1},0,0)).toEqual({position:.5,velocity:.1});
 });
 it('reverses gradually and finishes each stroke in 6–8 seconds',()=>{
  const moving={position:.5,velocity:1/7};
  const next=stepLandingGear(moving,0,1/60);
  expect(next.position).toBeGreaterThan(.5);expect(next.velocity).toBeGreaterThan(0);
  for(const target of [1,0] as const){
   let s={position:1-target,velocity:0},elapsed=0;
   while(s.position!==target&&elapsed<9){s=stepLandingGear(s,target,1/60);elapsed+=1/60;}
   expect(elapsed).toBeGreaterThan(6);expect(elapsed).toBeLessThan(8);
   expect(s).toEqual({position:target,velocity:0});
  }
 });
});
