import type { PipMode } from './brain';
import type { PipCommand } from './pip';
import { tr } from '../i18n/i18n';

/**
 * What Q asks Pip to do: the context action if one is offered this frame; otherwise toggle wait/come —
 * except while Pip is busy with a task (winch, tow), when a stray Q must not free it (final review, Plan 3).
 */
export function resolveQ(contextCommand: PipCommand | null, mode: PipMode): PipCommand | null {
  if (contextCommand) return contextCommand;
  if (mode === 'task') return null;
  return mode === 'wait' ? 'come' : 'wait';
}

/** When Pip is parked (wait) and too far to help, tell the player how to call it instead of "wait for Pip". */
export function pipComeHint(mode: PipMode, distM: number, needM: number): string | null {
  if (distM <= needM) return null;
  if (mode === 'wait') return tr('Pip is parked far away: Q — "Pip, come!"');
  if (mode === 'follow') return tr('Pip is coming ({m} m away). Wait nearby for help.', { m: Math.ceil(distM) });
  return null;
}
