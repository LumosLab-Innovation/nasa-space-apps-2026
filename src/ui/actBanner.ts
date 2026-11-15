import { Control, Rectangle, TextBlock, type AdvancedDynamicTexture } from '@babylonjs/gui';
import { gamePauseClock } from '../core/pause';

const FADE_IN_S = 0.6;
const FADE_OUT_S = 0.8;

/** Translucent lower-third title banner. Fades in 0.6 s / out 0.8 s on gameplay time; returns a dispose function. */
export function showActBanner(ui: AdvancedDynamicTexture, text: string, seconds = 5): () => void {
  const scene = ui.getScene();
  const band = new Rectangle('actBanner');
  band.width = ui.getSize().width < 700 ? '92%' : '640px';
  band.height = '150px';
  band.thickness = 0;
  band.cornerRadius = 10;
  band.background = 'rgba(6, 12, 26, 0.55)';
  band.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
  band.top = '-18%';
  band.alpha = 0;
  band.isHitTestVisible = false;
  band.zIndex = 90;
  const label = new TextBlock('actBannerText', text);
  label.color = 'white';
  label.fontSize = 28;
  label.textWrapping = true;
  band.addControl(label);
  ui.addControl(band);

  let t = 0;
  let done = false;
  const dispose = () => {
    if (done) return;
    done = true;
    obs && scene?.onBeforeRenderObservable.remove(obs);
    band.dispose();
  };
  const obs = scene?.onBeforeRenderObservable.add(() => {
    if (gamePauseClock.isPaused) return;
    t += scene.getEngine().getDeltaTime() / 1000;
    if (t >= seconds + FADE_OUT_S) { dispose(); return; }
    band.alpha = t < FADE_IN_S ? t / FADE_IN_S : t > seconds ? 1 - (t - seconds) / FADE_OUT_S : 1;
  });
  return dispose;
}
