import { Color4, HavokPlugin, Scene, Vector3, type Engine } from '@babylonjs/core';
import HavokPhysics from '@babylonjs/havok';
import '@babylonjs/loaders/glTF';
import type { Music } from '../audio/musicEngine';
import { LUNAR_G } from '../config/constants';
import { settleWithin } from '../core/settleWithin';
import { withPreparationTarget } from '../core/preparationRender';
import { loadEphemeris } from '../data/ephemeris';
import { loadHeightmap } from '../data/heightmap';
import { planMission } from '../data/mission';
import { safeStorage, tr } from '../i18n/i18n';
import { prepareModels } from '../models/loadModel';
import { CONTINUE_KEY, clearSave, prepareRestore, type SaveData } from '../save/save';
import { createPhotoStore } from '../save/photoStore';
import { type LoadingProgress } from '../ui/loadingScreen';
import { cardsFor, notebookThumbUrls } from '../content/content';
import { loadEarthTexture } from '../world/earthGlobe';
import { prepareLandingIntro } from './landingScene';
import type { StartChoice } from './mainMenuScene';
import { EARTH_TEXTURE, HAVOK_BINARY, MISSION_FILE_COUNT, MODEL_IDS, loadMissionFiles, missionFetch, missionFile } from './missionAssets';
import { createSurfaceScene } from './surfaceScene';
import type { DescentHandoff } from '../landing/descentBridge';
import { prepareExhaustAssets } from '../fx/exhaustAssets';

interface MissionOptions {
  choice: StartChoice;
  save: SaveData | null;
  demo: boolean;
  autosave: boolean;
  introOnly: boolean;
  jump: string | null;
  onMainMenu: () => void;
}

export async function prepareMission(
  engine: Engine, music: Music, options: MissionOptions, report: LoadingProgress,
): Promise<() => Promise<void>> {
  const { choice, save, demo, autosave, introOnly, jump, onMainMenu } = options;
  const thumbs = notebookThumbUrls(cardsFor('en'));
  const work = MISSION_FILE_COUNT + thumbs.length + 4; // Gameplay module, packaged assets, data/physics, and first scene.
  const progress = (completed: number) => Math.floor(completed * 100 / work);
  const downloading = (completed: number) => report(progress(completed + 1), tr('Loading assets ({done}/{total})…', {
    done: completed, total: MISSION_FILE_COUNT,
  }));
  downloading(0);
  const files = await loadMissionFiles(downloading);
  const fetchFile = missionFetch(files);
  // Album thumbnails: fetched and decoded now so the notebook grid is instant. A failed thumb never blocks loading.
  let thumbsDone = 0;
  const pendingThumbs: HTMLImageElement[] = [];
  await Promise.all(thumbs.map(async (url) => {
    // Keep the Image referenced until it settles; a hung request times out instead of blocking loading.
    const img = new Image(); pendingThumbs.push(img); img.decoding = 'async'; img.src = url;
    await settleWithin(img.decode(), 6000);
    report(progress(MISSION_FILE_COUNT + 1 + ++thumbsDone), tr('Loading assets ({done}/{total})…', { done: MISSION_FILE_COUNT, total: MISSION_FILE_COUNT }));
  }));
  const after = MISSION_FILE_COUNT + thumbs.length;
  report(progress(after + 1), tr('Preparing terrain and physics…'));
  const [havok, hm, eph] = await Promise.all([
    HavokPhysics({ wasmBinary: missionFile(files, HAVOK_BINARY) }),
    loadHeightmap(fetchFile),
    loadEphemeris(fetchFile),
  ]);

  const prepareSurface = async (land: boolean, update: (message: string) => void) => {
    const scene = new Scene(engine);
    scene.clearColor = new Color4(0, 0, 0, 1);
    try {
      scene.enablePhysics(new Vector3(0, -LUNAR_G, 0), new HavokPlugin(true, havok));
      const [, earthTexture] = await Promise.all([
        prepareModels(scene, files, MODEL_IDS.filter((id) => id !== 'orion')),
        loadEarthTexture(scene, missionFile(files, EARTH_TEXTURE)),
        prepareExhaustAssets(scene,files),
      ]);
      update(tr('Preparing the lunar surface…'));
      const world = await createSurfaceScene(engine, scene, {
        dormant: true, demo, music, autosave, onMainMenu, terrainData: { hm, eph }, fetchFile, earthTexture,
        onRestart: autosave ? () => {
          try {
            sessionStorage.setItem(CONTINUE_KEY, '1');
          } catch {
            /* The title still offers Continue when session storage is unavailable. */
          }
          location.reload();
        } : undefined,
      });
      if (jump === 'act4' || jump === 'act5') {
        const { applyJump } = await import('../demo/jump');
        applyJump(world, jump);
      }
      if (choice === 'continue' && save) {
        try {
          world.restore(prepareRestore(save));
        } catch (error) {
          console.warn('[save] could not restore, starting fresh', error);
          clearSave(safeStorage());
        }
      } else if (land) {
        world.startLanding(choice === 'auto', true);
      } else if (autosave) {
        world.state.flags.add('landing:done');
      }
      await scene.whenReadyAsync();
      if(import.meta.env.DEV){
        Object.assign(window,{__preparedSurface:world});
        scene.onDisposeObservable.addOnce(()=>{delete (window as unknown as {__preparedSurface?:unknown}).__preparedSurface;});
      }
      await world.hlsRig.warm();
      await world.descent?.warmExhaust();
      // Compile both the resting surface and the already positioned landing view while dormant.
      await withPreparationTarget(scene, () => scene.render());
      await scene.whenReadyAsync();
      return { scene, world, start: (handoff?: DescentHandoff) => {
        if(import.meta.env.DEV)delete (window as unknown as {__preparedSurface?:unknown}).__preparedSurface;
        if (handoff) world.descent?.beginBridge(handoff);
        world.setDormant(false, handoff?.held);
        engine.getRenderingCanvas()?.focus({ preventScroll: true });
        if (import.meta.env.DEV) Object.assign(window, { __scene: scene, __world: world });
        engine.runRenderLoop(() => scene.render());
      } };
    } catch (error) {
      scene.dispose();
      throw error;
    }
  };

  const preparingScene = progress(after + 2);
  if (choice === 'auto' || choice === 'fly') {
    // New Game: the notebook photo album starts empty (only where the surface would save photos at all).
    if (autosave && !demo) createPhotoStore(safeStorage(), true).clear();
    report(preparingScene, tr('Preparing the lunar surface…'));
    const surface = introOnly ? null : await prepareSurface(true, text => report(preparingScene,text));
    report(progress(after+3),tr('Preparing lunar orbit…'));
    const surfaceStart = planMission(eph).start || Date.UTC(2028, 8, 10, 8);

    let handoff: DescentHandoff | undefined;
    let orbit: Awaited<ReturnType<typeof prepareLandingIntro>>;
    try {
      orbit = await prepareLandingIntro(engine, files, {
        assist: choice === 'auto', music,
        onMainMenu: () => { surface?.scene.dispose(); onMainMenu(); },
        openingUtc: surfaceStart - 15 * 60_000, destination: surface?.world,
        onBridge: surface ? data => { handoff=data; } : undefined,
      });
    } catch(error) { surface?.scene.dispose(); throw error; }
    return async () => {
      engine.getRenderingCanvas()?.focus({ preventScroll: true });
      const result = await orbit();
      if (introOnly) { document.title = 'intro: ' + result; return; }
      if(!surface || surface.scene.isDisposed)return;
      if(result==='skipped')surface.world.descent?.skip();
      surface.start(handoff);
    };
  }
  report(preparingScene, tr('Preparing the lunar surface…'));
  const surface = await prepareSurface(false, (text) => report(preparingScene, text));
  return async () => surface.start();
}
