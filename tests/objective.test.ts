import { describe, expect, it } from 'vitest';
import { createState } from '../src/core/gameState';
import { currentObjective, type ObjectiveContext } from '../src/story/objective';
import { CRATES, HLS_POS, SHELTER_POS, zone } from '../src/world/zones';
import { VI } from '../src/i18n/vi';

const setup = (): ObjectiveContext => ({ state: createState(), stage: 'waiting', carrying: null, towing: false, storm: false, lowOxygen: false, mica: { x: 0, z: 0 }, repair: 'towing' });
describe('progressive guidance without puzzle spoilers', () => {
  it('leads a new player to the crate where PIP is hiding', () => {
    expect(currentObjective(setup()).target).toEqual(CRATES.find(x => x.moduleId === 'habitat')!);
  });
  it('uses the lander for oxygen until the habitat is installed', () => {
    const c = setup(); c.lowOxygen = true;
    expect(currentObjective(c).target).toEqual(HLS_POS);
    c.state.modules.add('habitat');
    expect(currentObjective(c).target).toEqual(zone('base'));
  });
  it('prioritizes danger over construction and takes carried modules to the correct site', () => {
    const c = setup(); c.state.flags.add('dialogue:meetPip:done'); c.carrying = 'radiator';
    expect(currentObjective(c).target).toEqual(CRATES.find(x => x.moduleId === 'radiator')!.site);
    c.storm = true;
    expect(currentObjective(c).target).toEqual(SHELTER_POS);
  });
  it('does not send players to locked tracks before collecting evidence', () => {
    const c = setup(); c.state.flags.add('dialogue:meetPip:done');
    for (const m of ['habitat', 'radiator', 'solarTower', 'antenna'] as const) c.state.modules.add(m);
    expect(currentObjective(c).title).toBe('Collect evidence from the terrain');
    for (const s of ['anorthosite', 'breccia', 'regolith'] as const) c.state.samples.add(s);
    expect(currentObjective(c).title).toBe('Explore beyond camp');
  });
  it('keeps the hypothesis and energy choice with the player; all stages have Vietnamese hints', () => {
    const c = setup(); c.state.samples.add('iceRegolith');
    for (const stage of ['waiting', 'prep', 'nightPlanner', 'night', 'dawn', 'sendData', 'farewell', 'record'] as const) {
      c.stage = stage;
      const o = currentObjective(c);
      expect(VI[o.title]).toBeTruthy(); expect(VI[o.hint]).toBeTruthy();
      expect(o.hint).not.toMatch(/117°|97°|press 3|choose 1/i);
    }
  });
});
