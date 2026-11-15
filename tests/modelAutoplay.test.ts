import { expect, it, vi } from 'vitest';
const load = vi.hoisted(() => vi.fn(async () => ({})));
vi.mock('@babylonjs/core', () => ({ LoadAssetContainerAsync: load }));
import { prepareModels } from '../src/models/loadModel';
import { glbPath } from '../src/models/manifest';

it.each([false, true])('disables hidden source animation before importing (preloaded bytes=%s)', async (preloaded) => {
  load.mockClear();
  const files = new Map<string, ArrayBuffer>();
  if (preloaded) files.set(glbPath('astronaut'), new ArrayBuffer(8));
  await prepareModels({} as never, files, ['astronaut']);
  expect(load).toHaveBeenCalledOnce();
  expect(load.mock.calls[0]).toEqual([
    preloaded ? expect.any(Uint8Array) : glbPath('astronaut'),
    expect.any(Object),
    expect.objectContaining({ pluginOptions: { gltf: { animationStartMode: 0 } } }),
  ]);
});
