import type { Engine } from '@babylonjs/core/Engines/engine';
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { Color4 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Scene } from '@babylonjs/core/scene';
import { AdvancedDynamicTexture } from '@babylonjs/gui/2D/advancedDynamicTexture';
import { Container } from '@babylonjs/gui/2D/controls/container';
import { Control } from '@babylonjs/gui/2D/controls/control';
import { Image } from '@babylonjs/gui/2D/controls/image';
import { LinearGradient } from '@babylonjs/gui/2D/controls/gradient/LinearGradient';
import { Rectangle } from '@babylonjs/gui/2D/controls/rectangle';
import moonUrl from '../assets/loading-moon.webp?no-inline';
import shipUrl from '../assets/loading-ship.png?no-inline';
import type { Music } from '../audio/musicEngine';
import { tr } from '../i18n/i18n';
import { MenuKeys, menuButton, menuColors, menuLabel, menuRule } from './menuControls';
import { createMenuLogo } from './menuWordmark';
import { ORBIT_ART_SIZE } from './orbitArt';

// Placement of the separately rendered ship layer in the shared orbit frame.
const SHIP_CROP = { left: 752, top: 299, width: 515, height: 211 };

export type LoadingProgress = (percent: number, message: string) => void;

export async function withLoadingScreen<T>(
  engine: Engine, music: Music, initial: string, load: (report: LoadingProgress) => Promise<T>,
): Promise<T | null> {
  const scene = new Scene(engine);
  scene.clearColor = Color4.FromHexString('#060D1DFF');
  scene.activeCamera = new FreeCamera('loadingCamera', Vector3.Zero(), scene);
  const ui = AdvancedDynamicTexture.CreateFullscreenUI('missionLoadingUI', true, scene);
  const art = new Image('loadingOrbit', moonUrl);
  const ship = new Image('loadingShip', shipUrl);
  for (const image of [art, ship]) {
    image.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    image.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    image.isHitTestVisible = false;
    ui.addControl(image);
  }
  const shade = menuRule(menuColors.space);
  ui.addControl(shade);

  const logo = createMenuLogo('loadingLogo');
  logo.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
  ui.addControl(logo);

  const footer = new Container('loadingFooter');
  footer.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
  footer.height = '86px';
  footer.isHitTestVisible = false;
  ui.addControl(footer);

  const message = menuLabel('', 14, '#D1DEF0');
  const number = menuLabel('', 17, menuColors.ice);
  number.fontFamily = 'Consolas, monospace';
  number.fontWeight = '700';
  number.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
  const track = new Rectangle('loadingTrack');
  track.thickness = 0;
  track.background = '#6D94C650';
  const fill = menuRule('#528FFF');
  fill.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
  track.addControl(fill);
  const buttons = new Container('loadingActions');
  buttons.isVisible = false;
  for (const control of [message, track, number, buttons]) {
    control.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    footer.addControl(control);
  }
  const place = (control: Control, top: number, height: number) => {
    control.top = top + 'px';
    control.height = height + 'px';
  };
  place(message, 0, 36);
  place(track, 43, 7);
  place(number, 53, 28);
  place(buttons, 41, 45);

  let shipLeft = 0;
  let shipTop = 0;
  let driftDistance = 0;
  const resize = () => {
    const size = ui.getSize();
    const wide = size.width >= 700 && size.width > size.height;
    const artScale = wide
      ? Math.max(size.width / ORBIT_ART_SIZE.width, size.height * 1.09 / ORBIT_ART_SIZE.height)
      : Math.max(size.width / ORBIT_ART_SIZE.width, Math.min(size.height / ORBIT_ART_SIZE.height, size.width / 420));
    const artWidth = Math.round(ORBIT_ART_SIZE.width * artScale);
    const artHeight = Math.round(ORBIT_ART_SIZE.height * artScale);
    const artLeft = Math.round((size.width - artWidth) * (wide ? 0.45 : 0.58));
    const artTop = size.height > size.width ? Math.round((size.height - artHeight) * 0.38) : 0;
    art.width = artWidth + 'px';
    art.height = artHeight + 'px';
    art.left = artLeft + 'px';
    art.top = artTop + 'px';
    const scaleX = artWidth / ORBIT_ART_SIZE.width;
    const scaleY = artHeight / ORBIT_ART_SIZE.height;
    ship.width = (SHIP_CROP.width * scaleX) + 'px';
    ship.height = (SHIP_CROP.height * scaleY) + 'px';
    shipLeft = artLeft + SHIP_CROP.left * scaleX;
    shipTop = artTop + SHIP_CROP.top * scaleY;
    driftDistance = Math.min(12, artWidth * 0.009);

    const fade = new LinearGradient(0, artTop, 0, artTop + artHeight);
    fade.addColorStop(0, artTop > 0 ? menuColors.space : '#060D1D30');
    fade.addColorStop(0.29, '#060D1D30');
    fade.addColorStop(0.45, '#060D1D42');
    fade.addColorStop(1, wide ? '#060D1DBF' : menuColors.space);
    shade.backgroundGradient = fade;

    const availableWidth = Math.max(1, size.width - 48);
    const logoSize = Math.min(availableWidth, 248, Math.round(size.height * 0.38));
    const logoTop = Math.min(32, Math.round(size.height * 0.03));
    logo.width = logoSize + 'px';
    place(logo, logoTop, logoSize);

    const bottom = Math.min(60, Math.max(14, Math.round(size.height * 0.055)));
    footer.width = Math.min(560, availableWidth) + 'px';
    footer.top = -bottom + 'px';
  };
  const resizeObserver = engine.onResizeObservable.add(resize);
  resize();

  // The canvas draws the UI. Keep progress readable by assistive technology as well.
  const canvas = engine.getRenderingCanvas();
  const status = document.createElement('div');
  status.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);';
  const accessibleProgress = document.createElement('progress');
  accessibleProgress.id = 'mission-load-progress';
  accessibleProgress.max = 100;
  accessibleProgress.setAttribute('aria-label', tr('Preparing the mission'));
  const liveMessage = document.createElement('span');
  liveMessage.setAttribute('role', 'status');
  status.append(accessibleProgress, liveMessage);
  document.body.append(status);
  canvas?.setAttribute('aria-busy', 'true');

  const report: LoadingProgress = (percent, text) => {
    fill.width = percent + '%';
    number.text = percent + '%';
    accessibleProgress.value = percent;
    message.text = text;
    if (liveMessage.textContent !== text) liveMessage.textContent = text;
  };
  let choose: ((retry: boolean) => void) | undefined;
  const retry = menuButton('retryLoading', tr('Retry'), () => choose?.(true), { tone: 'primary', centered: true });
  const back = menuButton('leaveLoading', tr('Main menu'), () => choose?.(false), { centered: true });
  retry.control.width = back.control.width = '48%';
  retry.control.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
  back.control.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
  buttons.addControl(retry.control);
  buttons.addControl(back.control);
  const keys = new MenuKeys(() => buttons.isVisible, () => choose?.(false));
  keys.setInputs([retry, back], undefined, false);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let driftTime = 0;
  const loop = () => {
    const dt = Math.min(engine.getDeltaTime() / 1000, 0.1);
    driftTime = reducedMotion.matches ? 0 : driftTime + dt;
    const phase = driftTime * (2 * Math.PI / 18);
    ship.left = (shipLeft + driftDistance * Math.sin(phase)) + 'px';
    ship.top = (shipTop - driftDistance * 0.35 * (1 - Math.cos(phase))) + 'px';
    music.update(dt);
    scene.render();
  };
  engine.runRenderLoop(loop);
  const draw = () => new Promise<void>((resolve) => {
    scene.onAfterRenderObservable.addOnce(() => resolve());
  });

  try {
    for (;;) {
      track.isVisible = number.isVisible = true;
      footer.isHitTestVisible = buttons.isVisible = false;
      canvas?.setAttribute('aria-busy', 'true');
      report(0, initial);
      await draw();
      try {
        const value = await load(report);
        report(100, tr('Mission ready'));
        await draw();
        return value;
      } catch (error) {
        console.warn('[mission] Loading failed', error);
        message.text = tr('Loading failed') + '\n' + tr('Please check your connection and try again.');
        liveMessage.textContent = message.text;
        track.isVisible = number.isVisible = false;
        footer.isHitTestVisible = buttons.isVisible = true;
        canvas?.removeAttribute('aria-busy');
        keys.focus('retryLoading');
        const again = await new Promise<boolean>((resolve) => { choose = resolve; });
        choose = undefined;
        if (!again) return null;
      }
    }
  } finally {
    keys.dispose();
    engine.onResizeObservable.remove(resizeObserver);
    engine.stopRenderLoop(loop);
    scene.dispose();
    canvas?.removeAttribute('aria-busy');
    status.remove();
  }
}
