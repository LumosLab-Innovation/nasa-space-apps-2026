import havokWasmUrl from '@babylonjs/havok/lib/esm/HavokPhysics.wasm?url';
import { MODELS, glbPath, type ModelId } from '../models/manifest';
import { EXHAUST_FILES } from '../fx/exhaustAssets';

export const MOON_TEXTURE = 'textures/moon/lroc-color-4k.webp';
export const MOON_DETAIL_TEXTURE = 'textures/moon/lroc-tranquility.webp';
export const MOON_ELEVATION = 'textures/moon/lola-elevation-delta-v1.bin';
export const MOON_RELIEF_TEXTURE = 'textures/moon/lola-relief.webp';
export const APOLLO_MODEL = 'models/apollo11-descent.glb';
export const EARTH_TEXTURE = 'textures/earth/blue-marble-2048.jpg';
export const HAVOK_BINARY = 'havok.wasm';
export const MODEL_IDS = Object.keys(MODELS) as ModelId[];
const BASE_URL = import.meta.env.BASE_URL;
const publicFiles = [
  ...EXHAUST_FILES,
  ...MODEL_IDS.map(glbPath),
  MOON_TEXTURE,
  MOON_DETAIL_TEXTURE,
  MOON_ELEVATION,
  MOON_RELIEF_TEXTURE,
  EARTH_TEXTURE,
  APOLLO_MODEL,
  'data/terrain/heightmap.json',
  'data/terrain/heightmap-f32-v1.bin',
  'data/ephemeris/sun.json',
  'data/ephemeris/earth.json',
];
const sources = [...publicFiles.map((file) => [file, BASE_URL + file] as const), [HAVOK_BINARY, havokWasmUrl] as const];
export const MISSION_FILE_COUNT = sources.length;
export type MissionFiles = ReadonlyMap<string, ArrayBuffer>;

/** Count each asset once its entire response body is available for the scene loaders. */
export async function loadMissionFiles(
  onFile: (completed: number) => void,
  fetchFile: typeof fetch = fetch,
): Promise<MissionFiles> {
  const abort = new AbortController();
  const timeout = setTimeout(() => abort.abort(), 60_000);
  let completed = 0;
  try {
    const entries = await Promise.all(sources.map(async ([file, url]) => {
      const response = await fetchFile(url, { signal: abort.signal });
      if (!response.ok || response.headers.get('content-type')?.includes('text/html')) {
        throw new Error('Could not load mission asset: ' + file);
      }
      const bytes = await response.arrayBuffer();
      if (!bytes.byteLength) throw new Error('Empty mission asset: ' + file);
      if (!abort.signal.aborted) onFile(++completed);
      return [file, bytes] as const;
    }));
    return new Map(entries);
  } catch (error) {
    abort.abort();
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export function missionFile(files: MissionFiles, path: string): ArrayBuffer {
  const bytes = files.get(path);
  if (!bytes) throw new Error('Mission asset was not preloaded: ' + path);
  return bytes;
}

/** Preserve the original data loaders and their fallbacks, using downloaded local responses. */
export function missionFetch(files: MissionFiles): typeof fetch {
  return (request, init) => {
    const bytes = typeof request === 'string' && request.startsWith(BASE_URL)
      ? files.get(request.slice(BASE_URL.length))
      : undefined;
    return bytes ? Promise.resolve(new Response(bytes)) : fetch(request, init);
  };
}
