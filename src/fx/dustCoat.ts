/**
 * Regolith slowly coating boots, legs and wheels. Lunar dust is sharp and electrostatically clingy;
 * Apollo suits came back grey to the knees. The coat never reaches 100% so the suit colour still reads.
 */
export const MAX_COAT = 0.85;
export const REGOLITH = { r: 0.42, g: 0.41, b: 0.39 };
const METRES_TO_FULL = 800;

export interface Color3Like {
  r: number;
  g: number;
  b: number;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export class DustCoat {
  level = 0;

  addTravel(metres: number): void {
    this.level = clamp(this.level + metres / METRES_TO_FULL, 0, MAX_COAT);
  }

  addBurst(impactSpeedMs: number): void {
    this.level = clamp(this.level + 0.01 * clamp(impactSpeedMs, 0, 4), 0, MAX_COAT);
  }

  clean(amount: number): void {
    this.level = clamp(this.level - amount, 0, MAX_COAT);
  }
}

/** Lerp from the clean colour toward regolith grey. */
export function coatColor(base: Color3Like, level: number): Color3Like {
  if (level <= 0) return base;
  const t = clamp(level, 0, 1);
  return {
    r: base.r + (REGOLITH.r - base.r) * t,
    g: base.g + (REGOLITH.g - base.g) * t,
    b: base.b + (REGOLITH.b - base.b) * t,
  };
}
