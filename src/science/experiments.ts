import { gamePauseClock } from '../core/pause';
import { Color3, Mesh, MeshBuilder, PBRMaterial, PhysicsAggregate, PhysicsShapeType, Scene, TransformNode, Vector3 } from '@babylonjs/core';
import { loadModel, type LoadedModel } from '../models/loadModel';

const DROP_HEIGHT_M = 1.5;

/** Lays an upright GLB (long axis +Y) along the physics box's X axis, centred on it. */
function dress(box: Mesh, model: LoadedModel | null, lengthM: number): void {
  if (!model) return;
  box.isVisible = false;
  const holder = new TransformNode(`${box.name}-dress`, box.getScene());
  holder.parent = box;
  holder.rotation.z = -Math.PI / 2;
  holder.position.x = -lengthM / 2;
  model.root.parent = holder;
}

/**
 * Apollo 15 hammer-feather drop, simulated: two Havok bodies with zero damping released together from 1.5 m.
 * Resolves with each object's measured fall time (spec §6 scene 1.3).
 */
export async function startHammerFeather(scene: Scene, at: Vector3, groundY: number): Promise<{ hammerS: number; featherS: number }> {
  const [hammerModel, featherModel] = await Promise.all([loadModel(scene, 'hammer'), loadModel(scene, 'feather')]);
  const metal = new PBRMaterial('hammerMat', scene);
  metal.albedoColor = new Color3(0.55, 0.55, 0.58);
  metal.metallic = 0.9;
  metal.roughness = 0.35;
  const featherMat = new PBRMaterial('featherMat', scene);
  featherMat.albedoColor = new Color3(0.85, 0.8, 0.7);
  featherMat.roughness = 0.9;

  const hammer = MeshBuilder.CreateBox('hammer', { width: 0.32, height: 0.06, depth: 0.06 }, scene);
  hammer.material = metal;
  const feather = MeshBuilder.CreateBox('feather', { width: 0.28, height: 0.01, depth: 0.05 }, scene);
  feather.material = featherMat;
  dress(hammer, hammerModel, 0.39);
  dress(feather, featherModel, 0.28);
  const startY = groundY + DROP_HEIGHT_M;
  hammer.position.set(at.x - 0.3, startY, at.z);
  feather.position.set(at.x + 0.3, startY, at.z);

  const make = (m: Mesh, mass: number) => {
    const a = new PhysicsAggregate(m, PhysicsShapeType.BOX, { mass, restitution: 0 }, scene);
    a.body.setLinearDamping(0);
    a.body.setAngularDamping(0);
    return a;
  };
  make(hammer, 1.32);
  make(feather, 0.03);

  return new Promise((resolve) => {
    const t0 = gamePauseClock.now(performance.now());
    let hammerS = 0;
    let featherS = 0;
    const obs = scene.onAfterPhysicsObservable.add(() => {
      const now = (gamePauseClock.now(performance.now()) - t0) / 1000;
      if (!hammerS && hammer.position.y <= groundY + 0.05) hammerS = now;
      if (!featherS && feather.position.y <= groundY + 0.03) featherS = now;
      if ((hammerS && featherS) || now > 6) {
        scene.onAfterPhysicsObservable.remove(obs);
        resolve({ hammerS: hammerS || now, featherS: featherS || now });
      }
    });
  });
}
