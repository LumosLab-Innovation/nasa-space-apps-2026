import { Color3, DynamicTexture, Matrix, Mesh, MeshBuilder, PBRMaterial, Scene, Texture, Vector3 } from '@babylonjs/core';
import { sampleHeight, type Heightmap } from '../data/heightmap';
import { StampRing } from './trails';

export type TrailKind = 'boot' | 'wheel' | 'boulder';
type Kind = TrailKind;

/** Print size in metres (width across, length along travel). */
const SIZE: Record<Kind, { w: number; l: number }> = {
  boot: { w: 0.14, l: 0.33 },
  wheel: { w: 0.16, l: 0.3 },
  boulder: { w: 1.6, l: 1.6 },
};

/** Compacted soil reflects less light, so prints read about 15% darker than the ground around them. */
function printTexture(scene: Scene, kind: Kind): DynamicTexture {
  const t = new DynamicTexture(`${kind}PrintTex`, { width: 64, height: 128 }, scene, true, Texture.TRILINEAR_SAMPLINGMODE);
  const c = t.getContext() as CanvasRenderingContext2D;
  c.clearRect(0, 0, 64, 128);
  if (kind === 'boulder') {
    // A rolling boulder leaves a smooth, shallow groove: a soft darker oval per stamp.
    const g = c.createRadialGradient(32, 64, 4, 32, 64, 60);
    g.addColorStop(0, 'rgba(0,0,0,0.35)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, 64, 128);
  } else if (kind === 'boot') {
    c.fillStyle = 'rgba(0,0,0,0.32)';
    c.beginPath();
    c.ellipse(32, 64, 26, 60, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = 'rgba(0,0,0,0.38)';
    for (let y = 12; y < 118; y += 9) c.fillRect(10, y, 44, 4); // cross-ribbed sole
  } else {
    c.fillStyle = 'rgba(0,0,0,0.3)';
    c.fillRect(4, 0, 56, 128);
    c.fillStyle = 'rgba(0,0,0,0.4)';
    for (let y = 0; y < 128; y += 16) {
      c.beginPath(); // chevron grousers
      c.moveTo(4, y + 10);
      c.lineTo(32, y);
      c.lineTo(60, y + 10);
      c.lineTo(60, y + 15);
      c.lineTo(32, y + 5);
      c.lineTo(4, y + 15);
      c.fill();
    }
  }
  t.hasAlpha = true;
  t.update();
  return t;
}

/** Bootprints or wheel tracks as thin instances of one lit decal quad lying on the terrain. */
export class TrailRenderer {
  private readonly mesh: Mesh;
  private readonly ring: StampRing<true>;
  private readonly matrices: Float32Array;

  constructor(
    scene: Scene,
    private readonly hm: Heightmap,
    private readonly kind: Kind,
    private readonly capacity: number,
    makeTexture: (scene: Scene, kind: Kind) => DynamicTexture | null = printTexture,
  ) {
    const quad = MeshBuilder.CreatePlane(`${kind}Prints`, { width: 1, height: 1 }, scene);
    quad.bakeTransformIntoVertices(Matrix.RotationX(Math.PI / 2)); // lie flat, +Z along travel
    const mat = new PBRMaterial(`${kind}PrintMat`, scene);
    mat.albedoColor = new Color3(0.3, 0.29, 0.28);
    const tex = makeTexture(scene, kind);
    if (tex) {
      mat.albedoTexture = tex;
      mat.useAlphaFromAlbedoTexture = true;
    }
    mat.transparencyMode = PBRMaterial.PBRMATERIAL_ALPHABLEND;
    mat.roughness = 1;
    mat.metallic = 0;
    mat.environmentIntensity = 0;
    mat.zOffset = -2;
    quad.material = mat;
    quad.receiveShadows = true;
    quad.isPickable = false;
    quad.alwaysSelectAsActiveMesh = true;
    this.mesh = quad;
    this.ring = new StampRing<true>(capacity);
    this.matrices = new Float32Array(capacity * 16);
    quad.thinInstanceSetBuffer('matrix', this.matrices, 16, false);
    quad.thinInstanceCount = 0;
    // With zero thin instances Babylon would draw the 1 m source quad at the origin: hide it until stamped.
    quad.isVisible = false;
  }

  get count(): number {
    return this.ring.size;
  }

  /** Lays one print at (x, z) facing `yaw` (0 = +z), tilted to the local slope. */
  stamp(x: number, z: number, yaw: number): void {
    const e = 0.5;
    const h = (px: number, pz: number) => sampleHeight(this.hm, px, pz);
    const n = new Vector3(h(x - e, z) - h(x + e, z), 2 * e, h(x, z - e) - h(x, z + e)).normalize();
    const f0 = new Vector3(Math.sin(yaw), 0, Math.cos(yaw));
    const f = f0.subtract(n.scale(Vector3.Dot(f0, n))).normalize();
    const r = Vector3.Cross(n, f).normalize();
    const { w, l } = SIZE[this.kind];
    const y = h(x, z) + 0.012;
    const slot = this.ring.push(true);
    const m = this.matrices;
    const o = slot * 16;
    m[o] = r.x * w; m[o + 1] = r.y * w; m[o + 2] = r.z * w; m[o + 3] = 0;
    m[o + 4] = n.x; m[o + 5] = n.y; m[o + 6] = n.z; m[o + 7] = 0;
    m[o + 8] = f.x * l; m[o + 9] = f.y * l; m[o + 10] = f.z * l; m[o + 11] = 0;
    m[o + 12] = x; m[o + 13] = y; m[o + 14] = z; m[o + 15] = 1;
    this.mesh.thinInstanceCount = this.ring.size;
    this.mesh.isVisible = true;
    // Upload only the 16 floats of this print; a full ring would otherwise send ~768 KB per stamp.
    this.mesh.thinInstancePartialBufferUpdate('matrix', m.subarray(o, o + 16), o);
  }
}
