/** 'ride': sitting on the lunar rover's cargo deck (Plan 7). */
export type PipMode = 'follow' | 'wait' | 'goto' | 'task' | 'ride';
type P2 = { x: number; z: number };

export interface PipInput {
  pip: P2;
  player: P2;
  playerYawRad: number;
  dt: number;
  mode: PipMode;
  gotoTarget?: P2;
}
export interface PipOutput {
  target: P2 | null;
  speedMs: number;
  teleportTo: P2 | null;
}

export const FOLLOW_OFFSET = { back: 2.5, left: 1.0 };
export const STOP_DIST = 2.0;
export const WALK = 1.6;
export const RUN = 4.0;
export const RUN_DIST = 8;
export const CATCHUP_DIST = 25;
export const CATCHUP_S = 3;

/** Spot behind and to the left of the player (yaw 0 = facing +z). */
export function followSpot(player: P2, yaw: number): P2 {
  const fx = Math.sin(yaw), fz = Math.cos(yaw);
  const rx = Math.cos(yaw), rz = -Math.sin(yaw);
  return { x: player.x - fx * FOLLOW_OFFSET.back - rx * FOLLOW_OFFSET.left, z: player.z - fz * FOLLOW_OFFSET.back - rz * FOLLOW_OFFSET.left };
}

/** Pip's movement decisions, free of rendering so it can be tested. */
export class PipBrain {
  farTimerS = 0;

  update(i: PipInput): PipOutput {
    const none: PipOutput = { target: null, speedMs: 0, teleportTo: null };
    if (i.mode === 'wait' || i.mode === 'task' || i.mode === 'ride') {
      this.farTimerS = 0;
      return none;
    }
    if (i.mode === 'goto') {
      this.farTimerS = 0;
      return i.gotoTarget ? { target: { ...i.gotoTarget }, speedMs: WALK, teleportTo: null } : none;
    }
    const dist = Math.hypot(i.pip.x - i.player.x, i.pip.z - i.player.z);
    const spot = followSpot(i.player, i.playerYawRad);
    if (dist > CATCHUP_DIST) {
      this.farTimerS += i.dt;
      if (this.farTimerS >= CATCHUP_S) {
        this.farTimerS = 0;
        return { target: null, speedMs: 0, teleportTo: spot };
      }
    } else {
      this.farTimerS = 0;
    }
    if (dist < STOP_DIST) return none;
    return { target: spot, speedMs: dist > RUN_DIST ? RUN : WALK, teleportTo: null };
  }
}
