import { describe, expect, it } from 'vitest';
import { PendingApproach } from '../src/pip/pendingApproach';
import { canThermalize } from '../src/ui/thermalColor';
import { liftTargetFrom } from '../src/interact/moduleInstall';
import { LINES } from '../src/content/lines.en';

describe('Critical 1: Pip walks up to MICA before opening the hatch', () => {
  it('fires at once when Pip is already within reach', () => {
    const p = new PendingApproach(3);
    expect(p.request(2)).toBe('now');
    expect(p.pending).toBe(false);
  });
  it('asks Pip to approach when too far, then fires once it arrives', () => {
    const p = new PendingApproach(3);
    expect(p.request(5)).toBe('approach');
    expect(p.pending).toBe(true);
    expect(p.tick(4)).toBe(false);
    expect(p.tick(2.5)).toBe(true);
    expect(p.pending).toBe(false);
    expect(p.tick(1)).toBe(false);
  });
});

describe('Important 2: thermal view must not touch line meshes', () => {
  it('skips LinesMesh, sky bodies and meshes without material', () => {
    const mesh = (cls: string, opts: { infiniteDistance?: boolean; material?: unknown } = {}) => ({
      getClassName: () => cls, infiniteDistance: opts.infiniteDistance ?? false, material: 'material' in opts ? opts.material : {},
    });
    expect(canThermalize(mesh('Mesh'))).toBe(true);
    expect(canThermalize(mesh('LinesMesh'))).toBe(false);
    expect(canThermalize(mesh('Mesh', { infiniteDistance: true }))).toBe(false);
    expect(canThermalize(mesh('Mesh', { material: null }))).toBe(false);
  });
});

describe('Important 3: hammer & feather — observe, then explain', () => {
  it('splits the dialogue so the result comes after the drop', () => {
    expect(LINES.hammerFeather).toBeUndefined();
    expect(LINES.hammerFeatherIntro.map((l) => l.text).join(' ')).not.toMatch(/same time/i);
    expect(LINES.hammerFeatherResult.map((l) => l.text).join(' ')).toMatch(/same time/i);
  });
});

describe('Important 4: lift the crate the player is standing at', () => {
  it('reads the module id from the lift interactable id', () => {
    expect(liftTargetFrom('lift:habitat')).toBe('habitat');
    expect(liftTargetFrom('crate:habitat')).toBeNull();
    expect(liftTargetFrom(null)).toBeNull();
  });
});
