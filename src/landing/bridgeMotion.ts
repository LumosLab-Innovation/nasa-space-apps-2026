import { Quaternion, Vector3 } from '@babylonjs/core';
import { smoother as smooth } from './descentGeometry';
import { landingCamera } from './descentCamera';
export function hermite(a:Vector3,av:Vector3,b:Vector3,bv:Vector3,t:number,duration=5){
  const u=Math.max(0,Math.min(1,t/duration)),u2=u*u,u3=u2*u;
  return a.scale(2*u3-3*u2+1).add(av.scale((u3-2*u2+u)*duration)).add(b.scale(-2*u3+3*u2)).add(bv.scale((u3-u2)*duration));
}
export interface BridgeStart {position:Vector3;velocity:Vector3;camera:Vector3;cameraVelocity:Vector3;target:Vector3;targetVelocity:Vector3;rotation:Quaternion;scale:number;}
export function createBridgeMotion(start:BridgeStart,landing:Vector3,yaw:number){
  const side=new Vector3(Math.cos(yaw),0,-Math.sin(yaw)),velocity=side.scale(4).add(new Vector3(0,-12,0));
  const framing=landingCamera(300);
  const end=landing.add(new Vector3(0,300,0)),target=end.add(new Vector3(0,framing.targetHeight,0));
  const alpha=yaw+Math.PI*.75,beta=framing.beta;
  const direction=new Vector3(Math.cos(alpha)*Math.sin(beta),Math.cos(beta),Math.sin(alpha)*Math.sin(beta));
  const camera=target.add(direction.scale(framing.radius)),targetVelocity=velocity.clone(),cameraVelocity=targetVelocity.add(direction.scale(velocity.y*framing.radiusPerMetre));
  return (time:number)=>({
    position:hermite(start.position,start.velocity,end,velocity,time),
    camera:hermite(start.camera,start.cameraVelocity,camera,cameraVelocity,time),
    target:hermite(start.target,start.targetVelocity,target,targetVelocity,time),
    rotation:Quaternion.Slerp(start.rotation,Quaternion.RotationYawPitchRoll(yaw,0,0),smooth(time/3.5)),
    scale:start.scale+(1-start.scale)*smooth(time/3.5),
  });
}
