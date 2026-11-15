/**
 * Background image preloading for the notebook album (spec amendment "Image loading"): a FIFO queue that loads each
 * url once, with at most `maxConcurrent` loads in flight. Failed loads are forgotten so a later `want` retries them.
 */
export function createImagePreloader(load: (url: string) => Promise<void>, maxConcurrent = 3): { want(urls: string[]): void; has(url: string): boolean } {
  const done = new Set<string>();
  const busy = new Set<string>();
  const queue: string[] = [];
  const queued = new Set<string>();

  const finish = (url: string, ok: boolean) => {
    busy.delete(url);
    if (ok) done.add(url);
    pump();
  };

  function pump(): void {
    while (busy.size < maxConcurrent && queue.length > 0) {
      const url = queue.shift()!;
      queued.delete(url);
      busy.add(url);
      let p: Promise<void>;
      try {
        p = load(url);
      } catch {
        p = Promise.reject(new Error('load threw'));
      }
      p.then(() => finish(url, true), () => finish(url, false));
    }
  }

  return {
    want(urls) {
      for (const url of urls) {
        if (done.has(url) || busy.has(url) || queued.has(url)) continue;
        queue.push(url);
        queued.add(url);
      }
      pump();
    },
    has: (url) => done.has(url),
  };
}

/** Browser loader: fetch and decode off the main thread so showing the image later costs nothing. */
export function domImageLoader(url: string): Promise<void> {
  const img = new Image();
  img.decoding = 'async';
  img.src = url;
  return img.decode();
}
