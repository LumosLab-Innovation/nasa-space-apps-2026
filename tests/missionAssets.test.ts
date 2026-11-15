import { describe, expect, it, vi } from 'vitest';
import { HAVOK_BINARY, MISSION_FILE_COUNT, loadMissionFiles, missionFetch, missionFile } from '../src/scenes/missionAssets';
import { loadStormEvent, stormBlurb } from '../src/data/donki';

describe('mission asset preload', () => {
  it('can start and use generic storm context when both optional DONKI sources are offline', async () => {
    const fetchFile = vi.fn(async (url: RequestInfo | URL) => {
      if (/DONKI-API|donki\/sep/.test(String(url))) throw new Error('offline');
      return new Response(Uint8Array.of(1));
    });
    vi.stubGlobal('fetch', fetchFile);
    try {
      const files = await loadMissionFiles(() => {}, fetchFile);
      const result = await loadStormEvent(missionFetch(files));
      expect(files.size).toBe(MISSION_FILE_COUNT);
      expect(result).toEqual({ event: null, source: 'none' });
      expect(stormBlurb(result.event)).not.toMatch(/\d/);
    } finally {
      vi.unstubAllGlobals();
    }
  });
  it('reports completed bodies and serves cached mission data without fetching again', async () => {
    const progress = vi.fn();
    let body: ReadableStreamDefaultController<Uint8Array> | undefined;
    const slow = new ReadableStream<Uint8Array>({ start: (controller) => { body = controller; } });
    const fetchFile = vi.fn(async (url: RequestInfo | URL) => new Response(
      String(url).endsWith('heightmap-f32-v1.bin') ? slow : Uint8Array.of(1),
    ));
    const pending = loadMissionFiles(progress, fetchFile);
    await vi.waitFor(() => expect(progress).toHaveBeenCalledTimes(MISSION_FILE_COUNT - 1));
    body?.enqueue(Uint8Array.of(17, 34));
    body?.close();
    const files = await pending;
    expect(files.size).toBe(MISSION_FILE_COUNT);
    expect(progress.mock.calls.flat()).toEqual(Array.from({ length: MISSION_FILE_COUNT }, (_, i) => i + 1));
    expect(missionFile(files, HAVOK_BINARY).byteLength).toBe(1);
    const cachedFetch = missionFetch(files);
    const path = import.meta.env.BASE_URL + 'data/terrain/heightmap-f32-v1.bin';
    for (let read = 0; read < 2; read++) {
      expect(new Uint8Array(await (await cachedFetch(path)).arrayBuffer())).toEqual(Uint8Array.of(17, 34));
    }
    expect(fetchFile).toHaveBeenCalledTimes(MISSION_FILE_COUNT);
  });

  it('aborts the attempt when a missing asset returns the HTML app shell', async () => {
    const progress = vi.fn();
    const signals: AbortSignal[] = [];
    const fetchFile = vi.fn(async (url: RequestInfo | URL, options?: RequestInit) => {
      if (options?.signal) signals.push(options.signal);
      return String(url).endsWith('pip.glb')
        ? new Response('<!doctype html>', { headers: { 'content-type': 'text/html' } })
        : new Response(Uint8Array.of(1));
    });
    await expect(loadMissionFiles(progress, fetchFile)).rejects.toThrow('models/pip.glb');
    expect(signals).toHaveLength(MISSION_FILE_COUNT);
    expect(signals.every((signal) => signal.aborted)).toBe(true);
    expect(progress).not.toHaveBeenCalledWith(MISSION_FILE_COUNT);
  });
});
