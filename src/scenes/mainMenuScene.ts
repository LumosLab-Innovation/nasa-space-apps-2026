import type { Engine } from '@babylonjs/core/Engines/engine';
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { Color4 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Scene } from '@babylonjs/core/scene';
import { AdvancedDynamicTexture } from '@babylonjs/gui/2D/advancedDynamicTexture';
import { Container } from '@babylonjs/gui/2D/controls/container';
import { Control } from '@babylonjs/gui/2D/controls/control';
import { LinearGradient } from '@babylonjs/gui/2D/controls/gradient/LinearGradient';
import { ScrollViewer } from '@babylonjs/gui/2D/controls/scrollViewers/scrollViewer';
import type { Music } from '../audio/musicEngine';
import { onLangChange, tr } from '../i18n/i18n';
import { MenuColumn, MenuDialog, MenuKeys, menuButton, menuColors, menuLabel, menuRule, revealMenuInput } from '../ui/menuControls';
import { createMenuSettings } from '../ui/menuSettings';
import { addTitleButtonHover } from '../ui/titleButton';
import { createMenuWordmark, loadWordmarkFont } from '../ui/menuWordmark';
import { createOrbitArt, ORBIT_ART_SIZE } from '../ui/orbitArt';

export type StartChoice = 'fly' | 'auto' | 'skip' | 'continue';

export async function showMainMenu(engine: Engine, music: Music, hasSave: boolean): Promise<StartChoice> {
  const titleFamily = await loadWordmarkFont();
  const scene = new Scene(engine);
  scene.clearColor = new Color4(0.024, 0.051, 0.114, 1);
  scene.activeCamera = new FreeCamera('mainMenuCamera', Vector3.Zero(), scene);
  const ui = AdvancedDynamicTexture.CreateFullscreenUI('mainMenuUI', true, scene);
  const art = createOrbitArt('menuOrbit');
  const { width: artWidth, height: artHeight } = ORBIT_ART_SIZE;
  ui.addControl(art);

  const bottomShade = menuRule(menuColors.space);
  const sideShade = menuRule(menuColors.space);
  ui.addControl(bottomShade);
  ui.addControl(sideShade);

  const settings = createMenuSettings(music);
  return new Promise((resolve) => {
    let next: StartChoice = 'auto';
    let front: Container | undefined;
    let leaving = false;
    let scroll: ScrollViewer | undefined;
    let contentHeight = 0;
    let viewHeight = 0;
    let returnFocus = 'settings';

    function finish(choice: StartChoice): void {
      if (leaving) return;
      leaving = true;
      queueMicrotask(() => {
        engine.stopRenderLoop(loop);
        scene.dispose();
        resolve(choice);
      });
    }

    function choose(choice: StartChoice): void {
      next = choice;
      if (hasSave) dialog.open('confirm-new');
      else finish(choice);
    }

    const dialog = new MenuDialog(ui, scene, (page, column) => {
      if (page === 'settings') return settings(column, 'main', (focus) => dialog.refresh(focus), () => dialog.back());
      if (page === 'flight') {
        column.title(tr('Choose how to land'));
        column.button(menuButton('auto', tr('Autopilot'), () => choose('auto'), { tone: 'primary', note: tr('Watch the descent and follow the crew.') }), 65);
        column.button(menuButton('fly', tr('Manual flight'), () => choose('fly'), { note: tr('Fly the ship during descent.') }), 65);
        column.button(menuButton('skip', tr('Skip landing'), () => choose('skip'), { tone: 'risk' }));
      } else if (page === 'confirm-new') {
        column.title(tr('Start a new game?'));
        column.add(menuLabel(tr('The first autosave will replace your previous checkpoint.'), 15, menuColors.muted), 64);
        column.button(menuButton('start', tr('Start mission'), () => finish(next), { tone: 'primary' }));
      }
      column.button(menuButton('back', tr('Back'), () => dialog.back()));
    }, (open) => { if (!open) keys.focus(returnFocus); });

    const keys = new MenuKeys(() => !dialog.isOpen && !leaving, () => {}, (input) => {
      if (scroll) revealMenuInput(scroll, contentHeight, viewHeight, input);
    });
    const layout = () => {
      const { width, height } = ui.getSize();
      const left = Math.round(Math.max(18, width * 0.074));
      const compact = width < 660;
      const column = new MenuColumn(Math.min(590, width - left * 2), 4);
      const actionWidth = Math.min(362, column.width - 12);
      const rowStyle = { fontSize: compact ? 17 : 20, inset: compact ? 14 : 18, titleAction: true };
      const addAction = (input: ReturnType<typeof menuButton>, rowHeight: number) => {
        input.control.width = actionWidth + 'px';
        input.control.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        addTitleButtonHover(input.control, scene);
        column.button(input, rowHeight);
      };
      keys.setInputs([]);
      front?.dispose();
      front = new Container('mainMenuContent');
      front.width = column.width + 'px';
      front.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
      front.left = left + 'px';

      // Crop around the ships so they stay visible on narrow and wide screens.
      const scale = Math.max(width / artWidth, height * 1.09 / artHeight);
      const scaledArtWidth = Math.round(artWidth * scale);
      art.width = scaledArtWidth + 'px';
      art.height = Math.round(artHeight * scale) + 'px';
      art.left = Math.round((width - scaledArtWidth) * (compact ? 0.58 : 0.45)) + 'px';

      const verticalFade = new LinearGradient(0, height, 0, 0);
      verticalFade.addColorStop(0, '#060D1DEA');
      verticalFade.addColorStop(0.54, '#060D1D12');
      verticalFade.addColorStop(1, '#080E1B08');
      bottomShade.backgroundGradient = verticalFade;

      const horizontalFade = new LinearGradient(0, 0, width, 0);
      horizontalFade.addColorStop(0, '#050C1A');
      horizontalFade.addColorStop(0.27, '#081326EE');
      horizontalFade.addColorStop(0.58, '#08132636');
      horizontalFade.addColorStop(0.83, '#08132605');
      sideShade.backgroundGradient = horizontalFade;

      const wordmark = createMenuWordmark(titleFamily);
      // Leave room for the scrollbar when the menu is taller than the viewport.
      const { missionHeight, titleHeight } = wordmark.fit(ui.getContext(), column.width - 16, 106);
      column.add(wordmark.mission, missionHeight);
      column.add(wordmark.title, titleHeight);
      column.add(new Container(), compact ? 12 : 24);

      if (hasSave) {
        addAction(menuButton('continue', tr('Resume'), () => finish('continue'), {
          ...rowStyle, tone: 'primary', note: tr('From the last checkpoint'), icon: '→', accent: true,
        }), compact ? 68 : 78);
        column.add(new Container(), 1);
      }
      addAction(menuButton('new', tr('New game'), () => {
        returnFocus = 'new';
        dialog.open('flight');
      }, { ...rowStyle, tone: hasSave ? 'quiet' : 'primary', icon: '→', accent: !hasSave }), compact ? 49 : 58);
      addAction(menuButton('settings', tr('Settings'), () => {
        returnFocus = 'settings';
        dialog.open('settings');
      }, { ...rowStyle, tone: 'quiet', icon: '⚙' }), compact ? 49 : 58);
      addAction(menuButton('demo', tr('Decision demo'), () => location.assign(`${location.pathname}?demo=1`), { ...rowStyle, tone: 'quiet', icon: '→' }), compact ? 49 : 58);
      addAction(menuButton('sources', tr('NASA sources and credits'), () => window.open(`${import.meta.env.BASE_URL}sources.html`, '_blank', 'noopener,noreferrer'), { ...rowStyle, tone: 'quiet', icon: '↗' }), compact ? 49 : 58);
      contentHeight = column.height;
      viewHeight = Math.min(contentHeight, Math.max(80, height - 26));
      front.height = viewHeight + 'px';
      if (viewHeight === contentHeight) front.top = '4px';
      scroll = undefined;
      if (viewHeight < contentHeight) {
        scroll = new ScrollViewer('mainMenuScroll');
        scroll.width = scroll.height = 1;
        scroll.barSize = 7;
        scroll.barColor = menuColors.border;
        scroll.barBackground = menuColors.space;
        scroll.thickness = 0;
        column.stack.width = column.width - 12 + 'px';
        scroll.addControl(column.stack);
        front.addControl(scroll);
      } else {
        front.addControl(column.stack);
      }
      front.zIndex = 1;
      ui.addControl(front);
      keys.setInputs(column.inputs, undefined, false);
      dialog.refresh();
    };

    const resize = engine.onResizeObservable.add(layout);
    const language = onLangChange(layout);
    scene.onDisposeObservable.addOnce(() => {
      engine.onResizeObservable.remove(resize);
      language();
      keys.dispose();
    });
    const loop = () => {
      music.update(Math.min(engine.getDeltaTime() / 1000, 0.1));
      scene.render();
    };
    layout();
    engine.runRenderLoop(loop);
  });
}
