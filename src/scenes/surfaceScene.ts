import { addCasters, mergeStatic } from '../models/optimize';
import { Color3, Engine, MeshBuilder, PBRMaterial, PhysicsAggregate, PhysicsShapeType, Scene, TransformNode, Vector3, type Texture } from '@babylonjs/core';
import { GameClock } from '../core/clock';
import { EventBus, type GameEvents } from '../core/events';
import { createState, unlockCard, type GameState } from '../core/gameState';
import { loadEphemeris, sampleAt } from '../data/ephemeris';
import { planMission, type MissionPlan } from '../data/mission';
import { loadHeightmap, sampleHeight, type Heightmap } from '../data/heightmap';
import { ModuleSystem } from '../interact/moduleSystem';
import { Pip } from '../pip/pip';
import { Astronaut } from '../player/astronaut';
import { Keyboard } from '../player/keyboard';
import { createHud, type Hud } from '../ui/hud';
import { createDialogueBox, type DialogueBox } from '../ui/dialogueBox';
import { createNotebook, type Card } from '../ui/notebook';
import { DialogueRunner } from '../dialogue/runner';
import { cardsFor, linesFor } from '../content/content';
import { ScienceSystem } from '../science/scienceSystem';
import { MicaSystem } from '../mica/micaSystem';
import { MicaRepairSystem } from '../mica/repairSystem';
import { createThermalView } from '../ui/thermalView';
import { createSky, type Sky } from '../world/sky';
import { createTerrain } from '../world/terrain';
import { HLS_POS, MICA_POS, PIP_SPAWN, PLAYER_SPAWN, SHELTER_POS } from '../world/zones';
import { createFinalDescent, type FinalDescent } from '../landing/finalDescent';
import { createCargoLanding } from '../challenges/cargoLanding';
import { createPipMeeting } from '../story/pipMeetingSystem';
import { createHorizonGlow } from '../fx/horizonGlow';
import { escOpensPause, gamePauseClock } from '../core/pause';
import { loadSave, milestoneKey, restoreSteps, shouldAutosave, writeSave, type RestorePlan } from '../save/save';
import type { DataLogId, ModuleId, SampleId } from '../core/gameState';
import { createPauseMenu, type PauseMenu } from '../ui/pauseMenu';
import type { Music } from '../audio/musicEngine';
import { motifAllowed, pickMusic, type MusicInputs } from '../audio/musicMood';
import { createMusicMemory, toggleMusic } from '../audio/musicSystem';
import { CARGO } from '../challenges/cargoLanding';
import { compass, daysText } from '../story/timeText';
import { SunlightCache } from '../world/lighting';
import { loadModel } from '../models/loadModel';
import { createHlsRig, type HlsRig } from '../models/hlsRig';
import { Mica } from '../mica/mica';
import { DustSystem } from '../fx/dustSystem';
import { JourneySystem } from '../journey/journeySystem';
import { SurvivalSystem } from '../survival/survivalSystem';
import { WinchSystem } from '../challenges/winchSystem';
import { createBoulderTrail } from '../challenges/boulderTrail';
import { createFreshCrater } from '../challenges/freshCrater';
import { createFlagPlant } from '../challenges/flagPlant';
import { createEarthRelay } from '../challenges/earthRelay';
import { createDarkCrater } from '../challenges/darkCrater';
import { createRoverSystem } from '../rover/roverSystem';
import { walkReason, pipBusyFor } from '../rover/rover';
import { winchHoldsPip } from '../challenges/winch';
import { createMapView } from '../ui/mapView';
import { createDemoController } from '../demo/demoController';
import { resolveQ } from '../pip/qCommand';
import { TIME_SCALE } from '../config/constants';
import { UPGRADE_TEXT, upgradesFor } from '../pip/upgrades';
import { zone } from '../world/zones';
import { TrailRenderer } from '../fx/trailRenderer';
import { StampSpacer } from '../fx/trails';
import { coatColor, DustCoat } from '../fx/dustCoat';
import { createSolarStorm } from '../challenges/solarStorm';
import { InputLock, sceneInputGate } from '../ui/inputLock';
import { createStoryPanel, type StoryPanel } from '../ui/storyPanel';
import { createMemoryPuzzleView } from '../ui/memoryPuzzleView';
import { createAct5System } from '../story/act5System';
import { findCampNight } from '../data/night';
import { createHorizonView } from '../ui/horizonView';
import { createHeatLeaks, leaksFixed } from '../story/heatLeaks';
import { createNightPlanner } from '../ui/nightPlanner';
import { createEnding } from '../story/endingSystem';
import { loadStormEvent, type StormEvent } from '../data/donki';
import { getLang, onLangChange, safeStorage, tr } from '../i18n/i18n';
import { currentObjective } from '../story/objective';
import { createMissionGuide } from '../ui/missionGuide';

/** Everything that lives on the lunar surface, wired together. Later tasks add systems here. */
export interface SurfaceWorld {
  scene: Scene;
  hm: Heightmap;
  clock: GameClock;
  sky: Sky;
  state: GameState;
  bus: EventBus<GameEvents>;
  hud: Hud;
  keyboard: Keyboard;
  player: Astronaut;
  pip: Pip;
  rover: Awaited<ReturnType<typeof createRoverSystem>>;
  modules: ModuleSystem;
  dialogue: DialogueBox;
  science: ScienceSystem;
  micaSys: MicaSystem;
  repairSys: MicaRepairSystem;
  dust: DustSystem;
  mission: MissionPlan;
  survival: SurvivalSystem;
  winchSys: WinchSystem;
  act5: ReturnType<typeof createAct5System>;
  memory: ReturnType<typeof createMemoryPuzzleView>;
  night: ReturnType<typeof findCampNight>;
  lock: InputLock;
  panel: StoryPanel;
  /** The final descent onto the landing site, while it runs (Plan 5). */
  readonly descent: FinalDescent | null;
  hlsRig: HlsRig;
  /** The Esc menu (Plan 6a). */
  pauseMenu: PauseMenu;
  /** The act 2E cargo lander (null in the demo). */
  cargo: ReturnType<typeof createCargoLanding> | null;
  /** Start the final descent (after the orbital intro). */
  setDormant(value: boolean, held?: readonly string[]): void;
  startLanding(assist: boolean, prepared?: boolean): void;
  /** Continue from a save (Plan 6a): rebuild the world quietly from the saved state. */
  restore(plan: RestorePlan): void;
}

export async function createSurfaceScene(engine: Engine, scene: Scene, opts: { dormant?: boolean; demo?: boolean; music?: Music; autosave?: boolean; onRestart?: () => void; onMainMenu?: () => void; terrainData?: { hm: Heightmap; eph: Awaited<ReturnType<typeof loadEphemeris>> }; fetchFile?: typeof fetch; earthTexture: Texture }): Promise<SurfaceWorld> {
  const [hm, eph] = opts.terrainData ? [opts.terrainData.hm, opts.terrainData.eph] : await Promise.all([loadHeightmap(), loadEphemeris()]);
  const terrain = createTerrain(scene, hm);
  // Real light: the 2028 window with the highest Sun while Earth stays up (spec v3 §10.1–10.2).
  const mission = planMission(eph);
  const clock = new GameClock(mission.start, TIME_SCALE);
  const sky = createSky(scene, eph, clock, opts.earthTexture);
  sky.shadows.addShadowCaster(terrain);

  // Starship HLS at the landing zone: 50 m tall, elevator facing the spot where the player steps off.
  const hlsRoot = new TransformNode('hls', scene);
  hlsRoot.position.set(HLS_POS.x, sampleHeight(hm, HLS_POS.x, HLS_POS.z), HLS_POS.z);
  hlsRoot.rotation.y = Math.atan2(PLAYER_SPAWN.x - HLS_POS.x, PLAYER_SPAWN.z - HLS_POS.z);
  const hlsRig = await createHlsRig(scene, hlsRoot, sky.shadows);
  hlsRig.setTargets(1, 1, true);
  const hlsGroundY = hlsRig.groundHeight((x, z) => sampleHeight(hm, x, z));
  hlsRoot.position.y = hlsGroundY;
  const hlsHull = MeshBuilder.CreateCylinder('hlsCollider', { diameter: 9, height: 50 }, scene);
  hlsRoot.computeWorldMatrix(true);
  hlsHull.position.copyFrom(Vector3.TransformCoordinates(new Vector3(0, 25, 0), hlsRoot.getWorldMatrix()));
  hlsHull.rotation.copyFrom(hlsRoot.rotation);
  hlsHull.isVisible = false;
  new PhysicsAggregate(hlsHull, PhysicsShapeType.CYLINDER, { mass: 0 }, scene);

  const state = createState();
  const bus = new EventBus<GameEvents>();
  const hud = createHud(scene);
  let dormant = !!opts.dormant;
  if (dormant) { scene.physicsEnabled = false; scene.detachControl(); }
  const keyboard = new Keyboard();
  keyboard.setEnabled(!dormant);
  scene.onDisposeObservable.addOnce(() => keyboard.dispose());
  const player = await Astronaut.create(scene, hm, new Vector3(PLAYER_SPAWN.x, 0, PLAYER_SPAWN.z));
  addCasters(sky.shadows, player.root.getChildMeshes(false).concat(player.root));
  // Ballistic lunar dust: boots on jump/landing/steps, Pip's wheels while rolling (spec v3 §5).
  const dust = new DustSystem(scene, hm);
  const feet = () => new Vector3(player.position.x, sampleHeight(hm, player.position.x, player.position.z), player.position.z);
  player.onJump = (v) => dust.burst(feet(), v * 0.6);
  const playerCoat = new DustCoat();
  const pipCoat = new DustCoat();
  player.onLand = (v) => {
    dust.burst(feet(), v);
    playerCoat.addBurst(v);
  };
  // Bootprints and wheel tracks stay for the whole session: there is no wind on the Moon.
  const boots = new TrailRenderer(scene, hm, 'boot', 6000);
  const tracks = new TrailRenderer(scene, hm, 'wheel', 12000);
  player.onStep = (foot) => {
    dust.trickle(feet(), player.yaw, 1.2, 0.25);
    const side = foot === 'L' ? -0.15 : 0.15;
    const p = player.position;
    boots.stamp(p.x + Math.cos(player.yaw) * side, p.z - Math.sin(player.yaw) * side, player.yaw);
  };
  const wheelSpacers = [0, 1, 2, 3].map(() => new StampSpacer(0.3));
  const pip = await Pip.create(scene, hm, PIP_SPAWN);
  pip.dustSystem = dust;
  // Dust slowly coats the suit and Pip's running gear; each material takes a share of the coat.
  const coatTargets = (pairs: [string, number][]) =>
    pairs.flatMap(([name, share]) => {
      const m = scene.getMaterialByName(name);
      return m instanceof PBRMaterial ? [{ m, share, base: m.albedoColor.clone() }] : [];
    });
  const playerCoatMats = coatTargets([['suit', 0.5], ['Suit_Boots', 1], ['Suit_Legs', 0.5]]);
  const pipCoatMats = coatTargets([['pipDark', 1], ['pipWhite', 0.3], ['Pip_Rubber', 1], ['Pip_White', 0.3]]);
  const applyCoat = (mats: ReturnType<typeof coatTargets>, coat: DustCoat) => {
    for (const t of mats) {
      const c = coatColor(t.base, coat.level * t.share);
      t.m.albedoColor = new Color3(c.r, c.g, c.b);
    }
  };
  const lastPos = { player: player.position.clone(), pip: pip.position.clone() };
  const travelled = (now: Vector3, last: Vector3) => {
    const d = Math.hypot(now.x - last.x, now.z - last.z);
    last.copyFrom(now);
    return d < 5 ? d : 0;
  };
  addCasters(sky.shadows, pip.meshes);
  const modules = new ModuleSystem(scene, hm, state, bus, pip, sky, hud);
  const script = structuredClone(linesFor(getLang()));
  // Knowledge cards in the current language; replaced in place when the language changes.
  const cardList = [...cardsFor(getLang())] as Card[];
  const dialogue = createDialogueBox(hud.ui, scene, new DialogueRunner(script, state), pip, true);
  const notebook = createNotebook(hud.ui, state, cardList);
  const science = new ScienceSystem(scene, hm, state, script, dialogue, pip, sky, hud);
  const micaSys = new MicaSystem(scene, hm, state, dialogue, pip, sky, hud, await Mica.create(scene, hm, MICA_POS));
  const repairSys = new MicaRepairSystem(scene, hm, state, micaSys, dialogue, pip, hud);
  bus.on('moduleInstalled', () => void dialogue.play('moduleDone'));
  const journey = new JourneySystem(state, dialogue, pip, hud);
  const winchSys = new WinchSystem(scene, hm, state, modules, pip, dialogue, hud, sky);
  const boulderTrail = createBoulderTrail(scene, hm, sky, state, dialogue, hud, pip);
  const freshCrater = createFreshCrater(dialogue, hud);
  const flagPlant = createFlagPlant(scene, hm, sky, state, dialogue, hud);
  const relay = createEarthRelay(scene, hm, sky, state, dialogue, hud, pip, eph, clock);
  const map = createMapView(hud.ui, hm);
  const darkCrater = createDarkCrater(scene, hm, state, dialogue, hud, pip, () => upgradesFor(state.modules, state.flags));
  const upgrades = () => upgradesFor(state.modules, state.flags);
  const survival = new SurvivalSystem(hm, state, sky, pip, dialogue, hud, upgrades, () => pipCoat.level);
  // Rescue resets half-done challenges (final review, Plan 3).
  survival.onRescue.push(() => winchSys.onRescue(), () => repairSys.onRescue());
  // Act 4 radiation storm from a real DONKI event, 15 s after Pip first hooks MICA's tow line (not in the demo).
  let stormEvent: StormEvent | null = null;
  void loadStormEvent(opts.fetchFile).then((r) => {
    stormEvent = r.event;
  });
  const micaInCamp = () => {
    const b = zone('base');
    const m = micaSys.mica.root.position;
    return Math.hypot(m.x - b.x, m.z - b.z) <= b.radius;
  };
  const storm = createSolarStorm(scene, hm, sky, state, hud, dialogue, pip, survival, () => stormEvent, micaInCamp);
  if (!opts.demo) repairSys.onTowStart = () => storm.start();
  // Plan 7: Pip hides behind the habitat crate until the player overhears it and says hello.
  const meeting = createPipMeeting({ state, dialogue, hud, pip });
  // Lunar rover (Plan 7): lowered from the lander after the meeting; Pip rides on the cargo deck when free.
  // (storm and cargo are created further down; these closures only run from the render loop.)
  const worldBusy = () => ({
    storm: storm.phase === 'warning' || storm.phase === 'storm',
    cargoCountdown: cargo?.phase === 'warning' || cargo?.phase === 'descent',
    towing: repairSys.isTowing,
    winchHoldsPip: winchHoldsPip(winchSys.winch.state),
    pipCarrying: modules.pipCarrying,
    pipSleeping: pip.sleeping,
  });
  const rover = await createRoverSystem({
    scene, hm, state, player, pip, hud, dialogue, dust, tracks,
    pipBusy: () => pipBusyFor(worldBusy()),
    walkReason: () => walkReason(worldBusy()),
    meeting,
  });
  addCasters(sky.shadows, rover.meshes);
  // 2G: faint glow over the horizon at the light–dark boundary (still debated).
  // Fine dust is coloured by the sunlight where it is thrown up (one terrain-horizon lookup per emission).
  const sunCache = new SunlightCache(hm);
  dust.lightAt = (x, z) => (sunCache.isSunlit(x, z, sampleAt(eph.sun, clock.nowMs)) ? 1 : 0);
  const glow = createHorizonGlow(scene, sunCache, {
    sun: () => sampleAt(eph.sun, clock.nowMs),
    playerInSun: () => (survival.lastEnv ? survival.lastEnv.playerInSun : true),
    canAnnounce: () => state.flags.has('dialogue:meetPip:done') && !pip.sleeping && !dialogue.busy && !lock.locked,
  }, () => {
    void dialogue.play('glow_seen');
    if (unlockCard(state, 'horizonGlow')) hud.toast(tr('New discovery in your Science Notebook (Tab)'), 3);
  });
  // Act 2E: the cargo lander, once two modules are up (Plan 5; not in the demo).
  const cargo = opts.demo
    ? null
    : createCargoLanding({
        scene, hm, state, dialogue, hud, pip, dust, pipCoat,
        towerSite: () => (state.modules.has('solarTower') ? modules.entries.get('solarTower')?.site ?? null : null),
        winchBusy: () => winchSys.winch.state !== 'idle' && winchSys.winch.state !== 'done',
        carrying: () => modules.carryingId !== null,
        locked: () => lock.locked,
      });
  bus.on('moduleInstalled', (id) => {
    hud.toast(tr(UPGRADE_TEXT[id]), 5);
    void dialogue.play(`upgrade_${id}`);
  });
  // EDS cleaning of Pip's panels at camp once the habitat is installed (spec v3 §7.1).
  const edsPrompt = (): string | null => {
    const base = zone('base');
    const near = Math.hypot(pip.position.x - player.position.x, pip.position.z - player.position.z) <= 3;
    const inCamp = Math.hypot(player.position.x - base.x, player.position.z - base.z) <= base.radius;
    if (!upgrades().eds || !near || !inCamp || pipCoat.level < 0.02) return null;
    if (keyboard.consume('KeyE')) {
      pipCoat.clean(1);
      repairSys.burstAt(pip.position);
      void dialogue.play('eds_clean');
    }
    return tr("E — EDS-clean Pip's panels");
  };
  const thermal = createThermalView(scene, sky, hud.ui);
  const lock = new InputLock();
  const panel = createStoryPanel(hud.ui, lock);
  let fadeLocked = false;
  let descent: FinalDescent | null = null;
  // Music (Plan 5, Task 8): mood from the game state, motifs on Pip's and MICA's lines.
  const music = opts.music ?? null;
  const musicMem = createMusicMemory();
  let contactT = 0;
  let stung = false;
  let cardsSeen = state.unlockedCards.size;
  // Autosave (Plan 6a): at each milestone and every 30 s, once the landing is done (never in the demo or dev jumps).
  let lastSaveKey = '';
  let saveT = 0;
  dialogue.onLine = (l) => {
    if (!music || micaSys.silent || !motifAllowed(music.debug.cue, l.face)) return;
    if (l.speaker === 'pip' && musicMem.motifReady('pip')) music.motif('pip');
    if (l.speaker === 'mica' && musicMem.motifReady('mica')) music.motif('mica');
  };
  // MICA's memory puzzle (v2 scene 4.5), opened with E on the awake MICA.
  const memory = createMemoryPuzzleView(panel, keyboard, dialogue, state, hud, pip);
  repairSys.onRestoreMemory = () => {
    void dialogue.play('mica_memory_intro').then(() => memory.open());
  };
  // Act 5 in the first real long night at camp (29 Nov – 3 Dec 2028), computed from LOLA + JPL.
  const night = findCampNight(eph, hm, zone('base'), mission.start + 7 * 24 * 3600_000);
  // Houston's heads-up uses the real night: the direction the Sun sets behind and how long the dark lasts.
  const applyNightLines = () => {
    if (!night) return;
    const days = daysText(night.hours);
    const Days = `${days[0].toUpperCase()}${days.slice(1)}`;
    const dir = compass(night.sunsetAzDeg);
    if (getLang() === 'vi') {
      script.act5_news[0].text = `Artemis IV, Houston đây. Lưu ý: khoảng sáu tiếng nữa Mặt Trời sẽ khuất sau dãy đồi phía ${dir} trại. Mô hình địa hình cho thấy các bạn sẽ ở trong bóng tối ${days}.`;
      script.act5_news[3].text = `${Days} không có nắng. Được rồi. Được rồi! Tụi mình chuẩn bị. Lo chỗ trú trước, hoảng sau.`;
    } else {
      script.act5_news[0].text = `Artemis IV, Houston. Heads up: in about six hours the Sun slips behind the hills to the ${dir} of your camp. Our terrain models say you will be in shadow for ${days}.`;
      script.act5_news[3].text = `${Days} without sunlight. Okay. Okay! We prepare. Shelter first, panic later.`;
    }
  };
  applyNightLines();
  // Language switch (Esc menu): new lines and cards use the new language at once.
  const stopLanguageUpdates = onLangChange((l) => {
    for (const k of Object.keys(script)) delete script[k];
    Object.assign(script, structuredClone(linesFor(l)));
    applyNightLines();
    cardList.splice(0, cardList.length, ...(cardsFor(l) as Card[]));
  });
  scene.onDisposeObservable.addOnce(stopLanguageUpdates);
  const act5 = createAct5System({ ui: hud.ui, clock, state, dialogue, hud, pip, lock, towing: () => repairSys.isTowing, stormActive: () => storm.phase === 'warning' || storm.phase === 'storm' }, night);
  const horizon = night ? createHorizonView(panel, keyboard, hm, eph, night, state, dialogue, hud, pip, () => micaSys.mica, () => clock.nowMs) : null;
  if (horizon) act5.hooks.openHorizon = () => horizon.open();
  const leaks = createHeatLeaks(scene, hm, state, pip, dialogue, hud, thermal, () => act5.stage === 'prep');
  const planner = createNightPlanner(panel, keyboard, state, dialogue, hud, pip, () => micaSys.mica, clock, night,
    () => act5.director.next('plannerDone'),
    () => act5.director.next('nightDone'));
  act5.hooks.openPlanner = () => planner.open();
  const ending = createEnding(
    { scene, hm, clock, state, dialogue, hud, pip, mica: () => micaSys.mica, dust, lock, panel, hls: hlsRoot, hlsRig, totalCards: cardList.length, cards: cardList },
    act5.director, night,
  );
  act5.hooks.updateLate = (stage, dt2, p, kb) => ending.update(stage, dt2, p, kb);
  // Updated after the world block (which resets Pip's context command); shown by act5 next frame.
  let leakPrompt: string | null = null;
  act5.hooks.prepPrompt = () => leakPrompt;
  act5.hooks.prepExtras = () => [`${leaksFixed(state.flags) === 3 ? '[x]' : '[ ]'} ${tr('Optional: seal heat leaks with Pip (T thermal view) {n}/3', { n: leaksFixed(state.flags) })}`];

  const demo = opts.demo ? createDemoController({ state, panel, keyboard, stage: () => act5.stage, hours: night?.hours ?? 86,
    begin: () => {
      for (const f of ['dialogue:meetPip:done', 'pip:met', 'act3:micaFound', 'act4:micaAwake', 'act5:started', 'stop:base', 'stop:landing']) state.flags.add(f);
      for (const id of ['habitat', 'radiator', 'antenna', 'solarTower'] as const) { state.modules.add(id); modules.forceInstall(id, true); }
      state.dataLogs.add('radiation');
      repairSys.fastForwardWake(true);
      rover.restore('camp');
      if (night) clock.jumpTo(night.sunsetMs + 2 * 3600_000);
      player.camera.radius = 20;
      player.camera.beta = 1.1;
      player.teleport(SHELTER_POS.x, SHELTER_POS.z + 1);
      pip.root.position.set(SHELTER_POS.x + 2, sampleHeight(hm, SHELTER_POS.x + 2, SHELTER_POS.z), SHELTER_POS.z);
      act5.director.next('start'); act5.director.next('titleDone'); act5.director.next('beginNight');
      planner.open();
    },
  }) : null;

  // Esc menu (Plan 6a): everything stands still while it is open (clock, vitals, Pip, physics, storm).
  let physicsWasEnabled = scene.physicsEnabled;
  const pauseMenu = createPauseMenu(hud.ui, scene, {
    enabled: () => !dormant,
    music,
    phase: () => descent?.active ? 'landing' : 'surface',
    onRestart: opts.onRestart,
    onSkip: () => descent?.skip(),
    onMainMenu: opts.onMainMenu ?? (() => location.assign(location.pathname)),
    hasSave: () => !!loadSave(safeStorage()),
    onChange: (open) => {
      descent?.setPaused(open);
      // The Havok plugin steps by frame time, so a time step of 0 is ignored: switch physics off instead.
      keyboard.reset();
      if (open) {
        physicsWasEnabled = guide.open ? guidePhysics : scene.physicsEnabled;
        scene.physicsEnabled = false;
        player.camera.detachControl();
      } else if (!scene.isDisposed) {
        scene.physicsEnabled = physicsWasEnabled;
        if (!descent?.active && !dormant) player.camera.attachControl(engine.getRenderingCanvas()!, true);
      }
    },
  });

  let guidePhysics = true;
  const guide = createMissionGuide((open) => {
    keyboard.reset();
    gamePauseClock.setPaused(open || pauseMenu.isOpen, performance.now());
    if (open) {
      guidePhysics = scene.physicsEnabled;
      scene.physicsEnabled = false;
      player.camera.detachControl();
    } else {
      scene.physicsEnabled = !pauseMenu.isOpen && guidePhysics;
      if (!pauseMenu.isOpen && !dormant && !descent?.active) player.camera.attachControl(engine.getRenderingCanvas()!, true);
    }
  });
  scene.onDisposeObservable.addOnce(() => guide.dispose());
  if (dormant) player.camera.detachControl();
  scene.onBeforeAnimationsObservable.add(() => {
    if (dormant) return;
    if (!pauseMenu.isOpen && escOpensPause({ descentActive: !!descent?.active, horizonOpen: !!horizon?.active }) && keyboard.consume('Escape')) {
      pauseMenu.open();
    }
  });

  scene.onBeforeRenderObservable.add(() => {
    if (dormant) return;
    const dt = Math.min(engine.getDeltaTime() / 1000, 0.1);
    guide.update(currentObjective({ state, stage: act5.stage, carrying: modules.carryingId, towing: repairSys.isTowing,
      storm: storm.phase === 'warning' || storm.phase === 'storm', lowOxygen: survival.resources.o2 < 20,
      mica: micaSys.mica.root.position, repair: repairSys.repair.stage }), player.position, player.cameraYaw,
      !pauseMenu.isOpen && !panel.open && !notebook.open && !map.open && !descent?.active && !opts.demo && act5.stage !== 'liftoff' && act5.stage !== 'record',
      ['habitat', 'radiator', 'antenna', 'solarTower'].find(id => !state.modules.has(id as ModuleId)) ?? '');
    if (guide.open) { keyboard.endFrame(); music?.update(dt); return; }
    if (pauseMenu.isOpen) {
      keyboard.endFrame();
      music?.update(dt);
      return;
    }
    if (descent?.active) {
      // The lander uses its explicit flight integrator; wake exploration physics/story only after landing.
      scene.physicsEnabled=false;
      descent.update(dt, keyboard); hlsRig.update(dt); dust.update(dt);
      if(music){
        if(keyboard.consume('KeyB'))toggleMusic(music);
        contactT=descent.phase==='contact'?contactT+dt:0;
        if(contactT>=2&&!stung){stung=true;music.stinger('touchdown');}
        music.setTarget(pickMusic({landing:descent.phase==='flying'?(descent.state.h>30?'final':'low'):'none',touchdownHold:descent.phase==='contact'&&contactT<2}));
        music.duck(dialogue.busy);music.update(dt);
      }
      keyboard.endFrame();
      return;
    }
    clock.tick(dt);
    // Story panels and the rescue fade freeze the world behind them (Plan 4 Task 4).
    if (survival.fading !== fadeLocked) {
      fadeLocked = survival.fading;
      if (fadeLocked) lock.push('rescue');
      else lock.pop('rescue');
    }
    // Final descent (Plan 5): flies the HLS down before Act 1; the lock it holds freezes the world input.
    if (descent?.active) descent.update(dt, keyboard);
    hlsRig.update(dt);
    // The rover first, so the driver's seat is where the rover is this frame.
    const roverPrompt = rover.update(dt, keyboard, { locked: lock.locked });
    player.update(dt, sceneInputGate(lock, keyboard.moveInput()));
    // Story beats first: their keys (E at the shelter, 1–4 in panels) win over world interactions.
    demo?.update();
    memory.update();
    horizon?.update();
    planner.update(dt);
    const storyPrompt = act5.update(dt, player, keyboard);
    const meetPrompt = meeting.update(dt, player, keyboard, { descentActive: !!descent?.active, locked: lock.locked });
    let prompt: string | null = null;
    if (!lock.locked && !rover.driving) {
      const modulePrompt = modules.update(dt, player, keyboard);
      const repairPrompt = repairSys.update(dt, player, keyboard);
      const sciencePrompt = science.update(dt, player, keyboard);
      // After modules/repair, which reset Pip's context command every frame.
      const winchPrompt = winchSys.update(dt, player, keyboard);
      const cargoPrompt = cargo?.update(dt, player, keyboard) ?? null;
      cargo?.lateUpdate();
      const brushPrompt = cargo?.brushPrompt(player, keyboard) ?? null;
      const flagPrompt = flagPlant.update(dt, player, keyboard);
      const relayPrompt = relay.update(player, keyboard);
      const darkPrompt = darkCrater.update(player, keyboard);
      const stormPrompt = storm.update(dt, player);
      prompt = stormPrompt ?? cargoPrompt ?? winchPrompt ?? brushPrompt ?? flagPrompt ?? relayPrompt ?? darkPrompt ?? modulePrompt ?? repairPrompt ?? sciencePrompt ?? edsPrompt();
      // Climbing into the rover comes last: every other E action near it wins.
      const boardPrompt = prompt ? null : rover.boardPrompt();
      if (boardPrompt) {
        prompt = boardPrompt;
        if (keyboard.consume('KeyE')) rover.board();
      }
    }
    leakPrompt = lock.locked ? null : leaks.update(player);
    micaSys.update(player);
    if (act5.stage !== 'liftoff' && act5.stage !== 'record' && act5.stage !== 'farewell') journey.update(dt, player);
    boulderTrail.update(player);
    freshCrater.update(player, thermal.on);
    science.thermalOn = thermal.on;
    survival.paused = panel.open || !!descent?.active;
    survival.update(dt, player, !descent?.active);
    science.lidarRangeM = upgrades().lidarRangeM;
    hud.showPrompt(micaSys.silent || lock.locked ? null : storyPrompt ?? meetPrompt ?? roverPrompt ?? prompt, dialogue.bottomInset);
    if (!lock.locked) {
      if (keyboard.consume('Tab')) notebook.toggle();
      if (keyboard.consume('KeyM')) {
        if (upgrades().map) map.toggle();
        else hud.toast(tr('No map yet: align the relay on Earth View Peak first.'), 4);
      }
      if (keyboard.consume('KeyT')) {
        thermal.toggle();
        if (thermal.on && unlockCard(state, 'sunFacingHeat')) hud.toast(tr('New discovery in your Science Notebook (Tab)'), 3);
      }
      if (keyboard.consume('KeyQ')) {
        const cmd = resolveQ(pip.contextCommand, pip.mode);
        if (cmd) pip.command(cmd);
      }
    }
    map.update(player.position, pip.position, state);
    pip.update(dt, player);
    pip.wheelWorldPositions().forEach((w, i) => {
      if (wheelSpacers[i].feed(w.x, w.z)) tracks.stamp(w.x, w.z, pip.heading);
    });
    dust.update(dt);
    playerCoat.addTravel(travelled(player.position, lastPos.player));
    pipCoat.addTravel(travelled(pip.position, lastPos.pip));
    applyCoat(playerCoatMats, playerCoat);
    applyCoat(pipCoatMats, pipCoat);
    sky.update();
    sky.updateNight(dt, survival.lastEnv ? !survival.lastEnv.playerInSun : false);
    glow.update(dt, player, thermal.on);
    if (opts.autosave && state.flags.has('landing:done') && !descent?.active && shouldAutosave(state.flags)) {
      saveT += dt;
      const key = milestoneKey(state);
      if (key !== lastSaveKey || saveT >= 30) {
        lastSaveKey = key;
        saveT = 0;
        writeSave(safeStorage(), state, clock.nowMs);
      }
    }
    if (music) {
      if (keyboard.consume('KeyB')) hud.toast(toggleMusic(music), 2);
      musicMem.tickMotifs(dt);
      // CONTACT: hold the breath for 2 s, then the touchdown chord under the title card.
      const d = descent?.active ? descent : null;
      let landing: MusicInputs['landing'] = 'none';
      let touchdownHold = false;
      if (d && d.phase === 'flying') landing = d.state.h > 30 ? 'final' : 'low';
      if (d && d.phase === 'contact') {
        contactT += dt;
        touchdownHold = contactT < 2;
        if (!touchdownHold && !stung) {
          stung = true;
          music.stinger('touchdown');
        }
      } else contactT = 0;
      const dark = zone('darkCrater');
      const inDark = Math.hypot(player.position.x - dark.x, player.position.z - dark.z) <= dark.radius;
      const r = survival.resources;
      const milestones = [...state.flags].filter((f) => f.startsWith('stop:') || f === 'flag:planted').length;
      const stage = act5.stage;
      music.setTarget(pickMusic({
        micaSilent: micaSys.silent,
        touchdownHold,
        storm: storm.phase === 'warning' || storm.phase === 'storm' ? storm.phase : 'none',
        stormLeftS: storm.leftS,
        landing,
        countdownLeftS: cargo?.countdownLeftS ?? null,
        countdownTotalS: CARGO.warnS,
        tense: inDark || Math.min(r.o2, r.heat, r.pip) < 25 || repairSys.isTowing,
        wonder: musicMem.wonder(dt, milestones),
        act5: stage === 'waiting' || stage === 'titleCard' ? null : stage,
      }));
      if (state.unlockedCards.size > cardsSeen) {
        cardsSeen = state.unlockedCards.size;
        music.stinger('discovery');
      }
      music.duck(dialogue.busy);
      music.update(dt);
    }
    keyboard.endFrame();
    hud.setStatus(descent?.active ? null : {
      nowMs: clock.nowMs,
      modules: state.modules.size,
      samples: state.samples.size,
      sunElevation: sky.sunElevDeg,
      earthElevation: sky.earthElevDeg,
    });
  });

  return {
    scene, hm, clock, sky, state, bus, hud, keyboard, player, pip, rover, modules, dialogue, science, micaSys, repairSys, dust, mission, survival, winchSys, act5, memory, night, lock, panel, cargo, pauseMenu, hlsRig,
    get descent() {
      return descent?.active ? descent : null;
    },
    restore(plan: RestorePlan) {
      hlsRig.setTargets(1, 1, true);
      for (const m of plan.modules) state.modules.add(m as ModuleId);
      for (const x of plan.samples) state.samples.add(x as SampleId);
      for (const x of plan.dataLogs) state.dataLogs.add(x as DataLogId);
      for (const f of plan.flags) state.flags.add(f);
      for (const c of plan.cards) state.unlockedCards.add(c);
      cardsSeen = state.unlockedCards.size;
      // Already in state.modules, so installing emits no 'moduleInstalled' (no dialogue); quiet: no toast.
      for (const m of plan.modules) modules.forceInstall(m as ModuleId, true);
      const steps = restoreSteps(state);
      if (steps.winchDone) winchSys.forceFinish();
      rover.restore(steps.roverAt);
      flagPlant.restore();
      meeting.restore();
      relay.restore();
      darkCrater.restore();
      science.restore();
      storm.restore();
      cargo?.restore();
      if (steps.micaFound) micaSys.stage = 'found';
      if (steps.micaAwakeSilent) repairSys.fastForwardWake(true);
      if (plan.clockMs != null) clock.jumpTo(plan.clockMs);
      const at = plan.where === 'camp' ? { x: zone('base').x + 4, z: zone('base').z + 8 } : PLAYER_SPAWN;
      player.teleport(at.x, at.z);
      pip.root.position.set(at.x + 2, pip.root.position.y, at.z - 2);
      lastSaveKey = milestoneKey(state);
    },
    setDormant(value, held = []) {
      dormant = value; scene.physicsEnabled = !value && !descent?.active;
      if (value) scene.detachControl(); else scene.attachControl();
      keyboard.setEnabled(!value, held);
      if (value || descent?.active) player.camera.detachControl();
      else player.camera.attachControl(engine.getRenderingCanvas()!, true);
    },
    startLanding(assist: boolean, prepared = false) {
      if (descent?.active) return;
      survival.setHudVisible(false);
      descent = createFinalDescent({ scene, hm, ui: hud.ui, state, dust, hud, dialogue, lock, player, pip }, hlsRoot, { assist, rig: hlsRig, groundY: hlsGroundY, prepared, onTouchdown:()=>music?.touchdownImpact?.() });
    },
  };
}
