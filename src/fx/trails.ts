/**
 * Footprint and wheel-track bookkeeping. With no wind or rain, marks in lunar regolith stay for ages
 * (the Apollo bootprints are still there), so the game keeps every mark for the whole session, up to a
 * fixed budget: the oldest mark is reused once the ring is full.
 */

/** Emits a stamp every `spacingM` of travelled ground distance. */
export class StampSpacer {
  private last: { x: number; z: number } | null = null;
  private acc = 0;

  constructor(private readonly spacingM: number, private readonly teleportM = 5) {}

  feed(x: number, z: number): boolean {
    if (!this.last) {
      this.last = { x, z };
      return false;
    }
    const d = Math.hypot(x - this.last.x, z - this.last.z);
    this.last = { x, z };
    if (d > this.teleportM) {
      this.acc = 0;
      return false;
    }
    this.acc += d;
    if (this.acc >= this.spacingM) {
      this.acc -= this.spacingM;
      return true;
    }
    return false;
  }
}

/** Fixed-size ring: push() overwrites the oldest entry when full and returns the slot it wrote. */
export class StampRing<T> {
  private readonly items: T[] = [];
  private next = 0;

  constructor(private readonly capacity: number) {}

  get size(): number {
    return this.items.length;
  }

  push(v: T): number {
    const slot = this.next;
    this.items[slot] = v;
    this.next = (this.next + 1) % this.capacity;
    return slot;
  }

  at(i: number): T {
    return this.items[i];
  }
}
