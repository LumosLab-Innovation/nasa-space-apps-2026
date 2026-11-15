import { sampleHeight, type Heightmap } from '../data/heightmap';
import { tr } from '../i18n/i18n';

/**
 * Sunny Hill (spec v3 §7, stop 3): soft regolith on a steep slope makes wheels spin in place — the way
 * Spirit got stuck for good in 2009. Pip can only get the solar-tower crate up with a winch anchored at
 * the top by the player.
 */

/** Signed slope (degrees) going along heading `dirYawRad` (0 = +z, π/2 = +x); uphill is positive. */
export function slopeDeg(hm: Heightmap, x: number, z: number, dirYawRad: number, sampleM = 2): number {
  const fx = Math.sin(dirYawRad);
  const fz = Math.cos(dirYawRad);
  const h0 = sampleHeight(hm, x - (fx * sampleM) / 2, z - (fz * sampleM) / 2);
  const h1 = sampleHeight(hm, x + (fx * sampleM) / 2, z + (fz * sampleM) / 2);
  return (Math.atan2(h1 - h0, sampleM) * 180) / Math.PI;
}

const SLIP_START_DEG = 12;
/** VIPER is designed for slopes of about 15°; past 18° in soft regolith a rover's wheels just dig in. */
const SLIP_FULL_DEG = 18;

/** A heavy load pushes the wheels deeper into soft regolith, so a loaded rover slips this much earlier. */
const LOAD_PENALTY_DEG = 6;

/** 0 = full grip, 1 = wheels spin in place. */
export function wheelSlip(slopeDegrees: number, loaded = false): number {
  const s = slopeDegrees + (loaded ? LOAD_PENALTY_DEG : 0);
  if (s <= SLIP_START_DEG) return 0;
  if (s >= SLIP_FULL_DEG) return 1;
  return (s - SLIP_START_DEG) / (SLIP_FULL_DEG - SLIP_START_DEG);
}

export type WinchState = 'idle' | 'stuck' | 'anchored' | 'reeling' | 'done';

export const ANCHOR_REACH_M = 2.5;

/** E only works within reach of the anchor point. Further out, show how far to walk. */
export function anchorPrompt(distM: number): { text: string; canPlant: boolean } {
  if (distM <= ANCHOR_REACH_M) return { text: tr('E — plant the winch anchor'), canPlant: true };
  return { text: tr('Walk to the anchor marker: {m} m to go', { m: (distM - ANCHOR_REACH_M).toFixed(1) }), canPlant: false };
}

/** While stuck, anchored or reeling, the winch owns Pip: nothing else may move or free it. */
export function winchHoldsPip(state: WinchState): boolean {
  return state === 'stuck' || state === 'anchored' || state === 'reeling';
}

export const WINCH_PROMPT_M = 15;

/** The winch prompt (and its Q) only applies near the hill: within 15 m of the anchor or of Pip. */
export function winchPromptActive(state: WinchState, playerToAnchorM: number, playerToPipM: number): boolean {
  return winchHoldsPip(state) && (playerToAnchorM <= WINCH_PROMPT_M || playerToPipM <= WINCH_PROMPT_M);
}

export class Winch {
  state: WinchState = 'idle';
  ropeLeftM: number;

  constructor(private readonly ropeM = 40) {
    this.ropeLeftM = ropeM;
  }

  /** Back to the start (rescue): idle, full rope. */
  reset(): void {
    this.state = 'idle';
    this.ropeLeftM = this.ropeM;
  }

  /** Done at once (demo skip). */
  finishNow(): void {
    this.state = 'done';
    this.ropeLeftM = 0;
  }

  /** Pip reports how much its wheels slip; only a full slip gets it stuck. */
  onPipSlip(slip: number): void {
    if (this.state === 'idle' && slip >= 1) this.state = 'stuck';
  }

  plantAnchor(distFromAnchorM: number): boolean {
    if (this.state !== 'stuck' || distFromAnchorM > ANCHOR_REACH_M) return false;
    this.state = 'anchored';
    return true;
  }

  startReel(): void {
    if (this.state === 'anchored') this.state = 'reeling';
  }

  reel(dt: number, speedMs = 0.4): void {
    if (this.state !== 'reeling') return;
    this.ropeLeftM = Math.max(0, this.ropeLeftM - speedMs * dt);
    if (this.ropeLeftM === 0) this.state = 'done';
  }

  dropLoad(): void {
    if (this.state === 'stuck') this.state = 'idle';
  }
}
