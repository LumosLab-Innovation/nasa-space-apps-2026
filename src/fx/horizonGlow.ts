import { Color3, Constants, DynamicTexture, MeshBuilder, StandardMaterial, Vector3, type Mesh, type Scene } from '@babylonjs/core';
import type { SunlightCache } from '../world/lighting';
import { azElToDirection } from '../world/skyMath';

/**
 * 2G (still debated): a faint glow just above the horizon toward the Sun, seen from shadow when the Sun is
 * at the horizon and the ground nearby is lit — the light–dark boundary where Apollo crews saw twilight rays.
 */
export function glowVisible(s: { playerInSun: boolean; sunElDeg: number; litNearby: boolean; thermal: boolean }): boolean {
  return !s.playerInSun && s.sunElDeg >= -1 && s.sunElDeg <= 2 && s.litNearby && !s.thermal;
}

/** True the first time a key is seen (one-shot lines and cards). */
export function firstTime(seen: Set<string>, key: string): boolean {
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
}

const DIST_M = 3000;
const WIDTH_DEG = 25;
const HEIGHT_DEG = 0.6;
const MAX_ALPHA = 0.25;
const FADE_S = 2;
const CHECK_EVERY_S = 2;
const RING_M = 150;

export interface GlowEnv {
  sun: () => { az: number; el: number };
  playerInSun: () => boolean;
  /** Pip only points it out when nothing else is going on (after meeting Pip, dialogue idle). */
  canAnnounce: () => boolean;
}

export function createHorizonGlow(scene: Scene, sunCache: SunlightCache, env: GlowEnv, onFirstSeen: () => void) {
  const w = 2 * DIST_M * Math.tan(((WIDTH_DEG / 2) * Math.PI) / 180);
  const h = 2 * DIST_M * Math.tan(((HEIGHT_DEG / 2) * Math.PI) / 180) * 2;
  const band: Mesh = MeshBuilder.CreatePlane('horizonGlow', { width: w, height: h, sideOrientation: 2 }, scene);
  // Soft-edged warm band: brightest at the bottom centre, fading up and to the sides.
  const tex = new DynamicTexture('horizonGlowTex', { width: 256, height: 32 }, scene, false);
  const ctx = tex.getContext() as CanvasRenderingContext2D;
  for (let x = 0; x < 256; x++) {
    const sx = Math.sin((x / 255) * Math.PI) ** 1.5;
    const g = ctx.createLinearGradient(0, 0, 0, 32);
    g.addColorStop(0, 'rgba(255,240,215,0)');
    g.addColorStop(1, `rgba(255,240,215,${sx.toFixed(3)})`);
    ctx.fillStyle = g;
    ctx.fillRect(x, 0, 1, 32);
  }
  tex.update();
  tex.hasAlpha = true;
  const mat = new StandardMaterial('horizonGlowMat', scene);
  mat.emissiveTexture = tex;
  mat.opacityTexture = tex;
  mat.diffuseColor = Color3.Black();
  mat.disableLighting = true;
  mat.alphaMode = Constants.ALPHA_ADD;
  mat.alpha = 0;
  band.material = mat;
  band.isPickable = false;
  band.setEnabled(false);

  let checkT = CHECK_EVERY_S;
  let litNearby = false;
  let alpha = 0;
  const seen = new Set<string>();

  return {
    get visible(): boolean {
      return alpha > 0.01;
    },
    update(dt: number, player: { position: Vector3 }, thermalOn: boolean): void {
      const sun = env.sun();
      checkT += dt;
      // The ring of eight samples 150 m out is checked every 2 s, never per frame.
      if (checkT >= CHECK_EVERY_S) {
        checkT = 0;
        litNearby = false;
        for (let i = 0; i < 8 && !litNearby; i++) {
          const a = (i / 8) * 2 * Math.PI;
          litNearby = sunCache.isSunlit(player.position.x + RING_M * Math.sin(a), player.position.z + RING_M * Math.cos(a), sun);
        }
      }
      const on = glowVisible({ playerInSun: env.playerInSun(), sunElDeg: sun.el, litNearby, thermal: thermalOn });
      alpha += Math.sign((on ? 1 : 0) - alpha) * Math.min(Math.abs((on ? 1 : 0) - alpha), dt / FADE_S);
      band.setEnabled(alpha > 0.005);
      if (alpha <= 0.005) return;
      mat.alpha = alpha * MAX_ALPHA;
      const d = azElToDirection(sun.az, Math.max(sun.el, 0) + HEIGHT_DEG / 2);
      band.position.set(player.position.x + d.x * DIST_M, player.position.y + d.y * DIST_M, player.position.z + d.z * DIST_M);
      band.rotation.y = Math.atan2(d.x, d.z);
      if (on && alpha > 0.5 && env.canAnnounce() && firstTime(seen, 'glow')) onFirstSeen();
    },
  };
}
