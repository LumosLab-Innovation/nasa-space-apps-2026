import type { MoveInput } from './movement';

/** Tracks held keys (by KeyboardEvent.code) and exposes WASD/Space as MoveInput. */
export class Keyboard {
  private enabled = true;
  private held = new Set<string>();
  private pressedOnce = new Set<string>();

  private readonly down = (e: KeyboardEvent) => {
    if (!this.enabled) return;
    if (['Space', 'Tab'].includes(e.code)) e.preventDefault();
    if (e.repeat) return;
    if (!this.held.has(e.code)) this.pressedOnce.add(e.code);
    this.held.add(e.code);
  };
  private readonly up = (e: KeyboardEvent) => this.held.delete(e.code);
  private readonly blur = () => this.reset();

  constructor(private readonly target: Window = window) {
    target.addEventListener('keydown', this.down);
    target.addEventListener('keyup', this.up);
    target.addEventListener('blur', this.blur);
  }

  /** Stop listening (the landing intro has its own keyboard and disposes it). */
  dispose(): void {
    this.target.removeEventListener('keydown', this.down);
    this.target.removeEventListener('keyup', this.up);
    this.target.removeEventListener('blur', this.blur);
  }

  heldCodes(): string[] { return [...this.held]; }

  setEnabled(enabled: boolean, held: readonly string[] = []): void {
    this.reset(); this.enabled = enabled;
    if (enabled) for (const code of held) this.held.add(code);
  }

  reset(): void {
    this.held.clear();
    this.pressedOnce.clear();
  }

  isHeld(code: string): boolean {
    return this.held.has(code);
  }

  /** True once per physical key press. */
  consume(code: string): boolean {
    return this.pressedOnce.delete(code);
  }

  /** Drop presses nobody used this frame, so a stray E can't fire later somewhere else. */
  endFrame(): void {
    this.pressedOnce.clear();
  }

  moveInput(): MoveInput {
    const f = (this.isHeld('KeyW') ? 1 : 0) - (this.isHeld('KeyS') ? 1 : 0);
    const r = (this.isHeld('KeyD') ? 1 : 0) - (this.isHeld('KeyA') ? 1 : 0);
    return { forward: f, right: r, jump: this.consume('Space'), lope: this.isHeld('ShiftLeft') || this.isHeld('ShiftRight') };
  }
}
