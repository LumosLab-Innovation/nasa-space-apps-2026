import { Control, Rectangle, type AdvancedDynamicTexture } from '@babylonjs/gui';
import type { Resources } from '../survival/resources';
import { tr } from '../i18n/i18n';
import { HUD_MARGIN, HUD_NARROW, fitHud, hudMeter, hudNotice, hudStack, hudText } from './hudWidgets';
import { menuColors } from './menuControls';

/** Live suit and PIP readouts. The survival system owns the resource and rescue rules. */
export function createResourceHud(ui: AdvancedDynamicTexture) {
  const panel = hudStack('resources');
  panel.spacing = 7;
  panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
  panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
  fitHud(ui, panel, (width) => {
    const narrow = width <= HUD_NARROW;
    panel.width = narrow ? '186px' : '200px';
    panel.left = (narrow ? 12 : HUD_MARGIN) + 'px';
    panel.top = (narrow ? -66 : -HUD_MARGIN) + 'px';
  });
  ui.addControl(panel);

  const warning = hudNotice('resourceWarning');
  warning.height = '25px';
  warning.background = '#281C17F2';
  warning.color = '#FFAD64';
  warning.isVisible = false;
  const message = hudText('', 12, '#FFE1BA');
  message.paddingLeft = '6px';
  warning.addControl(message);
  panel.addControl(warning);

  const title = hudText(tr('Resources').toUpperCase(), 12, menuColors.ice);
  title.fontWeight = '700';
  title.height = '15px';
  panel.addControl(title);

  const entries = [
    { key: 'o2', name: 'Suit O2', tint: '#69D4EE' },
    { key: 'heat', name: 'Suit heat', tint: '#F4A66D' },
    { key: 'pip', name: 'PIP battery', tint: '#EFD06A' },
  ] as const;
  const bars = entries.map(({ name, tint }) => {
    const meter = hudMeter(name, tint);
    meter.update(1);
    panel.addControl(meter.control);
    return meter;
  });

  const veil = new Rectangle('rescueVeil');
  veil.background = 'black';
  veil.thickness = 0;
  veil.alpha = 0;
  veil.isHitTestVisible = false;
  ui.addControl(veil);

  return {
    update(resources: Resources) {
      title.text = tr('Resources').toUpperCase();
      entries.forEach(({ key }, index) => {
        bars[index].update(resources[key] / 100, resources[key] < 20);
      });
      const low = entries.reduce((lowest, entry) => resources[entry.key] < resources[lowest.key] ? entry : lowest);
      warning.isVisible = resources[low.key] < 20;
      if (warning.isVisible) {
        message.text = tr('{resource} low · {pct}%', { resource: tr(low.name), pct: Math.round(resources[low.key]) });
      }
    },
    setVisible(visible: boolean) {
      panel.isVisible = visible;
    },
    fade(alpha: number) {
      veil.alpha = alpha;
    },
  };
}
