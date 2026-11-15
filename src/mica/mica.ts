import { AbstractMesh, Axis, Color3, Mesh, MeshBuilder, PBRMaterial, Quaternion, Scene, StandardMaterial, TransformNode } from '@babylonjs/core';
import { gamePauseClock } from '../core/pause';
import { sampleHeight, type Heightmap } from '../data/heightmap';
import { loadModel, type LoadedModel } from '../models/loadModel';
import { wheelSpin } from '../pip/pipRig';

const SILVER = new Color3(0.72, 0.73, 0.75);
const CELLS = new Color3(0.06, 0.09, 0.22);
const DUST = new Color3(0.42, 0.41, 0.39);
const WHEEL_RADIUS_M = 0.18;
/** Hatch hinges at its rear edge; negative X rotation lifts the front edge (glTF frame). */
const HATCH_OPEN_RAD = -1.6;

/**
 * MICA: older six-wheel rocker-bogie rover with HORIZONTAL solar wings and one round camera eye
 * (spec v3 §4.2). Loads public/models/mica.glb; falls back to the Plan 1 placeholder body.
 */
export class Mica {
  readonly root: TransformNode;
  readonly meshes: AbstractMesh[] = [];
  private readonly bodyMat: PBRMaterial;
  private readonly cellMat: PBRMaterial;
  private readonly eyeMat: { emissiveColor: Color3 };
  private readonly wheels: TransformNode[] = [];
  private readonly hatch: TransformNode | null = null;
  private dustLevel = 1;
  private roll = 0;
  private hatchAngle = 0;
  private hatchTarget = 0;

  static async create(scene: Scene, hm: Heightmap, pos: { x: number; z: number }): Promise<Mica> {
    return new Mica(scene, hm, pos, await loadModel(scene, 'mica'));
  }

  constructor(scene: Scene, hm: Heightmap, pos: { x: number; z: number }, model: LoadedModel | null = null) {
    this.root = new TransformNode('mica', scene);
    const body = model?.material('Mica_Body');
    const cells = model?.material('Mica_Cells');
    const eye = model?.material('Mica_Eye');
    if (model && body instanceof PBRMaterial && cells instanceof PBRMaterial && eye instanceof PBRMaterial) {
      model.root.parent = this.root;
      this.meshes.push(...model.meshes);
      this.bodyMat = body;
      this.cellMat = cells;
      this.eyeMat = eye;
      for (let i = 1; i <= 6; i++) this.wheels.push(model.node(`wheel_${i}`));
      this.hatch = model.node('hatch');
    } else {
      const placeholder = this.buildPlaceholder(scene);
      this.bodyMat = placeholder.body;
      this.cellMat = placeholder.cells;
      this.eyeMat = placeholder.eye;
    }
    this.root.position.set(pos.x, sampleHeight(hm, pos.x, pos.z), pos.z);
    // Stalled on the rim, tilted: it stopped where the ground gave out.
    this.root.rotation.set(0.06, -0.9, -0.08);
    this.dust = 1;
    scene.onBeforeRenderObservable.add(() => {
      if (gamePauseClock.isPaused || !this.hatch || Math.abs(this.hatchTarget - this.hatchAngle) < 1e-3) return;
      const dt = scene.getEngine().getDeltaTime() / 1000;
      this.hatchAngle += (this.hatchTarget - this.hatchAngle) * Math.min(1, dt * 3);
      this.hatch.rotationQuaternion = Quaternion.RotationAxis(Axis.X, this.hatchAngle);
    });
  }

  /** Plan 1 box body, kept as the fallback when mica.glb cannot load. */
  private buildPlaceholder(scene: Scene): { body: PBRMaterial; cells: PBRMaterial; eye: StandardMaterial } {
    const body = new PBRMaterial('micaBody', scene);
    body.metallic = 0.6;
    body.roughness = 0.5;
    const cells = new PBRMaterial('micaCells', scene);
    cells.metallic = 0.4;
    cells.roughness = 0.3;
    const eye = new StandardMaterial('micaEye', scene);
    eye.diffuseColor = Color3.Black();
    const add = (m: Mesh, mat: PBRMaterial | StandardMaterial) => {
      m.parent = this.root;
      m.material = mat;
      m.receiveShadows = true;
      this.meshes.push(m);
      return m;
    };
    add(MeshBuilder.CreateBox('micaChassis', { width: 1.0, height: 0.42, depth: 1.3 }, scene), body).position.y = 0.55;
    for (const x of [-0.58, 0.58]) {
      for (const z of [-0.5, 0, 0.5]) {
        const w = add(MeshBuilder.CreateCylinder('micaWheel', { diameter: 0.36, height: 0.14, tessellation: 16 }, scene), body);
        w.rotation.z = Math.PI / 2;
        w.position.set(x, 0.18, z);
      }
      add(MeshBuilder.CreateBox('micaWing', { width: 1.0, height: 0.03, depth: 0.8 }, scene), cells).position.set(x * 1.45, 0.78, -0.05);
    }
    add(MeshBuilder.CreateCylinder('micaMast', { diameter: 0.06, height: 0.55 }, scene), body).position.set(0, 1.03, 0.45);
    add(MeshBuilder.CreateSphere('micaEyeBall', { diameter: 0.2 }, scene), eye).position.set(0, 1.32, 0.5);
    return { body, cells, eye };
  }

  get dust(): number {
    return this.dustLevel;
  }

  /** 0 = clean, 1 = buried under grey regolith. */
  set dust(v: number) {
    this.dustLevel = Math.min(1, Math.max(0, v));
    this.bodyMat.albedoColor = Color3.Lerp(SILVER, DUST, this.dustLevel * 0.9);
    this.bodyMat.metallic = 0.6 * (1 - this.dustLevel);
    this.cellMat.albedoColor = Color3.Lerp(CELLS, DUST, this.dustLevel * 0.95);
  }

  setAwake(on: boolean): void {
    this.eyeMat.emissiveColor = on ? new Color3(0.35, 0.8, 1) : Color3.Black();
  }

  setHatchOpen(open: boolean): void {
    this.hatchTarget = open ? HATCH_OPEN_RAD : 0;
  }

  /** Turns all six wheels as if MICA rolled this far (towing). */
  rollWheels(distanceM: number): void {
    if (!this.wheels.length) return;
    this.roll += wheelSpin(distanceM, WHEEL_RADIUS_M);
    const q = Quaternion.RotationAxis(Axis.X, this.roll);
    for (const w of this.wheels) w.rotationQuaternion = q.clone();
  }
}
