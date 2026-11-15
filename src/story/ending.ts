import type { GameState } from '../core/gameState';
import { tr } from '../i18n/i18n';

/** The Mission Record (v2 K.4): what the player did and decided, read back from the game state. */
export function missionRecord(s: GameState, totalCards: number): { lines: string[]; decisions: string[] } {
  const f = s.flags;
  const leaks = ['door', 'vent', 'cable'].filter((id) => f.has(`act5:leak:${id}`)).length;
  const pick = (cases: [boolean, string][], none = tr('not recorded')) => tr(cases.find(([ok]) => ok)?.[1] ?? none);
  const lines = [
    tr('Modules {m}/4 · Samples {s}/6 · Data logs {d}', { m: s.modules.size, s: s.samples.size, d: s.dataLogs.size }),
    tr('Discoveries {n}/{total} in the Science Notebook', { n: s.unlockedCards.size, total: totalCards }),
  ];
  const decisions = [
    `${tr('Radiation storm:')} ${pick([[f.has('storm:sheltered'), tr('sheltered in time under the regolith')], [f.has('storm:rescued'), tr('caught outside, rescued by Pip')]])}`,
    `${tr('Sunrise notch:')} ${pick([[f.has('act5:notchCorrect'), tr('you picked the right notch')], [f.has('act5:notchChosen'), tr('a different notch than the real sunrise')]])}`,
    `${tr('Heat leaks sealed:')} ${f.has('act5:started') || leaks > 0 ? `${leaks}/3` : tr('not recorded')}`,
    `${tr('MICA in the long night:')} ${pick([[f.has('act5:keptMica'), tr('you kept MICA warm')], [f.has('act5:micaSlept'), tr('MICA slept until dawn')]])}`,
    `${tr('Comms with Houston at night:')} ${pick([[f.has('act5:commsOff'), tr('comms off to save power')], [f.has('act5:keptMica') || f.has('act5:micaSlept'), tr('comms on')]])}`,
    `${tr('Science data:')} ${tr(f.has('act5:dataLost') ? tr('one data log lost to keep MICA warm') : f.has('act5:freezerOff') ? tr('the sample freezer was switched off to keep MICA warm (no data logs on board yet)') : f.has('act5:started') ? tr('nothing lost') : 'not recorded')}`,
    `${tr('Artemis IV flag:')} ${f.has('flag:planted') ? tr('planted at the landing site') : tr('not planted')}`,
    `${tr("MICA's mission:")} ${f.has('ending:dataSent') ? tr("MICA's data reached Houston") : tr('not recorded')}`,
  ];
  return { lines, decisions };
}

const STORY_IDS = ['story_pragyan', 'story_slim', 'story_odysseus', 'story_eds', 'story_artemis'];

/** The five real-story cards (v2 K.5), in order, for reading straight from the Mission Record. */
export function realStories<T extends { id: string; title: string; body: string }>(cards: T[]): T[] {
  return STORY_IDS.map((id) => cards.find((c) => c.id === id)).filter((c): c is T => !!c);
}
