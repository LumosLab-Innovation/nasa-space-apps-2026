import { pipKnown } from '../story/pipMeeting';

/**
 * Pip only helps after the player has met it (Plan 7 story): before that nobody has ever heard it, so no LIDAR
 * scan and no anorthosite lecture over the radio. Pure rules for scienceSystem.ts.
 */
export const pipCanScan = (flags: Set<string>): boolean => pipKnown(flags);

/** The dialogue to play after bagging a sample, or null. */
export function firstSampleLine(id: string, flags: Set<string>): 'firstSample' | null {
  return id === 'anorthosite' && pipKnown(flags) ? 'firstSample' : null;
}
