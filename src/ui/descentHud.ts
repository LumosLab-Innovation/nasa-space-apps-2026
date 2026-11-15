import { Container, Control, Grid, type AdvancedDynamicTexture } from '@babylonjs/gui';
import { tr } from '../i18n/i18n';
import type { DialogueBox } from './dialogueBox';
import { HUD_MARGIN, HUD_NARROW, fitHud, hudHeading, hudMeter, hudMetric, hudNotice, hudNumber, hudPair, hudStack, hudText, placeTopReadouts, SlantedBar } from './hudWidgets';
import { menuColors, menuRule } from './menuControls';

/** Speed gauge of the braking burn: the needle shows v / (band centre), from 0.6 to 1.4. */
const GAUGE_LO = 0.6;
const GAUGE_HI = 1.4;

export interface BrakeReadout { v: number; h: number; fuelKg: number; fuelMaxKg: number; throttle: number; centre: number; band: number; warp: number; assist: boolean; guidance?: boolean }
export interface LandReadout { h: number; vy: number; vx: number; tiltDeg: number; fuelKg: number; fuelMaxKg: number; throttle: number; autopilot: boolean; guidance?: boolean }

export interface DescentHud {
  showBrake(r: BrakeReadout): void;
  showLand(r: LandReadout): void;
  alarm(text: string | null): void;
  dispose(): void;
}

/** Where the needle sits on the gauge (0..1) for a speed ratio v / centre. */
export function gaugeX(ratio: number): number {
  return Math.min(1, Math.max(0, (ratio - GAUGE_LO) / (GAUGE_HI - GAUGE_LO)));
}

/** Live readouts for braking in orbit and final descent. */
export function createDescentHud(ui: AdvancedDynamicTexture, dialogue: DialogueBox): DescentHud {
  const panel = hudStack('descentHud');
  panel.spacing = 5;
  panel.isVisible = false;
  placeTopReadouts(ui, panel, 326);

  const heading = hudHeading();
  panel.addControl(heading.control);
  const first = hudMetric();
  const second = hudMetric();
  const drift = hudMetric(true);
  const tilt = hudMetric(true);
  panel.addControl(hudPair(first.control, second.control, 48));
  const lateral = hudPair(drift.control, tilt.control, 41);
  panel.addControl(lateral);

  const fuel = hudMeter('Fuel', '#73A8FF');
  const thrust = hudMeter('Thrust', '#80D3E8');
  panel.addControl(hudPair(fuel.control, thrust.control, 26));

  const gauge = hudStack('brakeGauge');
  gauge.spacing = 4;
  const divider = menuRule('#39577F80');
  divider.height = '1px';
  gauge.addControl(divider);
  const caption = hudText('', 11, menuColors.muted);
  caption.height = '19px';
  gauge.addControl(caption);
  const band = new SlantedBar('brakeBand', '#6D443B', 7);
  gauge.addControl(band);
  const legend = new Grid();
  legend.height = '17px';
  const keys = ['Too slow', 'In range', 'Too fast'];
  const labels = keys.map((key, index) => {
    legend.addColumnDefinition(1 / 3);
    const label = hudText(tr(key), 11, index === 1 ? '#B4EAD4' : menuColors.muted);
    label.textHorizontalAlignment = [Control.HORIZONTAL_ALIGNMENT_LEFT, Control.HORIZONTAL_ALIGNMENT_CENTER, Control.HORIZONTAL_ALIGNMENT_RIGHT][index];
    legend.addControl(label, 0, index);
    return label;
  });
  gauge.addControl(legend);
  panel.addControl(gauge);

  const prompt = hudNotice('landingControls', 'message');
  prompt.height = '38px';
  prompt.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
  prompt.isVisible = false;
  const bindings = new Grid();
  const controls = [['A / D', 'Tilt'], ['Space', 'Thrust'], ['H', 'Autopilot']] as const;
  const bindingLabels = controls.map(([key, label], index) => {
    bindings.addColumnDefinition([0.31, 0.38, 0.31][index]);
    const binding = new Container();
    const keycap = hudNotice('flightKeycap');
    keycap.cornerRadius = keycap.cornerRadiusY = 3;
    keycap.background = '#162A45';
    keycap.width = [36, 40, 18][index] + 'px';
    keycap.height = '21px';
    keycap.left = '5px';
    keycap.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    const text = hudText(key, 11, menuColors.ice);
    text.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    keycap.addControl(text);
    binding.addControl(keycap);
    const action = hudText(tr(label), 12);
    action.paddingLeft = [46, 49, 27][index] + 'px';
    binding.addControl(action);
    bindings.addControl(binding, 0, index);
    return action;
  });
  prompt.addControl(bindings);
  fitHud(ui, prompt, (width) => { prompt.width = Math.min(340, Math.max(1, width - 24)) + 'px'; });
  ui.addControl(prompt);

  const alarm = hudNotice('flightAlarm');
  alarm.background = '#281C17F2';
  alarm.color = '#FFAD64';
  alarm.height = '52px';
  alarm.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
  alarm.isVisible = false;
  const message = hudText('', 14, '#FFE1BA');
  message.fontWeight = '700';
  message.textWrapping = true;
  message.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
  message.paddingLeft = message.paddingRight = '8px';
  alarm.addControl(message);
  fitHud(ui, alarm, (width, height) => {
    alarm.width = Math.min(340, Math.max(1, width - 24)) + 'px';
    const top = width > 1060 ? HUD_MARGIN : width <= HUD_NARROW ? 268 : 211;
    alarm.top = Math.min(top, Math.max(HUD_MARGIN, height - 112)) + 'px';
  });
  ui.addControl(alarm);

  return {
    showBrake(r) {
      panel.isVisible = gauge.isVisible = true;
      lateral.isVisible = prompt.isVisible = false;
      heading.title.text = tr('Orbit').toUpperCase();
      heading.mode.text = r.guidance ? tr('Aligning for braking') : r.assist ? tr('Braking · Auto ×{warp}', { warp: hudNumber(r.warp, r.warp % 1 ? 1 : 0) }) : tr('Manual · Attitude assist');
      first.update('Speed', hudNumber(r.v, 0), 'm/s');
      second.update('Altitude', hudNumber(r.h / 1000, 2), 'km');
      fuel.update(r.fuelKg / r.fuelMaxKg);
      thrust.update(r.throttle);
      caption.text = tr(r.assist ? 'Target speed band' : r.v > r.centre * (1 + r.band) ? 'Increase braking' : r.v < r.centre * (1 - r.band) ? 'Reduce braking' : 'Keep steady');
      keys.forEach((key, index) => { labels[index].text = tr(key); });
      band.update(gaugeX(1 - r.band), gaugeX(1 + r.band), '#3D836C', gaugeX(r.v / r.centre));
    },
    showLand(r) {
      panel.isVisible = lateral.isVisible = prompt.isVisible = true;
      gauge.isVisible = false;
      heading.title.text = tr('Landing').toUpperCase();
      heading.mode.text = tr(r.guidance ? 'Landing guidance' : r.autopilot ? 'Autopilot' : 'Manual · Light assist');
      prompt.isVisible = !r.guidance;
      first.update('Altitude', hudNumber(r.h, 1), 'm');
      second.update('Descent rate', hudNumber(-r.vy, 1), 'm/s');
      drift.update('Lateral drift', hudNumber(r.vx, 1), 'm/s');
      tilt.update('Tilt', hudNumber(r.tiltDeg, 1) + '°');
      fuel.update(r.fuelKg / r.fuelMaxKg, false, 'Landing fuel');
      thrust.update(r.throttle);
      controls.forEach(([, label], index) => { bindingLabels[index].text = tr(label); });
      prompt.top = -Math.max(HUD_MARGIN, dialogue.bottomInset + 8) + 'px';
    },
    alarm(text) {
      alarm.isVisible = !!text;
      if (text) message.text = text;
    },
    dispose() {
      panel.dispose();
      prompt.dispose();
      alarm.dispose();
    },
  };
}
