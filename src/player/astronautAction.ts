export type AstronautActionKind = 'sample' | 'install';
export interface ActionRequest {
  kind: AstronautActionKind;
  id: string;
  onCommit: () => void;
  onCancel?: () => void;
  onAcquire?: () => void;
  onProgress?: (progress: number) => void;
}
export interface ActionSnapshot {
  kind: AstronautActionKind;
  id: string;
  time: number;
  progress: number;
  committed: boolean;
  recovering: boolean;
  weight: number;
}
export const ACTION_TIMING = { sample: { commit: 2.8, end: 3.6 }, install: { entry: .6, hold: 1.5, commit: 2.1, end: 2.6 }, recovery: .32 } as const;
export const easeMotion = (value: number): number => {
  const t = Math.max(0, Math.min(1, value));
  return t * t * t * (t * (t * 6 - 15) + 10);
};

/** Gameplay-time action transaction. Visual acquisition is provisional until the commit marker. */
export class AstronautAction {
  private request: ActionRequest | null = null;
  private state: ActionSnapshot | null = null;
  private recoveryTime = 0;
  private acquired = false;
  get busy(): boolean { return this.state !== null; }
  get snapshot(): Readonly<ActionSnapshot> | null { return this.state; }

  start(request: ActionRequest): boolean {
    if (this.busy) return false;
    this.request = request;
    this.acquired = false;
    this.recoveryTime = 0;
    this.state = { kind: request.kind, id: request.id, time: 0, progress: 0, committed: false, recovering: false, weight: 0 };
    return true;
  }

  update(dt: number, input: { held: boolean; valid: boolean; cancel: boolean }): void {
    const s = this.state, request = this.request;
    if (!s || !request || !Number.isFinite(dt) || dt <= 0) return;
    if (!s.recovering && ((!s.committed && (!input.valid || (s.kind === 'install' && !input.held))) || input.cancel)) {
      s.recovering = true;
      if (!s.committed) request.onCancel?.();
      this.recoveryTime = 0;
    }
    if (s.recovering) {
      this.recoveryTime += dt;
      s.weight = Math.min(s.weight, 1 - easeMotion(this.recoveryTime / ACTION_TIMING.recovery));
      if (this.recoveryTime >= ACTION_TIMING.recovery) this.clear();
      return;
    }
    s.time += dt;
    const timing = ACTION_TIMING[s.kind];
    s.weight = easeMotion(s.time / .25) * (1 - easeMotion((s.time - timing.end + .3) / .3));
    s.progress = s.kind === 'install'
      ? Math.max(0, Math.min(1, (s.time - ACTION_TIMING.install.entry) / ACTION_TIMING.install.hold))
      : Math.min(1, s.time / timing.commit);
    if (!s.committed) request.onProgress?.(s.progress);
    if (s.kind === 'sample' && !this.acquired && s.time >= 1.6) {
      this.acquired = true;
      request.onAcquire?.();
    }
    if (!s.committed && s.time + 1e-9 >= timing.commit) {
      s.committed = true;
      request.onCommit();
    }
    if (s.time + 1e-9 >= timing.end) this.clear();
  }

  /** Immediate teardown/teleport, distinct from the short visual recovery for ordinary input. */
  cancel(): void {
    const s = this.state, request = this.request;
    this.clear();
    if (s && !s.committed && !s.recovering) request?.onCancel?.();
  }
  private clear(): void { this.state = null; this.request = null; }
}
