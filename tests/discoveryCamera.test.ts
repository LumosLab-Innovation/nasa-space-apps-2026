import { afterEach, describe, expect, it, vi } from 'vitest';
import { Observable } from '@babylonjs/core';
import { BATCH_WINDOW_MS, CAPTURE_COOLDOWN_MS, LANDING_CARDS, QUIET_CARDS, createDiscoveryQueue, hidePhotoLayers, isCaptureTimeout, isOffscreenRender, withTimeout } from '../src/ui/discoveryCamera';
import type { PhotoStore, StoredPhoto } from '../src/save/photoStore';

function fakeStore(): PhotoStore {
  const photos = new Map<string, StoredPhoto>();
  const seen = new Set<string>();
  let pend: string[] = [];
  return {
    get: id => photos.get(id) ?? null,
    put: (id, p) => { photos.set(id, p); },
    isSeen: id => seen.has(id),
    markSeen: id => { seen.add(id); },
    pending: () => [...pend],
    addPending: id => { if (!pend.includes(id)) pend.push(id); },
    removePending: id => { pend = pend.filter(x => x !== id); },
    clear: () => { photos.clear(); seen.clear(); pend = []; },
  };
}

describe('discovery queue', () => {
  const set = (...ids: string[]) => new Set(ids);
  /** Simulates the caller: store each captured id, clear its pending flag, report the capture. */
  function takePhoto(store: PhotoStore, q: ReturnType<typeof createDiscoveryQueue>, ids: string[], jpeg: string, nowMs: number) {
    for (const id of ids) { store.put(id, { jpeg, clockMs: 7 }); store.removePending(id); }
    q.captured(ids, jpeg, nowMs);
  }

  it('never announces synced ids', () => {
    const q = createDiscoveryQueue(fakeStore());
    q.sync(['a', 'b']);
    expect(q.update(set('a', 'b'), true, 0)).toEqual({ announce: [], capture: [] });
    expect(q.update(set('a', 'b'), true, 5000)).toEqual({ announce: [], capture: [] });
  });

  it('sync after restore with 10 ids announces nothing', () => {
    const q = createDiscoveryQueue(fakeStore());
    const ids = Array.from({ length: 10 }, (_, i) => 'c' + i);
    q.sync(ids);
    expect(q.update(new Set(ids), true, 0).announce).toEqual([]);
    expect(q.update(new Set(ids), true, 9000).announce).toEqual([]);
  });

  it('two ids 200 ms apart form one batch, announced when the window closes', () => {
    const q = createDiscoveryQueue(fakeStore());
    expect(q.update(set('a'), true, 1000).announce).toEqual([]);
    expect(q.update(set('a', 'b'), true, 1200).announce).toEqual([]);
    expect(q.update(set('a', 'b'), true, 1000 + BATCH_WINDOW_MS - 1).announce).toEqual([]);
    expect(q.update(set('a', 'b'), true, 1000 + BATCH_WINDOW_MS).announce).toEqual([{ ids: ['a', 'b'], quiet: false }]);
    expect(q.update(set('a', 'b'), true, 9000).announce).toEqual([]);
  });

  it('an id 2 s later forms a new batch', () => {
    const q = createDiscoveryQueue(fakeStore());
    q.update(set('a'), false, 0);
    // No frame ran in between: the old batch still closes on its own, the new id opens the next one.
    expect(q.update(set('a', 'c'), false, 2000).announce).toEqual([{ ids: ['a'], quiet: false }]);
    expect(q.update(set('a', 'c'), false, 2000 + BATCH_WINDOW_MS).announce).toEqual([{ ids: ['c'], quiet: false }]);
  });

  it('a batch is captured once, all together, only after it is announced and the view is clear', () => {
    const store = fakeStore();
    const q = createDiscoveryQueue(store);
    expect(q.update(set('a'), true, 0).capture).toEqual([]);
    expect(q.update(set('a', 'b'), true, 200).capture).toEqual([]);
    expect(store.pending()).toEqual(['a', 'b']);
    const shown = q.update(set('a', 'b'), false, BATCH_WINDOW_MS);
    expect(shown.announce).toEqual([{ ids: ['a', 'b'], quiet: false }]);
    expect(shown.capture).toEqual([]);
    for (let i = 0; i < 50; i++) expect(q.update(set('a', 'b'), false, 2000 + i).capture).toEqual([]);
    const step = q.update(set('a', 'b'), true, 3000);
    expect(step.capture).toEqual(['a', 'b']);
    takePhoto(store, q, step.capture, 'jpeg1', 3100);
    expect(q.update(set('a', 'b'), true, 3200)).toEqual({ announce: [], capture: [] });
  });

  it('an id that already has a photo is announced as a quiet moment and never captured', () => {
    const store = fakeStore();
    store.put('x', { jpeg: 'old', clockMs: 1 });
    const q = createDiscoveryQueue(store);
    q.update(set('x'), true, 0);
    const step = q.update(set('x'), true, BATCH_WINDOW_MS);
    expect(step.announce).toEqual([{ ids: ['x'], quiet: true }]);
    expect(step.capture).toEqual([]);
    expect(store.pending()).toEqual([]);
    expect(store.get('x')?.jpeg).toBe('old');
  });

  it('a snapshot card in a batch with an already photographed card reuses that photo: no capture, quiet', () => {
    const store = fakeStore();
    store.put('x', { jpeg: 'old', clockMs: 1 });
    const q = createDiscoveryQueue(store);
    q.update(set('y'), true, 0);
    q.update(set('y', 'x'), true, 300);
    const step = q.update(set('y', 'x'), true, BATCH_WINDOW_MS);
    expect(step).toEqual({ announce: [{ ids: ['y', 'x'], quiet: true }], capture: [] });
    expect(store.get('y')).toEqual({ jpeg: 'old', clockMs: 1 });
    expect(store.pending()).toEqual([]);
  });

  it('a quiet card is never pending or captured, and its batch is quiet', () => {
    expect(QUIET_CARDS.has('noSound')).toBe(true);
    const store = fakeStore();
    const q = createDiscoveryQueue(store);
    q.update(set('noSound', 'earthshine'), true, 0);
    expect(store.pending()).toEqual([]);
    const step = q.update(set('noSound', 'earthshine'), true, BATCH_WINDOW_MS);
    expect(step).toEqual({ announce: [{ ids: ['noSound', 'earthshine'], quiet: true }], capture: [] });
  });

  it('a batch mixing quiet and snapshot cards is not quiet; only the snapshot cards are captured', () => {
    const store = fakeStore();
    const q = createDiscoveryQueue(store);
    q.update(set('hammerFeather', 'tracksLast', 'noSound'), true, 0);
    const step = q.update(set('hammerFeather', 'tracksLast', 'noSound'), true, BATCH_WINDOW_MS);
    expect(step.announce).toEqual([{ ids: ['hammerFeather', 'tracksLast', 'noSound'], quiet: false }]);
    expect(step.capture).toEqual(['hammerFeather', 'tracksLast']);
  });

  it('landing cards enter silently: never announced or captured; alarm1202 reuses the Eagle photo', () => {
    expect([...LANDING_CARDS].sort()).toEqual(['alarm1202', 'apollo11Site', 'rocketEquation']);
    const store = fakeStore();
    store.put('apollo11Site', { jpeg: 'eagle', clockMs: 3 });
    const q = createDiscoveryQueue(store);
    const ids = set('apollo11Site', 'alarm1202', 'rocketEquation');
    for (const t of [0, 100, BATCH_WINDOW_MS, 5000]) expect(q.update(ids, true, t)).toEqual({ announce: [], capture: [] });
    expect(store.get('alarm1202')).toEqual({ jpeg: 'eagle', clockMs: 3 });
    expect(store.get('rocketEquation')).toBeNull();
    expect(store.pending()).toEqual([]);
  });

  it('landing cards stay silent with no player photo when the intro was skipped', () => {
    const store = fakeStore();
    const q = createDiscoveryQueue(store);
    const ids = set('apollo11Site', 'alarm1202', 'rocketEquation');
    for (const t of [0, BATCH_WINDOW_MS, 5000]) expect(q.update(ids, true, t)).toEqual({ announce: [], capture: [] });
    expect(store.get('apollo11Site')).toBeNull();
    expect(store.get('alarm1202')).toBeNull();
    expect(store.pending()).toEqual([]);
  });

  it('a landing card does not open or join a batch of the cards around it', () => {
    const q = createDiscoveryQueue(fakeStore());
    q.update(set('alarm1202', 'a'), true, 0);
    expect(q.update(set('alarm1202', 'a'), true, BATCH_WINDOW_MS).announce).toEqual([{ ids: ['a'], quiet: false }]);
  });

  it('a snapshot id 30 s after a capture reuses that photo quietly; 100 s after, it is captured anew', () => {
    const store = fakeStore();
    const q = createDiscoveryQueue(store);
    q.update(set('a'), true, 0);
    const first = q.update(set('a'), true, BATCH_WINDOW_MS);
    expect(first.capture).toEqual(['a']);
    takePhoto(store, q, first.capture, 'jpeg1', 2000);
    // 30 s later: the same photo at once, nothing pending, nothing to capture, no flash or click.
    q.update(set('a', 'b'), true, 32_000);
    expect(store.get('b')).toEqual({ jpeg: 'jpeg1', clockMs: 7 });
    expect(store.pending()).toEqual([]);
    const later = q.update(set('a', 'b'), true, 32_000 + BATCH_WINDOW_MS);
    expect(later.announce).toEqual([{ ids: ['b'], quiet: true }]);
    expect(later.capture).toEqual([]);
    // 100 s after the capture the cooldown is over.
    const t = 2000 + 100_000;
    expect(t).toBeGreaterThan(2000 + CAPTURE_COOLDOWN_MS);
    q.update(set('a', 'b', 'c'), true, t);
    expect(store.get('c')).toBeNull();
    const fresh = q.update(set('a', 'b', 'c'), true, t + BATCH_WINDOW_MS);
    expect(fresh.announce).toEqual([{ ids: ['c'], quiet: false }]);
    expect(fresh.capture).toEqual(['c']);
  });

  it('ids that became pending while the capture was in flight share that photo', () => {
    const store = fakeStore();
    const q = createDiscoveryQueue(store);
    q.update(set('a'), true, 0);
    const step = q.update(set('a'), true, BATCH_WINDOW_MS);
    q.update(set('a', 'b'), true, BATCH_WINDOW_MS + 16); // b unlocks while the JPEG is still being made
    expect(store.pending()).toEqual(['a', 'b']);
    takePhoto(store, q, step.capture, 'jpeg1', BATCH_WINDOW_MS + 100);
    expect(store.pending()).toEqual([]);
    expect(store.get('b')?.jpeg).toBe('jpeg1');
  });
});

describe('capture timeout', () => {
  afterEach(() => { vi.useRealTimers(); });

  it('a timeout is recognisable; any other failure is not', async () => {
    vi.useFakeTimers();
    const slow = withTimeout(new Promise<string>(() => {}), 10, 'photo timed out').catch((e: unknown) => e);
    await vi.advanceTimersByTimeAsync(10);
    const timedOut = await slow;
    expect(isCaptureTimeout(timedOut)).toBe(true);
    expect((timedOut as Error).message).toBe('photo timed out');
    const failed = await withTimeout(Promise.reject(new Error('gl lost')), 10, 'photo timed out').catch((e: unknown) => e);
    expect(isCaptureTimeout(failed)).toBe(false);
    expect(isCaptureTimeout(undefined)).toBe(false);
  });
});

describe('photo capture safety', () => {
  afterEach(() => { vi.useRealTimers(); });

  it('withTimeout rejects a promise that never settles', async () => {
    vi.useFakeTimers();
    const p = withTimeout(new Promise<string>(() => {}), 35_000, 'photo timed out');
    const seen = p.then(() => 'resolved', (e: Error) => e.message);
    await vi.advanceTimersByTimeAsync(34_999);
    let settled = false;
    void seen.then(() => { settled = true; });
    await Promise.resolve();
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(await seen).toBe('photo timed out');
  });

  it('withTimeout passes through a value and a rejection, and clears its timer', async () => {
    vi.useFakeTimers();
    await expect(withTimeout(Promise.resolve('jpeg'), 1000, 'late')).resolves.toBe('jpeg');
    await expect(withTimeout(Promise.reject(new Error('boom')), 1000, 'late')).rejects.toThrow('boom');
    expect(vi.getTimerCount()).toBe(0);
  });

  it('isOffscreenRender is true only while the active camera renders into a target', () => {
    expect(isOffscreenRender({ activeCamera: null })).toBe(false);
    expect(isOffscreenRender({ activeCamera: { outputRenderTarget: null } } as never)).toBe(false);
    expect(isOffscreenRender({ activeCamera: { outputRenderTarget: {} } } as never)).toBe(true);
  });

  it('hides GUI layers only for the photo render, then restores them', () => {
    const scene = {
      layers: [{ isEnabled: true }, { isEnabled: false }, { isEnabled: true }],
      onBeforeCameraRenderObservable: new Observable<unknown>(),
      onAfterCameraRenderObservable: new Observable<unknown>(),
    };
    let photo = false;
    const stop = hidePhotoLayers(scene as never, () => photo);
    // A normal frame leaves the HUD alone.
    scene.onBeforeCameraRenderObservable.notifyObservers({});
    expect(scene.layers.map((l) => l.isEnabled)).toEqual([true, false, true]);
    scene.onAfterCameraRenderObservable.notifyObservers({});
    // The photo render draws no layer at all.
    photo = true;
    scene.onBeforeCameraRenderObservable.notifyObservers({});
    expect(scene.layers.map((l) => l.isEnabled)).toEqual([false, false, false]);
    scene.onAfterCameraRenderObservable.notifyObservers({});
    expect(scene.layers.map((l) => l.isEnabled)).toEqual([true, false, true]);
    // Stopping mid-render restores too, and removes the observers.
    scene.onBeforeCameraRenderObservable.notifyObservers({});
    stop();
    expect(scene.layers.map((l) => l.isEnabled)).toEqual([true, false, true]);
    expect(scene.onBeforeCameraRenderObservable.hasObservers()).toBe(false);
    expect(scene.onAfterCameraRenderObservable.hasObservers()).toBe(false);
  });
});
