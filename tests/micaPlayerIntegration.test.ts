import {afterEach,expect,it} from 'vitest';
import {NullEngine,Scene,Vector3} from '@babylonjs/core';
import {Mica} from '../src/mica/mica';
import {Astronaut} from '../src/player/astronaut';
import type {Heightmap} from '../src/data/heightmap';
import type {Footprint} from '../src/player/footprintCollision';
const hm:Heightmap={size:2,worldSizeM:6000,heights:new Float32Array(4),source:'procedural'};
const engines:NullEngine[]=[];
afterEach(()=>engines.splice(0).forEach(e=>e.dispose()));
it('keeps the moving tilted footprint around all MICA geometry while leaving E/Q in reach',()=>{
 const engine=new NullEngine();engines.push(engine);const scene=new Scene(engine),mica=new Mica(scene,hm,{x:-50,z:-284});
 for(const yaw of [0,.6,-.9,Math.PI/2]){
  mica.root.position.x+=7;mica.root.position.z-=3;mica.root.rotation.set(.06,yaw,-.08);
  const f=mica.footprint;
  expect(f.x).toBeCloseTo(mica.root.position.x,0);
  for(const mesh of mica.meshes){mesh.computeWorldMatrix(true);
   for(const p of mesh.getBoundingInfo().boundingBox.vectorsWorld){
    const x=(p.x-f.x)*Math.cos(f.yaw)-(p.z-f.z)*Math.sin(f.yaw),z=(p.x-f.x)*Math.sin(f.yaw)+(p.z-f.z)*Math.cos(f.yaw);
    expect(Math.abs(x)).toBeLessThanOrEqual(f.halfX+1e-5);expect(Math.abs(z)).toBeLessThanOrEqual(f.halfZ+1e-5);
   }
  }
  expect(Math.hypot(f.halfX+.5,f.halfZ+.5)).toBeLessThan(3.2);
 }
});

function playerFixture(y=1){
 let p=new Vector3(0,y,0),v=new Vector3(0,1.6,-2);
 // Test the real public constraint on a minimal character-controller adapter.
 const player=Object.create(Astronaut.prototype) as Astronaut;
 const root={position:p.clone()};const camera={target:new Vector3(),alpha:.4,beta:1.2,radius:7};
 Object.assign(player,{cc:{getPosition:()=>p.clone(),setPosition:(n:Vector3)=>{p=n.clone();},getVelocity:()=>v.clone(),setVelocity:(n:Vector3)=>{v=n.clone();}},hm,root,camera,seat:null});
 let f:Footprint={x:0,z:0,yaw:0,halfX:1.55,halfZ:.85};
 player.setFootprintObstacle(()=>f);
 return {player,position:()=>p,velocity:()=>v,camera,root,moveObstacle:(next:Footprint)=>{f=next;}};
}
it.each([1,3,20])('keeps an overlapping astronaut outside even at height %s and preserves camera/vertical velocity',y=>{
 const f=playerFixture(y);
 expect(f.position().z).toBeGreaterThan(1.35);
 expect(f.position().y).toBe(y);
 expect(f.velocity().y).toBe(1.6);expect(f.velocity().z).toBe(0);
 expect(f.root.position.equals(f.position())).toBe(true);
 expect([f.camera.alpha,f.camera.beta,f.camera.radius]).toEqual([.4,1.2,7]);
});
it('rechecks a rover moved onto the player before an interaction',()=>{
 const f=playerFixture();const p=f.position();
 f.moveObstacle({x:p.x,z:p.z,yaw:.6,halfX:1.55,halfZ:.85});
 f.player.enforceFootprint();
 expect(Vector3.Distance(p,f.position())).toBeGreaterThan(1);
 expect(f.position().y).toBe(1);
});
