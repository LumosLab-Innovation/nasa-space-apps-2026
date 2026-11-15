import { afterEach, describe, expect, it, vi } from 'vitest';
import { NullEngine, Scene, Vector3 } from '@babylonjs/core';
import { ScienceSystem } from '../src/science/scienceSystem';
import { createState } from '../src/core/gameState';
import { SAMPLE_SPOTS } from '../src/world/zones';
import { AstronautAction } from '../src/player/astronautAction';
import type { Astronaut, AstronautInteraction } from '../src/player/astronaut';
import type { Heightmap } from '../src/data/heightmap';
import { ModuleSystem } from '../src/interact/moduleSystem';
import { EventBus, type GameEvents } from '../src/core/events';
import { TransformNode } from '@babylonjs/core';
import { createDarkCrater } from '../src/challenges/darkCrater';
import { ICE_SPOT } from '../src/world/zones';
vi.mock('../src/models/loadModel', () => ({ loadModel: async () => null }));

const engines: NullEngine[] = [];
afterEach(() => engines.splice(0).forEach((e) => e.dispose()));
const hm: Heightmap = { size: 2, worldSizeM: 6000, heights: new Float32Array(4), source: 'procedural' };
function fixture(id = 'anorthosite') {
  const engine = new NullEngine(); engines.push(engine); const scene = new Scene(engine);
  const state = createState(), action = new AstronautAction();
  const hud = { toast: vi.fn() }, dialogue = { play: vi.fn(async () => {}) };
  const science = new ScienceSystem(scene, hm, state, {}, dialogue as never, {} as never, { shadows: { addShadowCaster: vi.fn() } } as never, hud as never);
  science.thermalOn = true;
  const spot = SAMPLE_SPOTS.find((s) => s.sampleId === id)!;
  let request: AstronautInteraction | undefined;
  const player = { position: new Vector3(spot.x, .95, spot.z - .7), yaw: 0, beginInteraction: vi.fn((r: AstronautInteraction) => { request = r; return action.start(r); }) } as unknown as Astronaut;
  let pressed = true;
  const key = { consume: (code: string) => code === 'KeyE' && pressed && !(pressed = false) };
  science.update(1 / 60, player, key as never);
  return { scene, state, action, player, request: () => request, hud };
}
describe('sample actions mutate the actual science system at the bag marker', () => {
  it.each(['anorthosite', 'breccia', 'regolith', 'freshCrater', 'glassBeads'])('%s remains uncommitted while reaching and is restored on cancellation', (id) => {
    const f = fixture(id);
    expect(f.player.beginInteraction).toHaveBeenCalledOnce();
    expect(f.state.samples.size).toBe(0);
    f.action.update(1.7, { held: true, valid: true, cancel: false });
    expect(f.scene.getMeshByName('sample-' + id)!.isEnabled()).toBe(false);
    expect(f.state.samples.size).toBe(0);
    f.action.cancel();
    expect(f.scene.getMeshByName('sample-' + id)!.isEnabled()).toBe(true);
    expect(f.state.samples.size).toBe(0);
  });
  it('commits once and a subsequent cancel does not restore an owned sample', () => {
    const f = fixture();
    f.action.update(2.8, { held: true, valid: f.request()!.valid(), cancel: false });
    expect(f.state.samples.has('anorthosite')).toBe(true);
    f.action.cancel();
    expect(f.scene.getMeshByName('sample-anorthosite')!.isEnabled()).toBe(false);
    expect(f.state.samples.size).toBe(1);
  });
});

describe('module locks use held-E animation transactions', () => {
  it.each(['solarTower', 'radiator', 'habitat', 'antenna'] as const)('%s resets on release and emits one install on completion', (id) => {
    const engine = new NullEngine(); engines.push(engine); const scene = new Scene(engine);
    const state = createState(), bus = new EventBus<GameEvents>(), installed = vi.fn(); bus.on('moduleInstalled', installed);
    const pip = { root: new TransformNode('pip', scene), carryOffset: Vector3.Zero(), position: Vector3.Zero(), setPose: vi.fn(), lowerArm: vi.fn(), onCommand: vi.fn() };
    const modules = new ModuleSystem(scene, hm, state, bus, pip as never, { shadows: { addShadowCaster: vi.fn() }, sunDir: Vector3.Up() } as never, { toast: vi.fn() } as never);
    modules.forceCarry(id); const entry = modules.entries.get(id)!;
    pip.position.set(entry.site.x, 0, entry.site.z);
    const action = new AstronautAction(); let request: AstronautInteraction | undefined;
    const player = { position: entry.connector.position.add(new Vector3(0, 0, -.7)), yaw: 0, beginInteraction: (r: AstronautInteraction) => { request = r; return action.start(r); } } as Astronaut;
    const key = { isHeld: () => true, consume: () => false };
    modules.update(.016, player, key as never);
    action.update(1.2, { held: true, valid: request!.valid(), cancel: false });
    expect(entry.install.alignProgressS).toBeCloseTo(.6);
    action.update(0, { held: false, valid: true, cancel: false });
    expect(entry.install.alignProgressS).toBeCloseTo(.6); // paused
    action.update(.05, { held: false, valid: true, cancel: false });
    expect(entry.install.alignProgressS).toBe(0); expect(installed).not.toHaveBeenCalled();
    action.cancel(); modules.update(.016, player, key as never);
    action.update(2.1, { held: true, valid: request!.valid(), cancel: false });
    expect(installed).toHaveBeenCalledExactlyOnceWith(id);
    action.cancel(); modules.forceInstall(id);
    expect(installed).toHaveBeenCalledTimes(1);
    expect(entry.connector.isEnabled()).toBe(true);
  });
  it('ice still requires PIP light until acquisition/commit', () => {
    const engine = new NullEngine(); engines.push(engine); const scene = new Scene(engine), state = createState(), action = new AstronautAction();
    const pip = { position: new Vector3(ICE_SPOT.x, 0, ICE_SPOT.z), lampOn: true, setFace: vi.fn(), mode: 'follow', command: vi.fn() };
    const dark = createDarkCrater(scene, hm, state, { play: vi.fn(async () => {}) } as never, { toast: vi.fn() } as never, pip as never, () => ({ heater: true }) as never);
    let request: AstronautInteraction | undefined;
    const player = { position: new Vector3(ICE_SPOT.x, .95, ICE_SPOT.z - .7), beginInteraction: (r: AstronautInteraction) => { request = r; return action.start(r); } } as Astronaut;
    dark.update(player, { consume: () => true } as never);
    expect(request!.kind).toBe('sample');
    action.update(1.7, { held: true, valid: request!.valid(), cancel: false });
    pip.lampOn = false;
    action.update(1.2, { held: true, valid: request!.valid(), cancel: false });
    expect(state.samples.size).toBe(0);
    expect(scene.getMeshByName('iceRegolith')!.isEnabled()).toBe(true);
  });
});
