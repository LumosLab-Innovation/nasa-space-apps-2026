import type { Scene } from '@babylonjs/core/scene';
import { Control } from '@babylonjs/gui/2D/controls/control';
import { LinearGradient } from '@babylonjs/gui/2D/controls/gradient/LinearGradient';
import type { Button } from '@babylonjs/gui/2D/controls/button';
import { menuRule } from './menuControls';

export function addTitleButtonHover(button: Button, scene: Scene): void {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const shine = menuRule('transparent');
  shine.width = '29%';
  shine.height = '190%';
  shine.rotation = 0.38;
  shine.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
  shine.isVisible = false;
  button.clipChildren = true;
  button.transformCenterX = 0;
  button.addControl(shine);

  shine.onBeforeDrawObservable.add(() => {
    const left = shine.centerX - shine.widthInPixels / 2;
    const right = shine.centerX + shine.widthInPixels / 2;
    const band = new LinearGradient(left, 0, right, 0);
    band.addColorStop(0, '#FFFFFF00');
    band.addColorStop(0.5, '#E0EFFF44');
    band.addColorStop(1, '#FFFFFF00');
    shine.backgroundGradient = band;
  });

  let hovered = false;
  let sweep = 1;
  button.pointerEnterAnimation = () => {
    hovered = true;
    sweep = reducedMotion.matches ? 1 : 0;
  };
  button.pointerOutAnimation = () => {
    hovered = false;
    sweep = 1;
  };
  button.pointerDownAnimation = () => { button.alpha = 0.9; };
  button.pointerUpAnimation = () => { button.alpha = 1; };
  const observer = scene.onBeforeRenderObservable.add(() => {
    const dt = Math.min(scene.getEngine().getDeltaTime(), 50);
    const target = hovered && !reducedMotion.matches ? 1.03 : 1;
    const scale = button.scaleX + (target - button.scaleX) * Math.min(dt / 80, 1);
    const rounded = Math.abs(scale - target) < 0.001 ? target : scale;
    button.scaleX = button.scaleY = rounded;
    if (sweep < 1) sweep = Math.min(1, sweep + dt / 460);
    shine.isVisible = sweep < 1 && !reducedMotion.matches;
    if (shine.isVisible) shine.left = (-0.42 + 1.57 * sweep) * button.widthInPixels + 'px';
  });
  button.onDisposeObservable.addOnce(() => scene.onBeforeRenderObservable.remove(observer));
}
