import {describe,it,expect} from 'vitest';
import {NullEngine,Scene,TransformNode,Vector3,Quaternion} from '@babylonjs/core';
import {BrakingPlasmaState} from '../src/fx/brakingPlasmaState';
import {BrakingPlasma} from '../src/fx/brakingPlasma';

describe('approved B braking plasma',()=>{
  it('waits for ignition at or below 13 km, reveals gently, and fades only after 1100 m',()=>{
    const s=new BrakingPlasmaState();
    s.update(10,false,15000,1);expect(s.power).toBe(0);
    s.update(10,true,15000,0);expect(s.power).toBe(0);
    s.update(10,true,13001,.5);expect(s.power).toBe(0);expect(s.time).toBe(0);
    s.update(.6,true,13000,.5);expect(s.power).toBeCloseTo(.5);
    s.update(.6,true,12950,.5);expect(s.power).toBe(1);
    s.update(1,true,1101,.5);expect(s.power).toBe(1);
    s.update(0,true,1100,.5);expect(s.power).toBe(1);
    s.update(1,true,1050,.5);expect(s.power).toBeCloseTo(.5);
    const t=s.time;s.update(0,true,1050,.5);expect(s.time).toBe(t);expect(s.power).toBeCloseTo(.5);
    s.update(1,true,1000,.5);expect(s.power).toBe(0);
    s.update(10,true,1500,.5);expect(s.power).toBe(0);
  });
  it('does not ignite below cutoff or continue outside braking',()=>{
    const s=new BrakingPlasmaState();s.update(1,true,1000,1);expect(s.power).toBe(0);
    const active=new BrakingPlasmaState();active.update(2,true,9000,1);
    active.update(.1,false,9000,1);expect(active.power).toBe(0);
  });
  it('uses gameplay seconds independently of frame rate',()=>{
    const values=[30,60,120].map(fps=>{const s=new BrakingPlasmaState();
      for(let i=0;i<fps*2;i++)s.update(1/fps,true,5000,.7);
      for(let i=0;i<fps;i++)s.update(1/fps,true,1090,.7);
      return s.power;});
    for(const power of values)expect(power).toBeCloseTo(.5,6);
  });
  it('inherits the rig transform and releases only its own resources',()=>{
    const engine=new NullEngine(),scene=new Scene(engine),mount=new TransformNode('mount',scene);
    mount.position.set(10,1700,0);mount.scaling.setAll(.001);
    mount.rotationQuaternion=Quaternion.RotationAxis(Vector3.Forward(),.5);
    const fx=new BrakingPlasma(scene,mount);
    expect(fx.diagnostics.power).toBe(0);
    expect(mount.getChildMeshes()).toHaveLength(2);
    fx.update(2,true,6000,.7);expect(fx.diagnostics.power).toBe(1);
    const meshes=mount.getChildMeshes();expect(meshes.every(m=>m.isEnabled())).toBe(true);
    for(const mesh of meshes){mesh.computeWorldMatrix(true);expect(mesh.absolutePosition.equalsWithEpsilon(mount.position)).toBe(true);}
    fx.dispose();fx.dispose();expect(scene.meshes).toHaveLength(0);expect(scene.materials).toHaveLength(0);
    expect(mount.isDisposed()).toBe(false);scene.dispose();engine.dispose();
  });
});
