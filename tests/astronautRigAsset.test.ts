import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseGlbJson } from '../src/models/glb';

const bytes = readFileSync('public/models/astronaut.glb');
const j = parseGlbJson(bytes) as ReturnType<typeof parseGlbJson> & {
  skins?: { joints: number[] }[];
  animations?: { name: string; channels: unknown[] }[];
  meshes?: { primitives: { attributes: Record<string, number>; indices: number }[] }[];
  accessors: { bufferView: number; byteOffset?: number; count: number; componentType: number }[];
  bufferViews: { byteOffset: number; byteStride?: number }[];
};
describe('AxEMU deforming asset', () => {
  it.each(Array.from({ length: 22 }, (_, i) => Number((.94 + i * .02).toFixed(2))))('keeps an open gap between each arm and torso at %s m', (height) => {
    const body = j.nodes!.find(n => n.name === 'AxEMU_cover')!;
    const p = j.meshes![body.mesh!].primitives[0];
    const bin = 20 + bytes.readUInt32LE(12) + 8;
    const read = (accessor: number, i: number, width: number, k = 0) => {
      const a = j.accessors[accessor], v = j.bufferViews[a.bufferView];
      const size = a.componentType === 5123 ? 2 : 4;
      const at = bin + v.byteOffset + (a.byteOffset ?? 0) + i * (v.byteStride ?? width * size) + k * size;
      return a.componentType === 5126 ? bytes.readFloatLE(at) : size === 2 ? bytes.readUInt16LE(at) : bytes.readUInt32LE(at);
    };
    const hits: number[] = [];
    for (let i = 0; i < j.accessors[p.indices].count; i += 3) {
      const [a, b, c] = [0, 1, 2].map(k => {
        const vertex = read(p.indices, i + k, 1);
        return [0, 1, 2].map(axis => read(p.attributes.POSITION, vertex, 3, axis));
      });
      // Intersect a lateral line through the torso/arms, in glTF's Y-up bind pose.
      const det = (b[2] - c[2]) * (a[1] - c[1]) + (c[1] - b[1]) * (a[2] - c[2]);
      if (Math.abs(det) < 1e-10) continue;
      const u = ((b[2] - c[2]) * (height - c[1]) - (c[1] - b[1]) * c[2]) / det;
      const v = ((c[2] - a[2]) * (height - c[1]) - (a[1] - c[1]) * c[2]) / det;
      if (u >= -1e-6 && v >= -1e-6 && u + v <= 1 + 1e-6) hits.push(u * a[0] + v * b[0] + (1 - u - v) * c[0]);
    }
    const sorted = hits.sort((a, b) => a - b);
    const edges = sorted.filter((x, i) => i === 0 || x - sorted[i - 1] > .001);
    expect(edges, 'left arm / torso / right arm must remain separate cross sections').toHaveLength(6);
    expect(edges[2] - edges[1]).toBeGreaterThan(.012);
    expect(edges[4] - edges[3]).toBeGreaterThan(.012);
  });
  it('shares a deforming cloth shell across torso, shoulders and hips', () => {
    const body = j.nodes?.find(n => n.name === 'AxEMU_cover');
    expect(body?.mesh).toBeDefined();
    const primitive = j.meshes![body!.mesh!].primitives[0];
    const a = j.accessors[primitive.attributes.JOINTS_0], v = j.bufferViews[a.bufferView];
    const wa = j.accessors[primitive.attributes.WEIGHTS_0], wv = j.bufferViews[wa.bufferView];
    const bin = 20 + bytes.readUInt32LE(12) + 8;
    const used = new Set<string>();
    const size = a.componentType === 5121 ? 1 : 2;
    for (let i = 0; i < a.count; i++) for (let k = 0; k < 4; k++) {
      const weight = bytes.readFloatLE(bin + wv.byteOffset + (wa.byteOffset ?? 0) + i * (wv.byteStride ?? 16) + k * 4);
      if (weight < .01) continue;
      const offset = bin + v.byteOffset + (a.byteOffset ?? 0) + i * (v.byteStride ?? size * 4) + k * size;
      const joint = size === 1 ? bytes.readUInt8(offset) : bytes.readUInt16LE(offset);
      used.add(j.nodes![j.skins![0].joints[joint]].name!);
    }
    expect([...used]).toEqual(expect.arrayContaining(['spine', 'pelvis', 'upperArm_L', 'upperArm_R', 'thigh_L', 'thigh_R']));
  });
  it('has a humanoid skeleton and authored action clips', () => {
    expect(j.skins?.[0]?.joints.length ?? 0).toBeGreaterThanOrEqual(35);
    expect(j.animations?.map(a => a.name)).toEqual(expect.arrayContaining(['collectSample', 'installModule', 'idle', 'walk']));
    for (const a of j.animations ?? []) expect(a.channels.length).toBeGreaterThan(4);
    const names = j.nodes?.map(n => n.name) ?? [];
    expect(names).toEqual(expect.arrayContaining(['toolSocket_R', 'toolSocket_L', 'samplePouch']));
  });
  it('uses normalized skin weights and blended vertices rather than rigid disconnected pieces', () => {
    const binOffset = 20 + bytes.readUInt32LE(12) + 8;
    let blended = 0, weighted = 0;
    for (const mesh of j.meshes ?? []) for (const p of mesh.primitives) {
      if (p.attributes.WEIGHTS_0 === undefined) continue;
      expect(p.attributes.JOINTS_0).toBeDefined();
      const a = j.accessors[p.attributes.WEIGHTS_0], v = j.bufferViews[a.bufferView];
      expect(a.componentType).toBe(5126);
      for (let n = 0; n < a.count; n++) {
        const at = binOffset + v.byteOffset + (a.byteOffset ?? 0) + n * (v.byteStride ?? 16);
        const w = Array.from({ length: 4 }, (_, k) => bytes.readFloatLE(at + k * 4));
        expect(w.reduce((s, x) => s + x, 0)).toBeCloseTo(1, 4);
        expect(w.every(x => x >= 0 && x <= 1)).toBe(true);
        if (w.filter(x => x > .01).length > 1) blended++;
        weighted++;
      }
    }
    expect(weighted).toBeGreaterThan(2000);
    expect(blended).toBeGreaterThan(300);
  });
});
