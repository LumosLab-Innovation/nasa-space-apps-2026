import { Control, Ellipse, Image, Rectangle, TextBlock, type AdvancedDynamicTexture } from '@babylonjs/gui';
import type { GameState } from '../core/gameState';
import { sampleHeight, type Heightmap } from '../data/heightmap';
import { ZONES } from '../world/zones';
import { fitHud } from './hudWidgets';
import { tr } from '../i18n/i18n';

const SIZE = 360;
const RES = 180;
const BOUNDS = { left: -320, right: 320, south: -650, north: -40 };
const centerX = (BOUNDS.left + BOUNDS.right) / 2;
const centerZ = (BOUNDS.south + BOUNDS.north) / 2;

/** Grey hillshade of the real terrain, drawn once into a data URL. */
function hillshade(hm: Heightmap): string {
  const c = document.createElement('canvas');
  c.width = RES;
  c.height = RES;
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(RES, RES);
  const step = (BOUNDS.right - BOUNDS.left) / RES;
  for (let j = 0; j < RES; j++) {
    for (let i = 0; i < RES; i++) {
      const x = BOUNDS.left + (i / RES) * (BOUNDS.right - BOUNDS.left);
      const z = BOUNDS.north - (j / RES) * (BOUNDS.north - BOUNDS.south); // north up
      const dx = sampleHeight(hm, x + step, z) - sampleHeight(hm, x - step, z);
      const dz = sampleHeight(hm, x, z + step) - sampleHeight(hm, x, z - step);
      const shade = Math.max(0, Math.min(1, 0.55 - (dx - dz) / (4 * step)));
      const v = Math.round(40 + shade * 170);
      const o = (j * RES + i) * 4;
      img.data[o] = img.data[o + 1] = img.data[o + 2] = v;
      img.data[o + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c.toDataURL();
}

/** Map (M), unlocked by the aligned relay: real terrain, the player, Pip and every stop already found. */
export function createMapView(ui: AdvancedDynamicTexture, hm: Heightmap): {
  toggle(): void;
  update(player: { x: number; z: number }, pip: { x: number; z: number }, state: GameState): void;
  readonly open: boolean;
} {
  const frame = new Rectangle('mapFrame');
  frame.width = `${SIZE + 8}px`;
  frame.height = `${SIZE + 220}px`;
  frame.thickness = 2;
  frame.color = '#ffb070';
  frame.background = 'rgba(0,0,0,0.85)';
  frame.isVisible = false;
  frame.zIndex = 55;
  ui.addControl(frame);
  fitHud(ui, frame, (width, height) => { frame.scaleX = frame.scaleY = Math.min(1, (width - 24) / (SIZE + 8), (height - 120) / (SIZE + 220)); });
  const title = new TextBlock('mapTitle', tr('MAP · real LOLA terrain · north up'));
  title.color = '#ffb070';
  title.fontSize = 14;
  title.height = '24px';
  title.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
  frame.addControl(title);
  let img: Image | null = null;
  const toPx = (p: { x: number; z: number }) => ({ left: ((p.x - centerX) / (BOUNDS.right - BOUNDS.left)) * SIZE, top: (-(p.z - centerZ) / (BOUNDS.north - BOUNDS.south)) * SIZE - 80 });
  const dot = (color: string, r: number) => {
    const e = new Ellipse();
    e.width = e.height = `${r}px`;
    e.background = color;
    e.thickness = 0;
    frame.addControl(e);
    return e;
  };
  const stops = ZONES.map((z, i) => {
    const e = dot('#ff9a3a', 9);
    const label = new TextBlock(`map-${z.id}`, String(i + 1));
    label.color = '#ffd9b0';
    label.fontSize = 14;
    label.width = '22px'; label.height = '22px';
    frame.addControl(label);
    const p = toPx(z);
    e.left = `${p.left}px`;
    e.top = `${p.top}px`;
    label.left = `${p.left}px`;
    label.top = `${p.top + 11}px`;
    return { id: z.id, e, label };
  });
  const legend = new TextBlock('mapLegend');
  legend.color = '#e8eef5'; legend.fontSize = 14; legend.height = '175px'; legend.width = '330px';
  legend.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM; legend.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
  frame.addControl(legend);
  const pipDot = dot('#5fe3ff', 8);
  const meDot = dot('#ffffff', 10);

  return {
    get open() {
      return frame.isVisible;
    },
    toggle() {
      frame.isVisible = !frame.isVisible;
      if (frame.isVisible && !img) {
        img = new Image('mapImage', hillshade(hm));
        img.width = img.height = `${SIZE}px`;
        img.top = '-80px';
        frame.addControl(img);
        // Keep markers above the image.
        for (const s of stops) {
          frame.removeControl(s.e);
          frame.addControl(s.e);
          frame.removeControl(s.label);
          frame.addControl(s.label);
        }
        frame.removeControl(pipDot);
        frame.addControl(pipDot);
        frame.removeControl(meDot);
        frame.addControl(meDot);
      }
    },
    update(player, pip, state) {
      if (!frame.isVisible) return;
      for (const s of stops) {
        const found = state.flags.has(`stop:${s.id}`);
        s.e.isVisible = found;
        s.label.isVisible = found;
      }
      legend.text = ZONES.map((z, i) => state.flags.has(`stop:${z.id}`) ? `${i + 1}  ${tr(z.name)}` : `${i + 1}  ?`).join('\n');
      const a = toPx(player);
      meDot.left = `${a.left}px`;
      meDot.top = `${a.top}px`;
      const b = toPx(pip);
      pipDot.left = `${b.left}px`;
      pipDot.top = `${b.top}px`;
    },
  };
}
