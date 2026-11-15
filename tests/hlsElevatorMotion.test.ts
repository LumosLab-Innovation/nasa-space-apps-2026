import { describe, it, expect } from 'vitest';
import { elevatorPose, advanceElevator, ELEVATOR_DURATION,stepElevatorMotion,guardPose,frontGuardOpen } from '../src/demo/hlsElevatorMotion';

describe('front gate', () => {
 it('is closed at gate 0 and stowed at gate 1',()=>{
  expect(frontGuardOpen(1,0)).toBe(guardPose(1).front);
  expect(frontGuardOpen(1,1)).toBe(0);
 });
 it('opens monotonically',()=>{
  let prev=Infinity;
  for(let i=0;i<=50;i++){const v=frontGuardOpen(1,i/50);expect(v).toBeLessThanOrEqual(prev);prev=v;}
 });
});

describe('folding elevator sequence', () => {
 it('reverses velocity gradually and comes to rest at both endpoints',()=>{
  let state={position:.7,velocity:1/ELEVATOR_DURATION};
  const next=stepElevatorMotion(state,0,1/60);
  expect(next.velocity).toBeGreaterThan(0);expect(next.position).toBeGreaterThan(state.position);
  for(let i=0;i<1500;i++)state=stepElevatorMotion(state,0,1/60);
  expect(state).toEqual({position:0,velocity:0});
  for(let i=0;i<1500;i++)state=stepElevatorMotion(state,1,1/60);
  expect(state).toEqual({position:1,velocity:0});
  expect(stepElevatorMotion({position:.4,velocity:.02},1,0)).toEqual({position:.4,velocity:.02});
 });
 it('opens front rail before side rails without nested easing',()=>{
  for(let t=0;t<=1;t+=.001){const p=guardPose(t);if(p.sides>0)expect(p.front).toBe(1);}
  expect(guardPose(.4).front).toBeCloseTo(.5);expect(guardPose(.48).sides).toBeCloseTo(.5);
 });
 it('clears supports before floor, guards before descent', () => {
  for(let t=0;t<=1;t+=.001){
   const p=elevatorPose(t);
   if(p.floor>0)expect(p.support).toBe(1);
   if(p.guards>0)expect(p.floor).toBe(1);
   if(p.lower>0)expect(p.guards).toBe(1);
  }
  expect(elevatorPose(0)).toEqual({support:0,floor:0,guards:0,lower:0});
  expect(elevatorPose(1)).toEqual({support:1,floor:1,guards:1,lower:1});
 });
 it('eases to rest at every mechanical boundary', () => {
  for(const t of [0,.18,.36,.52,1]){
   const a=elevatorPose(t-1e-5),b=elevatorPose(t+1e-5);
   for(const key of ['support','floor','guards','lower'] as const)expect(Math.abs(a[key]-b[key])).toBeLessThan(1e-7);
  }
 });
 it('can reverse without snapping and freezes with zero time', () => {
  for(const t of [.1,.3,.45,.7]){
   expect(advanceElevator(t,1,0)).toBe(t);
   const next=advanceElevator(t,1,.016);
   expect(next).toBeGreaterThan(t);
   expect(advanceElevator(next,0,.016)).toBeCloseTo(t,10);
  }
  expect(advanceElevator(.99,1,ELEVATOR_DURATION)).toBe(1);
  expect(advanceElevator(.01,0,ELEVATOR_DURATION)).toBe(0);
 });
});
