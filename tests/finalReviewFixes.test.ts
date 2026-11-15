import { describe, expect, it, vi } from 'vitest';
import { Mesh, NullEngine, Scene, Vector3 } from '@babylonjs/core';
import { DustSystem } from '../src/fx/dustSystem';
import { TrailRenderer } from '../src/fx/trailRenderer';
import { generateCraterField, sampleHeight } from '../src/data/heightmap';

const hm = generateCraterField(33, 100, 1);
const newScene = () => new Scene(new NullEngine());

describe('Important 1: empty thin-instance sources must not render as a stray mesh at the origin', () => {
  it('dust mesh is hidden while no grains are alive, shown while some are', () => {
    const scene = newScene();
    const d = new DustSystem(scene, hm, 100);
    const mesh = scene.getMeshByName('dustGrains')!;
    d.update(1 / 60);
    expect(mesh.isVisible).toBe(false);
    d.burst(new Vector3(0, sampleHeight(hm, 0, 0) + 0.5, 0), 2);
    d.update(1 / 60);
    expect(mesh.isVisible).toBe(true);
    for (let i = 0; i < 600; i++) d.update(1 / 60);
    expect(mesh.isVisible).toBe(false);
  });

  it('print quad is hidden until the first stamp', () => {
    const scene = newScene();
    const t = new TrailRenderer(scene, hm, 'wheel', 10, () => null);
    const mesh = scene.getMeshByName('wheelPrints')!;
    expect(mesh.isVisible).toBe(false);
    t.stamp(1, 1, 0);
    expect(mesh.isVisible).toBe(true);
  });
});

describe('Important 2: GPU uploads stay small during long play', () => {
  it('a stamp uploads only its own 16 floats, never the whole ring', () => {
    const scene = newScene();
    const t = new TrailRenderer(scene, hm, 'wheel', 50, () => null);
    const mesh = scene.getMeshByName('wheelPrints') as Mesh;
    for (let i = 0; i < 60; i++) t.stamp(i * 0.3, 0, 0);
    const full = vi.spyOn(mesh, 'thinInstanceBufferUpdated');
    const partial = vi.spyOn(mesh, 'thinInstancePartialBufferUpdate');
    t.stamp(20, 0, 0);
    expect(full).not.toHaveBeenCalled();
    expect(partial).toHaveBeenCalledTimes(1);
    expect((partial.mock.calls[0][1] as Float32Array).length).toBe(16);
  });

  it('idle dust does not re-upload its buffer every frame', () => {
    const scene = newScene();
    const d = new DustSystem(scene, hm, 100);
    const mesh = scene.getMeshByName('dustGrains') as Mesh;
    d.update(1 / 60);
    const full = vi.spyOn(mesh, 'thinInstanceBufferUpdated');
    for (let i = 0; i < 10; i++) d.update(1 / 60);
    expect(full).not.toHaveBeenCalled();
  });
});
