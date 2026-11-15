import { setFlag, type GameState } from '../core/gameState';
import { zone, ZONES, type ZoneId } from '../world/zones';

/** The eight journey stops (spec v3 §7). Order is only a suggestion: each is discovered on its own. */
export interface Stop {
  id: ZoneId;
  radiusM: number;
  lineId: string;
  cardId?: string;
}

const STOP_CARDS: Partial<Record<ZoneId, string>> = { solarHill: 'viperPanels' };

export const STOPS: Stop[] = ZONES.map((z) => ({ id: z.id, radiusM: z.radius, lineId: `stop_${z.id}`, cardId: STOP_CARDS[z.id] }));

export const stopName = (id: ZoneId): string => zone(id).name;

/** Stops the player has just entered for the first time; marks each with the flag `stop:<id>`. */
export function discoverStops(state: GameState, p: { x: number; z: number }, stops: Stop[]): Stop[] {
  const found: Stop[] = [];
  for (const s of stops) {
    if (state.flags.has(`stop:${s.id}`)) continue;
    const z = zone(s.id);
    if (Math.hypot(p.x - z.x, p.z - z.z) <= s.radiusM) {
      setFlag(state, `stop:${s.id}`);
      found.push(s);
    }
  }
  return found;
}

/** Pip worries when the player wanders off (spec v3 §7.2), at most once per cooldown. */
export class PipFarWatcher {
  private timer = 0;

  constructor(private readonly farM = 40, private readonly cooldownS = 60) {}

  update(dt: number, distM: number): boolean {
    this.timer -= dt;
    if (distM > this.farM && this.timer <= 0) {
      this.timer = this.cooldownS;
      return true;
    }
    return false;
  }
}
