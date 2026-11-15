import { describe, expect, it } from 'vitest';
import { pickInteractable, type Interactable } from '../src/interact/resolver';
import { ModuleInstall } from '../src/interact/moduleInstall';

const item = (id: string, x: number, z: number, enabled = true): Interactable => ({ id, x, z, enabled, prompt: id });

describe('pickInteractable', () => {
  it('ignores disabled items and items beyond 2.5 m', () => {
    const list = [item('off', 0, 1, false), item('far', 0, 3)];
    expect(pickInteractable(list, { x: 0, z: 0 }, 0)).toBeNull();
  });
  it('picks the nearest item', () => {
    const list = [item('a', 0, 2), item('b', 0, 1)];
    expect(pickInteractable(list, { x: 0, z: 0 }, 0)!.id).toBe('b');
  });
  it('breaks distance ties in favour of the item in front', () => {
    const list = [item('behind', 0, -1.5), item('front', 0, 1.5)];
    expect(pickInteractable(list, { x: 0, z: 0 }, 0)!.id).toBe('front');
  });
});

describe('ModuleInstall', () => {
  it('goes crate → needsLift on use', () => {
    const m = new ModuleInstall('solarTower');
    m.playerUse();
    expect(m.stage).toBe('needsLift');
  });
  it('refuses to lift when Pip is more than 3 m away', () => {
    const m = new ModuleInstall('solarTower');
    m.playerUse();
    expect(m.pipLift(4)).toBe(false);
    expect(m.stage).toBe('needsLift');
    expect(m.pipLift(2)).toBe(true);
    expect(m.stage).toBe('lifted');
  });
  it('resets alignment progress if the player lets go early', () => {
    const m = new ModuleInstall('radiator');
    m.playerUse();
    m.pipLift(2);
    m.holdAlign(1.0);
    m.releaseAlign();
    expect(m.stage).toBe('lifted');
    m.holdAlign(1.0);
    expect(m.stage).not.toBe('installed');
  });
  it('installs after holding align for 1.5 s, then ignores further use', () => {
    const m = new ModuleInstall('radiator');
    m.playerUse();
    m.pipLift(2);
    m.holdAlign(1.5);
    expect(m.stage).toBe('installed');
    m.playerUse();
    expect(m.stage).toBe('installed');
  });
});
