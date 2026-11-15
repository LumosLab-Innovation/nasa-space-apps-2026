import {Vector3,Quaternion} from '@babylonjs/core';
import {landStart} from './descent';
import {flightStart} from './guidedFlight';
import {smoother} from './descentGeometry';
/** Opening models are x100: 30 m of illustrative docking clearance is rendered as 3 km.
 * RCS translation settles before ignition, so physical flight inherits no exaggerated relative speed. */
export const separationOffsetKm=(seconds:number)=>3*smoother(seconds/6);
/** Both cinematic and physical adapters use the same transformed base, even at exaggerated scale. */
export function seedFlightFromBase(base:Vector3,velocity:Vector3,groundRadiusM:number) {
 const radial=base.normalizeToNew(),east=new Vector3(-radial.z,0,radial.x).normalize();
 return {longitude:Math.atan2(-base.z,-base.x)*180/Math.PI,
  flight:{...flightStart(),y:base.length()-groundRadiusM,vx:Vector3.Dot(velocity,east),vy:Vector3.Dot(velocity,radial)}};
}
/** Resolve the orbital frame's roll during the live camera move, before changing control frames. */
export function settleFlightRotation(incoming:Quaternion,yaw:number,pitch:number,progress:number) {
 return Quaternion.Slerp(incoming,Quaternion.RotationYawPitchRoll(yaw,0,pitch),smoother(progress));
}
export function transferLandingState(p:{h:number;vy:number;vx:number;pitch:number}) {
 return {...landStart(),h:p.h,vy:p.vy,vx:p.vx,tiltDeg:-p.pitch*180/Math.PI};
}
export interface CameraFollow {position:Vector3;velocity:Vector3}
/** Exact critically damped spring relative to a linearly moving goal, in metres. */
export function followCamera(s:CameraFollow,goal:Vector3,velocity:Vector3,dt:number):CameraFollow {
 if(dt<=0)return s;
 const omega=12,decay=Math.exp(-omega*dt);
 const error=s.position.subtract(goal.subtract(velocity.scale(dt)));
 const rate=s.velocity.subtract(velocity),j=rate.add(error.scale(omega));
 const offset=error.add(j.scale(dt)).scale(decay);
 if(offset.length()>8)offset.normalize().scaleInPlace(8);
 return {position:goal.add(offset),velocity:velocity.add(rate.subtract(j.scale(omega*dt)).scale(decay))};
}
