export type RepairStage = 'towing' | 'cleaning' | 'openPanel' | 'swapBoard' | 'warming' | 'awake';

export const EDS_DUST_PER_PULSE = 0.25;
export const EDS_ENERGY_PER_PULSE = 5;
export const CLEAN_ENOUGH = 0.1;
export const PIP_REACH_M = 3;
/** Teaching limit: the heater cuts out above this rate, preserving the battery. */
export const MAX_WARM_RATE_C_PER_S = 2;
export const WAKE_BATTERY_C = 0;

/** MICA repair at camp: clean panels with EDS → Pip opens the hatch → swap the radiation-damaged board → warm the battery slowly. */
export class MicaRepair {
  stage: RepairStage = 'towing';
  dust = 1;
  energyUsed = 0;
  batteryC = -40;
  warning: 'tooFast' | null = null;

  arriveAtBase(): void {
    if (this.stage === 'towing') this.stage = 'cleaning';
  }

  eds(): void {
    if (this.stage !== 'cleaning') return;
    this.dust = Math.max(0, this.dust - EDS_DUST_PER_PULSE);
    this.energyUsed += EDS_ENERGY_PER_PULSE;
    if (this.dust <= CLEAN_ENOUGH) this.stage = 'openPanel';
  }

  pipOpen(pipDistM: number): boolean {
    if (this.stage !== 'openPanel' || pipDistM > PIP_REACH_M) return false;
    this.stage = 'swapBoard';
    return true;
  }

  playerSwap(): void {
    if (this.stage === 'swapBoard') this.stage = 'warming';
  }

  warm(rateCPerS: number, dtS: number): void {
    if (this.stage !== 'warming') return;
    if (rateCPerS > MAX_WARM_RATE_C_PER_S) {
      this.warning = 'tooFast';
      return;
    }
    this.warning = null;
    this.batteryC = Math.min(WAKE_BATTERY_C, this.batteryC + rateCPerS * dtS);
    if (this.batteryC >= WAKE_BATTERY_C) this.stage = 'awake';
  }
}
