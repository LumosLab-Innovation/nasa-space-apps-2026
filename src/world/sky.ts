import {
  CascadedShadowGenerator, Color3, Color4, DirectionalLight, Mesh, MeshBuilder, PointsCloudSystem,
  Scene, StandardMaterial, Vector3, type Texture,
} from '@babylonjs/core';
import type { GameClock } from '../core/clock';
import { sampleAt, type Ephemeris } from '../data/ephemeris';
import { createEarthGlobe } from './earthGlobe';
import { azElToDirection, earthPhase } from './skyMath';

const SKY_DIST = 4000;
const SUN_INTENSITY = 4;
/** The Sun's disc is ~0.53° wide; light fades in while the disc crosses the horizon. */
const SUN_HALF_DISC_DEG = 0.27;

export interface Sky {
  cinematicSun: {direction:Vector3;intensity:number}|null;
  sun: DirectionalLight;
  shadows: CascadedShadowGenerator;
  /** Unit vector towards the Sun (world space). */
  sunDir: Vector3;
  sunElevDeg: number;
  earthElevDeg: number;
  stars: Mesh | null;
  /** Thermal camera on: the Sun is the only light, at unit intensity (see ui/thermalView.ts). */
  thermalMode: boolean;
  update(): void;
  /** Night sky: stars fade in after ~8 s in shadow; earthshine follows Earth's real phase (Plan 4). */
  updateNight(dt: number, inShadow: boolean): void;
}

function skyBody(name: string, scene: Scene, angularDiamDeg: number, color: Color3): Mesh {
  const radius = SKY_DIST * Math.tan((angularDiamDeg / 2) * (Math.PI / 180));
  const m = MeshBuilder.CreateSphere(name, { diameter: radius * 2, segments: 24 }, scene);
  const mat = new StandardMaterial(`${name}-mat`, scene);
  mat.emissiveColor = color;
  mat.diffuseColor = Color3.Black();
  mat.specularColor = Color3.Black();
  mat.disableLighting = true;
  m.material = mat;
  m.infiniteDistance = true;
  m.isPickable = false;
  return m;
}

/** Full-Earth earthshine light intensity (1% of the Sun here, exaggerated for dark-adapted eyes; real ratio ~1e-4). */
const EARTHSHINE_FULL = 0.04;
const STAR_ADAPT_S = 8;

export function createSky(scene: Scene, eph: Ephemeris, clock: GameClock, earthTexture: Texture): Sky {
  scene.clearColor = new Color4(0, 0, 0, 1);
  scene.ambientColor = Color3.Black();
  scene.environmentTexture = null;

  const sun = new DirectionalLight('sun', new Vector3(0, -1, 0), scene);
  sun.intensity = SUN_INTENSITY;
  const shadows = new CascadedShadowGenerator(2048, sun);
  shadows.shadowMaxZ = 900;
  shadows.numCascades = 4;
  shadows.lambda = 0.85;
  shadows.stabilizeCascades = true;
  shadows.bias = 0.004;
  shadows.normalBias = 0.12; // tuned visually: lower → contour acne at grazing sun, higher → detached shadows
  shadows.usePercentageCloserFiltering = true;

  const sunDisc = skyBody('sunDisc', scene, 0.53, new Color3(1, 0.98, 0.92));
  const earth = createEarthGlobe('earth', scene, SKY_DIST * Math.tan(0.95 * Math.PI / 180), earthTexture);
  earth.mesh.infiniteDistance = true;
  // Earthshine: weak, shadowless light from Earth's direction, scaled by Earth's phase seen from the Moon.
  const earthshine = new DirectionalLight('earthshine', new Vector3(0, -1, 0), scene);
  earthshine.intensity = 0;
  earthshine.shadowEnabled = false;
  let shadowS = 0;
  let starVis = 0;

  const sky: Sky = {
    cinematicSun:null, sun, shadows, sunDir: new Vector3(0, 1, 0), sunElevDeg: 0, earthElevDeg: 0, stars: null, thermalMode: false,
    update() {
      const s = sampleAt(eph.sun, clock.nowMs);
      const e = sampleAt(eph.earth, clock.nowMs);
      const d = azElToDirection(s.az, s.el);
      sky.sunDir.set(d.x, d.y, d.z);
      sky.sunElevDeg = s.el;
      sky.earthElevDeg = e.el;
      sun.direction.set(-d.x, -d.y, -d.z);
      const visible = Math.min(1, Math.max(0, (s.el + SUN_HALF_DISC_DEG) / (2 * SUN_HALF_DISC_DEG)));
      sun.intensity = (sky.thermalMode ? 1 : SUN_INTENSITY) * visible;
      sunDisc.position.set(d.x * SKY_DIST, d.y * SKY_DIST, d.z * SKY_DIST);
      sunDisc.setEnabled(visible > 0);
      const ed = azElToDirection(e.az, e.el);
      earth.mesh.position.set(ed.x * SKY_DIST, ed.y * SKY_DIST, ed.z * SKY_DIST);
      earth.mesh.setEnabled(e.el > -1);
      earth.setSunDirection(sky.sunDir);
      earthshine.direction.set(-ed.x, -ed.y, -ed.z);
      earthshine.intensity = sky.thermalMode || e.el <= 0 ? 0 : EARTHSHINE_FULL * earthPhase(d, ed);
      if(sky.cinematicSun){sun.direction.copyFrom(sky.cinematicSun.direction);sun.intensity=sky.cinematicSun.intensity;}
    },
    updateNight(dt, inShadow) {
      shadowS = inShadow ? shadowS + dt : 0;
      const target = shadowS > STAR_ADAPT_S ? 1 : 0;
      // Eyes adapt slowly to the dark and lose the stars quickly in sunlight.
      starVis += (target - starVis) * Math.min(1, dt * (target > starVis ? 0.5 : 4));
      if (sky.stars) sky.stars.visibility = starVis;
    },
  };

  // Stars exist but stay invisible: eyes adapted to sunlight cannot see them (spec §7). Plan 4 fades them in.
  const pcs = new PointsCloudSystem('stars', 2, scene);
  pcs.addPoints(1500, (p: { position: Vector3; color: Color4 }) => {
    const u = Math.random() * 2 - 1;
    const a = Math.random() * Math.PI * 2;
    const r = Math.sqrt(1 - u * u);
    p.position = new Vector3(r * Math.cos(a), u, r * Math.sin(a)).scale(SKY_DIST * 1.1);
    p.color = new Color4(1, 1, 1, 1);
  });
  void pcs.buildMeshAsync().then((m) => {
    m.infiniteDistance = true;
    m.visibility = 0;
    m.isPickable = false;
    sky.stars = m;
  });

  sky.update();
  return sky;
}
