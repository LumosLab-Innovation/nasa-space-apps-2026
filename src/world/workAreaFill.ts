import { Color3, Light, MultiMaterial, PointLight, PBRMaterial, StandardMaterial, Vector3 } from '@babylonjs/core';
import type { AbstractMesh, Scene } from '@babylonjs/core';
import { CRATES, zone } from './zones';

const radiator = CRATES.find(crate => crate.moduleId === 'radiator')!;
const solarHill = zone('solarHill');
const workAreas = [
  { x: radiator.x, z: radiator.z, radius: 18 },
  solarHill,
];
const AREA_FEATHER_M = 8;
const SHADOW_INTENSITY = 0.58;
const SUN_INTENSITY = 0.15;

/** Local readability light for the two outdoor cargo tasks. It contributes no heat or resource drain. */
export function createWorkAreaFill(scene: Scene, meshes: AbstractMesh[]) {
  const light = new PointLight('workAreaFill', Vector3.Zero(), scene);
  light.falloffType = Light.FALLOFF_STANDARD;
  light.range = 10;
  light.diffuse = new Color3(1, 0.97, 0.92);
  light.specular = Color3.Black();
  light.shadowEnabled = false;
  light.intensity = 0;
  // Keep the same shader layout through fades and mode switches, even at zero intensity.
  light.includedOnlyMeshes = meshes;
  // Only these receivers need an extra slot. Keep the Sun, earthshine and both existing lamps.
  const materials = new Set(meshes.flatMap(({ material }) =>
    material instanceof MultiMaterial ? material.subMaterials : [material]));
  for (const material of materials) {
    if (material instanceof PBRMaterial || material instanceof StandardMaterial) {
      material.maxSimultaneousLights = Math.max(material.maxSimultaneousLights, 5);
    }
  }

  return {
    update(dt: number, player: Vector3, sunlit: boolean, hidden: boolean): void {
      if (hidden) {
        light.intensity = 0;
        return;
      }
      let coverage = 0;
      for (const area of workAreas) {
        const edge = Math.hypot(player.x - area.x, player.z - area.z) - area.radius;
        const t = Math.max(0, Math.min(1, 1 - edge / AREA_FEATHER_M));
        coverage = Math.max(coverage, t * t * (3 - 2 * t));
      }
      const target = coverage * (sunlit ? SUN_INTENSITY : SHADOW_INTENSITY);
      light.intensity += (target - light.intensity) * (1 - Math.exp(-dt / 0.28));
      if (Math.abs(light.intensity - target) < 0.002) light.intensity = target;
      if (light.intensity === 0) return;

      // Light the side the player can see, including the back of the suit when the helmet lamp faces away.
      const eye = scene.activeCamera?.globalPosition ?? player;
      const dx = eye.x - player.x;
      const dz = eye.z - player.z;
      const scale = 1.8 / Math.max(1.8, Math.hypot(dx, dz));
      light.position.set(player.x + dx * scale, player.y + 1.6, player.z + dz * scale);
    },
  };
}
