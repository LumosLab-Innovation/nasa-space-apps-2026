import { Color3, Matrix, Mesh, StandardMaterial, Vector3, VertexData, type Scene } from '@babylonjs/core';
import { Container, Ellipse, Line, type AdvancedDynamicTexture } from '@babylonjs/gui';
import type { Heightmap } from '../data/heightmap';
import { terrainSurfaceHeight, terrainBlocksSight } from '../world/terrainQuery';

interface ReticleTarget {
  name: string;
  position: () => { x: number; z: number } | null;
  emphasized?: boolean;
  groundRing?: {
    mesh: Mesh;
    distanceFromPlayer: () => number;
    startsAtM: number;
    fullAtM: number;
  };
}

const GROUND_CLEARANCE_M = 0.12;

export function createTerrainRing(
  name: string, scene: Scene, hm: Heightmap, center: { x: number; z: number }, radius: number,
): Mesh {
  const segments = 128;
  const halfWidth = 0.09;
  const positions: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i < segments; i++) {
    const angle = i * Math.PI * 2 / segments;
    // Follow the actual rendered height at both edges of the band.
    for (const edge of [radius - halfWidth, radius + halfWidth]) {
      const x = center.x + Math.cos(angle) * edge;
      const z = center.z + Math.sin(angle) * edge;
      positions.push(x, terrainSurfaceHeight(hm, x, z) + 0.065, z);
    }
    const a = i * 2;
    const next = ((i + 1) % segments) * 2;
    indices.push(a, a + 1, next, next, a + 1, next + 1);
  }
  const mesh = new Mesh(name, scene);
  const data = new VertexData();
  data.positions = positions;
  data.indices = indices;
  data.applyToMesh(mesh);
  const material = new StandardMaterial(`${name}Material`, scene);
  material.disableLighting = true;
  material.backFaceCulling = false;
  material.emissiveColor = new Color3(1, 0.62, 0.19);
  mesh.material = material;
  mesh.isPickable = false;
  mesh.setEnabled(false);
  return mesh;
}

export function addTerrainReticles(
  ui: AdvancedDynamicTexture,
  scene: Scene,
  hm: Heightmap,
  targets: ReticleTarget[],
  enabled: () => boolean,
): void {
  const reticles = targets.map(({ name, position, emphasized, groundRing }) => {
    const root = new Container(name);
    root.isVisible = root.isHitTestVisible = false;
    const size = emphasized ? 44 : 26;
    const cornerLength = emphasized ? 11 : 6;
    const padding = emphasized ? 4 : 1;
    const halfExtent = size / 2 + padding;
    // Move one container to the projected point so its corners always move together.
    root.width = root.height = `${halfExtent * 2}px`;
    const stroke = (x1: number, y1: number, x2: number, y2: number) => {
      const line = new Line();
      line.color = '#e7fcff';
      line.lineWidth = emphasized ? 2.6 : 1.3;
      if (emphasized) {
        line.shadowColor = '#081322';
        line.shadowBlur = 3;
      }
      line.isHitTestVisible = false;
      line.x1 = x1;
      line.y1 = y1;
      line.x2 = x2;
      line.y2 = y2;
      root.addControl(line);
    };
    for (const x of [padding, padding + size]) {
      for (const y of [padding, padding + size]) {
        stroke(x, y, x + (x === padding ? cornerLength : -cornerLength), y);
        stroke(x, y, x, y + (y === padding ? cornerLength : -cornerLength));
      }
    }
    if (groundRing) {
      const dot = new Ellipse(`${name}Center`);
      dot.width = dot.height = '8px';
      dot.background = '#e7fcff';
      dot.color = '#081322';
      dot.thickness = 1.5;
      dot.isHitTestVisible = false;
      root.addControl(dot);
    }
    ui.addControl(root);
    return { root, position, halfExtent, groundRing };
  });

  const identity = Matrix.Identity();
  const point = new Vector3();
  const screen = new Vector3();
  // Update after the camera matrices are ready, before the GUI draws this frame.
  scene.onBeforeCameraRenderObservable.add((camera) => {
    const active = enabled();
    const { width, height } = ui.getSize();
    const viewport = camera.viewport.toGlobal(width, height);
    for (const { root, position, halfExtent, groundRing } of reticles) {
      const target = active ? position() : null;
      if (!target) {
        root.isVisible = false;
        groundRing?.mesh.setEnabled(false);
        continue;
      }
      point.set(target.x, terrainSurfaceHeight(hm, target.x, target.z) + GROUND_CLEARANCE_M, target.z);
      Vector3.ProjectToRef(point, identity, scene.getTransformMatrix(), viewport, screen);
      const visible = screen.z >= 0 && screen.z <= 1 &&
        screen.x >= halfExtent && screen.x <= width - halfExtent &&
        screen.y >= halfExtent && screen.y <= height - halfExtent &&
        !terrainBlocksSight(hm, camera.globalPosition, point);
      let blend = 0;
      if (groundRing) {
        if (visible) {
          const { startsAtM, fullAtM } = groundRing;
          const t = Math.min(1, Math.max(0, (startsAtM - groundRing.distanceFromPlayer()) / (startsAtM - fullAtM)));
          blend = t * t * (3 - 2 * t);
        }
        groundRing.mesh.visibility = blend;
        groundRing.mesh.setEnabled(blend > 0);
      }
      root.alpha = 1 - blend;
      root.isVisible = visible && blend < 1;
      if (!root.isVisible) continue;
      root.leftInPixels = screen.x - width / 2;
      root.topInPixels = screen.y - height / 2;
    }
  }, -1, true);
}
