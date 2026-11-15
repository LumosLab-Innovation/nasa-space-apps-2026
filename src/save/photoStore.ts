/**
 * Notebook photo album storage: the player's photos, the "seen" page ids and pending captures live in
 * localStorage under their own key, separate from the autosave. Never throws: blocked or full storage
 * just means the album lasts for this session.
 */
export const PHOTO_KEY = 'pipmica.photos';

export interface StoredPhoto { jpeg: string; clockMs: number }

export interface PhotoKV { getItem(k: string): string | null; setItem(k: string, v: string): void; removeItem(k: string): void }

export interface PhotoStore {
  get(id: string): StoredPhoto | null;
  put(id: string, p: StoredPhoto): void;
  isSeen(id: string): boolean;
  markSeen(id: string): void;
  pending(): string[];
  addPending(id: string): void;
  removePending(id: string): void;
  clear(): void;
}

interface PhotoData {
  v: 1;
  photos: Record<string, StoredPhoto>;
  seen: string[];
  pending: string[];
}

const strings = (x: unknown): x is string[] => Array.isArray(x) && x.every((v) => typeof v === 'string');

function parse(json: string | null): PhotoData | null {
  if (!json) return null;
  try {
    const d = JSON.parse(json) as Partial<PhotoData> | null;
    if (!d || typeof d !== 'object' || d.v !== 1) return null;
    if (!d.photos || typeof d.photos !== 'object' || Array.isArray(d.photos)) return null;
    if (!strings(d.seen) || !strings(d.pending)) return null;
    const photos: Record<string, StoredPhoto> = {};
    for (const [id, p] of Object.entries(d.photos)) {
      if (p && typeof p.jpeg === 'string' && typeof p.clockMs === 'number' && Number.isFinite(p.clockMs)) {
        photos[id] = { jpeg: p.jpeg, clockMs: p.clockMs };
      }
    }
    return { v: 1, photos, seen: [...d.seen], pending: [...d.pending] };
  } catch {
    return null;
  }
}

export function createPhotoStore(storage: PhotoKV | null | undefined, persist: boolean): PhotoStore {
  let loaded: PhotoData | null = null;
  try {
    loaded = parse(storage?.getItem(PHOTO_KEY) ?? null);
  } catch {
    loaded = null;
  }
  const data: PhotoData = loaded ?? { v: 1, photos: {}, seen: [], pending: [] };

  const save = (): void => {
    if (!persist) return;
    try {
      storage?.setItem(PHOTO_KEY, JSON.stringify(data));
    } catch {
      /* blocked or full storage: keep it in memory */
    }
  };

  return {
    get: (id) => {
      const p = Object.prototype.hasOwnProperty.call(data.photos, id) ? data.photos[id] : null;
      return p ? { ...p } : null;
    },
    put: (id, p) => {
      data.photos[id] = { jpeg: p.jpeg, clockMs: p.clockMs };
      save();
    },
    isSeen: (id) => data.seen.includes(id),
    markSeen: (id) => {
      if (data.seen.includes(id)) return;
      data.seen.push(id);
      save();
    },
    pending: () => [...data.pending],
    addPending: (id) => {
      if (data.pending.includes(id)) return;
      data.pending.push(id);
      save();
    },
    removePending: (id) => {
      const i = data.pending.indexOf(id);
      if (i < 0) return;
      data.pending.splice(i, 1);
      save();
    },
    clear: () => {
      data.photos = {};
      data.seen = [];
      data.pending = [];
      try {
        storage?.removeItem(PHOTO_KEY);
      } catch {
        /* ignore */
      }
    },
  };
}
