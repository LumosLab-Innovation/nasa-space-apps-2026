import { LoadAssetContainerAsync, type AbstractMesh, type AssetContainer, type Material, type Scene, type TransformNode, type Skeleton, type AnimationGroup } from '@babylonjs/core';
import { MODELS, glbPath, type ModelId } from './manifest';

export interface LoadedModel {
  root: TransformNode;
  meshes: AbstractMesh[];
  skeletons?: Skeleton[];
  animationGroups?: AnimationGroup[];
  /** Finds a node inside THIS instance; throws if the GLB breaks the manifest contract. */
  node(name: string): TransformNode;
  material(name: string): Material | null;
}

export type Importer = (url: string, scene: Scene) => Promise<AssetContainer>;

/** Contract nodes (manifest) that a loaded model does not have. */
export function missingNodes(id: ModelId, names: string[]): string[] {
  const have = new Set(names);
  return MODELS[id].nodes.filter((n) => !have.has(n));
}

const sources = new WeakMap<Scene, ReadonlyMap<string, ArrayBuffer>>();
const defaultImporter: Importer = (url, scene) => {
  const bytes = sources.get(scene)?.get(url);
  // Cached source skeletons must stay in bind pose. FIRST (loader default) runs hidden source clips.
  const pluginOptions = { gltf: { animationStartMode: 0 } } as const;
  return bytes
    ? LoadAssetContainerAsync(new Uint8Array(bytes), scene, { pluginExtension: '.glb', name: url, pluginOptions })
    : LoadAssetContainerAsync(url, scene, { pluginOptions });
};
/** Per scene: a container belongs to the scene it was loaded into (the intro and the surface are two scenes). */
const caches = new WeakMap<Scene, Map<string, Promise<AssetContainer>>>();
const cacheFor = (scene: Scene) => {
  let c = caches.get(scene);
  if (!c) caches.set(scene, (c = new Map()));
  return c;
};
const warned = new Set<ModelId>();

function modelContainer(scene: Scene, url: string): Promise<AssetContainer> {
  const cache = cacheFor(scene);
  let pending = cache.get(url);
  if (!pending) {
    pending = defaultImporter(url, scene);
    cache.set(url, pending);
  }
  return pending;
}

export async function prepareModels(scene: Scene, files: ReadonlyMap<string, ArrayBuffer>, ids: readonly ModelId[]): Promise<void> {
  sources.set(scene, files);
  const results = await Promise.allSettled(ids.map((id) => modelContainer(scene, glbPath(id))));
  const failure = results.find((result) => result.status === 'rejected');
  if (failure) throw failure.reason;
}

/**
 * Loads a GLB from public/models and returns a fresh instance of it, or null when the file is missing or
 * broken (the caller then keeps its Plan 1 placeholder body). Containers are cached per scene and model id.
 */
export async function loadModel(scene: Scene, id: ModelId, importer: Importer = defaultImporter): Promise<LoadedModel | null> {
  const url = glbPath(id);
  try {
    const container = await (importer === defaultImporter ? modelContainer(scene, url) : importer(url, scene));
    const inst = container.instantiateModelsToScene((n) => n, true);
    for (const group of inst.animationGroups ?? []) group.stop();
    const root = inst.rootNodes[0] as TransformNode;
    root.name = `${id}-model`;
    const meshes = root.getChildMeshes(false);
    for (const m of meshes) m.receiveShadows = true;
    const nodes = root.getDescendants(false) as TransformNode[];
    // A GLB that breaks the Blender contract would crash later in node(): use the placeholder instead.
    const miss = missingNodes(id, nodes.map((n) => n.name));
    if (miss.length) {
      root.dispose();
      for (const group of inst.animationGroups ?? []) group.dispose();
      for (const skeleton of inst.skeletons ?? []) skeleton.dispose();
      throw new Error(`breaks the manifest contract, missing nodes: ${miss.join(', ')}`);
    }
    return {
      root,
      meshes,
      skeletons: inst.skeletons ?? [],
      animationGroups: inst.animationGroups ?? [],
      node(name) {
        const n = nodes.find((x) => x.name === name);
        if (!n) throw new Error(`model ${id}: missing node ${name}`);
        return n;
      },
      material(name) {
        return meshes.map((m) => m.material).find((m) => m?.name === name) ?? null;
      },
    };
  } catch (e) {
    if (importer === defaultImporter) cacheFor(scene).delete(url);
    if (!warned.has(id)) {
      warned.add(id);
      console.warn(`[models] ${id}: could not load ${url}, using placeholder`, e);
    }
    return null;
  }
}
