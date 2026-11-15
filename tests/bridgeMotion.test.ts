import {it,expect} from 'vitest';
import {Vector3,Quaternion} from '@babylonjs/core';
import {createBridgeMotion,hermite} from '../src/landing/bridgeMotion';
import {renderedSurfaceRadius} from '../src/world/orbitalTerrain';
import {MOON_R_KM} from '../src/landing/moonMath';
it('matches position and velocity on both sides of a moving camera bridge',()=>{
 const a=new Vector3(1,500,2),v=new Vector3(100,-40,0),b=new Vector3(0,300,0),w=new Vector3(4,-12,0),e=.0001;
 expect(Vector3.Distance(hermite(a,v,b,w,0),a)).toBeLessThan(1e-8);
 expect(Vector3.Distance(hermite(a,v,b,w,5),b)).toBeLessThan(1e-8);
 expect(Vector3.Distance(hermite(a,v,b,w,e).subtract(a).scale(1/e),v)).toBeLessThan(.02);
 expect(Vector3.Distance(b.subtract(hermite(a,v,b,w,5-e)).scale(1/e),w)).toBeLessThan(.02);
});
it('delivers a physical scale ship at 300 m with a moving chase camera',()=>{
 const position=new Vector3(-310,500,0),camera=position.add(new Vector3(-200,180,50));
 const sample=createBridgeMotion({position,velocity:new Vector3(120,-40,0),camera,cameraVelocity:new Vector3(120,-40,0),target:position,targetVelocity:new Vector3(120,-40,0),rotation:Quaternion.Identity(),scale:1},Vector3.Zero(),0);
 expect(sample(5).position.asArray()).toEqual([0,300,0]);expect(sample(5).scale).toBe(1);
 expect(sample(4).position.equals(sample(4.01).position)).toBe(false);
 expect(sample(4).camera.equals(sample(4.01).camera)).toBe(false);
});
it('samples rendered triangle altitude rather than pretending a coarse chord is a sphere',()=>{
 const edge=renderedSurfaceRadius(0,40,()=>0),centre=renderedSurfaceRadius(1,41,()=>0);
 expect(edge).toBeCloseTo(MOON_R_KM,6);expect(centre).toBeLessThan(MOON_R_KM-.1);
 expect(renderedSurfaceRadius(0,20,()=>0)).toBeCloseTo(MOON_R_KM,6);
});
it.each([0,.8,-1.7])('hands off into the restored close landing shot at yaw %s',yaw=>{
 const landing=new Vector3(80,50,-240),position=landing.add(new Vector3(-310,500,0));
 const sample=createBridgeMotion({position,velocity:new Vector3(110,-40,0),camera:position.add(new Vector3(-112,50,34)),cameraVelocity:new Vector3(100,-40,0),target:position,targetVelocity:new Vector3(110,-40,0),rotation:Quaternion.Identity(),scale:1},landing,yaw);
 const end=sample(5),dt=.0001;
 const direction=new Vector3(Math.cos(yaw+Math.PI*.75)*Math.sin(1.05),Math.cos(1.05),Math.sin(yaw+Math.PI*.75)*Math.sin(1.05));
 const velocity=new Vector3(4*Math.cos(yaw),-12,-4*Math.sin(yaw));
 expect(end.target.subtract(end.position).asArray()).toEqual([0,74,0]);
 expect(Vector3.Distance(end.camera,end.target)).toBeCloseTo(185,6);
 expect(Vector3.Distance(end.camera.subtract(end.target).normalize(),direction)).toBeLessThan(1e-8);
 expect(Vector3.Distance(end.camera.subtract(sample(5-dt).camera).scale(1/dt),velocity.add(direction.scale(-3)))).toBeLessThan(.04);
 expect(Vector3.Distance(end.target.subtract(sample(5-dt).target).scale(1/dt),velocity)).toBeLessThan(.04);
});
