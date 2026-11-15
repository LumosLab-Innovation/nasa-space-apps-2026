import { Engine } from '@babylonjs/core/Engines/engine';
import { createMusic, type Music } from './audio/musicEngine';
import { attachMusicUnlock } from './audio/musicSystem';
import { loadLang, safeStorage, setLang, tr } from './i18n/i18n';
import { introMode } from './landing/introMode';
import { showMainMenu, type StartChoice } from './scenes/mainMenuScene';
import { CONTINUE_KEY, loadSave } from './save/save';
import { withLoadingScreen } from './ui/loadingScreen';

const returnToMainMenu = () => location.assign(location.pathname);

export async function boot(canvas: HTMLCanvasElement): Promise<void> {
  const engine = new Engine(canvas, true);
  window.addEventListener('resize', () => engine.resize());
  const q = new URLSearchParams(location.search);
  const lang = loadLang(safeStorage()) ?? (navigator.language.toLowerCase().startsWith('vi') ? 'vi' : 'en');
  setLang(lang);
  canvas.tabIndex = 0;
  const music = createMusic();
  attachMusicUnlock(music);
  if (import.meta.env.DEV) Object.assign(window, { __music: music, __engine: engine });

  if (import.meta.env.DEV && q.get('music') === 'test') {
    const { runMusicSampler } = await import('./demo/musicSampler');
    runMusicSampler(music);
    return;
  }

  const introOnly = import.meta.env.DEV && q.get('intro') === 'only';
  const autosave = !introOnly && introMode(location.search, import.meta.env.DEV) === 'intro';
  const save = autosave ? loadSave(safeStorage()) : null;
  let autoContinue = false;
  try {
    autoContinue = sessionStorage.getItem(CONTINUE_KEY) === '1';
    sessionStorage.removeItem(CONTINUE_KEY);
  } catch {
    /* Storage may be unavailable. */
  }

  let choice: StartChoice;
  if (introOnly) choice = q.get('assist') === '1' ? 'auto' : 'fly';
  else if (!autosave) choice = 'skip';
  else if (autoContinue && save) choice = 'continue';
  else choice = await showMainMenu(engine, music, !!save);

  const play = await withLoadingScreen(engine, music, tr('Loading gameplay…'), async (report) => {
    const { prepareMission } = await import('./scenes/missionStartup');
    return prepareMission(engine, music, {
      choice, save, autosave, introOnly, demo: q.get('demo') === '1',
      jump: import.meta.env.DEV ? q.get('jump') : null,
      onMainMenu: returnToMainMenu,
    }, report);
  });
  if (play) await play();
  else returnToMainMenu();
}

const canvas = document.getElementById('game') as HTMLCanvasElement | null;
if (canvas) void boot(canvas);
