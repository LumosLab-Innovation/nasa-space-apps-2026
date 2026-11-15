import type { GameState, ModuleId } from '../core/gameState';
import type { Act5Stage } from './act5';
import { CRATES, HLS_POS, ICE_SPOT, REPAIR_SPOT, SAMPLE_SPOTS, SHELTER_POS, TRACKS_PATH, zone } from '../world/zones';

export interface Objective {
  title: string;
  hint: string;
  target?: { x: number; z: number };
}
export interface ObjectiveContext {
  state: GameState;
  stage: Act5Stage;
  carrying: ModuleId | null;
  towing: boolean;
  storm: boolean;
  lowOxygen: boolean;
  mica: { x: number; z: number };
  repair: string;
}

/** Goals and tool reminders only: never expose a puzzle answer or choose an energy plan. */
export function currentObjective(c: ObjectiveContext): Objective {
  const f = c.state.flags;
  if (c.storm) return { title: 'Reach radiation cover', hint: 'Follow the warning. Enter the centre of the regolith shelter; a rock shadow is not cover. Watch the protection message.', target: SHELTER_POS };
  if (c.lowOxygen) return { title: 'Refill your oxygen', hint: 'Return to camp or the lander before the suit runs out. Your discoveries will wait.', target: c.state.modules.has('habitat') ? zone('base') : HLS_POS };
  if (c.stage === 'record') return { title: 'Mission complete', hint: 'Read your decisions and the real stories in the Mission Record.' };
  if (c.stage === 'farewell' || c.stage === 'liftoff') return { title: 'Return to the lander', hint: 'Your data is home. Approach the lander and follow the E prompt.', target: HLS_POS };
  if (c.stage === 'sendData' || c.stage === 'dawn') return { title: 'Send the science home', hint: 'Go to MICA after dawn. If you saved power by switching comms off, restore them before transmitting.', target: c.mica };
  if (c.stage === 'night' || c.stage === 'nightPlanner') return { title: 'Plan for the long night', hint: 'Compare demand with stored energy. Which loads can you give up, and what would that cost?' };
  if (c.stage === 'prep' || c.stage === 'titleCard') {
    if (!c.state.samples.has('iceRegolith')) return { title: 'Collect the ice evidence', hint: 'The dark crater is cold. Stay near PIP’s light, watch your heat and read the sample prompt.', target: ICE_SPOT };
    return { title: 'Prepare for darkness', hint: 'At the shelter, E opens the horizon view. Use the Sun’s direction and the terrain to make your prediction. T reveals optional heat leaks; Q asks PIP to seal one nearby. Enter begins the night when you are ready.', target: SHELTER_POS };
  }
  if (f.has('act4:micaAwake')) return { title: 'Recover MICA’s memory', hint: 'Approach MICA and press E after the conversation. Compare the shadows in the photos; wrong attempts give clues, not a penalty.', target: c.mica };
  if (f.has('act3:micaFound')) {
    if (c.towing) return { title: 'Bring MICA to camp', hint: 'Lead PIP back to camp on foot. Watch for alerts while towing.', target: zone('base') };
    if (c.repair !== 'towing') return { title: 'Repair MICA', hint: 'Read the prompt beside MICA: E cleans or replaces parts, Q asks PIP to open the panel. When warming the battery, watch the rate and release E when needed.', target: REPAIR_SPOT };
    return { title: 'Help the stranded rover', hint: 'Get close to MICA and use the Q prompt to ask PIP to tow it.', target: c.mica };
  }
  if (!f.has('dialogue:meetPip:done')) return { title: 'Meet your robot partner', hint: 'Walk towards the habitat crate near the lander. Listen, then approach PIP and follow the E prompt.', target: CRATES.find(x => x.moduleId === 'habitat')! };
  if (c.carrying) return { title: 'Install the module PIP is carrying', hint: 'Lead PIP to the orange installation ring. Wait for PIP, then hold E to align the module. On the steep hill, watch for the anchor and winch prompts.', target: CRATES.find(x => x.moduleId === c.carrying)!.site };
  if (c.state.modules.size < 4) {
    const id = (['habitat', 'radiator', 'antenna', 'solarTower'] as const).find(x => !c.state.modules.has(x))!;
    return { title: 'Build a working outpost', hint: 'Suggested next crate: {module}. E opens it; Q asks PIP to lift it. Each module adds a capability. You can explore and collect samples in any order.', target: CRATES.find(x => x.moduleId === id)! };
  }
  if (c.state.samples.size < 3) return { title: 'Collect evidence from the terrain', hint: 'Use R to scan nearby rocks and read the E prompt to collect a sample. Three samples and two modules unlock the next investigation. What changes between sunny and shaded ground?', target: SAMPLE_SPOTS.find(x => x.sampleId !== 'iceRegolith' && !c.state.samples.has(x.sampleId)) };
  if (f.has('dialogue:tracksFound:done')) return { title: 'Investigate the wheel tracks', hint: 'Follow the marks on the ground beyond the first tracks. Who made them? Keep PIP close and check your oxygen.' };
  return { title: 'Explore beyond camp', hint: 'There are unusual wheel tracks south of camp. Investigate them. The relay on Earth View Peak can unlock your map; samples and experiments are optional discoveries.', target: TRACKS_PATH[0] };
}
