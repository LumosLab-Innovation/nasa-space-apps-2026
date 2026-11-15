/**
 * Pip's face screen artwork, drawn with Canvas 2D so it needs no image files.
 * Style (user decision 06/11): chibi and minimal. Two big solid eyes set low and wide with a single
 * highlight, a tiny mouth tucked under them, soft blush. No brows: each mood changes only eye and mouth shapes.
 * Animated by blink, gaze, talk and time.
 */
export type PipExpression =
  | 'happy' | 'curious' | 'worried' | 'sad' | 'dots' | 'sleep'
  | 'excited' | 'laugh' | 'proud' | 'scared' | 'love' | 'dizzy';

export const PIP_EXPRESSIONS: PipExpression[] = [
  'happy', 'curious', 'worried', 'sad', 'dots', 'sleep', 'excited', 'laugh', 'proud', 'scared', 'love', 'dizzy',
];

export interface FaceState {
  expression: PipExpression;
  /** 0 = open, 1 = fully closed (blink). */
  blink: number;
  /** Gaze offset, each in [-1, 1]. */
  lookX: number;
  lookY: number;
  /** 0..1 mouth opening while speaking. */
  talk: number;
  /** Seconds, drives bounce/sparkle/spin. */
  t: number;
}

const INK = '#7fe9ff';
const BG = '#05090e';
const BLUSH = 'rgba(255,140,180,0.45)';
const PINK = '#ff8fc0';
const SHINE = '#ffffff';

/** Draws the face into a w×h canvas area (designed for 2:1). */
export function drawPipFace(ctx: CanvasRenderingContext2D, w: number, h: number, s: FaceState): void {
  const u = h / 128; // design units: 256×128
  ctx.save();
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, w, h);
  ctx.scale(u, u);
  ctx.translate((w / u - 256) / 2, 0);
  // Features fill the screen so the face still reads from the third-person camera a few metres away.
  ctx.translate(128, 70);
  ctx.scale(1.3, 1.3);
  ctx.translate(-128, -70);
  ctx.shadowColor = INK;
  ctx.shadowBlur = 6;
  ctx.strokeStyle = INK;
  ctx.fillStyle = INK;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const e = s.expression;
  const L = 90;
  const R = 166;
  let Y = 62;
  const MY = 92;
  const gx = s.lookX * 6;
  const gy = s.lookY * 4;
  if (e === 'happy' || e === 'excited' || e === 'love') Y += Math.sin(s.t * 3) * 1.2; // gentle bounce
  if (e === 'laugh') Y += Math.sin(s.t * 16) * 2;
  if (e === 'scared') ctx.translate(Math.sin(s.t * 40) * 1.2, 0);
  const open = 1 - Math.min(1, Math.max(0, s.blink)) * 0.9;
  const talking = s.talk > 0.1;

  const path = (fn: () => void, mode: 'fill' | 'stroke', lw = 6) => {
    ctx.lineWidth = lw;
    ctx.beginPath();
    fn();
    if (mode === 'fill') ctx.fill();
    else ctx.stroke();
  };

  /** The signature chibi eye: a big solid oval with one bright highlight. */
  const eye = (x: number, rx = 15, ry = 20, shine = 1) => {
    const ex = x + gx;
    const ey = Y + gy;
    const r = Math.max(1.5, ry * open);
    path(() => ctx.ellipse(ex, ey, rx, r, 0, 0, Math.PI * 2), 'fill');
    if (open > 0.5 && shine > 0) {
      ctx.save();
      ctx.shadowBlur = 0;
      ctx.fillStyle = SHINE;
      path(() => ctx.arc(ex + rx * 0.35, ey - r * 0.4, rx * 0.3, 0, Math.PI * 2), 'fill');
      if (shine > 1) path(() => ctx.arc(ex - rx * 0.3, ey + r * 0.35, rx * 0.14, 0, Math.PI * 2), 'fill');
      ctx.restore();
    }
  };
  /** ^ shaped (closed happy) or ∪ shaped (closed content/sad) eye. */
  const curveEye = (x: number, upward: boolean) =>
    path(() => (upward ? ctx.arc(x, Y + 8, 14, Math.PI * 1.15, Math.PI * 1.85) : ctx.arc(x, Y - 6, 14, Math.PI * 0.15, Math.PI * 0.85)), 'stroke', 7);
  const blush = () => {
    ctx.save();
    ctx.shadowBlur = 0;
    ctx.fillStyle = BLUSH;
    path(() => ctx.ellipse(L - 30, MY - 4, 12, 6, 0, 0, Math.PI * 2), 'fill');
    path(() => ctx.ellipse(R + 30, MY - 4, 12, 6, 0, 0, Math.PI * 2), 'fill');
    ctx.restore();
  };
  /** Tiny mouths: they all stay small; talking opens a little oval. */
  const mouth = (kind: 'smile' | 'cat' | 'o' | 'frown' | 'flat' | 'wave' | 'open' | 'smirk') => {
    if (talking && kind !== 'open') {
      path(() => ctx.ellipse(128, MY, 6, 2 + s.talk * 5, 0, 0, Math.PI * 2), 'fill');
      return;
    }
    switch (kind) {
      case 'smile':
        path(() => ctx.arc(128, MY - 5, 8, Math.PI * 0.2, Math.PI * 0.8), 'stroke', 5);
        break;
      case 'cat': // ω
        path(() => {
          ctx.arc(122, MY - 3, 6, Math.PI * 0.1, Math.PI * 0.9);
          ctx.moveTo(140, MY - 3);
          ctx.arc(134, MY - 3, 6, Math.PI * 0.1, Math.PI * 0.9);
        }, 'stroke', 4.5);
        break;
      case 'o':
        path(() => ctx.ellipse(128, MY, 4, 5, 0, 0, Math.PI * 2), 'stroke', 4);
        break;
      case 'frown':
        path(() => ctx.arc(128, MY + 6, 7, Math.PI * 1.2, Math.PI * 1.8), 'stroke', 5);
        break;
      case 'flat':
        path(() => {
          ctx.moveTo(122, MY);
          ctx.lineTo(134, MY);
        }, 'stroke', 5);
        break;
      case 'wave':
        path(() => {
          for (let x = 118; x <= 138; x += 2) ctx.lineTo(x, MY + Math.sin((x - 118) * 0.6 + s.t * 5) * 2);
        }, 'stroke', 4);
        break;
      case 'open':
        path(() => {
          ctx.moveTo(118, MY - 4);
          ctx.lineTo(138, MY - 4);
          ctx.quadraticCurveTo(128, MY + 10 + s.talk * 3, 118, MY - 4);
        }, 'fill');
        break;
      case 'smirk':
        path(() => {
          ctx.moveTo(120, MY);
          ctx.quadraticCurveTo(130, MY + 3, 138, MY - 4);
        }, 'stroke', 5);
        break;
    }
  };
  const drop = (x: number, y: number) => {
    ctx.save();
    ctx.globalAlpha = 0.75;
    path(() => {
      ctx.moveTo(x, y - 7);
      ctx.quadraticCurveTo(x + 5, y + 2, x, y + 4);
      ctx.quadraticCurveTo(x - 5, y + 2, x, y - 7);
    }, 'fill');
    ctx.restore();
  };
  const heart = (cx: number, cy: number, r: number) =>
    path(() => {
      ctx.moveTo(cx, cy + r * 0.9);
      ctx.bezierCurveTo(cx - r * 1.4, cy - r * 0.2, cx - r * 0.6, cy - r * 1.3, cx, cy - r * 0.45);
      ctx.bezierCurveTo(cx + r * 0.6, cy - r * 1.3, cx + r * 1.4, cy - r * 0.2, cx, cy + r * 0.9);
    }, 'fill');
  const sparkle = (cx: number, cy: number, r: number) =>
    path(() => {
      ctx.moveTo(cx, cy - r);
      ctx.quadraticCurveTo(cx, cy, cx + r, cy);
      ctx.quadraticCurveTo(cx, cy, cx, cy + r);
      ctx.quadraticCurveTo(cx, cy, cx - r, cy);
      ctx.quadraticCurveTo(cx, cy, cx, cy - r);
    }, 'fill');

  switch (e) {
    case 'happy':
      curveEye(L, true);
      curveEye(R, true);
      blush();
      mouth('cat');
      break;
    case 'curious':
      eye(L, 16, 22);
      eye(R, 12, 16);
      mouth('o');
      break;
    case 'worried':
      eye(L, 13, 17);
      eye(R, 13, 17);
      mouth('wave');
      drop(R + 26, Y - 14 + ((s.t * 6) % 8));
      break;
    case 'sad':
      curveEye(L, false);
      curveEye(R, false);
      mouth('frown');
      ctx.save();
      ctx.globalAlpha = 0.5 + 0.5 * Math.sin(s.t * 2);
      drop(L - 4, Y + 14 + ((s.t * 10) % 16));
      ctx.restore();
      break;
    case 'dots':
      path(() => ctx.arc(L + gx * 0.5, Y, 4, 0, Math.PI * 2), 'fill');
      path(() => ctx.arc(R + gx * 0.5, Y, 4, 0, Math.PI * 2), 'fill');
      break;
    case 'sleep':
      curveEye(L, false);
      curveEye(R, false);
      blush();
      mouth('flat');
      ctx.font = 'bold 16px sans-serif';
      ctx.globalAlpha = 0.35 + 0.65 * ((s.t * 0.6) % 1);
      ctx.fillText('z', 196, 52 - ((s.t * 8) % 12));
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('z', 208, 40 - ((s.t * 6) % 8));
      ctx.globalAlpha = 1;
      break;
    case 'excited':
      eye(L, 17, 22, 2);
      eye(R, 17, 22, 2);
      blush();
      mouth('open');
      ctx.save();
      ctx.globalAlpha = 0.5 + 0.5 * Math.sin(s.t * 6);
      sparkle(L - 26, Y - 22, 6);
      sparkle(R + 28, Y - 18, 5);
      ctx.restore();
      break;
    case 'laugh':
      path(() => {
        ctx.moveTo(L - 12, Y - 8);
        ctx.lineTo(L + 6, Y);
        ctx.lineTo(L - 12, Y + 8);
        ctx.moveTo(R + 12, Y - 8);
        ctx.lineTo(R - 6, Y);
        ctx.lineTo(R + 12, Y + 8);
      }, 'stroke', 7);
      blush();
      mouth('open');
      break;
    case 'proud':
      path(() => {
        ctx.moveTo(L - 13, Y + 2);
        ctx.lineTo(L + 13, Y + 2);
        ctx.moveTo(R - 13, Y + 2);
        ctx.lineTo(R + 13, Y + 2);
      }, 'stroke', 7);
      blush();
      mouth('smirk');
      break;
    case 'scared':
      path(() => ctx.ellipse(L + gx, Y + gy, 13, 17 * open + 1, 0, 0, Math.PI * 2), 'stroke', 5);
      path(() => ctx.ellipse(R + gx, Y + gy, 13, 17 * open + 1, 0, 0, Math.PI * 2), 'stroke', 5);
      path(() => ctx.arc(L + gx, Y + gy, 3.5, 0, Math.PI * 2), 'fill');
      path(() => ctx.arc(R + gx, Y + gy, 3.5, 0, Math.PI * 2), 'fill');
      mouth('o');
      drop(R + 28, Y - 16);
      break;
    case 'love': {
      const beat = 1 + Math.max(0, Math.sin(s.t * 7)) * 0.15;
      ctx.save();
      ctx.fillStyle = PINK;
      ctx.shadowColor = PINK;
      heart(L, Y, 16 * beat);
      heart(R, Y, 16 * beat);
      ctx.restore();
      blush();
      mouth('smile');
      break;
    }
    case 'dizzy':
      for (const [cx, dir] of [[L, 1], [R, -1]] as const) {
        path(() => {
          for (let a = 0; a < Math.PI * 4; a += 0.25) {
            const r = 1.5 + a * 1.2;
            ctx.lineTo(cx + Math.cos(a * dir + s.t * 5 * dir) * r, Y + Math.sin(a * dir + s.t * 5 * dir) * r);
          }
        }, 'stroke', 3.5);
      }
      mouth('wave');
      break;
  }
  ctx.restore();
}

/** Natural blink: closed for ~0.12 s every 2.5–5 s. Pure, so it can be tested. */
export function blinkAmount(t: number, seed = 0): number {
  const period = 2.5 + ((((Math.sin(seed * 12.9898) * 43758.5453) % 1) + 1) % 1) * 2.5;
  const phase = t % period;
  const d = 0.12;
  if (phase > d) return 0;
  return Math.sin((phase / d) * Math.PI);
}
