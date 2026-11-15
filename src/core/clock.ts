/** Simulation time. Real seconds × timeScale = simulated seconds. */
export class GameClock {
  private t: number;
  private ffTarget = 0;
  private ffLeftS = 0;

  constructor(startMs: number, private readonly timeScale = 60) {
    this.t = startMs;
  }

  tick(dtRealS: number): void {
    let dt = dtRealS;
    if (this.ffLeftS > 0) {
      // Story fast-forward: cover the remaining gap at a constant rate, landing exactly on the target.
      const step = Math.min(dt, this.ffLeftS);
      this.t += (this.ffTarget - this.t) * (step / this.ffLeftS);
      this.ffLeftS -= step;
      dt -= step;
      if (this.ffLeftS <= 1e-9) {
        this.ffLeftS = 0;
        this.t = this.ffTarget;
      }
    }
    this.t += dt * this.timeScale * 1000;
  }

  get nowMs(): number {
    return this.t;
  }

  get fastForwarding(): boolean {
    return this.ffLeftS > 0;
  }

  skipHours(h: number): void {
    this.t += h * 3600_000;
  }

  /** Hold story time at `ms`: if the clock is past it, it goes back to it (called every frame to freeze). */
  capAt(ms: number): void {
    if (this.t > ms) {
      this.t = ms;
      this.ffLeftS = 0;
    }
  }

  /** Story jump to a real moment; never goes backwards. */
  jumpTo(ms: number): void {
    if (ms > this.t) this.t = ms;
  }

  /** Over the next `overRealS` real seconds, run fast enough to arrive exactly at `ms` (e.g. watch a sunset). */
  fastForwardTo(ms: number, overRealS: number): void {
    if (ms <= this.t) return;
    if (overRealS <= 0) {
      this.t = ms;
      return;
    }
    this.ffTarget = ms;
    this.ffLeftS = overRealS;
  }
}
