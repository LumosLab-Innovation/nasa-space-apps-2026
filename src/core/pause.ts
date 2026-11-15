/** Pause rules (Plan 6a). Escape pauses the mission unless it is closing the horizon view. */
export function escOpensPause(s: { descentActive: boolean; horizonOpen: boolean }): boolean {
  return !s.horizonOpen;
}

/**
 * What the open pause menu does with a key event: handle a fresh key press once, swallow auto-repeat, and let
 * key releases through so the game never keeps a key "held" that was released during the pause.
 */
export function menuKeyAction(e: { type: string; repeat: boolean }): 'handle' | 'swallow' | 'pass' {
  if (e.type !== 'keydown') return 'pass';
  return e.repeat ? 'swallow' : 'handle';
}

/** A clock that stops while the game is paused (dialogue reading time, Houston's radio delay). */
export class PauseClock {
  private pausedAt: number | null = null;
  private pausedTotal = 0;
  setPaused(on: boolean, nowMs: number): void {
    if (on && this.pausedAt == null) this.pausedAt = nowMs;
    if (!on && this.pausedAt != null) {
      this.pausedTotal += nowMs - this.pausedAt;
      this.pausedAt = null;
    }
  }
  get isPaused(): boolean {
    return this.pausedAt !== null;
  }
  now(nowMs: number): number {
    return (this.pausedAt ?? nowMs) - this.pausedTotal;
  }
}

/** The game's one pause clock (the Esc menu drives it; the dialogue box reads it). */
export const gamePauseClock = new PauseClock();

interface KV { getItem(k: string): string | null; setItem(k: string, v: string): void }
const VOL_KEY = 'pipmica.volume';

export function loadVolume(storage: KV | null | undefined): number {
  try {
    const v = Number(storage?.getItem(VOL_KEY));
    return storage?.getItem(VOL_KEY) != null && Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 1;
  } catch {
    return 1;
  }
}

export function saveVolume(storage: KV | null | undefined, v: number): void {
  try {
    storage?.setItem(VOL_KEY, String(Math.max(0, Math.min(1, v))));
  } catch {
    /* blocked storage */
  }
}

/** The mission stays paused while any of its menu pages are open. */
export class MenuHistory<Page extends string> {
  private readonly pages: Page[] = [];

  constructor(private readonly onVisibilityChange?: (open: boolean) => void) {}

  get current(): Page | undefined {
    return this.pages.at(-1);
  }

  open(page: Page): void {
    const wasClosed = !this.current;
    this.pages.push(page);
    if (wasClosed) this.onVisibilityChange?.(true);
  }

  back(): void {
    if (this.pages.pop() && !this.current) this.onVisibilityChange?.(false);
  }

  close(): void {
    if (!this.current) return;
    this.pages.length = 0;
    this.onVisibilityChange?.(false);
  }
}
