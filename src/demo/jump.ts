import type { GameState } from '../core/gameState';
import type { SurfaceWorld } from '../scenes/surfaceScene';
import { MICA_POS, SHELTER_POS } from '../world/zones';

export type JumpTarget = 'act4' | 'act5';

/** The game state a dev jump starts from (pure, tested). */
export function jumpState(s: GameState, to: JumpTarget): void {
  for (const m of ['solarTower', 'radiator', 'habitat', 'antenna'] as const) s.modules.add(m);
  for (const f of ['stop:landing', 'dialogue:meetPip:done', 'act3:micaFound']) s.flags.add(f);
  if (to === 'act5') {
    for (const id of ['anorthosite', 'breccia', 'glassBeads', 'regolith', 'freshCrater'] as const) s.samples.add(id);
    s.flags.add('act4:memory');
  }
}

/**
 * Dev-only shortcuts for playtesting the late story (`?jump=act4` at MICA's rim before the tow,
 * `?jump=act5` in camp with MICA awake and its memory restored).
 */
export function applyJump(w: SurfaceWorld, to: JumpTarget): void {
  jumpState(w.state, to);
  if (to === 'act4') {
    w.micaSys.stage = 'found';
    // South of MICA: the player starts facing +z, i.e. looking straight at it.
    w.player.teleport(MICA_POS.x, MICA_POS.z - 3);
    w.pip.root.position.set(MICA_POS.x + 3, w.pip.root.position.y, MICA_POS.z + 1);
    return;
  }
  w.repairSys.fastForwardWake();
  w.player.teleport(SHELTER_POS.x, SHELTER_POS.z + 6);
  w.pip.root.position.set(SHELTER_POS.x + 3, w.pip.root.position.y, SHELTER_POS.z + 7);
}
