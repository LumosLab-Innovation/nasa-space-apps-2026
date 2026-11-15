/**
 * The long night's energy budget (v2 scene 5.2, task 1; 5.5 MICA's choice). Units: % of the stored battery
 * per night-day. Sealing heat leaks lowers the shelter heater's draw; the player can switch off lights and
 * comms (Earth stays up, but every watt counts). Kindness is never punished: keeping MICA warm with too
 * little energy costs one science data log, never the game.
 */
export const NIGHT = { capacity: 100, shelterHeat: 14, freezer: 1, perLeakSaved: 3, pipWarm: 6, micaWarm: 5, lights: 3, comms: 4 };

export interface NightPlan {
  lights: boolean;
  comms: boolean;
  mica: boolean;
  freezer?: boolean;
}

export function nightDays(hours: number): number {
  return Math.ceil(hours / 24);
}

export function nightDialogue(turn: number, plan: NightPlan): string {
  if (turn === 1) return plan.mica ? 'pip_sleep_fear' : 'pip_sleep_alone';
  if (turn === 3 && !plan.comms) return 'night_day3_offline';
  if (turn >= 4 && !plan.mica) return 'night_day4_alone';
  return `night_day${Math.min(turn, 4)}`;
}

export function perDay(plan: NightPlan, leaks: number): number {
  return (
    NIGHT.shelterHeat - NIGHT.perLeakSaved * Math.max(0, Math.min(3, leaks)) +
    NIGHT.pipWarm +
    (plan.freezer !== false ? NIGHT.freezer : 0) +
    (plan.mica ? NIGHT.micaWarm : 0) +
    (plan.lights ? NIGHT.lights : 0) +
    (plan.comms ? NIGHT.comms : 0)
  );
}

export function budget(plan: NightPlan, leaks: number, days: number): { need: number; enough: boolean } {
  const need = days * perDay(plan, leaks);
  return { need, enough: need <= NIGHT.capacity };
}

/** Make the plan fit: lights off, then comms off; if still short with MICA kept, the sample freezer goes. */
export function resolveNight(plan: NightPlan, leaks: number, days: number): { plan: NightPlan; dataLost: boolean } {
  let p = { ...plan };
  if (budget(p, leaks, days).enough) return { plan: p, dataLost: false };
  p = { ...p, lights: false };
  if (budget(p, leaks, days).enough) return { plan: p, dataLost: false };
  p = { ...p, comms: false };
  if (budget(p, leaks, days).enough) return { plan: p, dataLost: false };
  // The freezer is a real load, so sacrificing a log must actually reduce demand.
  p = { ...p, freezer: false };
  return { plan: p, dataLost: true };
}
