import { existsSync, readFileSync, statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { materialNames, nodeNames, nodeWorldPosition, parseGlbJson } from '../src/models/glb';
import { MODELS, type ModelId } from '../src/models/manifest';

/** The Blender → game contract: every built GLB has its nodes/materials and faces the right way. */
const check = (id: ModelId) =>
  describe(`model ${id}`, () => {
    const path = `public/models/${MODELS[id].file}`;
    const json = () => parseGlbJson(new Uint8Array(readFileSync(path)));
    it('exists', () => expect(existsSync(path)).toBe(true));
    it('has every contract node and material', () => {
      const j = json();
      const n = nodeNames(j);
      const m = materialNames(j);
      expect(MODELS[id].nodes.filter((x) => !n.has(x))).toEqual([]);
      expect(MODELS[id].materials.filter((x) => !m.has(x))).toEqual([]);
    });
    it('stays under 5 MB so the page loads quickly', () => expect(statSync(path).size).toBeLessThan(5 * 1024 * 1024));
    it('front faces +Z and _L is on +X', () => {
      const j = json();
      if (MODELS[id].front) expect(nodeWorldPosition(j, MODELS[id].front!)![2]).toBeGreaterThan(0);
      if (MODELS[id].left) expect(nodeWorldPosition(j, MODELS[id].left!)![0]).toBeGreaterThan(0);
    });
  });

check('pip');
check('mica');
check('astronaut');
check('solarTower');
check('radiator');
check('habitat');
check('antenna');
check('crate');
check('flag');
check('hls');
check('hlsFar');
check('relay');
check('hammer');
check('feather');
check('rover');
check('orion');
