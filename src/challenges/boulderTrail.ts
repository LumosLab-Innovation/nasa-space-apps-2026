import { Color3, MeshBuilder, PBRMaterial, Scene, VertexBuffer } from '@babylonjs/core';
import { setFlag, unlockCard, type GameState } from '../core/gameState';
import { sampleHeight, type Heightmap } from '../data/heightmap';
import { TrailRenderer } from '../fx/trailRenderer';
import type { Pip } from '../pip/pip';
import type { Astronaut } from '../player/astronaut';
import type { DialogueBox } from '../ui/dialogueBox';
import type { Hud } from '../ui/hud';
import type { Sky } from '../world/sky';
import { BOULDER } from '../world/zones';
import { tr } from '../i18n/i18n';

const SEEN_M = 12;
const SCAN_M = 15;

/** Shortest distance from p to the segment a–b. */
function distToSegment(p: { x: number; z: number }, a: { x: number; z: number }, b: { x: number; z: number }): number {
  const abx = b.x - a.x;
  const abz = b.z - a.z;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * abx + (p.z - a.z) * abz) / (abx * abx + abz * abz)));
  return Math.hypot(p.x - (a.x + abx * t), p.z - (a.z + abz * t));
}

/**
 * Rolling Boulder Field (spec v3 §7, stop 4): a long trail down the slope looks like a wheel track until
 * Pip's LIDAR scan shows it ends at a boulder — a red herring before MICA's real tracks.
 */
export function createBoulderTrail(
  scene: Scene, hm: Heightmap, sky: Sky, state: GameState, dialogue: DialogueBox, hud: Hud, pip: Pip,
): { update(player: Astronaut): void } {
  const rock = MeshBuilder.CreateIcoSphere('rollingBoulder', { radius: 1.1, subdivisions: 2 }, scene);
  const pos = rock.getVerticesData(VertexBuffer.PositionKind)!;
  let seed = 7;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < pos.length; i += 3) {
    const k = 0.8 + rand() * 0.35;
    pos[i] *= k;
    pos[i + 1] *= k * 0.85;
    pos[i + 2] *= k;
  }
  rock.updateVerticesData(VertexBuffer.PositionKind, pos);
  rock.convertToFlatShadedMesh();
  const m = new PBRMaterial('boulderMat', scene);
  m.albedoColor = new Color3(0.38, 0.37, 0.35);
  m.roughness = 1;
  m.metallic = 0;
  rock.material = m;
  rock.receiveShadows = true;
  rock.position.set(BOULDER.bottom.x, sampleHeight(hm, BOULDER.bottom.x, BOULDER.bottom.z) + 0.6, BOULDER.bottom.z);
  sky.shadows.addShadowCaster(rock);

  const trail = new TrailRenderer(scene, hm, 'boulder', 64);
  const len = Math.hypot(BOULDER.top.x - BOULDER.bottom.x, BOULDER.top.z - BOULDER.bottom.z);
  const yaw = Math.atan2(BOULDER.bottom.x - BOULDER.top.x, BOULDER.bottom.z - BOULDER.top.z);
  for (let d = 0; d < len - 1.5; d += 1.2) {
    const t = d / len;
    const wobble = Math.sin(d * 0.35) * 0.4; // irregular shape → small wiggles, as LROC trails show
    trail.stamp(BOULDER.top.x + (BOULDER.bottom.x - BOULDER.top.x) * t + wobble, BOULDER.top.z + (BOULDER.bottom.z - BOULDER.top.z) * t, yaw);
  }

  let seen = false;
  let near = false;
  const prev = pip.onCommand;
  pip.onCommand = (c) => {
    prev(c);
    if (c !== 'scan' || !seen || !near || state.flags.has('boulder:solved')) return;
    setFlag(state, 'boulder:solved');
    pip.setFace('laugh');
    void dialogue.play('boulder_scan');
    if (unlockCard(state, 'boulderTracks')) hud.toast(tr('New discovery in your Science Notebook (Tab)'), 3);
  };

  return {
    update(player) {
      const d = distToSegment(player.position, BOULDER.top, BOULDER.bottom);
      near = d <= SCAN_M;
      if (!seen && d <= SEEN_M) {
        seen = true;
        pip.setFace('curious');
        void dialogue.play('boulder_seen');
      }
    },
  };
}
