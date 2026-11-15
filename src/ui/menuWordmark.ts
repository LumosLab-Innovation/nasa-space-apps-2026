import { Image } from '@babylonjs/gui/2D/controls/image';
import titleFontUrl from '../assets/barlow-condensed-extrabold-title.woff2?inline';

const logoUrl = `${import.meta.env.BASE_URL}branding/artemis-iv-logo-600-transparent.webp`;
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

export function createMenuLogo(name: string): Image {
  const logo = new Image(name, logoUrl);
  logo.stretch = Image.STRETCH_UNIFORM;
  logo.isHitTestVisible = false;
  return logo;
}
