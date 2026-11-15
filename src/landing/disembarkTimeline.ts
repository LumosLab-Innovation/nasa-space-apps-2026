/** Pure timeline + camera path for the post-landing elevator disembark (no Babylon). */
export type Vec3 = [number, number, number];
export type CamPose = { alpha: number; beta: number; radius: number; target: [number, number, number] };
export type DisembarkStage = 'deploying' | 'riding' | 'arrived' | 'stepped' | 'done';

export const DISEMBARK = { appearAt: 0.30, cameraMoveS: 3.5, presentFallbackS: 20, stepOffM: 1.2 };

const CAMERA_MOVE_START_S = 1;
const OFFSET_RAD = (55 * Math.PI) / 180;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const smooth = (x: number) => { const t = clamp01(x); return t * t * (3 - 2 * t); };
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpAngle = (a: number, b: number, t: number) => {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  else if (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
};

export function stageFor(s: { elevator: number; deployed: boolean; gate: number; steppedOff: boolean; sinceHandOver: number }): DisembarkStage {
  if (s.elevator < DISEMBARK.appearAt) return 'deploying';
  if (!(s.deployed && s.gate >= 1)) return 'riding';
  if (s.steppedOff || s.sinceHandOver >= DISEMBARK.presentFallbackS) return 'stepped';
  return 'arrived';
}

/** Camera alpha for a camera standing in front/side of something facing outwardYaw (yaw 0 = +Z). */
function outwardAlpha(outwardYaw: number): number {
  const a = outwardYaw + OFFSET_RAD;
  return Math.atan2(Math.cos(a), Math.sin(a));
}

export function sidePose(carTop: Vec3, outwardYaw: number): CamPose {
  return { alpha: outwardAlpha(outwardYaw), beta: 1.32, radius: 22, target: [carTop[0], carTop[1], carTop[2]] };
}

export function endPose(carFloor: Vec3, outwardYaw: number, _hullCentre: Vec3): CamPose {
  return { alpha: outwardAlpha(outwardYaw), beta: 1.25, radius: 7, target: [carFloor[0], carFloor[1] + 0.8, carFloor[2]] };
}

function blend(a: CamPose, b: CamPose, t: number): CamPose {
  return {
    alpha: lerpAngle(a.alpha, b.alpha, t),
    beta: lerp(a.beta, b.beta, t),
    radius: lerp(a.radius, b.radius, t),
    target: [lerp(a.target[0], b.target[0], t), lerp(a.target[1], b.target[1], t), lerp(a.target[2], b.target[2], t)],
  };
}

/** `descend` is already eased by the elevator lower stage (quintic); smoothing it again spikes radius speed, so it is applied linearly. */
export function cameraAt(poses: { from: CamPose; side: CamPose; end: CamPose }, move: number, descend: number): CamPose {
  return blend(blend(poses.from, poses.side, smooth(move)), poses.end, clamp01(descend));
}

/** Linear 0..1 progress of the camera move; easing is applied in cameraAt. */
export function moveProgress(sinceTouchdown: number, reduced: boolean): number {
  const dur = reduced ? DISEMBARK.cameraMoveS / 2 : DISEMBARK.cameraMoveS;
  return clamp01((sinceTouchdown - CAMERA_MOVE_START_S) / dur);
}
