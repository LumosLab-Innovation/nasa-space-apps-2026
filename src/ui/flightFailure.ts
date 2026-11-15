import { Rectangle, StackPanel, type AdvancedDynamicTexture } from '@babylonjs/gui';
import type { Scene } from '@babylonjs/core';
import { gamePauseClock } from '../core/pause';
import { tr } from '../i18n/i18n';
import { type FlightFailureReason } from '../landing/assistedFlight';
import { MenuKeys, menuButton, menuGradient, menuLabel } from './menuControls';
import { fitHud } from './hudWidgets';

const reasons: Record<FlightFailureReason, string> = {
  brakingFast: 'Not enough braking: approach speed is too high.',
  brakingSlow: 'Too much braking: approach speed is too low.',
  approachFast: 'The approach is too fast for a safe landing.',
  impact: 'The spacecraft touched down too hard.',
  tipped: 'The spacecraft tilted too far at touchdown.',
  outside: 'The spacecraft left the landing area.',
};

export function createFlightFailureDialog(ui: AdvancedDynamicTexture, scene: Scene, choose: (automatic: boolean) => void, onPause: () => void) {
  const scrim = new Rectangle('flightFailureDialog');
  scrim.width = scrim.height = 1;
  scrim.thickness = 0;
  scrim.background = '#03081255';
  scrim.zIndex = 960;
  scrim.isPointerBlocker = true;
  scrim.isVisible = false;
  const panel = new Rectangle('flightFailurePanel');
  panel.height = '268px';
  panel.thickness = 1;
  panel.cornerRadius = 5;
  menuGradient(panel, '#192D45F5', '#071222F5', { direction: 'diagonal', border: ['#9FC9ECAA', '#33537555'] });
  fitHud(ui, panel, width => { panel.width = Math.min(430, width - 24) + 'px'; });
  scrim.addControl(panel);
  const stack = new StackPanel();
  stack.width = .88;
  stack.spacing = 10;
  panel.addControl(stack);
  const title = menuLabel(tr('Try the landing again'), 24);
  title.fontWeight = '700'; title.height = '36px';
  const reason = menuLabel('', 16, '#CDDAEA');
  reason.height = '60px';
  stack.addControl(title); stack.addControl(reason);
  let selected = false;
  const act = (auto: boolean) => {
    if (!scrim.isVisible || selected || gamePauseClock.isPaused) return;
    selected = true;
    scrim.isVisible = false;
    choose(auto);
  };
  const retry = menuButton('flightRetry', tr('Try again'), () => act(false), { titleAction: true, tone: 'primary' });
  const auto = menuButton('flightAutomatic', tr('Autopilot'), () => act(true), { titleAction: true });
  stack.addControl(retry.control); stack.addControl(auto.control);
  ui.addControl(scrim);
  const keys = new MenuKeys(() => scrim.isVisible && !gamePauseClock.isPaused, onPause);
  keys.setInputs([retry, auto], retry.id);
  let disposed = false;
  const dispose = () => { if (disposed) return; disposed = true; keys.dispose(); scrim.dispose(); };
  scene.onDisposeObservable.addOnce(dispose);
  return {
    get visible() { return scrim.isVisible; },
    show(failure: FlightFailureReason) {
      selected = false;
      reason.text = tr(reasons[failure]);
      scrim.isVisible = true;
      keys.focus(auto.id); keys.focus(retry.id);
    },
    hide() { scrim.isVisible = false; },
    dispose,
  };
}
