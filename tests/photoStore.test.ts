import { describe, expect, it, vi } from 'vitest';
import { PHOTO_KEY, createPhotoStore, type PhotoKV } from '../src/save/photoStore';

function fakeKV(): PhotoKV & { data: Map<string, string>; setItem: ReturnType<typeof vi.fn>; removeItem: ReturnType<typeof vi.fn> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k: string) => data.get(k) ?? null,
    setItem: vi.fn((k: string, v: string) => { data.set(k, v); }),
    removeItem: vi.fn((k: string) => { data.delete(k); }),
  };
}

describe('photoStore', () => {
  it('round-trips photos, seen and pending across instances', () => {
    const kv = fakeKV();
    const a = createPhotoStore(kv, true);
    a.put('c1', { jpeg: 'data:image/jpeg;base64,AAA', clockMs: 42 });
    a.markSeen('c1');
    a.addPending('c2');
    const b = createPhotoStore(kv, true);
    expect(b.get('c1')).toEqual({ jpeg: 'data:image/jpeg;base64,AAA', clockMs: 42 });
    expect(b.get('nope')).toBeNull();
    expect(b.isSeen('c1')).toBe(true);
    expect(b.isSeen('c2')).toBe(false);
    expect(b.pending()).toEqual(['c2']);
    expect(JSON.parse(kv.data.get(PHOTO_KEY)!).v).toBe(1);
  });

  it('persist=false never writes', () => {
    const kv = fakeKV();
    const s = createPhotoStore(kv, false);
    s.put('c1', { jpeg: 'x', clockMs: 1 });
    s.markSeen('c1');
    s.addPending('c2');
    s.removePending('c2');
    expect(kv.setItem).not.toHaveBeenCalled();
    expect(s.get('c1')).not.toBeNull();
  });

  it('survives a throwing setItem', () => {
    const kv = fakeKV();
    kv.setItem.mockImplementation(() => { throw new Error('quota'); });
    const s = createPhotoStore(kv, true);
    expect(() => s.put('c1', { jpeg: 'x', clockMs: 1 })).not.toThrow();
    expect(() => s.markSeen('c1')).not.toThrow();
    expect(s.get('c1')).toEqual({ jpeg: 'x', clockMs: 1 });
    expect(s.isSeen('c1')).toBe(true);
  });

  it('corrupt JSON or wrong version gives an empty store', () => {
    for (const bad of ['{not json', JSON.stringify({ v: 2, photos: { a: { jpeg: 'x', clockMs: 1 } }, seen: [], pending: [] }), 'null', '5']) {
      const kv = fakeKV();
      kv.data.set(PHOTO_KEY, bad);
      const s = createPhotoStore(kv, true);
      expect(s.get('a')).toBeNull();
      expect(s.pending()).toEqual([]);
      expect(s.isSeen('a')).toBe(false);
    }
  });

  it('a throwing getItem gives an empty store', () => {
    const kv = fakeKV();
    kv.getItem = () => { throw new Error('blocked'); };
    expect(createPhotoStore(kv, true).pending()).toEqual([]);
  });

  it('works in memory with null storage', () => {
    const s = createPhotoStore(null, true);
    s.put('c1', { jpeg: 'x', clockMs: 1 });
    s.addPending('p');
    expect(s.get('c1')?.clockMs).toBe(1);
    expect(s.pending()).toEqual(['p']);
  });

  it('clear empties memory and removes the key', () => {
    const kv = fakeKV();
    const s = createPhotoStore(kv, true);
    s.put('c1', { jpeg: 'x', clockMs: 1 });
    s.markSeen('c1');
    s.addPending('c2');
    s.clear();
    expect(s.get('c1')).toBeNull();
    expect(s.isSeen('c1')).toBe(false);
    expect(s.pending()).toEqual([]);
    expect(kv.removeItem).toHaveBeenCalledWith(PHOTO_KEY);
    expect(createPhotoStore(kv, true).get('c1')).toBeNull();
  });

  it('addPending is idempotent, keeps order, removePending works', () => {
    const s = createPhotoStore(null, true);
    s.addPending('b');
    s.addPending('a');
    s.addPending('b');
    s.addPending('c');
    expect(s.pending()).toEqual(['b', 'a', 'c']);
    s.removePending('a');
    expect(s.pending()).toEqual(['b', 'c']);
  });
});
