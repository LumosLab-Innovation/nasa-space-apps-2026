import { Color3, Color4, Mesh, MeshBuilder, ParticleSystem, PBRMaterial, Scene, StandardMaterial, Texture, Vector3 } from '@babylonjs/core';
import { setFlag, type GameState } from '../core/gameState';
import { sampleHeight, type Heightmap } from '../data/heightmap';
import type { Pip } from '../pip/pip';
import type { Astronaut } from '../player/astronaut';
import type { DialogueBox } from '../ui/dialogueBox';
import type { Hud } from '../ui/hud';
import { SHELTER_POS } from '../world/zones';
import { pipComeHint } from '../pip/qCommand';
import { tr } from '../i18n/i18n';

/**
 * Before the long night (v2 scene 5.2, task 2): heat escapes from three spots on the shelter. They only
 * show in Pip's thermal view (they radiate infrared into the black sky; there is no convection), and Pip
 * covers each with a regolith berm, which conducts heat very poorly. Fixed leaks save night energy.
 */
export type LeakId = 'door' | 'vent' | 'cable';

const LEAK_AZ: Record<LeakId, number> = { door: 0, vent: 140, cable: 230 };
const RING_M = 3.2;
const NEAR_M = 2.5;
const PIP_NEAR_M = 4;

export const HEAT_LEAKS: { id: LeakId; x: number; z: number }[] = (Object.keys(LEAK_AZ) as LeakId[]).map((id) => {
  const a = (LEAK_AZ[id] * Math.PI) / 180;
  return { id, x: SHELTER_POS.x + Math.sin(a) * RING_M, z: SHELTER_POS.z + Math.cos(a) * RING_M };
});

export function leaksFixed(flags: Set<string>): number {
  return HEAT_LEAKS.filter((l) => flags.has(`act5:leak:${l.id}`)).length;
}

export function createHeatLeaks(
  scene: Scene, hm: Heightmap, state: GameState, pip: Pip, dialogue: DialogueBox, hud: Hud,
  thermal: { readonly on: boolean }, active: () => boolean,
) {
  const glowMat = new StandardMaterial('leakGlow', scene);
  glowMat.emissiveColor = new Color3(1, 0.85, 0.6);
  glowMat.disableLighting = true;
  const bermMat = new PBRMaterial('bermMat', scene);
  bermMat.albedoColor = new Color3(0.4, 0.39, 0.37);
  bermMat.roughness = 1;
  bermMat.metallic = 0;
  const spots = HEAT_LEAKS.map((l) => {
    const y = sampleHeight(hm, l.x, l.z);
    const glow = MeshBuilder.CreateSphere(`leak_${l.id}`, { diameter: 0.5, segments: 10 }, scene);
    glow.position.set(l.x, y + 0.5, l.z);
    glow.material = glowMat;
    glow.metadata = { hotSpot: true };
    glow.isPickable = false;
    glow.isVisible = false;
    const ps = new ParticleSystem(`leakIR_${l.id}`, 60, scene);
    ps.particleTexture = new Texture('data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><circle cx="8" cy="8" r="7" fill="white"/></svg>'), scene);
    ps.emitter = glow.position.clone();
    ps.minEmitBox = new Vector3(-0.2, 0, -0.2);
    ps.maxEmitBox = new Vector3(0.2, 0, 0.2);
    ps.color1 = new Color4(1, 0.8, 0.5, 0.9);
    ps.color2 = new Color4(1, 0.6, 0.3, 0.6);
    ps.colorDead = new Color4(1, 0.5, 0.2, 0);
    ps.minSize = 0.05;
    ps.maxSize = 0.12;
    ps.minLifeTime = 1.2;
    ps.maxLifeTime = 2;
    ps.emitRate = 25;
    ps.gravity = Vector3.Zero();
    ps.direction1 = new Vector3(-0.1, 1, -0.1);
    ps.direction2 = new Vector3(0.1, 1, 0.1);
    ps.minEmitPower = 0.6;
    ps.maxEmitPower = 1.0;
    return { ...l, y, glow, ps, running: false, berm: null as Mesh | null };
  });
  let offered: (typeof spots)[number] | null = null;
  let explained = false;

  const prev = pip.onCommand;
  pip.onCommand = (c) => {
    prev(c);
    if (c !== 'berm' || !offered) return;
    const s = offered;
    offered = null;
    setFlag(state, `act5:leak:${s.id}`);
    const berm = MeshBuilder.CreateCylinder(`berm_${s.id}`, { diameterTop: 0.3, diameterBottom: 1.6, height: 0.7, tessellation: 14 }, scene);
    berm.position.set(s.x, s.y + 0.3, s.z);
    berm.material = bermMat;
    s.berm = berm;
    s.glow.isVisible = false;
    s.ps.stop();
    s.running = false;
    void dialogue.play('leak_fixed');
    hud.toast(tr('Heat leaks sealed: {n}/3', { n: leaksFixed(state.flags) }), 3);
  };

  return {
    get fixed(): number {
      return leaksFixed(state.flags);
    },
    /** Prompt near a leak during Act 5 prep (or null). Call every frame. */
    update(player: Astronaut): string | null {
      offered = null;
      const on = active();
      for (const s of spots) {
        const show = on && thermal.on && !state.flags.has(`act5:leak:${s.id}`);
        s.glow.isVisible = show;
        if (show !== s.running) {
          s.running = show;
          if (show) s.ps.start();
          else s.ps.stop();
        }
      }
      if (!on) return null;
      const p = player.position;
      const near = spots.find((s) => !state.flags.has(`act5:leak:${s.id}`) && Math.hypot(p.x - s.x, p.z - s.z) <= NEAR_M);
      if (!near) return null;
      if (!thermal.on) return tr('T — thermal view: find where heat escapes');
      if (!explained) {
        explained = true;
        void dialogue.play('leak_found');
      }
      const pd = Math.hypot(pip.position.x - near.x, pip.position.z - near.z);
      if (pd > PIP_NEAR_M) return pipComeHint(pip.mode, pd, PIP_NEAR_M) ?? tr('Heat leak! Pip needs to be next to you to cover it');
      offered = near;
      pip.contextCommand = 'berm';
      return tr('Q — "Pip, pile regolith on that leak!"');
    },
  };
}
