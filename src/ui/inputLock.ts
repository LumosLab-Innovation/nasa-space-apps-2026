import type { MoveInput } from '../player/movement';

/**
 * While a story panel (or the rescue fade) is up, the world behind it must not react: no walking, no E/Q
 * interactions, no resource drain. Several reasons can hold the lock at once.
 */
export class InputLock {
  private readonly reasons = new Map<string, number>();

  push(reason: string): void {
    this.reasons.set(reason, (this.reasons.get(reason) ?? 0) + 1);
  }

  pop(reason: string): void {
    const n = this.reasons.get(reason) ?? 0;
    if (n <= 1) this.reasons.delete(reason);
    else this.reasons.set(reason, n - 1);
  }

  get locked(): boolean {
    return this.reasons.size > 0;
  }
}

const STILL: MoveInput = { forward: 0, right: 0, jump: false, lope: false };

export function sceneInputGate(lock: InputLock, input: MoveInput): MoveInput {
  return lock.locked ? { ...STILL } : input;
}

/** Number keys 1..max (top row or numpad) for panel choices; null when none was pressed this frame. */
export function readDigit(keyboard: { consume(code: string): boolean }, max: number): number | null {
  for (let i = 1; i <= Math.min(9, max); i++) {
    if (keyboard.consume(`Digit${i}`) || keyboard.consume(`Numpad${i}`)) return i;
  }
  return null;
}

export function shouldStepSurvival(paused: boolean, rescuing: boolean): boolean {
  return !paused && !rescuing;
}

/**
 * Enter both skips dialogue lines (its own keydown listener) and confirms story steps. A press that just
 * ended the last line must not also confirm: require the dialogue to have been idle for a moment.
 */
export const ENTER_AFTER_DIALOGUE_MS = 250;
export function enterAllowed(dialogueBusy: boolean, idleSinceMs: number, nowMs: number): boolean {
  return !dialogueBusy && nowMs - idleSinceMs >= ENTER_AFTER_DIALOGUE_MS;
}
