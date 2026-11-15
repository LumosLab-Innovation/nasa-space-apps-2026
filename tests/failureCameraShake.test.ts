import { expect, it } from 'vitest';
import { ArcRotateCamera, FreeCamera, NullEngine, Scene, Vector3 } from '@babylonjs/core';
import { FailureCameraShake } from '../src/landing/failureCameraShake';

it('shakes briefly, freezes on pause, then restores framing without accumulated drift', () => {
  const engine=new NullEngine(), scene=new Scene(engine);
  for (const camera of [new FreeCamera('orbit',new Vector3(0,0,-100),scene), new ArcRotateCamera('landing',0,1,100,Vector3.Zero(),scene)]) {
    camera.setTarget(Vector3.Zero());camera.getViewMatrix(true);
    const pos=camera.position.clone(), target=camera.getTarget().clone(), fov=camera.fov;
    const fx=new FailureCameraShake();fx.start(camera);fx.update(.1);
    expect(Vector3.Distance(camera.position,pos)).toBeGreaterThan(.01);
    const shaken=camera.position.clone();fx.update(0);expect(camera.position.equals(shaken)).toBe(true);
    fx.update(2);expect(Vector3.Distance(camera.position,pos)).toBeLessThan(1e-6);
    expect(Vector3.Distance(camera.getTarget(),target)).toBeLessThan(1e-6);expect(camera.fov).toBe(fov);
    fx.start(camera,Vector3.Zero(),true);fx.update(.1);expect(Vector3.Distance(camera.position,pos)).toBeLessThan(1e-6);
    fx.reset();fx.update(2);expect(Vector3.Distance(camera.position,pos)).toBeLessThan(1e-6);
  }
  scene.dispose();engine.dispose();
});
