import { it, expect, vi } from 'vitest';

vi.mock('@babylonjs/core', () => ({
  RenderTargetTexture: class { dispose = vi.fn(); },
}));
import { withPreparationTarget } from '../src/core/preparationRender';

it.each([false, true])('isolates renders across async preparation and restores the camera (failure=%s)', async fail => {
  const previous = {};
  const camera = { outputRenderTarget: previous };
  const loadingCamera = { outputRenderTarget: null };
  const engine = { getRenderWidth: () => 1440, getRenderHeight: () => 810, restoreDefaultFramebuffer: vi.fn() };
  const scene = { activeCamera: camera, getEngine: () => engine };
  let target: any;
  const run = withPreparationTarget(scene as never, async () => {
    target = camera.outputRenderTarget;
    expect(target).not.toBe(previous);
    expect(target).toBeTruthy();
    await Promise.resolve();
    expect(camera.outputRenderTarget).toBe(target);
    expect(loadingCamera.outputRenderTarget).toBeNull();
    if (fail) throw new Error('warm failed');
    return 42;
  });
  if (fail) await expect(run).rejects.toThrow('warm failed');
  else expect(await run).toBe(42);
  expect(camera.outputRenderTarget).toBe(previous);
  expect(target.dispose).toHaveBeenCalledOnce();
});
