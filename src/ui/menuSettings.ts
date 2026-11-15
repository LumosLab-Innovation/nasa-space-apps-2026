import { Container } from '@babylonjs/gui/2D/controls/container';
import { Control } from '@babylonjs/gui/2D/controls/control';
import { Rectangle } from '@babylonjs/gui/2D/controls/rectangle';
import { Slider } from '@babylonjs/gui/2D/controls/sliders/slider';
import { StackPanel } from '@babylonjs/gui/2D/controls/stackPanel';
import type { Music } from '../audio/musicEngine';
import { toggleMusic } from '../audio/musicSystem';
import { saveVolume } from '../core/pause';
import { getLang, safeStorage, saveLang, setLang, tr, type Lang } from '../i18n/i18n';
import { MenuColumn, menuButton, menuColors, menuLabel, menuRule, type MenuInput } from './menuControls';
import { reducedCameraMotion, setReducedCameraMotion } from '../core/accessibility';

export type MenuPhase = 'main' | 'orbit' | 'landing' | 'surface';
type Group = 'audio' | 'language' | 'controls';

function buttonRow(inputs: MenuInput[], width: number, height: number): StackPanel {
  const row = new StackPanel();
  row.isVertical = false;
  row.width = 1;
  row.spacing = 6;
  for (const input of inputs) {
    input.control.width = (width - (inputs.length - 1) * row.spacing) / inputs.length + 'px';
    input.control.height = height + 'px';
    row.addControl(input.control);
  }
  return row;
}

export function createMenuSettings(music: Music | null) {
  let group: Group = 'audio';

  return (column: MenuColumn, phase: MenuPhase, refresh: (focus?: string) => void, back: () => void): void => {
    column.title(tr('Settings'));
    const wide = column.width >= 540;
    const groups: [Group, string][] = [['audio', tr('Audio')], ['language', tr('Language')], ['controls', tr('Control guide')]];
    const choices = groups.map(([id, label]) => menuButton(id, label, () => {
      group = id;
      refresh(id);
    }, {
      tone: group === id ? 'selected' : undefined,
      accent: group === id,
      centered: !wide,
      fontSize: wide ? 20 : 14,
      inset: wide ? 12 : 4,
    }));
    const body = new MenuColumn(wide ? column.width - 210 : column.width, 0);
    const fontSize = wide ? 19 : 16;
    const buttonHeight = wide ? 55 : 44;

    if (group === 'audio' && music) {
      const musicRow = new Container();
      const musicLabel = menuLabel(tr('Background music'), fontSize);
      musicLabel.fontWeight = '700';
      musicLabel.paddingRight = '82px';
      musicRow.addControl(musicLabel);
      const toggle = menuButton('music', tr(music.on ? 'On' : 'Off'), () => {
        toggleMusic(music);
        refresh('music');
      }, { tone: music.on ? 'selected' : undefined, centered: true, fontSize });
      toggle.control.width = '71px';
      toggle.control.height = buttonHeight + 'px';
      toggle.control.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
      musicRow.addControl(toggle.control);
      body.add(musicRow, buttonHeight, [toggle]);

      const dividerRow = new Container();
      const divider = menuRule('#3A517C');
      divider.height = '1px';
      dividerRow.addControl(divider);
      body.add(dividerRow, wide ? 36 : 22);

      const volumeRow = new Container();
      const volumeLabel = menuLabel(tr('Music volume'), fontSize);
      volumeLabel.paddingRight = '62px';
      volumeRow.addControl(volumeLabel);

      const badge = new Rectangle('musicVolumeBadge');
      badge.width = '49px';
      badge.cornerRadius = 4;
      badge.color = '#4A71A6';
      badge.background = '#0B1931';
      badge.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
      badge.isHitTestVisible = false;
      const label = menuLabel(Math.round(music.volume * 100) + '%', wide ? 17 : 15, menuColors.ice);
      label.fontFamily = 'Consolas, monospace';
      label.fontWeight = '700';
      label.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
      badge.addControl(label);
      volumeRow.addControl(badge);
      body.add(volumeRow, wide ? 36 : 32);

      const sliderRow = new Container();
      const track = new Rectangle('musicVolumeTrack');
      track.height = '10px';
      track.cornerRadius = 5;
      track.background = '#3B3B3B';
      track.color = '#898A90';
      track.isHitTestVisible = false;
      const fill = menuRule('#6C9FFF');
      fill.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
      fill.width = label.text;
      track.addControl(fill);
      sliderRow.addControl(track);

      const slider = new Slider('musicVolume');
      slider.minimum = 0;
      slider.maximum = 100;
      slider.step = 1;
      slider.value = Math.round(music.volume * 100);
      slider.thumbWidth = '20px';
      slider.barOffset = '16px';
      slider.isThumbCircle = true;
      slider.displayValueBar = false;
      slider.color = '#6C9FFF';
      slider.borderColor = 'transparent';
      slider.background = 'transparent';
      slider.isPointerBlocker = true;
      slider.hoverCursor = 'pointer';
      slider.onValueChangedObservable.add((value) => {
        music.setVolume(value / 100);
        saveVolume(safeStorage(), music.volume);
        label.text = Math.round(value) + '%';
        fill.width = label.text;
      });
      sliderRow.addControl(slider);
      body.add(new Container(), 12);
      body.add(sliderRow, 36, [{ id: 'volume', control: slider, adjust: (direction) => { slider.value += 5 * direction; } }]);
    } else if (group === 'language') {
      const languages = (['vi', 'en'] as const).map((lang: Lang) => menuButton(lang, lang === 'vi' ? 'Tiếng Việt' : 'English', () => {
        saveLang(safeStorage(), lang);
        setLang(lang);
        refresh(lang);
      }, { tone: getLang() === lang ? 'selected' : undefined, centered: true, fontSize }));
      body.add(buttonRow(languages, Math.min(276, body.width), buttonHeight), buttonHeight, languages);
    } else if (group === 'controls') {
      body.button(menuButton('motion', tr('Reduced camera motion: {s}', { s: tr(reducedCameraMotion() ? 'On' : 'Off') }), () => {
        setReducedCameraMotion(!reducedCameraMotion()); refresh('motion');
      }, { fontSize }), buttonHeight);
      const controlRows = [tr('Tab / ↑↓ — choose · Enter — select'), tr('Esc — back or pause · ←→ — adjust slider'), tr('Shift+Tab — focus mission menu icons')];
      if (phase === 'main' || phase === 'orbit') controlRows.push(tr('Space — braking burn · Enter — next line'));
      if (phase === 'main' || phase === 'landing') controlRows.push(tr('A/D — tilt · Space — thrust · H — autopilot'));
      if (phase === 'main' || phase === 'surface') {
        controlRows.push(tr('W A S D — walk · Shift — lope · Space — jump · drag the mouse — look around'));
        controlRows.push(tr('E — interact · Q — ask Pip · R — scan rocks · T — thermal view'));
        controlRows.push(tr('J — mission goal and optional hints (pauses play)'));
      }
      for (const text of controlRows) {
        const row = new Container();
        row.addControl(menuLabel(text, wide ? 16 : 14, menuColors.muted));
        const divider = menuRule('#48649280');
        divider.height = '1px';
        divider.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        row.addControl(divider);
        body.add(row, body.width < 380 ? 52 : 45);
      }
    }

    if (wide) {
      const rail = new MenuColumn(167, 8);
      for (const choice of choices) rail.button(choice, buttonHeight);
      const row = new Container();
      rail.stack.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
      body.stack.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
      const divider = menuRule('#486492');
      divider.width = '1px';
      divider.left = '184px';
      divider.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
      row.addControl(rail.stack);
      row.addControl(divider);
      row.addControl(body.stack);
      column.add(row, Math.max(271, body.height), [...rail.inputs, ...body.inputs]);
    } else {
      column.add(buttonRow(choices, column.width, buttonHeight), buttonHeight, choices);
      if (body.height) column.add(body.stack, body.height, body.inputs);
    }
    const backButton = menuButton('back', tr('Back'), back, { tone: 'primary', centered: true, fontSize: wide ? 20 : 17 });
    backButton.control.width = '116px';
    backButton.control.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    column.button(backButton, buttonHeight);
  };
}
