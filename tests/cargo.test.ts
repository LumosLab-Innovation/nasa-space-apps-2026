import { describe, expect, it, vi } from 'vitest';
import { NullEngine, Scene } from '@babylonjs/core';
import { createState } from '../src/core/gameState';
import { CARGO_SITE, createCargoLanding, cargoShouldStart, ejectaShielded, nearestShelter, slopeDeg } from '../src/challenges/cargoLanding';
import { upgradesFor } from '../src/pip/upgrades';
import { zone } from '../src/world/zones';
import { realHeightmap } from './helpers/realWorld';

const hm = realHeightmap();
const base = zone('base');
const ready = { modules: 2, act3Started: false, winchBusy: false, carrying: false, done: false };

describe('cargo lander (act 2E, plan 5 task 4)', () => {
  it.each([false, true])('warns about folding panels only if the tower exists (%s)', tower => {
    const engine = new NullEngine(), scene = new Scene(engine), state = createState();
    state.modules.add('habitat');
    state.modules.add(tower ? 'solarTower' : 'radiator');
    const play = vi.fn();
    const cargo = createCargoLanding({ scene, hm, state, dialogue: { busy: false, play },
      towerSite: () => tower ? base : null, winchBusy: () => false, carrying: () => false, locked: () => false,
    } as never);
    cargo.update(21, { position: base }, { consume: () => false });
    expect(play.mock.calls.map(c => c[0])).toEqual(tower ? ['cargo_warn', 'cargo_stow_tower'] : ['cargo_warn']);
    scene.dispose(); engine.dispose();
  });
  it('cargo landing fires once, only in act 2, never mid-winch', () => {
    expect(cargoShouldStart(ready)).toBe(true);
    expect(cargoShouldStart({ ...ready, modules: 1 })).toBe(false);
    expect(cargoShouldStart({ ...ready, act3Started: true })).toBe(false);
    expect(cargoShouldStart({ ...ready, winchBusy: true })).toBe(false);
    expect(cargoShouldStart({ ...ready, carrying: true })).toBe(false);
    expect(cargoShouldStart({ ...ready, done: true })).toBe(false);
  });

  it('a ridge between Pip and the cargo site shields it; open ground does not', () => {
    expect(ejectaShielded(hm, base, CARGO_SITE)).toBe(false);
    const s = nearestShelter(hm, base, CARGO_SITE, 60);
    expect(s).not.toBeNull();
    expect(Math.hypot(s!.x - base.x, s!.z - base.z)).toBeLessThanOrEqual(60);
    expect(ejectaShielded(hm, s!, CARGO_SITE)).toBe(true);
  });

  it('a dusty solar tower loses fast charging until it is brushed', () => {
    const mods = new Set(['solarTower'] as const);
    expect(upgradesFor(mods, new Set()).fastCharge).toBe(true);
    expect(upgradesFor(mods, new Set(['cargo:towerDusty'])).fastCharge).toBe(false);
    expect(upgradesFor(mods, new Set(['cargo:towerBrushed'])).fastCharge).toBe(true);
  });

  it('cargo site is flat and at least 600 m from camp', () => {
    expect(Math.hypot(CARGO_SITE.x - base.x, CARGO_SITE.z - base.z)).toBeGreaterThanOrEqual(600);
    expect(slopeDeg(hm, CARGO_SITE.x, CARGO_SITE.z)).toBeLessThan(5);
    expect(Math.abs(CARGO_SITE.x)).toBeLessThan(hm.worldSizeM / 2);
    expect(Math.abs(CARGO_SITE.z)).toBeLessThan(hm.worldSizeM / 2);
  });
});
