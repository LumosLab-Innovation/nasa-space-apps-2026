import { describe, it, expect } from 'vitest';
import { burnEntryBlend, BURN_ENTRY_SECONDS, blendBurnCamera } from '../src/landing/burnEntry';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
describe('Orion separation to braking camera',()=>{
 it('preserves the outgoing world camera even when the physical-base chase goal is kilometres away',()=>{
  const camera=new Vector3(-1629,-10,-649),velocity=new Vector3(.65,.03,-1.6);
  const goal=camera.add(new Vector3(-1,2,2.5));
  expect(blendBurnCamera(camera,velocity,goal,0).subtract(camera).length()).toBe(0);
  const dt=.0001,first=blendBurnCamera(camera,velocity,goal,dt);
  expect(first.subtract(camera).scale(1/dt).subtract(velocity).length()).toBeLessThan(.001);
  expect(blendBurnCamera(camera,velocity,goal,BURN_ENTRY_SECONDS).subtract(goal).length()).toBeLessThan(1e-9);
 });
 it('begins at the outgoing camera and reaches the playable camera continuously',()=>{
  expect(burnEntryBlend(0)).toBe(0);expect(burnEntryBlend(BURN_ENTRY_SECONDS)).toBe(1);
  let last=0;for(let t=0;t<=BURN_ENTRY_SECONDS;t+=1/60){const q=burnEntryBlend(t);expect(q).toBeGreaterThanOrEqual(last);expect(q-last).toBeLessThan(.02);last=q}
 });
 it('eases into and out of the shot and clamps late frames',()=>{
  expect(burnEntryBlend(.001)).toBeLessThan(.00001);
  expect(1-burnEntryBlend(BURN_ENTRY_SECONDS-.001)).toBeLessThan(.00001);
  expect(burnEntryBlend(-1)).toBe(0);expect(burnEntryBlend(10)).toBe(1);
 });
});
