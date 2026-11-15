import { Color3, Matrix, Mesh, MeshBuilder, PBRMaterial, Quaternion, TransformNode, Vector3 } from '@babylonjs/core';
import type { LoadedModel } from '../models/loadModel';
import { easeMotion, type ActionSnapshot } from './astronautAction';

const rotationBetween = (from: Vector3, to: Vector3): Quaternion => {
  const a = from.normalizeToNew(), b = to.normalizeToNew();
  const dot = Math.max(-1, Math.min(1, Vector3.Dot(a, b)));
  if (dot > .999999) return Quaternion.Identity();
  const axis = Vector3.Cross(a, b);
  if (axis.lengthSquared() < 1e-10) return Quaternion.RotationAxis(Vector3.Right(), Math.PI);
  return Quaternion.RotationAxis(axis.normalize(), Math.acos(dot));
};

/** Fixed-length two-joint solver. Convert targets through parent matrices to respect glTF handedness. */
export function solveRigChain(upper: TransformNode, lower: TransformNode, end: TransformNode, target: Vector3, pole: Vector3, weight: number): void {
  const parent = upper.parent as TransformNode;
  const inverse = Matrix.Invert(parent.computeWorldMatrix(true));
  const start = upper.position;
  const localTarget = Vector3.TransformCoordinates(target, inverse);
  const a = lower.position.length(), b = end.position.length();
  const direction = localTarget.subtract(start);
  const distance = Math.max(Math.abs(a - b) + .0001, Math.min(a + b - .0001, direction.length()));
  direction.normalize();
  const bend = Vector3.TransformCoordinates(pole, inverse).subtract(start);
  bend.subtractInPlace(direction.scale(Vector3.Dot(bend, direction)));
  if (bend.lengthSquared() < 1e-8) return;
  bend.normalize();
  const along = (a * a + distance * distance - b * b) / (2 * distance);
  const offset = Math.sqrt(Math.max(0, a * a - along * along));
  const elbow = direction.scale(along).add(bend.scale(offset));
  const upperQ = rotationBetween(lower.position, elbow);
  upper.rotationQuaternion = Quaternion.Slerp(upper.rotationQuaternion ?? Quaternion.Identity(), upperQ, weight);
  upper.computeWorldMatrix(true);
  const lowerTarget = Vector3.TransformCoordinates(target, Matrix.Invert(upper.getWorldMatrix())).subtract(lower.position);
  const lowerQ = rotationBetween(end.position, lowerTarget);
  lower.rotationQuaternion = Quaternion.Slerp(lower.rotationQuaternion ?? Quaternion.Identity(), lowerQ, weight);
  lower.computeWorldMatrix(true);
}

/** Owns only this loaded instance. Clips are sampled on gameplay time, so pause freezes all joints. */
export class AstronautRig {
  private readonly rest = new Map<TransformNode, { position: Vector3; rotation: Quaternion; scale: Vector3 }>();
  private readonly tool: TransformNode;
  private readonly scoop: Mesh;
  private readonly tongs: Mesh[];
  private readonly sample: Mesh;
  private feet: Vector3[] = [];
  private activeId: string | null = null;
  private idleTime = 0;
  private walkBlend = 0;
  constructor(private readonly model: LoadedModel) {
    for (const group of model.animationGroups ?? []) {
      group.stop();
      for (const channel of group.targetedAnimations) {
        const n = channel.target as TransformNode;
        if (!this.rest.has(n)) this.rest.set(n, { position: n.position.clone(), rotation: (n.rotationQuaternion ?? Quaternion.Identity()).clone(), scale: n.scaling.clone() });
      }
    }
    const scene = model.root.getScene();
    this.tool = new TransformNode('sample-tool', scene);
    this.tool.parent = model.node('toolSocket_R');
    const metal = new PBRMaterial('sample-tool-metal', scene);
    metal.albedoColor = new Color3(.34, .38, .4); metal.metallic = .65; metal.roughness = .5;
    const shaft = MeshBuilder.CreateCylinder('sample-tool-shaft', { height: .38, diameter: .016, tessellation: 10 }, scene);
    shaft.parent = this.tool; shaft.position.y = -.17; shaft.material = metal;
    this.scoop = MeshBuilder.CreateSphere('regolith-scoop', { diameter: .10, segments: 12, slice: .5 }, scene);
    this.scoop.parent = this.tool; this.scoop.position.y = -.39; this.scoop.scaling.set(1, .4, 1.3); this.scoop.material = metal;
    this.tongs = [-1, 1].map((side) => {
      const jaw = MeshBuilder.CreateBox('sample-tong', { width: .012, height: .12, depth: .014 }, scene);
      jaw.parent = this.tool; jaw.position.set(side * .025, -.39, 0); jaw.rotation.z = side * -.15; jaw.material = metal;
      return jaw;
    });
    this.sample = MeshBuilder.CreateSphere('held-sample', { diameter: .065, segments: 6 }, scene);
    this.sample.parent = this.tool; this.sample.position.y = -.435;
    const dust = new PBRMaterial('held-sample-regolith', scene); dust.albedoColor = new Color3(.4, .39, .37); dust.roughness = 1;
    this.sample.material = dust;
    this.tool.setEnabled(false);
  }
  /** Reset channels not written by the gait too: canceled clips must leave no stale shoulder/finger pose. */
  reset(): void {
    for (const [node, rest] of this.rest) {
      node.position.copyFrom(rest.position); node.scaling.copyFrom(rest.scale);
      node.rotationQuaternion = rest.rotation.clone();
    }
  }
  clearAction(): void { this.tool.setEnabled(false); this.activeId = null; this.feet = []; }
  async warm(): Promise<void> {
    const variants = new Set<string>();
    const work: Promise<void>[] = [];
    for (const mesh of [...this.model.meshes, ...this.tool.getChildMeshes()]) {
      const material = mesh.material;
      const key = `${material?.uniqueId}:${mesh.skeleton ? mesh.numBoneInfluencers : 0}`;
      if (!material || variants.has(key)) continue;
      variants.add(key);
      work.push(material.forceCompilationAsync(mesh));
    }
    await Promise.all(work);
  }
  private clip(name: string, time: number, weight: number, filter?: (name: string) => boolean, groundOffset = 0): void {
    const group = this.model.animationGroups?.find((g) => g.name === name);
    if (!group) return;
    for (const { target, animation } of group.targetedAnimations) {
      const node = target as TransformNode;
      if (filter && !filter(node.name)) continue;
      const value = animation.evaluate(Math.min(group.to, group.from + time * animation.framePerSecond));
      if (animation.targetProperty === 'rotationQuaternion') node.rotationQuaternion = Quaternion.Slerp(node.rotationQuaternion ?? Quaternion.Identity(), value as Quaternion, weight);
      else if (animation.targetProperty === 'position') {
        const position = node.name === 'pelvis' ? (value as Vector3).add(new Vector3(0, groundOffset, 0)) : value as Vector3;
        Vector3.LerpToRef(node.position, position, weight, node.position);
      }
    }
  }
  apply(dt: number, action: Readonly<ActionSnapshot> | null, target: Vector3 | null, root: TransformNode, phase: number, moving: boolean, groundAt?: (x: number, z: number) => number): void {
    this.idleTime += dt;
    // Authored upper-body timing over the travel/terrain-driven lower-body gait.
    this.walkBlend += ((moving ? 1 : 0) - this.walkBlend) * (1 - Math.exp(-dt / .16));
    const arms = (n: string) => /clavicle|upperArm|foreArm|wrist|finger/.test(n);
    this.clip('idle', this.idleTime % 4, .3 * (1 - this.walkBlend), arms);
    this.clip('walk', phase * 1.4, .3 * this.walkBlend, arms);
    if (!action || !target) { this.activeId = null; this.tool.setEnabled(false); return; }
    if (this.activeId !== action.id) {
      this.activeId = action.id;
      this.feet = ['L', 'R'].map((s) => { const n = this.model.node('ankle_' + s); n.computeWorldMatrix(true); const p = n.getAbsolutePosition().clone(); if (groundAt) p.y = groundAt(p.x, p.z) + .13; return p; });
    }
    // The Havok capsule rests slightly above the ground. Authored clips use feet-level origin.
    const groundOffset = groundAt ? Math.max(-.25, Math.min(.25, groundAt(root.position.x, root.position.z) - root.position.y - this.model.root.position.y)) : 0;
    this.clip(action.kind === 'sample' ? 'collectSample' : 'installModule', action.time, action.weight, undefined, groundOffset);
    const forward = new Vector3(Math.sin(root.rotation.y), 0, Math.cos(root.rotation.y));
    const right = new Vector3(Math.cos(root.rotation.y), 0, -Math.sin(root.rotation.y));
    for (const [i, s] of ['L', 'R'].entries()) {
      solveRigChain(this.model.node('thigh_' + s), this.model.node('shin_' + s), this.model.node('ankle_' + s), this.feet[i], this.feet[i].add(forward.scale(.7)).add(new Vector3(0, .5, 0)), action.weight);
      const thigh = this.model.node('thigh_' + s).rotationQuaternion!.toEulerAngles().x;
      const shin = this.model.node('shin_' + s).rotationQuaternion!.toEulerAngles().x;
      const ankle = this.model.node('ankle_' + s);
      ankle.rotationQuaternion = Quaternion.Slerp(ankle.rotationQuaternion!, Quaternion.RotationAxis(Vector3.Right(), -thigh - shin), action.weight);
    }
    const sample = action.kind === 'sample';
    this.tool.setEnabled(sample && action.time > .25 && action.time < 3.2 && !action.recovering);
    const granular = /regolith|glass|ice/i.test(action.id);
    this.scoop.setEnabled(granular); this.tongs.forEach((m) => m.setEnabled(!granular));
    this.sample.setEnabled(action.time >= 1.6 && !action.committed && !action.recovering);
    const reach = easeMotion((action.time - (sample ? .55 : .15)) / .65)
      * (1 - easeMotion((action.time - (sample ? 2.75 : 2.1)) / .45)) * action.weight;
    let hand = target.add(new Vector3(0, sample ? .49 : 0, 0));
    if (!sample) hand = hand.subtract(forward.scale(.055)).add(new Vector3(0, .025, 0));
    if (sample && action.time > 2) {
      const pouch = this.model.node('samplePouch'); pouch.computeWorldMatrix(true);
      hand = Vector3.Lerp(hand, pouch.getAbsolutePosition().add(new Vector3(0, .45, 0)).add(forward.scale(.06)), easeMotion((action.time - 2) / .75));
    }
    const shoulderPole = root.position.add(forward.scale(-.3)).add(right.scale(.4)).add(new Vector3(0, -.15, 0));
    solveRigChain(this.model.node('upperArm_R'), this.model.node('foreArm_R'), this.model.node('wrist_R'), hand, shoulderPole, reach);
    if (!sample) solveRigChain(this.model.node('upperArm_L'), this.model.node('foreArm_L'), this.model.node('wrist_L'), hand.subtract(right.scale(.14)).add(new Vector3(0, -.03, 0)), shoulderPole.subtract(right.scale(.8)), reach);
    else {
      // Keep the long sampler pointed down while the arm reaches and transfers it to the pouch.
      const wrist = this.model.node('wrist_R');
      const parentMatrix = (wrist.parent as TransformNode).computeWorldMatrix(true);
      const down = Vector3.TransformNormal(new Vector3(0, -1, 0), Matrix.Invert(parentMatrix));
      wrist.rotationQuaternion = Quaternion.Slerp(wrist.rotationQuaternion!, rotationBetween(new Vector3(0, 0, -1), down), reach);
    }
  }
  dispose(): void {
    this.tool.dispose(false, true);
    for (const group of this.model.animationGroups ?? []) group.dispose();
    for (const skeleton of this.model.skeletons ?? []) skeleton.dispose();
  }
}
