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

describe('module install reach (hold E within the prompt radius)', async () => {
  const { interactionReach, canStartInteraction } = await import('../src/player/astronaut');
  const { WALK_SPEED_MS } = await import('../src/player/movement');
  const flat = () => 0;
  it('accepts install starts up to 2.5 m and walks at normal speed', () => {
    const r = interactionReach('install');
    expect(r.maxStart).toBe(2.5);
    expect(r.stance).toBe(.4);
    expect(r.speed).toBe(WALK_SPEED_MS);
  });
  it('fits an install approach from 2.5 m inside its timeout', () => {
    const r = interactionReach('install');
    expect((2.5 - r.stance) / r.speed).toBeLessThan(r.timeout(2.5));
  });
  it('keeps sample reach unchanged', () => {
    const r = interactionReach('sample');
    expect(r.stance).toBe(.48);
    expect(r.maxStart).toBeCloseTo(.93, 6);
    expect(r.speed).toBe(.45);
    expect(r.timeout(2)).toBe(2.5);
  });
  it('starts an install from 2 m but not from 3 m', () => {
    const target = { x: 0, z: 0 };
    expect(canStartInteraction('install', { x: 2, z: 0 }, target, flat)).not.toBeNull();
    expect(canStartInteraction('install', { x: 3, z: 0 }, target, flat)).toBeNull();
    expect(canStartInteraction('sample', { x: 2, z: 0 }, target, flat)).toBeNull();
  });
  it('checks install ground against the connector height, not the player position', () => {
    // Player stands 0.5 m uphill; stance point (0.4 m out) is level with the connector.
    const slope = (x: number) => (x > 1 ? .5 : 0);
    const stance = canStartInteraction('install', { x: 2, z: 0 }, { x: 0, z: 0 }, slope);
    expect(stance).not.toBeNull();
    expect(stance!.x).toBeCloseTo(.4, 6);
    expect(canStartInteraction('install', { x: 2, z: 0 }, { x: 0, z: 0 }, (x) => (x < .1 ? 0 : .5))).toBeNull();
  });
});

describe('movement keys held before holding E do not cancel the install', async () => {
  const { moveCancel } = await import('../src/player/astronaut');
  const walk = (forward: number, right = 0, jump = false) => ({ forward, right, jump, lope: false });
  it('ignores a movement key already held when the interaction starts', () => {
    let s = moveCancel(null, walk(1));
    expect(s.cancel).toBe(false);
    s = moveCancel(s.baseline, walk(1));
    expect(s.cancel).toBe(false);
  });
  it('cancels when that key is released and pressed again', () => {
    let s = moveCancel(null, walk(1));
    s = moveCancel(s.baseline, walk(0));
    expect(s.cancel).toBe(false);
    expect(moveCancel(s.baseline, walk(1)).cancel).toBe(true);
  });
  it('cancels on a new direction or a jump', () => {
    const s = moveCancel(null, walk(1));
    expect(moveCancel(s.baseline, walk(1, 1)).cancel).toBe(true);
    expect(moveCancel(s.baseline, walk(-1)).cancel).toBe(true);
    expect(moveCancel(s.baseline, walk(1, 0, true)).cancel).toBe(true);
  });
  it('cancels on any movement when nothing was held at the start', () => {
    const s = moveCancel(null, walk(0));
    expect(moveCancel(s.baseline, walk(0, -1)).cancel).toBe(true);
  });
});

describe('install approach settles without overshooting (review I1/I2)', async () => {
  const { approachVelocity, interactionReach } = await import('../src/player/astronaut');
  const simulate = (fps: number, start: number) => {
    const dt = 1 / fps, reach = interactionReach('install');
    let x = start, t = 0, closest = Infinity, overshoot = false;
    while (t < 10) {
      const v = approachVelocity(reach.stance - x, 0, reach.speed, dt);
      x += v.x * dt; t += dt;
      if (x < reach.stance - 1e-9) overshoot = true;
      closest = Math.min(closest, Math.abs(x - reach.stance));
      if (Math.abs(x - reach.stance) < .035) break;
    }
    return { t, closest, overshoot };
  };
  it.each([30, 60, 144])('never passes the stance point at %i fps', (fps) => {
    expect(simulate(fps, 2.5).overshoot).toBe(false);
  });
  it.each([30, 60, 144])('settles inside the timeout with margin at %i fps', (fps) => {
    const reach = interactionReach('install'), s = simulate(fps, 2.5);
    // arrival + 0.35 s settle + 0.5 s margin for turning to face the connector and frame jitter
    expect(s.t + .35 + .5).toBeLessThanOrEqual(reach.timeout(2.5 - reach.stance));
  });
});
