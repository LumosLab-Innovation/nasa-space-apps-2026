export type RGB = { r: number; g: number; b: number };

/** Thermal palette anchors (°C → colour). Cold = deep blue, room temperature = violet, hot = orange → yellow-white. */
export const THERMAL_ANCHORS: [number, RGB][] = [
  [-250, { r: 0, g: 0, b: 0.4 }],
  [-150, { r: 0, g: 0.3, b: 1 }],
  [0, { r: 0.75, g: 0.55, b: 0.95 }],
  [60, { r: 1, g: 0.5, b: 0 }],
  [120, { r: 1, g: 1, b: 0.8 }],
];

export function tempToColor(tempC: number): RGB {
  const a = THERMAL_ANCHORS;
  if (tempC <= a[0][0]) return { ...a[0][1] };
  for (let i = 1; i < a.length; i++) {
    const [t1, c1] = a[i];
    if (tempC <= t1) {
      const [t0, c0] = a[i - 1];
      const f = (tempC - t0) / (t1 - t0);
      return { r: c0.r + (c1.r - c0.r) * f, g: c0.g + (c1.g - c0.g) * f, b: c0.b + (c1.b - c0.b) * f };
    }
  }
  return { ...a[a.length - 1][1] };
}

/**
 * Which meshes the thermal camera may repaint. Line meshes are skipped: assigning them a shared material
 * makes Babylon dispose their own shader and switch the shared material to line drawing (review finding).
 */
export function canThermalize(m: { getClassName(): string; infiniteDistance: boolean; material: unknown; metadata?: unknown }): boolean {
  // Hot spots (heat leaks) keep their glowing material: the post-process reads them as warm.
  const hot = !!(m.metadata as { hotSpot?: boolean } | null | undefined)?.hotSpot;
  return !m.infiniteDistance && !!m.material && m.getClassName() !== 'LinesMesh' && !hot;
}
