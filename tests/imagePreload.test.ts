import { describe, expect, it } from 'vitest';
import { createImagePreloader } from '../src/ui/imagePreload';

/** A fake loader whose loads finish only when the test says so. */
function fakeLoader() {
  const started: string[] = [];
  const pending = new Map<string, { resolve: () => void; reject: (e: unknown) => void }[]>();
  let inFlight = 0;
  let maxInFlight = 0;
  const load = (url: string) => new Promise<void>((resolve, reject) => {
    started.push(url);
    inFlight++;
    maxInFlight = Math.max(maxInFlight, inFlight);
    const list = pending.get(url) ?? [];
    list.push({ resolve: () => { inFlight--; resolve(); }, reject: (e) => { inFlight--; reject(e); } });
    pending.set(url, list);
  });
  const settle = async (url: string, ok = true) => {
    const p = pending.get(url)?.shift();
    if (!p) throw new Error('not loading: ' + url);
    if (ok) p.resolve(); else p.reject(new Error('404'));
    await new Promise((r) => setTimeout(r, 0));
  };
  return { load, started, settle, get maxInFlight() { return maxInFlight; } };
}

describe('createImagePreloader', () => {
  it('loads each url once, even when wanted again while queued, loading or done', async () => {
    const f = fakeLoader();
    const p = createImagePreloader(f.load);
    p.want(['a', 'b', 'a']);
    p.want(['b', 'a']);
    await f.settle('a');
    p.want(['a']);
    await f.settle('b');
    expect(f.started).toEqual(['a', 'b']);
  });

  it('never has more than maxConcurrent loads in flight (default 3) and keeps FIFO order', async () => {
    const f = fakeLoader();
    const p = createImagePreloader(f.load);
    p.want(['1', '2', '3', '4', '5']);
    p.want(['6']);
    expect(f.started).toEqual(['1', '2', '3']);
    await f.settle('2');
    expect(f.started).toEqual(['1', '2', '3', '4']);
    await f.settle('1');
    await f.settle('3');
    expect(f.started).toEqual(['1', '2', '3', '4', '5', '6']);
    expect(f.maxInFlight).toBe(3);

    const g = fakeLoader();
    const one = createImagePreloader(g.load, 1);
    one.want(['x', 'y']);
    expect(g.started).toEqual(['x']);
    await g.settle('x');
    expect(g.started).toEqual(['x', 'y']);
    expect(g.maxInFlight).toBe(1);
  });

  it('a failed load does not block the queue, is forgotten and can be wanted again', async () => {
    const f = fakeLoader();
    const p = createImagePreloader(f.load, 1);
    p.want(['bad', 'good']);
    await f.settle('bad', false);
    expect(f.started).toEqual(['bad', 'good']);
    expect(p.has('bad')).toBe(false);
    await f.settle('good');
    p.want(['bad']);
    expect(f.started).toEqual(['bad', 'good', 'bad']);
    await f.settle('bad');
    expect(p.has('bad')).toBe(true);
  });

  it('a loader that throws synchronously is treated as a failed load', async () => {
    const started: string[] = [];
    const p = createImagePreloader((url) => { started.push(url); if (url === 'boom') throw new Error('sync'); return Promise.resolve(); }, 1);
    expect(() => p.want(['boom', 'ok'])).not.toThrow();
    await new Promise((r) => setTimeout(r, 0));
    expect(started).toEqual(['boom', 'ok']);
    expect(p.has('ok')).toBe(true);
    expect(p.has('boom')).toBe(false);
  });

  it('has() is true only after a successful load', async () => {
    const f = fakeLoader();
    const p = createImagePreloader(f.load);
    expect(p.has('a')).toBe(false);
    p.want(['a']);
    expect(p.has('a')).toBe(false);
    await f.settle('a');
    expect(p.has('a')).toBe(true);
  });
});
