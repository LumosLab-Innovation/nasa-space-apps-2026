import { sampleAt, type Ephemeris } from '../data/ephemeris';
import type { Heightmap } from '../data/heightmap';
import type { CampNight } from '../data/night';
import { horizonElevationDeg } from '../world/lighting';
import { tr } from '../i18n/i18n';

/**
 * "Where will the Sun rise?" (v2 scene 5.2, puzzle 3). The Sun creeps ~12°/day toward lower azimuths at an
 * almost constant height (~0.5–0.65°); it comes back where the real LOLA horizon first drops below that
 * height. Everything here is real data: the heightmap profile and the JPL Sun path.
 */
export interface AzEl {
  az: number;
  el: number;
}

/** Terrain horizon seen from `at` (eye 0.5 m, as isSunlit), one ray-march per degree. Compute once. */
export function horizonProfile(hm: Heightmap, at: { x: number; z: number }, fromAz = 85, toAz = 175, stepDeg = 1): AzEl[] {
  const out: AzEl[] = [];
  for (let az = fromAz; az <= toAz + 1e-9; az += stepDeg) out.push({ az, el: horizonElevationDeg(hm, at.x, at.z, az, 0.5) });
  return out;
}

/** The Sun every `stepH` hours from half a day before the sunset to half a day after the dawn. */
export function sunPath(e: Ephemeris, night: CampNight, stepH = 6): (AzEl & { t: number })[] {
  const out: (AzEl & { t: number })[] = [];
  const end = night.dawnMs + 12 * 3600_000;
  for (let t = night.sunsetMs - 12 * 3600_000; t <= end; t += stepH * 3600_000) out.push({ t, ...sampleAt(e.sun, t) });
  return out;
}

/**
 * Four choices in the order the Sun passes them (azimuth decreasing): where it set (it will not come back
 * there), the hilltop (the worst place), the real notch, and the deepest dip further on (tempting, but the
 * Sun reaches the real notch first).
 */
export function notchCandidates(profile: AzEl[], night: CampNight): { azDeg: number[]; correct: number } {
  const between = profile.filter((p) => p.az < night.sunsetAzDeg && p.az > night.dawnAzDeg);
  const hill = between.reduce((a, b) => (b.el > a.el ? b : a), between[0] ?? { az: (night.sunsetAzDeg + night.dawnAzDeg) / 2, el: 0 });
  const beyond = profile.filter((p) => p.az < night.dawnAzDeg - 8);
  const dip = beyond.reduce((a, b) => (b.el < a.el ? b : a), beyond[0] ?? { az: night.dawnAzDeg - 20, el: 0 });
  const round = (x: number) => Math.round(x);
  const list = [
    { az: round(night.sunsetAzDeg), right: false },
    { az: round(hill.az), right: false },
    { az: round(night.dawnAzDeg), right: true },
    { az: round(dip.az), right: false },
  ].sort((a, b) => b.az - a.az);
  return { azDeg: list.map((x) => x.az), correct: list.findIndex((x) => x.right) };
}

/**
 * Body yaw (rad, 0 = +z) that turns one of Pip's side panels straight at `azDeg`: the right-hand panel
 * faces (cos yaw, −sin yaw) in (x, z), so yaw = az − 90°.
 */
export function parkYawForSunAz(azDeg: number): number {
  return ((azDeg - 90) * Math.PI) / 180;
}

/**
 * The horizon panel: grey hill silhouette on black, the Sun's path so far (filled when above the hill,
 * hollow when hidden), an arrow for where it is heading, and the four lettered choices.
 */
export function drawHorizon(
  ctx: CanvasRenderingContext2D, w: number, h: number, profile: AzEl[], path: (AzEl & { t: number })[], nowMs: number, candidates: number[],
): void {
  const az0 = profile[profile.length - 1].az; // left edge = high azimuth (the Sun moves left → right)
  const az1 = profile[0].az;
  const elMin = -1;
  const elMax = 2;
  const X = (az: number) => ((az0 - az) / (az0 - az1)) * w;
  const Y = (el: number) => h - 40 - ((el - elMin) / (elMax - elMin)) * (h - 70);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, w, h);
  // hill silhouette
  ctx.fillStyle = '#4a4a4e';
  ctx.beginPath();
  ctx.moveTo(0, h - 40);
  for (const p of [...profile].reverse()) ctx.lineTo(X(p.az), Y(p.el));
  ctx.lineTo(w, h - 40);
  ctx.closePath();
  ctx.fill();
  // azimuth ticks
  ctx.fillStyle = '#9fb2c8';
  ctx.font = '12px system-ui';
  for (let az = Math.ceil(az1 / 10) * 10; az <= az0; az += 10) {
    ctx.fillRect(X(az), h - 40, 1, 6);
    ctx.fillText(`${az}°`, X(az) - 10, h - 22);
  }
  // Sun path up to now
  const horizonAt = (az: number) => {
    let best = profile[0];
    for (const p of profile) if (Math.abs(p.az - az) < Math.abs(best.az - az)) best = p;
    return best.el;
  };
  for (const s of path) {
    if (s.t > nowMs || s.az > az0 || s.az < az1) continue;
    const up = s.el > horizonAt(s.az);
    ctx.beginPath();
    ctx.arc(X(s.az), Y(s.el), 5, 0, Math.PI * 2);
    if (up) {
      ctx.fillStyle = '#fff6d8';
      ctx.fill();
    } else {
      ctx.strokeStyle = '#fff6d8';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }
  const last = [...path].reverse().find((s) => s.t <= nowMs);
  if (last) {
    ctx.strokeStyle = '#ffb060';
    ctx.fillStyle = '#ffb060';
    const x = X(last.az);
    const y = Y(last.el) - 18;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 60, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + 60, y - 5);
    ctx.lineTo(x + 68, y);
    ctx.lineTo(x + 60, y + 5);
    ctx.fill();
    ctx.font = '13px system-ui';
    ctx.fillText(tr('Sun ≈12°/day'), x + 4, y - 8);
  }
  // choices
  const letters = ['A', 'B', 'C', 'D'];
  candidates.forEach((az, i) => {
    const x = X(az);
    ctx.strokeStyle = '#ffd27a';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(x, 18);
    ctx.lineTo(x, Y(horizonAt(az)));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#ffd27a';
    ctx.font = 'bold 16px system-ui';
    ctx.fillText(`${i + 1} ${letters[i]}`, x - 10, 14);
  });
}
