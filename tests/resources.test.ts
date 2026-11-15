import { describe, expect, it } from 'vitest';
import { addSample, createState, installModule, setFlag } from '../src/core/gameState';
import { applyRescue, needsRescue, panelFactor, stepResources, type Env, type Resources, type Upg } from '../src/survival/resources';

const full: Resources = { o2: 100, heat: 100, pip: 100 };
const env = (o: Partial<Env> = {}): Env => ({
  playerInSun: true, inDarkCrater: false, nearPip: true, atCamp: false, pipInSun: false, pipMoving: false,
  pipLamp: false, pipPanelFactor: 1, pipDust: 0, ...o,
});
const noUpg: Upg = { heater: false, fastCharge: false, batteryX: 1 };
const run = (r: Resources, e: Env, u: Upg, seconds: number) => {
  let x = r;
  for (let i = 0; i < seconds * 10; i++) x = stepResources(x, e, u, 0.1);
  return x;
};

describe('resources', () => {
  it('o2 drains about 0.08 per second and refills at camp', () => {
    const r = run(full, env(), noUpg, 100);
    expect(r.o2).toBeCloseTo(92, 1);
    expect(run(r, env({ atCamp: true }), noUpg, 2).o2).toBe(100);
  });

  it('dark crater drains heat fast without the heater and slower with it', () => {
    expect(run(full, env({ inDarkCrater: true }), noUpg, 30).heat).toBeLessThan(55);
    expect(run(full, env({ inDarkCrater: true }), { ...noUpg, heater: true }, 30).heat).toBeGreaterThan(85);
  });

  it('pip charges in sun facing the panels and not in shadow', () => {
    const low = { ...full, pip: 50 };
    expect(run(low, env({ pipInSun: true }), noUpg, 10).pip).toBeCloseTo(62, 1);
    expect(run(low, env({ pipInSun: false }), noUpg, 10).pip).toBeLessThanOrEqual(50);
  });

  it('the heater needs a nearby, powered Pip and only draws energy while helping', () => {
    const heater = { ...noUpg, heater: true };
    const far = run(full, env({ inDarkCrater: true, nearPip: false }), heater, 10);
    const near = run(full, env({ inDarkCrater: true }), heater, 10);
    expect(far.heat).toBeCloseTo(84);
    expect(far.pip).toBe(100);
    expect(near.heat).toBeCloseTo(96.5);
    expect(near.pip).toBeCloseTo(98);
    expect(run({ ...full, pip: 0 }, env({ inDarkCrater: true }), heater, 10).heat).toBeCloseTo(84);
  });

  it('dust halves charging at 0.5 coat', () => {
    const low = { ...full, pip: 50 };
    expect(run(low, env({ pipInSun: true, pipDust: 0.5 }), noUpg, 10).pip).toBeCloseTo(56, 1);
  });

  it('the vertical panels catch a Sun from the side or behind, not from the open front', () => {
    expect(panelFactor(0, 180)).toBeCloseTo(1, 6); // Sun behind → back panel
    expect(panelFactor(0, 90)).toBeCloseTo(1, 6); // Sun to the right → right panel
    expect(panelFactor(0, 0)).toBeCloseTo(0, 6); // Sun straight ahead: no panel faces it
  });

  it('rescue keeps progress and refills', () => {
    const s = createState();
    installModule(s, 'solarTower');
    installModule(s, 'radiator');
    addSample(s, 'anorthosite');
    addSample(s, 'breccia');
    addSample(s, 'glassBeads');
    setFlag(s, 'stop:solarHill');
    const before = JSON.stringify([...s.modules, ...s.samples, ...s.flags, ...s.unlockedCards]);
    expect(applyRescue(s, { o2: 0, heat: 40, pip: 10 })).toEqual(full);
    expect(JSON.stringify([...s.modules, ...s.samples, ...s.flags, ...s.unlockedCards])).toBe(before);
  });

  it('needsRescue priority is o2, then heat, then pip', () => {
    expect(needsRescue({ o2: 0, heat: 0, pip: 0 })).toBe('o2');
    expect(needsRescue({ o2: 10, heat: 0, pip: 0 })).toBe('heat');
    expect(needsRescue({ o2: 10, heat: 10, pip: 0 }, false)).toBe('pip');
    expect(needsRescue({ o2: 10, heat: 10, pip: 0 }, true)).toBeNull();
    expect(needsRescue(full)).toBeNull();
  });
});
