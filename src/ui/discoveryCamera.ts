import { CreateScreenshotUsingRenderTargetAsync, type Camera, type RenderTargetTexture, type Scene } from '@babylonjs/core';
import type { PhotoStore, StoredPhoto } from '../save/photoStore';

/** Cards unlocked within this much real time of the first one share one photo moment (one fly-in, flash, click). */
export const BATCH_WINDOW_MS = 1500;
/** After a photo, snapshot cards announced within this much real time reuse it instead of taking another. */
export const CAPTURE_COOLDOWN_MS = 90_000;
/**
 * Pure knowledge cards: announced with their NASA thumbnail, no flash, no shutter, never photographed
 * (spec amendment "Fewer photos"). Every other card is a snapshot card.
 */
export const QUIET_CARDS: ReadonlySet<string> = new Set([
  'noSound', 'apollo17Dust', 'lightDelay', 'viperPanels', 'earthshine',
  'story_eds', 'story_artemis', 'rocketEquation', 'horizonGlow', 'artemisLTV',
]);

/** The Eagle (Tranquility Base) card: photographed during the orbital intro's heritage shot. */
export const EAGLE_CARD = 'apollo11Site';
/**
 * Cards unlocked at touchdown. The Eagle moment in the intro replaces their photo moment: they enter the
 * notebook silently (no fly-in, flash, click or capture); snapshot cards among them reuse the Eagle photo.
 */
export const LANDING_CARDS: ReadonlySet<string> = new Set([EAGLE_CARD, 'alarm1202', 'rocketEquation']);

/**
 * One photo moment. `quiet` when it takes no new photo (only quiet cards, or every card already has its
 * photo): no flash and no shutter click.
 */
export interface DiscoveryBatch { ids: string[]; quiet: boolean }
export interface DiscoveryStep { announce: DiscoveryBatch[]; capture: string[] }

export function createDiscoveryQueue(store: PhotoStore): {
  sync(unlocked: Iterable<string>): void;
  /** `nowMs` is real time (performance.now()), not the game clock. */
  update(unlocked: ReadonlySet<string>, viewClear: boolean, nowMs: number): DiscoveryStep;
  /** Call after the captured ids were stored (store.put + removePending) with this jpeg. */
  captured(ids: string[], jpeg: string, nowMs: number): void;
} {
  const known = new Set<string>();
  let open: { start: number; ids: string[] } | null = null;
  let lastShot: { photo: StoredPhoto; at: number } | null = null;
  const batch = (ids: string[]): DiscoveryBatch => {
    // A card in this moment already has a photo: the whole moment shares it instead of taking another.
    const existing = ids.map((id) => store.get(id)).find((p) => p !== null);
    if (existing) {
      for (const id of ids) {
        if (QUIET_CARDS.has(id) || store.get(id)) continue;
        store.put(id, existing);
        store.removePending(id);
      }
    }
    const pending = new Set(store.pending());
    return { ids, quiet: !ids.some((id) => pending.has(id)) };
  };
  return {
    sync(unlocked) { for (const id of unlocked) known.add(id); },
    update(unlocked, viewClear, nowMs) {
      const announce: DiscoveryBatch[] = [];
      if (open && nowMs - open.start >= BATCH_WINDOW_MS) {
        announce.push(batch(open.ids));
        open = null;
      }
      for (const id of unlocked) {
        if (known.has(id)) continue;
        known.add(id);
        if (LANDING_CARDS.has(id)) {
          const eagle = store.get(EAGLE_CARD);
          if (eagle && !QUIET_CARDS.has(id) && !store.get(id)) store.put(id, eagle);
          continue;
        }
        if (!open) open = { start: nowMs, ids: [] };
        open.ids.push(id);
        if (QUIET_CARDS.has(id) || store.get(id)) continue;
        if (lastShot && nowMs < lastShot.at + CAPTURE_COOLDOWN_MS) store.put(id, lastShot.photo);
        else store.addPending(id);
      }
      // One capture per moment: wait until the batch is announced, then take every pending id together.
      const pending = open ? [] : store.pending();
      return { announce, capture: viewClear && pending.length > 0 ? pending : [] };
    },
    captured(ids, jpeg, nowMs) {
      const stored = ids.map((id) => store.get(id)).find((p) => p?.jpeg === jpeg);
      if (!stored) return;
      lastShot = { photo: stored, at: nowMs };
      // Cards that unlocked while this JPEG was being made share it.
      for (const id of store.pending()) {
        if (!store.get(id)) store.put(id, stored);
        store.removePending(id);
      }
    },
  };
}

/** Longer than Babylon's own 30 s readiness timeout, which on its own never settles the promise. */
export const CAPTURE_TIMEOUT_MS = 35_000;

class CaptureTimeoutError extends Error {}

/** True for the rejection of withTimeout (Babylon kept the frame frozen that long: never retry it). */
export function isCaptureTimeout(error: unknown): boolean {
  return error instanceof CaptureTimeoutError;
}

/** Rejects with `message` if `p` has not settled after `ms`; the timer is always cleared. */
export function withTimeout<T>(p: Promise<T>, ms: number, message: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new CaptureTimeoutError(message)), ms); });
  return Promise.race([p, timeout]).finally(() => clearTimeout(timer));
}

/**
 * True while this scene renders into an offscreen target (the photo, the descent compositor): Babylon's
 * screenshot calls scene.render() itself, so per-frame game logic must not run a second step inside it.
 */
export function isOffscreenRender(scene: Pick<Scene, 'activeCamera'>): boolean {
  return !!scene.activeCamera?.outputRenderTarget;
}

type LayerScene = Pick<Scene, 'layers' | 'onBeforeCameraRenderObservable' | 'onAfterCameraRenderObservable'>;

/** Disables every scene layer (the fullscreen GUI is one) for the camera renders where `isPhoto()` holds. */
export function hidePhotoLayers(scene: LayerScene, isPhoto: () => boolean): () => void {
  let hidden: { layer: { isEnabled: boolean }; was: boolean }[] | null = null;
  const restore = () => {
    if (!hidden) return;
    for (const h of hidden) h.layer.isEnabled = h.was;
    hidden = null;
  };
  const before = scene.onBeforeCameraRenderObservable.add(() => {
    if (hidden || !isPhoto()) return;
    hidden = scene.layers.map((layer) => ({ layer, was: layer.isEnabled }));
    for (const h of hidden) h.layer.isEnabled = false;
  });
  const after = scene.onAfterCameraRenderObservable.add(restore);
  return () => {
    restore();
    scene.onBeforeCameraRenderObservable.remove(before);
    scene.onAfterCameraRenderObservable.remove(after);
  };
}

/**
 * Scene-only JPEG data URL. Babylon's render-target screenshot draws scene layers, so the fullscreen
 * GUI is switched off for that one render. The shot starts after the current frame (Babylon renders the
 * scene synchronously when ready, which must not happen inside the game's own frame), and a capture that
 * never finishes rejects after CAPTURE_TIMEOUT_MS.
 */
export function captureScene(scene: Scene, camera: Camera): Promise<string> {
  let target: RenderTargetTexture | null = null;
  const stop = hidePhotoLayers(scene, () => target !== null && camera.outputRenderTarget === target);
  const engine = scene.getEngine();
  const shot = new Promise<string>((resolve, reject) => {
    engine.onEndFrameObservable.addOnce(() => {
      if (scene.isDisposed) { reject(new Error('scene disposed before the notebook photo')); return; }
      try {
        CreateScreenshotUsingRenderTargetAsync(
          engine, camera, { width: 480, height: 360 }, 'image/jpeg',
          undefined, undefined, undefined, undefined, undefined, true, 0.75, (t) => { target = t; },
        ).then(resolve, reject);
      } catch (error) {
        reject(error);
      }
    });
  });
  return withTimeout(shot, CAPTURE_TIMEOUT_MS, 'notebook photo timed out').catch((error: unknown) => {
    // Babylon's give-up path restores the render size without a resize event: re-lay out the live HUD.
    if (engine.onResizeObservable.hasObservers()) engine.onResizeObservable.notifyObservers(engine);
    throw error;
  }).finally(stop);
}
