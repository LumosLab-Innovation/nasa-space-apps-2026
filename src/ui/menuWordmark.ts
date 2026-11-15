import type { ICanvasRenderingContext } from '@babylonjs/core/Engines/ICanvas';
import titleFontUrl from '../assets/barlow-condensed-extrabold-title.woff2?inline';
import { menuLabel } from './menuControls';

const MAIN_TITLE = 'COMMON GROUND';
const FONT_NAME = 'Barlow Condensed';
let titleFamily: Promise<string> | undefined;

export function loadWordmarkFont(): Promise<string> {
  if (!titleFamily) {
    const face = new FontFace(FONT_NAME, `url(${JSON.stringify(titleFontUrl)})`, { weight: '800' });
    titleFamily = face.load().then(font => {
      document.fonts.add(font);
      return `"${FONT_NAME}", sans-serif`;
    }, () => '"Arial Black", system-ui, sans-serif');
  }
  return titleFamily;
}

export function createMenuWordmark(family: string) {
  const mission = menuLabel('ARTEMIS IV', 16, '#B8D3F6');
  const title = menuLabel(MAIN_TITLE);
  for (const line of [mission, title]) {
    line.fontFamily = family;
    line.fontWeight = '800';
    line.textWrapping = false;
    line.shadowColor = '#060D1D';
    line.shadowBlur = 12;
    line.shadowOffsetY = 2;
  }
  return {
    mission,
    title,
    fit(context: ICanvasRenderingContext, width: number, maxTitleSize: number) {
      context.save();
      context.font = `800 100px ${family}`;
      const textWidth = context.measureText(MAIN_TITLE).width;
      context.restore();
      const fitSize = Math.floor(100 * Math.max(1, width) / textWidth);
      const titleSize = Math.max(1, Math.min(maxTitleSize, fitSize));
      const missionSize = Math.round(titleSize * 0.57);
      title.fontSize = titleSize;
      mission.fontSize = missionSize;
      return { missionHeight: missionSize + 2, titleHeight: titleSize + 8 };
    },
  };
}
