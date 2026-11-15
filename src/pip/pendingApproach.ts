/** A Pip action that needs Pip within `reachM` of a target: fire now, or remember it until Pip arrives. */
export class PendingApproach {
  pending = false;

  constructor(private readonly reachM: number) {}

  request(distM: number): 'now' | 'approach' {
    if (distM <= this.reachM) {
      this.pending = false;
      return 'now';
    }
    this.pending = true;
    return 'approach';
  }

  /** True exactly once: the frame a pending request comes within reach. */
  tick(distM: number): boolean {
    if (!this.pending || distM > this.reachM) return false;
    this.pending = false;
    return true;
  }
}
