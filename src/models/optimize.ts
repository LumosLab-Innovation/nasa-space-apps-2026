import { Mesh, type AbstractMesh, type TransformNode } from '@babylonjs/core';

/**
 * Performance helpers (plan 2, Task 10). The cascaded shadow map renders every caster once per cascade,
 * so bolts and lenses multiply the cost for no visible gain at a 0.6° Sun.
 */
export function shadowWorthy(mesh: Pick<AbstractMesh, 'getBoundingInfo'>, minRadiusM = 0.15): boolean {
  return mesh.getBoundingInfo().boundingSphere.radiusWorld >= minRadiusM;
}

/**
 * Bakes every mesh under `root` (that does not move on its own) into one multi-material mesh, so a static
 * prop costs one draw call and one shadow caster. Returns the merged mesh, or null if nothing to merge.
 */
export function mergeStatic(root: TransformNode, name: string): Mesh | null {
  const meshes = root.getChildMeshes(false).filter((m): m is Mesh => m instanceof Mesh && m.getTotalVertices() > 0);
  if (meshes.length < 2) return meshes[0] ?? null;
  const merged = Mesh.MergeMeshes(meshes, true, true, undefined, false, true);
  if (!merged) return null;
  merged.name = name;
  merged.receiveShadows = true;
  return merged;
}

/** Registers only the shadow-worthy, visible meshes as casters (world matrices refreshed first). */
export function addCasters(shadows: { addShadowCaster(m: AbstractMesh): void }, meshes: AbstractMesh[], minRadiusM = 0.15): void {
  for (const m of meshes) {
    if (!m.isVisible) continue;
    m.computeWorldMatrix(true);
    if (shadowWorthy(m, minRadiusM)) shadows.addShadowCaster(m);
  }
}
