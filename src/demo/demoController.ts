import type { GameState } from '../core/gameState';
import type { StoryPanel } from '../ui/storyPanel';
import type { Act5Stage } from '../story/act5';
import { DemoDirector, DEMO_HINTS } from './demoDirector';
import { tr } from '../i18n/i18n';

/** Staged starting situation; the same night planner and energy model as the full game. */
export function createDemoController(w: {
  state: GameState; panel: StoryPanel; keyboard: { consume(k: string): boolean };
  stage(): Act5Stage; begin(): void; hours: number;
}) {
  const d = new DemoDirector();
  let opened = false;
  return {
    update() {
      if (!opened) {
        opened = true;
        w.panel.show({ title: tr('A decision at Shackleton Camp'),
          body: tr(DEMO_HINTS.context) + '\n\n' + tr('NASA LRO/LOLA supplies the hills; JPL Horizons supplies the Sun. Together they predict {hours} hours of shadow here. Energy percentages are simplified game values, not NASA engineering specifications.', { hours: w.hours.toFixed(0) }),
          footer: tr('Enter — make your plan · Sources and credits are available from the main menu') });
      }
      if (d.step === 'context' && w.keyboard.consume('Enter')) {
        d.input('begin'); w.panel.hide(); w.begin();
      }
      if (d.step === 'energy' && (w.state.flags.has('act5:keptMica') || w.state.flags.has('act5:micaSlept'))) d.input('chosen');
      if (d.step === 'outcome' && w.stage() === 'dawn') {
        d.input('dawn');
        // The normal dawn, send-data and ending remain playable after the demo.
      }
    },
  };
}
