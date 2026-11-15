import {expect,it} from 'vitest';
import {resolveFootprint,type Footprint} from '../src/player/footprintCollision';
import {pickInteractable} from '../src/interact/resolver';
const footprint:Footprint={x:-50,z:-284,yaw:0,halfX:1.55,halfZ:.85};
const pad=.5;
const world=(x:number,z:number,f=footprint)=>({x:f.x+x*Math.cos(f.yaw)+z*Math.sin(f.yaw),z:f.z-x*Math.sin(f.yaw)+z*Math.cos(f.yaw)});
const local=(p:{x:number;z:number},f=footprint)=>({x:(p.x-f.x)*Math.cos(f.yaw)-(p.z-f.z)*Math.sin(f.yaw),z:(p.x-f.x)*Math.sin(f.yaw)+(p.z-f.z)*Math.cos(f.yaw)});
const outside=(p:{x:number;z:number},f=footprint)=>{const q=local(p,f);return Math.abs(q.x)>=f.halfX+pad-1e-8||Math.abs(q.z)>=f.halfZ+pad-1e-8;};
it.each([0,.6,-.9,Math.PI/2])('blocks all sides and long crossings at yaw %s',yaw=>{
 const f={...footprint,yaw};
 for(let i=0;i<32;i++){
  const a=i*Math.PI/16,from=world(Math.cos(a)*6,Math.sin(a)*6,f),to=world(-Math.cos(a)*6,-Math.sin(a)*6,f);
  const r=resolveFootprint(from,to,f,pad);
  expect(outside(r,f)).toBe(true);
  expect(r.contacts.length).toBeGreaterThan(0);
  // Sliding may pass a corner, but must never tunnel straight to the requested endpoint.
  expect(Math.hypot(r.x-to.x,r.z-to.z)).toBeGreaterThan(.1);
 }
});
it('slides along the side without sticking, and allows moving away',()=>{
 const a=world(3,-.6),b=world(1,.6),r=resolveFootprint(a,b,footprint,pad);
 expect(local(r).x).toBeCloseTo(2.051,3);expect(local(r).z).toBeCloseTo(.6,8);
 const tangent=world(2.051,1),t=resolveFootprint(r,tangent,footprint,pad);
 expect(t.x).toBeCloseTo(tangent.x);expect(t.z).toBeCloseTo(tangent.z);
 const away=world(4,1),o=resolveFootprint(t,away,footprint,pad);
 expect(o.contacts).toHaveLength(0);expect(o.x).toBeCloseTo(away.x);
});
it('ejects a pre-existing overlap to the closest face and still offers interaction',()=>{
 for(const [x,z] of [[0,0],[1.45,.2],[-1.45,-.2],[.4,-.8]]){
  const p=world(x,z),r=resolveFootprint(p,p,footprint,pad);
  expect(outside(r)).toBe(true);
  expect(pickInteractable([{id:'mica',x:footprint.x,z:footprint.z,enabled:true,prompt:'E/Q'}],r,0,3.2)?.id).toBe('mica');
 }
});
it('leaves distant movement unchanged',()=>{
 const a=world(6,6),b=world(5,4),r=resolveFootprint(a,b,footprint,pad);
 expect(r.x).toBeCloseTo(b.x);expect(r.z).toBeCloseTo(b.z);expect(r.contacts).toHaveLength(0);
});
