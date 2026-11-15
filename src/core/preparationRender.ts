import { RenderTargetTexture, type Scene } from '@babylonjs/core';

/** Compile scene materials without ever presenting a warm-up frame over the loading UI. */
export async function withPreparationTarget<T>(scene: Scene, prepare: () => T | Promise<T>): Promise<T> {
  const camera = scene.activeCamera;
  if (!camera) throw new Error('Preparing a scene requires an active camera');
  const engine = scene.getEngine();
  const target = new RenderTargetTexture('preparationOnly', {
    width: engine.getRenderWidth(true), height: engine.getRenderHeight(true),
  }, scene, false);
  const previous = camera.outputRenderTarget;
  camera.outputRenderTarget = target;
  try {
    return await prepare();
  } finally {
    camera.outputRenderTarget = previous;
    engine.restoreDefaultFramebuffer();
    target.dispose();
  }
}
