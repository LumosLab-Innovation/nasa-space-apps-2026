/** Minimal GLB (binary glTF 2.0) reader: enough to check the node/material contract between Blender and the game. */

export type Vec3 = [number, number, number];
type Quat = [number, number, number, number];

export interface GltfNode {
  name?: string;
  children?: number[];
  translation?: Vec3;
  rotation?: Quat;
  scale?: Vec3;
  mesh?: number;
}
export interface GltfJson {
  nodes?: GltfNode[];
  materials?: { name?: string }[];
  scenes?: { nodes: number[] }[];
  scene?: number;
}

const JSON_CHUNK = 0x4e4f534a; // 'JSON'

export function parseGlbJson(buf: Uint8Array): GltfJson {
  const magic = buf.length >= 4 ? String.fromCharCode(buf[0], buf[1], buf[2], buf[3]) : '';
  if (magic !== 'glTF' || buf.length < 20) throw new Error('not a GLB');
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const len = dv.getUint32(12, true);
  if (dv.getUint32(16, true) !== JSON_CHUNK) throw new Error('not a GLB');
  return JSON.parse(new TextDecoder().decode(buf.subarray(20, 20 + len))) as GltfJson;
}

export function nodeNames(j: GltfJson): Set<string> {
  return new Set((j.nodes ?? []).map((n) => n.name).filter((n): n is string => !!n));
}

export function materialNames(j: GltfJson): Set<string> {
  return new Set((j.materials ?? []).map((m) => m.name).filter((n): n is string => !!n));
}

function rotate(q: Quat, v: Vec3): Vec3 {
  const [x, y, z, w] = q;
  // v' = v + 2w(q×v) + 2 q×(q×v)
  const tx = 2 * (y * v[2] - z * v[1]);
  const ty = 2 * (z * v[0] - x * v[2]);
  const tz = 2 * (x * v[1] - y * v[0]);
  return [v[0] + w * tx + (y * tz - z * ty), v[1] + w * ty + (z * tx - x * tz), v[2] + w * tz + (x * ty - y * tx)];
}

function mulQ(a: Quat, b: Quat): Quat {
  return [
    a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1],
    a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0],
    a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3],
    a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2],
  ];
}

/** World-space position of the first node with this name (glTF coordinates), composing T·R·S down from the scene roots. */
export function nodeWorldPosition(j: GltfJson, name: string): Vec3 | null {
  const nodes = j.nodes ?? [];
  const roots = j.scenes?.[j.scene ?? 0]?.nodes ?? [];
  interface Frame { t: Vec3; r: Quat; s: Vec3 }
  const visit = (i: number, parent: Frame): Vec3 | null => {
    const n = nodes[i];
    if (!n) return null;
    const lt = n.translation ?? [0, 0, 0];
    const scaled: Vec3 = [lt[0] * parent.s[0], lt[1] * parent.s[1], lt[2] * parent.s[2]];
    const off = rotate(parent.r, scaled);
    const ls = n.scale ?? [1, 1, 1];
    const f: Frame = {
      t: [parent.t[0] + off[0], parent.t[1] + off[1], parent.t[2] + off[2]],
      r: mulQ(parent.r, n.rotation ?? [0, 0, 0, 1]),
      s: [parent.s[0] * ls[0], parent.s[1] * ls[1], parent.s[2] * ls[2]],
    };
    if (n.name === name) return f.t;
    for (const c of n.children ?? []) {
      const hit = visit(c, f);
      if (hit) return hit;
    }
    return null;
  };
  const identity: Frame = { t: [0, 0, 0], r: [0, 0, 0, 1], s: [1, 1, 1] };
  for (const r of roots) {
    const hit = visit(r, identity);
    if (hit) return hit;
  }
  return null;
}
