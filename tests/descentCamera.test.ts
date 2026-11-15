import {expect,it} from 'vitest';
import {approachCameraDistance,closeApproachDistance,descentFraming,landingCamera} from '../src/landing/descentCamera';
import {flightScale} from '../src/landing/descentGeometry';

it('keeps the high braking shot within three displayed ship lengths',()=>{
 for(const h of [6000,8000,10000,15000]){
  const displayedLength=50*flightScale(h)*1000;
  expect(approachCameraDistance(h)).toBeLessThan(displayedLength*3);
  expect(approachCameraDistance(h)).toBeGreaterThan(displayedLength*2);
 }
});

it('carries low framing through 300 m instead of pulling the ship abruptly upward at the camera join',()=>{
 const atJoin=landingCamera(300),near=landingCamera(299.999);
 expect(atJoin.targetHeight).toBeGreaterThan(65);
 expect(atJoin.targetHeight).toBeLessThan(80);
 expect(near.targetHeight).toBeCloseTo(atJoin.targetHeight,5);
 expect(landingCamera(150).targetHeight).toBe(18);
 expect(landingCamera(0).targetHeight).toBe(18);
});

it('holds a close distance while allowing restrained downward framing below 600 m',()=>{
 const start=descentFraming(600),end=descentFraming(360);
 expect(Math.abs(start.distance-end.distance)).toBeLessThan(1);
 expect(end.distance).toBeGreaterThan(110);expect(end.distance).toBeLessThan(145);
 expect(end.screenDrop-start.screenDrop).toBeGreaterThanOrEqual(.03);
 expect(end.screenDrop-start.screenDrop).toBeLessThanOrEqual(.05);
 for(const h of [800,600,360]){
  const e=.001,a=descentFraming(h-e),b=descentFraming(h),c=descentFraming(h+e);
  expect(Math.abs((c.distance-b.distance)/e-(b.distance-a.distance)/e)).toBeLessThan(.001);
  expect(Math.abs((c.screenDrop-b.screenDrop)/e-(b.screenDrop-a.screenDrop)/e)).toBeLessThan(.001);
 }
});

it('retains the selected close framing throughout the last kilometre',()=>{
 for(const [height,distance] of [[100,96],[300,112],[500,128],[1000,168]]){
  expect(closeApproachDistance(height)).toBeCloseTo(distance,8);
  expect(approachCameraDistance(height)).toBeCloseTo(distance,8);
 }
 expect(closeApproachDistance(-1)).toBe(88);
});
it('enters and leaves the high approach blend with continuous distance and slope',()=>{
 const e=.001;
 for(const h of [1500,6000]){
  const left=(approachCameraDistance(h)-approachCameraDistance(h-e))/e;
  const right=(approachCameraDistance(h+e)-approachCameraDistance(h))/e;
  expect(Math.abs(left-right)).toBeLessThan(.001);
 }
 let last=approachCameraDistance(0);
 for(let h=1;h<=15000;h++){
  const current=approachCameraDistance(h);expect(current).toBeGreaterThanOrEqual(last);last=current;
 }
});
