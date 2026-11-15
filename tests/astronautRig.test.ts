import { describe, expect, it } from 'vitest';
import { NullEngine, Scene, TransformNode, Quaternion, Vector3, Matrix, Animation, AnimationGroup } from '@babylonjs/core';
import { AstronautRig, solveRigChain } from '../src/player/astronautRig';

describe('AxEMU fixed-length joint chains', () => {
  it('blends the authored arm overlay when walking starts and stops', () => {
    const engine = new NullEngine(), scene = new Scene(engine);
    const root = new TransformNode('root', scene), arm = new TransformNode('upperArm_L', scene);
    arm.rotationQuaternion = Quaternion.Identity(); arm.parent = root;
    const socket = new TransformNode('toolSocket_R', scene); socket.parent = root;
    const groups = ['idle', 'walk'].map((name, i) => {
      const a = new Animation(name, 'rotationQuaternion', 30, Animation.ANIMATIONTYPE_QUATERNION);
      const q = Quaternion.RotationAxis(Vector3.Right(), i ? -.4 : .4);
      a.setKeys([{ frame: 0, value: q }, { frame: 120, value: q }]);
      const group = new AnimationGroup(name, scene); group.addTargetedAnimation(a, arm); return group;
    });
    const rig = new AstronautRig({ root, meshes: [], animationGroups: groups, node: () => socket, material: () => null });
    const update = (moving: boolean) => { rig.reset(); rig.apply(1 / 60, null, null, root, .25, moving); return arm.rotationQuaternion!.toEulerAngles().x; };
    for (let i = 0; i < 90; i++) update(false);
    const idle = update(false), firstStep = update(true);
    expect(Math.abs(firstStep - idle)).toBeLessThan(.04);
    for (let i = 0; i < 90; i++) update(true);
    const walk = update(true), firstStop = update(false);
    expect(Math.abs(firstStop - walk)).toBeLessThan(.04);
    rig.dispose(); engine.dispose();
  });
  it.each([0, Math.PI / 2, Math.PI, -Math.PI / 2].flatMap((yaw) => [1, -1].map((mirror) => ({ yaw, mirror }))))('reaches without stretching at yaw $yaw / glTF scale $mirror', ({ yaw, mirror }) => {
    const engine = new NullEngine(), scene = new Scene(engine);
    const root = new TransformNode('root', scene); root.scaling.x = mirror;
    root.rotationQuaternion = Quaternion.RotationYawPitchRoll(yaw, 0, 0).multiply(Quaternion.RotationAxis(Vector3.Right(), -Math.PI / 2));
    root.position.y = 1;
    const upper = new TransformNode('upper', scene); upper.parent = root;
    const lower = new TransformNode('lower', scene); lower.parent = upper; lower.position.z = -.41;
    const end = new TransformNode('end', scene); end.parent = lower; end.position.z = -.4;
    const target = Vector3.TransformCoordinates(new Vector3(.08, .35, .25), Matrix.RotationY(yaw));
    const pole = Vector3.TransformCoordinates(new Vector3(.1, .8, 1), Matrix.RotationY(yaw));
    solveRigChain(upper, lower, end, target, pole, 1);
    end.computeWorldMatrix(true);
    expect(Vector3.Distance(end.absolutePosition, target)).toBeLessThan(.001);
    expect(lower.position.length()).toBeCloseTo(.41);
    expect(end.position.length()).toBeCloseTo(.4);
    engine.dispose();
  });
});
