import { getLang } from '../i18n/i18n';

/** Words for real times and directions in the story (Plan 4 minors: no hard-coded dates or "north hill"). */

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const POINTS = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'];
const POINTS_VI = ['bắc', 'đông bắc', 'đông', 'đông nam', 'nam', 'tây nam', 'tây', 'tây bắc'];
const H = 3600_000;

/** Eight-point compass word for an azimuth (0° = north, 90° = east). */
export function compass(azDeg: number): string {
  const a = ((azDeg % 360) + 360) % 360;
  return (getLang() === 'vi' ? POINTS_VI : POINTS)[Math.round(a / 45) % 8];
}

const NUM = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const NUM_VI = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín', 'mười'];

/** A night length in words, to the nearest half day: 86 h → "three and a half days". */
export function daysText(hours: number): string {
  const halves = Math.max(1, Math.round(hours / 12));
  const whole = Math.floor(halves / 2);
  const half = halves % 2 === 1;
  if (getLang() === 'vi') {
    if (whole === 0) return 'nửa ngày';
    return `${NUM_VI[whole] ?? String(whole)} ngày${half ? ' rưỡi' : ''}`;
  }
  const w = NUM[whole] ?? String(whole);
  if (whole === 0) return 'half a day';
  return half ? `${w} and a half days` : `${w} day${whole === 1 ? '' : 's'}`;
}

/** "29 November 2028" (UTC, like the rest of the game's clock). */
export function formatDay(ms: number): string {
  const d = new Date(ms);
  if (getLang() === 'vi') return `${d.getUTCDate()} tháng ${d.getUTCMonth() + 1} năm ${d.getUTCFullYear()}`;
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/**
 * While MICA's data waits to be sent, story time holds one hour before Earth sets, so "Earth sets in N h"
 * never runs out under a player who wanders off (story first).
 */
export function sendClock(nowMs: number, earthSetMs: number): number {
  return Math.min(nowMs, earthSetMs - H);
}
