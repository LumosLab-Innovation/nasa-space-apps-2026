import type { ModuleId } from '../core/gameState';

export type InstallStage = 'crate' | 'needsLift' | 'lifted' | 'aligning' | 'installed';

export const PIP_REACH_M = 3;
export const ALIGN_HOLD_S = 1.5;

/** Co-op install: player opens the crate, Pip lifts (must be within reach), player holds to align. */
export class ModuleInstall {
  stage: InstallStage = 'crate';
  alignProgressS = 0;

  constructor(readonly id: ModuleId) {}

  playerUse(): void {
    if (this.stage === 'crate') this.stage = 'needsLift';
  }

  pipLift(pipDistM: number): boolean {
    if (this.stage !== 'needsLift' || pipDistM > PIP_REACH_M) return false;
    this.stage = 'lifted';
    return true;
  }

  holdAlign(dtS: number): void {
    if (this.stage !== 'lifted' && this.stage !== 'aligning') return;
    this.alignProgressS += dtS;
    this.stage = this.alignProgressS >= ALIGN_HOLD_S ? 'installed' : 'aligning';
  }

  releaseAlign(): void {
    if (this.stage !== 'aligning') return;
    this.alignProgressS = 0;
    this.stage = 'lifted';
  }
}

/** 'lift:<moduleId>' → moduleId, so Pip lifts the crate the player is actually standing at. */
export function liftTargetFrom(interactableId: string | null): ModuleId | null {
  return interactableId?.startsWith('lift:') ? (interactableId.slice(5) as ModuleId) : null;
}
