import { Control } from '@babylonjs/gui/2D/controls/control';
import { Image } from '@babylonjs/gui/2D/controls/image';
import orbitArtUrl from '../assets/menu-orbit.webp?no-inline';

// Menu and loading layers share a frame captured from the orbital scene.
export const ORBIT_ART_SIZE = { width: 1470, height: 720 };

export function createOrbitArt(name: string): Image {
  const art = new Image(name, orbitArtUrl);
  art.stretch = Image.STRETCH_FILL;
  art.isHitTestVisible = false;
  art.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
  return art;
}
