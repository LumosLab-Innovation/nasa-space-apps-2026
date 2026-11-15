import {describe,it,expect,vi} from 'vitest';
import {NullEngine,Scene,TransformNode,RawTexture,Vector3,Quaternion,FreeCamera} from '@babylonjs/core';
vi.mock('../src/fx/exhaustAssets',()=>({exhaustAssets:(scene:Scene)=>{
 const t=RawTexture.CreateRGBATexture(new Uint8Array([255,255,255,255]),1,1,scene);
 return {glow:t,wisp:t,dust:t,grain:t};
}}));
import {SpacecraftExhaust} from '../src/fx/spacecraftExhaust';
const nozzle={position:new Vector3(0,2,0),direction:Vector3.Down(),radius:1,kind:'main' as const};
describe('exhaust scene lifecycle',()=>{
 it('transfers live tails between kilometre and metre scenes without restarting',()=>{
  const engine=new NullEngine(),a=new Scene(engine),b=new Scene(engine);
  new FreeCamera('a',new Vector3(0,0,10),a);new FreeCamera('b',new Vector3(0,0,10),b);
  const from=new TransformNode('from',a),to=new TransformNode('to',b);
  from.position.set(4,1700,5);from.scaling.setAll(.001);from.rotationQuaternion=Quaternion.RotationAxis(Vector3.Right(),.6);
  to.position.set(80,300,-242);to.rotationQuaternion=Quaternion.RotationAxis(Vector3.Forward(),.12);
  const one=new SpacecraftExhaust(a,from,[nozzle],undefined,false),two=new SpacecraftExhaust(b,to,[nozzle],undefined,false);
  for(let i=0;i<20;i++)one.update(1/60,.7,false);
  const before=structuredClone(one.snapshot());expect(before.particles.length).toBeGreaterThan(0);
  two.present(before);const after=two.snapshot();expect(after.state.time).toBe(before.state.time);expect(after.state.power).toBe(before.state.power);
  expect(after.particles.length).toBe(before.particles.length);
  after.particles.forEach((v,i)=>expect(v).toBeCloseTo(before.particles[i],2));
  const paused=structuredClone(two.snapshot());two.update(0,.7,false);expect(two.snapshot().state).toEqual(paused.state);expect(two.snapshot().particles).toEqual(paused.particles);
  one.dispose();expect(two.diagnostics.particles).toBeGreaterThan(0);a.dispose();b.dispose();engine.dispose();
 });
 it('reset clears emission and dispose is idempotent without deleting scene textures',()=>{
  const engine=new NullEngine(),scene=new Scene(engine);new FreeCamera('c',new Vector3(0,0,10),scene);
  const fx=new SpacecraftExhaust(scene,new TransformNode('mount',scene),[nozzle]);
  for(let i=0;i<20;i++)fx.update(1/60,.7,true);
  const textures=[...scene.textures];fx.reset();
  expect(scene.meshes.filter(m => m.name.startsWith('exhaust') && m.isVisible)).toHaveLength(0);
  expect(fx.diagnostics.particles).toBe(0);expect(fx.diagnostics.jets).toHaveLength(0);
  fx.dispose();fx.dispose();fx.update(.1,1,true);expect(scene.meshes.filter(m=>m.name.startsWith('exhaust'))).toHaveLength(0);
  expect(scene.textures).toEqual(textures);scene.dispose();engine.dispose();
 });
});
