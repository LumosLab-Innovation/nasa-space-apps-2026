import {
  Matrix, Color3, Color4, Constants, RawCubeTexture, DirectionalLight, FreeCamera, HemisphericLight, MeshBuilder, PBRMaterial, PointsCloudSystem, Quaternion, Scene,
  StandardMaterial, TransformNode, Vector3, ShadowGenerator, type Engine, type Mesh,
} from '@babylonjs/core';
import { AdvancedDynamicTexture, Control, Rectangle, StackPanel } from '@babylonjs/gui';
import type { Music } from '../audio/musicEngine';
import { pickMusic, type MusicInputs } from '../audio/musicMood';
import { toggleMusic } from '../audio/musicSystem';
import { createState } from '../core/gameState';
import { gamePauseClock } from '../core/pause';
import { linesFor } from '../content/content';
import { DialogueRunner } from '../dialogue/runner';
import { BRAKE_START, HLS } from '../landing/descent';
import { IntroDirector, type IntroStage } from '../landing/introDirector';
import { APOLLO11, MOON_R_KM, earthDisc, latLonToSphere } from '../landing/moonMath';
import type { Pip } from '../pip/pip';
import { Keyboard } from '../player/keyboard';
import { createDescentHud } from '../ui/descentHud';
import { createDialogueBox } from '../ui/dialogueBox';
import { getLang, onLangChange, safeStorage, tr } from '../i18n/i18n';
import { createPauseMenu } from '../ui/pauseMenu';
import { formatDay } from '../story/timeText';
import { fitHud, hudNumber } from '../ui/hudWidgets';
import { menuLabel } from '../ui/menuControls';
import { loadWordmarkFont } from '../ui/menuWordmark';
import { loadSave } from '../save/save';
import { loadModel, prepareModels } from '../models/loadModel';
import { createHlsRig, type HlsRig } from '../models/hlsRig';
import { createEarthGlobe, loadEarthTexture } from '../world/earthGlobe';
import { createOrbitalMoon } from '../world/orbitalMoon';
import { createApolloHeritage } from '../world/apolloHeritage';
import { createApolloMarker } from '../ui/apolloMarker';
import { HERITAGE_LAYER, heritageShot } from '../landing/apolloHeritageShot';
import { ORBIT_SUN_LON, readOrbitalElevation, lunarCoordinates, renderedSurfaceRadius, renderedTerrainClearance, type Elevation } from '../world/orbitalTerrain';
import { APOLLO_MODEL, EARTH_TEXTURE, missionFile, MOON_DETAIL_TEXTURE, MOON_TEXTURE, MOON_ELEVATION, MOON_RELIEF_TEXTURE, type MissionFiles } from './missionAssets';
import type { ModelId } from '../models/manifest';
import { type FlightPresentation, type DescentHandoff } from '../landing/descentBridge';
import { LAND } from '../landing/descent';
import type { SurfaceWorld } from './surfaceScene';
import { HLS_POS, PLAYER_SPAWN } from '../world/zones';
import { followCamera, seedFlightFromBase, settleFlightRotation, separationOffsetKm, type CameraFollow } from '../landing/coherentMotion';
import { stepFlight } from '../landing/guidedFlight';
import { createLiveTransition } from '../landing/liveTransition';
import { retireScene } from '../landing/retireScene';
import { flightScale, flightWarp, smoother, flightNearPlaneKm } from '../landing/descentGeometry';
import { descentFraming, landingCamera } from '../landing/descentCamera';
import { BURN_ENTRY_SECONDS, burnEntryBlend, blendBurnCamera } from '../landing/burnEntry';
import {prepareExhaustAssets} from '../fx/exhaustAssets';
import {SpacecraftExhaust} from '../fx/spacecraftExhaust';
import {BrakingPlasma} from '../fx/brakingPlasma';
import {orionAuxiliaries} from '../fx/exhaustNozzles';
import {orionDeparturePower} from '../fx/exhaustState';

/**
 * 1 scene unit = 1 km. The ships are drawn ×100 so they can be seen next to a 1 737 km Moon: the HLS (50 m)
 * is 5 units tall instead of 0.05. Their sizes relative to each other are real.
 */
const SHIP_SCALE = 0.1;
/** The intro orbit is at 15 km, where Apollo-style powered descent begins. */
const ORBIT_H_KM = BRAKE_START.h / 1000;
const START_LON = 20.6;
// The globe's north pole is +Y. Negative yaw turns its longitude eastward in this scene.
const EARTH_SPIN_RAD_PER_S = -2 * Math.PI / 86_164.09;
const OPENING_TITLE_LEAD_S = 0.6;
const OPENING_ROW_S = 1;
const OPENING_ROW_GAP_S = 0.22;
const OPENING_READ_S = 2.8;
const OPENING_TEXT_FADE_S = 0.45;
const ORBIT_REVEAL_S = 1.35;
const LINE_ID: Partial<Record<IntroStage, string>> = {
  m1: 'landing_m1', tranquility: 'landing_tranquility', undock: 'landing_undock', pip: 'landing_burn',
};

export type IntroResult = 'done' | 'skipped';

const v3 = (p: { x: number; y: number; z: number }) => new Vector3(p.x, p.y, p.z);
const surface = (lat: number, lon: number, hKm = 0) => v3(latLonToSphere(lat, lon, MOON_R_KM + hKm));

function mat(scene: Scene, name: string, c: Color3, emissive = 0): StandardMaterial {
  const m = new StandardMaterial(name, scene);
  m.diffuseColor = c;
  m.specularColor = new Color3(0.15, 0.15, 0.15);
  m.emissiveColor = c.scale(emissive);
  return m;
}

/** Low-poly Orion: crew capsule cone on a service module with four X-shaped solar wings (real 5 m / 4 m sizes). */
function buildOrion(scene: Scene): TransformNode {
  const root = new TransformNode('orion', scene);
  const white = mat(scene, 'orionWhite', new Color3(0.85, 0.85, 0.82));
  const capsule = MeshBuilder.CreateCylinder('orionCapsule', { diameterTop: 1.6, diameterBottom: 5, height: 3.3, tessellation: 24 }, scene);
  capsule.material = mat(scene, 'orionCapsule', new Color3(0.55, 0.55, 0.58));
  capsule.position.y = 4.8 / 2 + 3.3 / 2;
  const sm = MeshBuilder.CreateCylinder('orionSM', { diameter: 4, height: 4.8, tessellation: 24 }, scene);
  sm.material = white;
  const wingMat = mat(scene, 'orionWing', new Color3(0.08, 0.12, 0.3), 0.1);
  for (let i = 0; i < 4; i++) {
    const w = MeshBuilder.CreateBox(`orionWing${i}`, { width: 7, height: 0.05, depth: 2 }, scene);
    w.material = wingMat;
    const a = Math.PI / 4 + (i * Math.PI) / 2;
    w.position.set(Math.cos(a) * 5.5, -1, Math.sin(a) * 5.5);
    w.rotation.y = -a;
    w.parent = root;
  }
  capsule.parent = sm.parent = root;
  return root;
}

/** Low-poly Starship HLS: a 9 m × 50 m steel cylinder with a crew window band and landing legs. */
function buildHls(scene: Scene): TransformNode {
  const root = new TransformNode('hlsOrbit', scene);
  const steel = mat(scene, 'hlsSteel', new Color3(0.72, 0.74, 0.78));
  steel.specularColor = new Color3(0.6, 0.6, 0.6);
  const body = MeshBuilder.CreateCylinder('hlsBody', { diameter: 9, height: 42, tessellation: 32 }, scene);
  body.material = steel;
  const nose = MeshBuilder.CreateCylinder('hlsNose', { diameterTop: 2, diameterBottom: 9, height: 8, tessellation: 32 }, scene);
  nose.material = steel;
  nose.position.y = 25;
  const band = MeshBuilder.CreateCylinder('hlsWindows', { diameter: 9.1, height: 1.2, tessellation: 32 }, scene);
  band.material = mat(scene, 'hlsWin', new Color3(0.05, 0.05, 0.07));
  band.position.y = 17;
  for (let i = 0; i < 6; i++) {
    const leg = MeshBuilder.CreateBox(`hlsLeg${i}`, { width: 0.8, height: 6, depth: 0.8 }, scene);
    leg.material = steel;
    const a = (i * Math.PI) / 3;
    leg.position.set(Math.cos(a) * 5, -21, Math.sin(a) * 5);
    leg.rotation.set(Math.sin(a) * 0.35, 0, -Math.cos(a) * 0.35);
    leg.parent = root;
  }
  // Engine plume (vacuum: wide and faint). Its length follows the throttle; hidden at zero.
  body.parent = nose.parent = band.parent = root;
  return root;
}

/**
 * Plan 7: replaces a procedural ship body with its detailed GLB once it loads (the procedural one stays if it
 * cannot). `offsetY` lines the GLB's origin up with the procedural centre; `keep` names meshes to keep (the
 * HLS engine plume). The intro has no environment map, so bare metal would render black: tone it down.
 */
async function swapInModel(scene: Scene, id: ModelId, holder: TransformNode, offsetY: number, keep: (name: string) => boolean): Promise<void> {
  const m = await loadModel(scene, id);
  if (!m || holder.isDisposed()) {
    m?.root.dispose();
    return;
  }
  for (const mesh of holder.getChildMeshes(true)) if (!keep(mesh.name)) mesh.dispose();
  m.root.parent = holder;
  m.root.position.y = offsetY;
  // Local low-intensity reflected light for Orion's metals, without changing scene lighting.
  const faces = Array.from({ length: 6 }, (_, face) => {
    const pixels = new Uint8Array(8 * 8 * 4);
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
      const value = face === 2 ? 25 : face === 3 ? 65 : 32 + y * 3;
      pixels.set([value, value, value + 3, 255], (y * 8 + x) * 4);
    }
    return pixels;
  });
  const reflection = new RawCubeTexture(scene, faces, 8, Constants.TEXTUREFORMAT_RGBA, Constants.TEXTURETYPE_UNSIGNED_BYTE, true);
  reflection.level = 0.5;
  m.root.onDisposeObservable.addOnce(() => reflection.dispose());
  for (const mesh of m.meshes) {
    mesh.isPickable = false;
    const mt = mesh.material;
    if (mt instanceof PBRMaterial) {
      // Orion's GLB owns its metal/insulation/cell response; preserve those distinctions.
      mt.roughness = Math.max(mt.roughness ?? 0.5, 0.23);
      // A little self-light stands in for the reflected Moon/Earth light the intro scene does not have.
      mt.reflectionTexture = reflection;
      mt.environmentIntensity = 0.6;
      mt.emissiveColor = mt.albedoColor.scale(0.08);
      // Texture also modulates the fill: a uniform emissive colour washes solar cells white.
      if (mt.albedoTexture) {
        mt.emissiveTexture = mt.albedoTexture;
        mt.emissiveColor = new Color3(0.12, 0.12, 0.12);
      }
    }
  }
}

/** Local frame on the orbit: up = radial, fwd = due east along the ground track. */
function frameAt(lonDeg: number, hKm: number, elevation: Elevation) {
  const pos = surface(0, lonDeg, hKm + elevation(0, lonDeg));
  const up = pos.normalizeToNew();
  const ahead = surface(0, lonDeg + 0.01).normalize();
  const fwd = ahead.subtract(up.scale(Vector3.Dot(ahead, up))).normalize();
  const side = Vector3.Cross(up, fwd).normalize();
  return { pos, up, fwd, side };
}

/** Point a ship's local +y along `axis` (ships are built standing up). */
function aim(node: TransformNode, axis: Vector3): void {
  const y = Vector3.Up();
  const a = axis.normalizeToNew();
  const c = Vector3.Cross(y, a);
  const d = Vector3.Dot(y, a);
  if (c.length() < 1e-6) {
    node.rotationQuaternion = null;
    node.rotation.set(d > 0 ? 0 : Math.PI, 0, 0);
    return;
  }
  const s = Math.sqrt((1 + d) * 2);
  node.rotationQuaternion = new Quaternion(c.x / s, c.y / s, c.z / s, s / 2);
}

/**
 * The orbital landing intro (v2 M1–M5): Tranquility Base from orbit, undocking, Pip on the radio, the
 * braking burn (interaction 1, hold Space) and a 1202-style program alarm. The mission menu can pause or skip the sequence.
 * Creates and disposes its own Scene.
 */
export async function prepareLandingIntro(
  engine: Engine, files: MissionFiles, opts: { assist: boolean; music?: Music; onMainMenu: () => void; openingUtc: number; destination?: SurfaceWorld; onApproach?:(origin:Vector3,basis:Quaternion,landing:Vector3)=>Promise<void>; onBridge?: (handoff: DescentHandoff) => void },
): Promise<() => Promise<IntroResult>> {
  const elevation = await readOrbitalElevation(missionFile(files, MOON_ELEVATION));
  const scene = new Scene(engine);
  scene.clearColor = new Color4(0, 0, 0, 1);
  const d = new IntroDirector(opts);

  // Physical anchor for a screen-space historical locator, not a surface ring.
  const site = surface(APOLLO11.lat, APOLLO11.lon, elevation(APOLLO11.lat, APOLLO11.lon) + 0.01);
  const siteUp = site.normalizeToNew();
  const siteEast = new Vector3(-siteUp.z, 0, siteUp.x).normalize();
  const siteNorth = Vector3.Cross(siteEast, siteUp).normalize();

  // The orbit shot uses a staged Sun angle so the Moon and the visible Earth crescent share one light.
  // The surface scene uses its own JPL ephemeris at the south-pole camp.
  const sun = new DirectionalLight('sun', surface(0, ORBIT_SUN_LON).normalize().scale(-1), scene);
  sun.intensity = 1.6;
  const moonReady = createOrbitalMoon(
    scene, missionFile(files, MOON_TEXTURE), missionFile(files, MOON_DETAIL_TEXTURE),
    missionFile(files, MOON_RELIEF_TEXTURE), elevation, sun.direction.scale(-1),
  );
  const amb = new HemisphericLight('amb', new Vector3(0, 1, 0), scene);
  amb.intensity = 0.12;
  const towardSun = sun.direction.scale(-1);
  const heritageReady = createApolloHeritage(scene, new Vector3(Vector3.Dot(towardSun,siteEast),Vector3.Dot(towardSun,siteUp),Vector3.Dot(towardSun,siteNorth)), missionFile(files, APOLLO_MODEL));
  // Tight shadow map follows the ships. Terrain self-shadow is baked from LOLA for this fixed Sun.
  const shipShadows = new ShadowGenerator(1024, sun);
  shipShadows.usePercentageCloserFiltering = true;
  shipShadows.bias = 0.00015;
  shipShadows.normalBias = 0.004;
  sun.shadowFrustumSize = 16;
  sun.shadowMinZ = 0.1;
  sun.shadowMaxZ = 60;

  // Place the stars behind Earth so the globe also occludes them on its dark side.
  const pcs = new PointsCloudSystem('introStars', 2, scene);
  pcs.addPoints(2000, (p: { position: Vector3; color: Color4 }) => {
    const u = Math.random() * 2 - 1;
    const a = Math.random() * Math.PI * 2;
    const r = Math.sqrt(1 - u * u);
    p.position = new Vector3(r * Math.cos(a), u, r * Math.sin(a)).scale(97_500);
    const b = 0.5 + Math.random() * 0.5;
    p.color = new Color4(b, b, b, 1);
  });
  // Use a larger Earth in the wide cinematic shot, like a tighter crop of an Earthset photograph.
  // The explorable surface sky keeps the real angular diameter (about 1.9°).
  const EARTH_DIST = 90_000;
  const EARTH_CINEMATIC_SCALE = 2.25;
  const earthReady = loadEarthTexture(scene, missionFile(files, EARTH_TEXTURE)).then((texture) => {
    const earth = createEarthGlobe(
      'introEarth', scene, earthDisc(EARTH_DIST).radius * EARTH_CINEMATIC_SCALE, texture, 1.18,
    );
    const f0 = surface(0, START_LON, ORBIT_H_KM);
    const up0 = f0.normalizeToNew();
    const fwd0 = surface(0, START_LON + 0.01, ORBIT_H_KM).subtract(f0).normalize();
    const side0 = Vector3.Cross(up0, fwd0).normalize();
    // Ahead and a little above the horizon, toward the camera side of the opening shot.
    earth.mesh.position = f0.add(fwd0.scale(0.93).add(up0.scale(0.12)).add(side0.scale(-0.35)).normalize().scale(EARTH_DIST));
    earth.setSunDirection(sun.direction.scale(-1));
    return earth.mesh;
  });

  const starsReady = pcs.buildMeshAsync().then((m) => {
    m.isPickable = false;
  });

  const orion = buildOrion(scene);
  const hls = buildHls(scene);
  for (const m of scene.meshes) if (m.name.startsWith('orion') || m.name.startsWith('hls')) m.isPickable = false;
  const shipNodes = [orion, hls];
  for (const n of shipNodes) n.scaling.setAll(SHIP_SCALE);
  let hlsRig!: HlsRig;
  let exhaust!:SpacecraftExhaust,orionExhaust!:SpacecraftExhaust;
  let brakingPlasma!:BrakingPlasma;
  let hlsNose = 0;
  const shipsReady = Promise.all([prepareExhaustAssets(scene,files),prepareModels(scene, files, ['hls', 'hlsFar', 'orion'])]).then(() => Promise.all([
    (async () => {
      for (const mesh of hls.getChildMeshes()) mesh.dispose();
      hlsRig = await createHlsRig(scene, hls, shipShadows);
      const offset = -hlsRig.dockingHeight / 2;
      hlsRig.setOffset(offset);
      hlsNose = hlsRig.dockingHeight + offset;
      exhaust=new SpacecraftExhaust(scene,hlsRig.exhaustMount,hlsRig.exhaustNozzles());
      brakingPlasma=new BrakingPlasma(scene,hlsRig.exhaustMount);
    })(),
    swapInModel(scene, 'orion', orion, 0, () => false).then(()=>{orionExhaust=new SpacecraftExhaust(scene,orion,orionAuxiliaries(),undefined,false);}),
  ]));

  const cam = new FreeCamera('introCam', Vector3.Zero(), scene);
  // The wide shots leave room for a farther near plane and more precision on the ships' seams.
  const wideShotNearKm = 0.85;
  cam.minZ = wideShotNearKm;
  cam.maxZ = 100_000;
  cam.fov = 0.9;
  scene.activeCamera = cam;
  const camPos = new Vector3();
  const camTgt = new Vector3();
  let camInit = false;

  // UI: dialogue, HUD, and the opening mission card.
  const ui = AdvancedDynamicTexture.CreateFullscreenUI('introUi', true, scene);
  if (ui.layer) ui.layer.layerMask |= HERITAGE_LAYER;
  const apolloMarker = createApolloMarker(ui, scene, site);
  const heritageFade = new Rectangle('heritageFade');
  heritageFade.background = '#000000';heritageFade.thickness = 0;heritageFade.zIndex = 45;
  heritageFade.isHitTestVisible = false;heritageFade.isVisible = false;ui.addControl(heritageFade);
  const pipStub = { setFace() {}, talking: false } as unknown as Pip;
  const script = { ...linesFor(getLang()) };
  const dialogue = createDialogueBox(ui, scene, new DialogueRunner(script, createState()), pipStub);
  const hud = createDescentHud(ui, dialogue);
  const fictionNotice = menuLabel(tr('Cinematic glow — not a lunar atmosphere'), 14, '#FFD390');
  fictionNotice.textWrapping = true;
  fictionNotice.height = '42px';
  fictionNotice.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
  fictionNotice.isVisible = false;
  ui.addControl(fictionNotice);
  fitHud(ui, fictionNotice, width => {
    fictionNotice.width = Math.min(340, width - 28) + 'px';
    fictionNotice.top = width < 800 ? '280px' : '76px';
  });
  // Pip's first radio call gets its motif.
  dialogue.onLine = (l) => {
    if (l.speaker === 'pip') opts.music?.motif('pip');
  };
  const opening = new StackPanel('orbitalMissionCard');
  opening.isHitTestVisible = false;
  opening.spacing = 8;
  opening.zIndex = 953;
  const title = menuLabel('ARTEMIS IV', 48);
  title.fontFamily = await loadWordmarkFont();
  title.fontWeight = '800';
  title.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
  opening.addControl(title);
  const rows = Array.from({ length: 3 }, () => {
    const label = menuLabel('', 17);
    label.fontFamily = 'Consolas, ui-monospace, monospace';
    label.textWrapping = false;
    opening.addControl(label);
    return { label, characters: [] as string[] };
  });
  ui.addControl(opening);

  const typingEndsAt = OPENING_TITLE_LEAD_S + rows.length * OPENING_ROW_S + (rows.length - 1) * OPENING_ROW_GAP_S;
  const fadeTextAt = typingEndsAt + OPENING_READ_S;
  const revealOrbitAt = fadeTextAt + OPENING_TEXT_FADE_S;
  const openingEndsAt = revealOrbitAt + ORBIT_REVEAL_S;
  let openingTime = 0;

  const writeOpening = () => {
    for (const [index, row] of rows.entries()) {
      const start = OPENING_TITLE_LEAD_S + index * (OPENING_ROW_S + OPENING_ROW_GAP_S);
      const fraction = Math.max(0, Math.min(1, (openingTime - start) / OPENING_ROW_S));
      const count = Math.floor(fraction * row.characters.length);
      row.label.text = row.characters.slice(0, count).join('');
    }
  };
  const layoutOpening = (width: number, height: number) => {
    const panelWidth = Math.max(1, Math.min(580, width - 32));
    opening.width = panelWidth + 'px';
    const compact = width < 420 || height < 320;
    title.fontSize = compact ? 36 : 48;
    title.height = (compact ? 50 : 66) + 'px';
    const baseSize = width < 420 ? 14 : 17;
    const context = ui.getContext();
    context.save();
    for (const { label, characters } of rows) {
      // Size each row for its complete text so the letters don't shift as it types.
      const text = characters.join('');
      context.font = `${baseSize}px ${label.fontFamily}`;
      const measured = context.measureText(text).width;
      const size = Math.max(1, Math.min(baseSize, Math.floor(baseSize * (panelWidth - 2) / measured)));
      context.font = `${size}px ${label.fontFamily}`;
      label.fontSize = size;
      label.width = Math.ceil(context.measureText(text).width + 1) + 'px';
      label.height = (compact ? 30 : 28) + 'px';
    }
    context.restore();
  };
  const setOpeningText = () => {
    const time = new Date(opts.openingUtc).toISOString().slice(11, 16);
    const text = [
      formatDay(opts.openingUtc) + ' · ' + time + ' UTC',
      tr('Flight time · 4 days 6 hours'),
      tr('Lunar orbit · 0° latitude · {lon}° E', { lon: hudNumber(START_LON, 2) }),
    ];
    rows.forEach((row, index) => { row.characters = Array.from(text[index].normalize('NFC')); });
    const { width, height } = ui.getSize();
    layoutOpening(width, height);
    writeOpening();
  };
  setOpeningText();
  fitHud(ui, opening, layoutOpening);
  const language = onLangChange((lang) => {
    Object.assign(script, linesFor(lang));
    if (opening.isVisible) setOpeningText();
  });
  scene.onDisposeObservable.addOnce(language);
  const fade = new Rectangle('introFade');
  fade.width = fade.height = 1;
  fade.thickness = 0;
  fade.background = 'black';
  fade.alpha = 1;
  // The opening sits above the flight toolbar. The pause dialog can still open over it.
  fade.zIndex = 952;
  fade.isPointerBlocker = true;
  ui.addControl(fade);

  let lon = START_LON;
  let t = 0;
  let stageT = 0;
  let undockOff = 0;
  let alarmT = -1;
  let fadeOut = -1;
  let lastStage: IntroStage | null = null;
  let warnCooldown = 0;
  let holdT = 0;
  let tranquilityDialogueDone = false;
  let heritageExitT = 0;
  let returnFadeT = 0;
  let wasLocal = false;

  let live:Awaited<ReturnType<typeof createLiveTransition>>|undefined;
  let earth: Mesh;
  let heritage: Awaited<ReturnType<typeof createApolloHeritage>>;
  try {
    // Observe every preparation failure and settle outstanding loaders before releasing the scene.
    const prepared = await Promise.allSettled([earthReady, heritageReady, moonReady, starsReady, shipsReady]);
    const failure = prepared.find((result) => result.status === 'rejected');
    if (failure?.status === 'rejected') throw failure.reason;
    earth = (prepared[0] as PromiseFulfilledResult<Mesh>).value;
    heritage = (prepared[1] as PromiseFulfilledResult<Awaited<ReturnType<typeof createApolloHeritage>>>).value;
    sun.excludedMeshes = heritage.meshes;
    amb.excludedMeshes = heritage.meshes;
    for (const mesh of orion.getChildMeshes()) {
      if (mesh.name.startsWith('exhaust')) continue;
      shipShadows.addShadowCaster(mesh, false);
      mesh.receiveShadows = true;
    }
    await scene.whenReadyAsync();
    await hlsRig.warm();
    await exhaust.warm();await orionExhaust.warm();await brakingPlasma.warm();
    if(opts.destination){
      cam.position.copyFrom(frameAt(START_LON,ORBIT_H_KM,elevation).pos.add(new Vector3(9,2,-6)));cam.setTarget(frameAt(START_LON,ORBIT_H_KM,elevation).pos);
      live=await createLiveTransition(engine,scene,opts.destination.scene);live.warm();
    }
  } catch (error) {
    scene.dispose();
    throw error;
  }

  return () => new Promise<IntroResult>((resolve) => {
    const keyboard = new Keyboard();
    let openingStartedAt: number | undefined;
    const flightLayers = cam.layerMask;
    // Draw only the GUI while the black card covers the orbital scene.
    const openingLayer = 0x10000000;
    if (ui.layer) {
      ui.layer.layerMask |= openingLayer;
      cam.layerMask = openingLayer;
    }
    if (import.meta.env.DEV) (window as unknown as { __intro: unknown }).__intro = { director: d, scene, hlsRig, get bridgeTime() { return bridge?.time ?? null; }, get burnEntryTime() { return burnEntry?.elapsed ?? null; } };
    let bridge: { time:number; blend:number; last?:FlightPresentation } | null = null;
    let approach: {ready:boolean;landing:Vector3;yaw:number;basis:Quaternion;local:(p:Vector3)=>Vector3;velocity:(p:Vector3)=>Vector3;world:(p:Vector3)=>Vector3} | null=null;
    let burnEntry: { elapsed: number; cameraVelocity:Vector3; targetVelocity:Vector3; camera: Vector3; target: Vector3; shipRotation: Quaternion; shipScale: number } | null = null;
    let orionLon: number | null = null;
    let flightDatum=0,flightLon=0;
    let followPosition:CameraFollow|undefined,followTarget:CameraFollow|undefined;
    let lastWantPos:Vector3|undefined,lastWantTarget:Vector3|undefined;
    let separationTime=0;
    let separationDialogueDone=false;
    let previousPosition=new Vector3(),previousCamera=new Vector3(),previousTarget=new Vector3();
    let velocityReady=false,shipVelocity=new Vector3(),cameraVelocity=new Vector3(),targetVelocity=new Vector3();
    let finished = false;
    let skipRequested = false;
    const pauseMenu = createPauseMenu(ui, scene, {
      enabled:()=>!finished, music: opts.music ?? null, phase: () => 'orbit', hasSave: () => !!loadSave(safeStorage()),
      onSkip: () => { skipRequested = true; }, onMainMenu: opts.onMainMenu,
      onChange: () => keyboard.reset(),
    });
    const finish = (r: IntroResult) => {
      if (finished) return;
      finished = true;
      engine.stopRenderLoop(loop);
      pauseMenu.close();
      keyboard.dispose();
      hud.dispose();
      dialogue.cancel();ui.dispose();
      retireScene(scene,()=>live?.dispose());
      if (import.meta.env.DEV) delete (window as unknown as { __intro?: unknown }).__intro;
      resolve(r);
    };

    const loop = () => {
      const dt = Math.min(engine.getDeltaTime() / 1000, 0.1);
      if (skipRequested) return finish('skipped');
      if (keyboard.consume('Escape')) pauseMenu.open();
      if (pauseMenu.isOpen) {
        keyboard.endFrame();
        opts.music?.update(dt);
        if(bridge&&live)live.render(bridge.blend,ui.layer);else scene.render();
        return;
      }
      const music = opts.music;
      if (music && keyboard.consume('KeyB')) toggleMusic(music);
      if (openingTime < openingEndsAt) {
        const now = gamePauseClock.now(performance.now());
        openingStartedAt ??= now;
        let elapsed = (now - openingStartedAt) / 1000;
        if (keyboard.consume('Enter') && elapsed < fadeTextAt) {
          elapsed = fadeTextAt;
          openingStartedAt = now - elapsed * 1000;
        } else if (openingTime < typingEndsAt && elapsed >= typingEndsAt) {
          // Give the full card its reading time even if a slow frame ran past the final letter.
          elapsed = typingEndsAt;
          openingStartedAt = now - elapsed * 1000;
        }
        openingTime = Math.min(openingEndsAt, elapsed);
        if (openingTime < revealOrbitAt) {
          writeOpening();
          const textFade = Math.max(0, (openingTime - fadeTextAt) / OPENING_TEXT_FADE_S);
          opening.alpha = Math.max(0, 1 - textFade);
          music?.update(dt);
          scene.render();
          keyboard.endFrame();
          return;
        }

        if (opening.isVisible) {
          opening.isVisible = false;
          cam.layerMask = flightLayers;
        }
        const reveal = (openingTime - revealOrbitAt) / ORBIT_REVEAL_S;
        fade.alpha = Math.max(0, 1 - reveal);
        if (openingTime === openingEndsAt) {
          fade.isVisible = false;
          fade.zIndex = 50;
          fade.isPointerBlocker = false;
        }
      }

      t += dt;
      earth.rotation.y = t * EARTH_SPIN_RAD_PER_S;
      stageT += dt;
      if (music) {
        const landing: MusicInputs['landing'] =
          d.stage === 'brake' || d.stage === 'done' ? (alarmT >= 0 && alarmT < 6 ? 'alarm' : 'braking') : 'cruise';
        music.setTarget(pickMusic({ landing }));
        music.update(dt);
        music.duck(dialogue.busy);
      }

      if(d.stage==='pip'&&separationDialogueDone&&separationTime>=6)d.next();
      if (openingTime === openingEndsAt && d.stage !== lastStage) {
        if(d.stage === 'brake') {
          burnEntry = { elapsed: 0, cameraVelocity:cameraVelocity.clone().scale(.001),targetVelocity:targetVelocity.clone().scale(.001), camera: camPos.clone(), target: camTgt.clone(),
            shipRotation: hls.rotationQuaternion!.clone(), shipScale: hls.scaling.x };
          orionLon = lon;
          // Seed from the already-rendered rig base, not the x100 visual centre.
          const startCoord=lunarCoordinates(previousPosition.scale(.001));
          flightDatum=renderedSurfaceRadius(startCoord.lat,startCoord.lon,elevation)*1000;
          const seed=seedFlightFromBase(previousPosition,shipVelocity,flightDatum);
          flightLon=seed.longitude;lon=flightLon;undockOff=0;d.flight=seed.flight;
          d.brake.h=d.flight.y;
        }
        lastStage = d.stage;
        stageT = 0;
        const id = LINE_ID[d.stage];
        const stageAtStart = d.stage;
        if (stageAtStart === 'tranquility') { tranquilityDialogueDone = false;heritageExitT = 0; }
        if (id) void dialogue.play(id).then(() => {
          if (finished || d.stage !== stageAtStart) return;
          if (stageAtStart === 'tranquility') tranquilityDialogueDone = true;
          else if(stageAtStart==='pip')separationDialogueDone=true;
          else d.next();
        });
        if (d.stage === 'brake' && d.assist) void dialogue.play('landing_brake_assist');
      }

      if (d.stage === 'tranquility' && tranquilityDialogueDone && stageT >= 14.1) {
        heritageExitT += dt;
        if (heritageExitT >= .5) { d.next();returnFadeT = .5; }
      }
      const shot = heritageShot(stageT);
      const localView = d.stage === 'tranquility' && shot.local;
      if (localView !== wasLocal) {
        heritage.setActive(localView);camInit = false;wasLocal = localView;
      }
      cam.layerMask = localView ? HERITAGE_LAYER : flightLayers;
      cam.maxZ = localView ? 2000 : 100_000;
      const heritageAlpha = d.stage === 'tranquility' ? Math.max(shot.fade,Math.min(1,heritageExitT/.5)) : returnFadeT/.5;
      heritageFade.isVisible = heritageAlpha > 0;heritageFade.alpha = heritageAlpha;
      if (d.stage !== 'tranquility') returnFadeT = Math.max(0,returnFadeT-dt);

      // Orbit motion: real low-orbit angular speed until the burn, then the ground track of the descent.
      const R = (MOON_R_KM + ORBIT_H_KM) * 1000;
      if (d.stage !== 'brake' && d.stage !== 'done') lon += ((BRAKE_START.v * dt) / R) * (180 / Math.PI);

      if (burnEntry) burnEntry.elapsed = Math.min(BURN_ENTRY_SECONDS, burnEntry.elapsed + dt);
      const aligningBurn = !!burnEntry && burnEntry.elapsed < BURN_ENTRY_SECONDS;
      const warp=flightWarp(Math.max(0,stageT-BURN_ENTRY_SECONDS),d.brake.h);
      if (d.stage === 'brake') {
        const radius=MOON_R_KM*1000;
        d.ground=renderedSurfaceRadius(0,lon,elevation)*1000-flightDatum;
        const ev = d.stepBrake(dt, keyboard.isHeld('Space')?1:0, warp);
        lon=flightLon+d.flight.x/radius*180/Math.PI;
        d.ground=renderedSurfaceRadius(0,lon,elevation)*1000-flightDatum;
        d.brake.h=d.flight.y-d.ground;
        // The controller sampled the old ground before advancing; only finish on the new terrain.
        if(d.brake.h>300)d.stage='brake';
        warnCooldown -= dt;
        for (const e of ev) {
          if (e === 'alarm') {
            alarmT = 0;
            void dialogue.play('landing_alarm');
          } else if (e === 'bandWarn' && !dialogue.busy && warnCooldown <= 0) {
            warnCooldown = 8;
            void dialogue.play(d.brake.v > d.band.hi ? 'landing_warn_fast' : 'landing_warn_slow');
          } else if (e === 'done') {
            fadeOut = 0;
          }
        }
        const b = d.band;
        hud.showBrake({
          v: d.brake.v, h: d.brake.h, fuelKg: d.brake.fuelKg, fuelMaxKg: HLS.fuelKg, throttle: d.throttle,
          centre: (b.lo + b.hi) / 2, band: 0.12, warp, assist: d.assist,
        });
      }
      if (aligningBurn) {
        const b=d.band;
        hud.showBrake({v:d.brake.v,h:d.brake.h,fuelKg:d.brake.fuelKg,fuelMaxKg:HLS.fuelKg,
          throttle:d.throttle,centre:(b.lo+b.hi)/2,band:.12,warp,assist:d.assist,guidance:true});
      }
      if (alarmT >= 0) {
        alarmT += dt;
        hud.alarm(alarmT < 6 ? tr('PROGRAM ALARM 1202 — COMPUTER OVERLOAD') : null);
      }

      // Ships: docked nose to nose until undocking, then the HLS drops below and ahead.
      const hKm = d.stage === 'brake' || d.stage === 'done' ? d.brake.h / 1000 : ORBIT_H_KM;
      const f = frameAt(lon, hKm, elevation);
      if (d.stage === 'undock' || d.stage === 'pip') {
        separationTime+=dt;
        undockOff=separationOffsetKm(separationTime);
      }
      const hlsPos = f.pos.add(f.up.scale(-Math.min(undockOff * 0.4, hKm * 0.15))).add(f.fwd.scale(undockOff));
      const shipClearance = Math.max(0.12, hKm * 0.2);
      const lift = shipClearance - renderedTerrainClearance(hlsPos, elevation);
      if (lift > 0) hlsPos.addInPlace(hlsPos.normalizeToNew().scale(lift));
      hls.position.copyFrom(hlsPos);
      aim(hls, f.fwd.scale(-1));
      // Nose to nose: HLS adapter from the model anchor, Orion capsule tip 5.7 m from its centre.
      // Orion stays in lunar orbit instead of vanishing when the pilot receives control.
      if (orionLon != null) orionLon += ((BRAKE_START.v * dt * warp) / R) * (180 / Math.PI);
      const orionFrame = orionLon == null ? f : frameAt(orionLon, ORBIT_H_KM, elevation);
      orion.position.copyFrom(orionFrame.pos.add(orionFrame.fwd.scale(-(hlsNose + 5.7) * SHIP_SCALE)));
      aim(orion, orionFrame.fwd);
      orion.setEnabled(true);
      sun.position.copyFrom(hlsPos.subtract(sun.direction.scale(30)));

      // Camera shots.
      let wantPos: Vector3;
      let wantTgt: Vector3;
      let up = f.up;
      cam.minZ = wideShotNearKm;
      if (localView) {
        cam.minZ = .12;
        wantTgt = new Vector3(-1.1,1.0,-.5);
        wantPos = Vector3.Lerp(new Vector3(22,32,-47),new Vector3(-7.5,6,-12),shot.travel);
        up = Vector3.Up();
      } else if (d.stage === 'tranquility') {
        const above = site.normalizeToNew();
        wantTgt = site;
        wantPos = site.add(above.scale(260)).add(f.fwd.scale(-160));
        up = f.fwd;
      } else if (d.stage === 'brake' || d.stage === 'done') {
        // Chase camera: behind and above the HLS, closer as it gets lower; the ship shrinks with the shot.
        const framing=descentFraming(d.brake.h),dist=framing.distance/1000;
        cam.minZ = .0005;
        const k = Math.min(1, dist / 18);
        sun.shadowFrustumSize = Math.max(1, dist * 1.1);
        shipShadows.normalBias = 0.004 * k;
        hls.scaling.setAll(flightScale(d.brake.h));
        aim(hls, f.fwd.scale(-Math.sin(d.flight.pitch)).add(f.up.scale(Math.cos(d.flight.pitch))));
        const bias=dist*Math.tan(cam.fov/2)*(.08*smoother((1000-d.brake.h)/700)+3.4*framing.screenDrop);
        wantTgt = hlsPos.add(f.fwd.scale(dist*.6)).add(f.up.scale(bias));
        wantPos = hlsPos.add(f.fwd.scale(-dist)).add(f.up.scale(dist*.45)).add(f.side.scale(dist*.3));
      } else {
        const swing = Math.sin(t * 0.08) * 0.4;
        wantTgt = f.pos.add(f.fwd.scale(2));
        wantPos = f.pos.add(f.side.scale(9 + swing * 3)).add(f.up.scale(2.5)).add(f.fwd.scale(-6));
      }
      if (burnEntry) {
        const blend=burnEntryBlend(burnEntry.elapsed);
        hls.rotationQuaternion=Quaternion.Slerp(burnEntry.shipRotation,hls.rotationQuaternion!,blend);
        hls.scaling.setAll(burnEntry.shipScale+(hls.scaling.x-burnEntry.shipScale)*blend);
      }
      if(d.stage==='brake'||d.stage==='done'){
        const axis=Vector3.TransformNormal(Vector3.Up(),Matrix.Compose(Vector3.One(),hls.rotationQuaternion!,Vector3.Zero())).normalize();
        // The flight origin is the standing lander's base, shared with the final scene.
        const radial=f.up;
        const physicalRoot=radial.scale((flightDatum+d.flight.y)*.001);
        const center=physicalRoot.add(axis.scale(hlsRig.dockingHeight*.5*hls.scaling.x));
        const delta=center.subtract(hls.position);hls.position.copyFrom(center);
        wantPos.addInPlace(delta);wantTgt.addInPlace(delta);
      }
      // First compose the physical centre/chase goal. Only that goal receives the
      // base correction; translating the captured outgoing camera caused the ignition kick.
      if(burnEntry){
        wantPos=blendBurnCamera(burnEntry.camera,burnEntry.cameraVelocity,wantPos,burnEntry.elapsed);
        wantTgt=blendBurnCamera(burnEntry.target,burnEntry.targetVelocity,wantTgt,burnEntry.elapsed);
        if(!aligningBurn)burnEntry=null;
      }
      if (!camInit) {
        camPos.copyFrom(wantPos);
        camTgt.copyFrom(wantTgt);
        camInit = true;
      }
      const isFlight=d.stage==='brake'||d.stage==='done';
      if(isFlight&&!burnEntry){
        const goal=wantPos.scale(1000),target=wantTgt.scale(1000);
        const speed=lastWantPos?goal.subtract(lastWantPos).scale(1/dt):cameraVelocity;
        const targetSpeed=lastWantTarget?target.subtract(lastWantTarget).scale(1/dt):targetVelocity;
        followPosition=followCamera(followPosition??{position:camPos.scale(1000),velocity:speed},goal,speed,dt);
        followTarget=followCamera(followTarget??{position:camTgt.scale(1000),velocity:targetSpeed},target,targetSpeed,dt);
        camPos.copyFrom(followPosition.position.scale(.001));camTgt.copyFrom(followTarget.position.scale(.001));
        lastWantPos=goal;lastWantTarget=target;
      }else{
        const blend=localView||isFlight?1:Math.min(1,dt*1.2);
        camPos.addInPlace(wantPos.subtract(camPos).scale(blend));camTgt.addInPlace(wantTgt.subtract(camTgt).scale(blend));
        followPosition=followTarget=undefined;lastWantPos=lastWantTarget=undefined;
      }
      const cameraLift = cam.minZ + 0.12 - renderedTerrainClearance(camPos, elevation);
      if (!localView && cameraLift > 0) camPos.addInPlace(camPos.normalizeToNew().scale(cameraLift));
      cam.position.copyFrom(camPos);
      cam.upVector = up;
      cam.setTarget(camTgt);
      // Do this after camera placement: clipping must not feed back into the camera path.
      // A fixed 0.5 m near plane at the wide burn-entry shot made thin hatch skins
      // lose the depth test against their inner faces. Bound both spacecraft and terrain.
      const updateFlightDepth=()=>{
        const hullGap=Math.min(Vector3.Distance(cam.position,hls.position)-60*hls.scaling.x,
          Vector3.Distance(cam.position,orion.position)-15*orion.scaling.x);
        cam.minZ=flightNearPlaneKm(hullGap,renderedTerrainClearance(cam.position,elevation));
      };
      if(isFlight)updateFlightDepth();
      brakingPlasma.update(dt,isFlight,d.brake.h,d.throttle);
      fictionNotice.isVisible = brakingPlasma.diagnostics.power > 0.01;
      fictionNotice.text = tr('Cinematic glow — not a lunar atmosphere');
      if(import.meta.env.DEV)Object.assign(scene.metadata??(scene.metadata={}),{brakingPlasma:brakingPlasma.diagnostics});
      apolloMarker.update(openingTime === openingEndsAt && (d.stage === 'm1' || d.stage === 'tranquility'),localView,1-heritageAlpha);

      const root=Vector3.TransformCoordinates(new Vector3(0,-hlsRig.dockingHeight/2,0),hls.computeWorldMatrix(true)).scale(1000),cp=cam.position.scale(1000),ct=camTgt.scale(1000);
      if(velocityReady&&dt>0){shipVelocity=root.subtract(previousPosition).scale(1/dt);cameraVelocity=cp.subtract(previousCamera).scale(1/dt);targetVelocity=ct.subtract(previousTarget).scale(1/dt);}
      previousPosition.copyFrom(root);previousCamera.copyFrom(cp);previousTarget.copyFrom(ct);velocityReady=true;
      if(!approach && opts.onBridge && opts.destination && (d.stage==='brake'||d.stage==='done') && d.brake.h<=360){
        const yaw=Math.atan2(PLAYER_SPAWN.x-HLS_POS.x,PLAYER_SPAWN.z-HLS_POS.z);
        const landing=opts.destination.hlsRig.parent.position.subtract(new Vector3(0,300,0));
        const up=root.normalizeToNew(),forward=f.fwd.subtract(up.scale(Vector3.Dot(f.fwd,up))).normalize(),right=Vector3.Cross(forward,up).normalize();
        const x=forward.scale(Math.cos(yaw)).add(right.scale(Math.sin(yaw))),z=forward.scale(-Math.sin(yaw)).add(right.scale(Math.cos(yaw)));
        const matrix=Matrix.FromValues(x.x,x.y,x.z,0,up.x,up.y,up.z,0,z.x,z.y,z.z,0,0,0,0,1),basis=Quaternion.FromRotationMatrix(matrix);
        let predicted={...d.flight,y:d.brake.h},elapsed=0;
        while(predicted.y>300&&elapsed<8){predicted=stepFlight(predicted,{assist:d.assist,throttle:d.throttle},1/60);elapsed+=1/60;}
        const endPoint=root.scale(.001).add(forward.scale((predicted.x-d.flight.x)/1000));const coord=lunarCoordinates(endPoint);
        const origin=surface(coord.lat,coord.lon,renderedSurfaceRadius(coord.lat,coord.lon,elevation)-MOON_R_KM);
        const local=(p:Vector3)=>{const delta=p.scale(.001).subtract(origin).scale(1000);return landing.add(new Vector3(Vector3.Dot(delta,x),Vector3.Dot(delta,up),Vector3.Dot(delta,z)));};
        const velocity=(p:Vector3)=>new Vector3(Vector3.Dot(p,x),Vector3.Dot(p,up),Vector3.Dot(p,z));
        const world=(p:Vector3)=>{const delta=p.subtract(landing).scale(.001);return origin.add(x.scale(delta.x)).add(up.scale(delta.y)).add(z.scale(delta.z));};
        approach={ready:true,landing,yaw,basis,local,velocity,world};bridge={time:0,blend:0};
      }
      if(approach&&bridge){
        bridge.time+=dt;
        const {local,basis,yaw,world}=approach;
        const position=local(root),alpha=yaw+Math.PI*.75;
        const framing=landingCamera(d.brake.h);
        const target=position.add(new Vector3(0,framing.targetHeight,0));
        const direction=new Vector3(Math.cos(alpha)*Math.sin(framing.beta),Math.cos(framing.beta),Math.sin(alpha)*Math.sin(framing.beta));
        const endCamera=target.add(direction.scale(framing.radius));
        const blend=smoother((360-d.brake.h)/60);
        const blendedCamera=Vector3.Lerp(local(cp),endCamera,blend),blendedTarget=Vector3.Lerp(local(ct),target,blend);
        cam.position.copyFrom(world(blendedCamera));cam.setTarget(world(blendedTarget));
        updateFlightDepth();
        if(d.brake.h<340)hlsRig.setTargets(1,0);
        const rotation=settleFlightRotation(basis.conjugate().multiply(hls.rotationQuaternion!),yaw,d.flight.pitch,(360-d.brake.h)/60);
        hls.rotationQuaternion=basis.multiply(rotation);
        exhaust.update(dt,d.throttle,true);orionExhaust.update(dt,0,false,false,0);
        const presentation:FlightPresentation={position:position.asArray(),rotation:rotation.asArray(),scale:1,
          camera:blendedCamera.asArray(),target:blendedTarget.asArray(),up:[0,1,0],fov:cam.fov,
          h:d.brake.h,vy:d.flight.vy,vx:d.flight.vx,offset:0,throttle:d.throttle,rig:hlsRig.snapshotMotion(),exhaust:exhaust.snapshot()};
        bridge.last=presentation;bridge.blend=smoother((340-d.brake.h)/25);
        hud.alarm(null);hud.showLand({...presentation,tiltDeg:-d.flight.pitch*180/Math.PI,fuelKg:LAND.fuelKg,fuelMaxKg:LAND.fuelKg,autopilot:d.assist,guidance:true});
        opts.destination?.descent?.present(presentation);
        if(live)live.render(bridge.blend,ui.layer);else scene.render();
        if(d.brake.h<=300){opts.onBridge!({startHeight:d.brake.h,startSpeed:d.flight.vx,throttle:d.throttle,cameraPosition:presentation.camera,cameraTarget:presentation.target,cameraUp:[0,1,0],fov:cam.fov,rig:presentation.rig,held:keyboard.heldCodes(),presentation});return finish('done');}
        hlsRig.update(dt);keyboard.endFrame();return;
      }
      // Fades.
      // After the burn, wait for the alarm exchange to finish (at most 10 s) before fading out.
      if (opts.onBridge) fadeOut = -1;
      if (fadeOut >= 0 && fadeOut < 0.01 && dialogue.busy && holdT < 10) {
        holdT += dt;
      } else if (fadeOut >= 0) {
        fadeOut += dt;
        fade.isVisible = true;
        fade.alpha = Math.min(1, fadeOut);
        if (fadeOut >= 1.2) return finish('done');
      }
      hlsRig.update(dt);
      exhaust.update(dt,d.stage==='brake'||d.stage==='done'?d.throttle:0,separationTime>.25&&!localView);
      orionExhaust.update(dt,0,false,false,orionDeparturePower(d.stage,stageT));
      if(import.meta.env.DEV)Object.assign(scene.metadata??(scene.metadata={}),{exhaust:exhaust.diagnostics,orionExhaust:orionExhaust.diagnostics});
      scene.render();
      keyboard.endFrame();
    };
    engine.runRenderLoop(loop);
  });
}
