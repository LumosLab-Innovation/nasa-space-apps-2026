import {
  AbstractMesh, Camera, Color3, Effect, Light, Material, PostProcess, Scene, StandardMaterial,
} from '@babylonjs/core';
import { Control, TextBlock, type AdvancedDynamicTexture } from '@babylonjs/gui';
import { SIGMA, SOLAR_CONST } from '../config/constants';
import type { Sky } from '../world/sky';
import { canThermalize, THERMAL_ANCHORS } from './thermalColor';
import { tr } from '../i18n/i18n';
import { fitHud } from './hudWidgets';

const ABSORPTIVITY = 0.9;
const EMISSIVITY = 0.95;
const SHADOW_TEMP_C = -150;

/**
 * Pip's thermal camera (key T). Every surface is temporarily rendered matte white lit by the Sun alone,
 * so pixel brightness = cos(incidence) × shadow. A post-process turns that into temperature with the
 * radiative-equilibrium law T = (a·S·L / (e·σ))^¼ and paints it with the thermal palette (spec §5.5, §7).
 */
function shaderSource(): string {
  const k = (ABSORPTIVITY * SOLAR_CONST) / (EMISSIVITY * SIGMA);
  const a = THERMAL_ANCHORS;
  const f = (n: number) => n.toFixed(4);
  let palette = `vec3 palette(float t) {\n  if (t <= ${f(a[0][0])}) return vec3(${f(a[0][1].r)}, ${f(a[0][1].g)}, ${f(a[0][1].b)});\n`;
  for (let i = 1; i < a.length; i++) {
    const [t0, c0] = a[i - 1];
    const [t1, c1] = a[i];
    palette += `  if (t <= ${f(t1)}) return mix(vec3(${f(c0.r)}, ${f(c0.g)}, ${f(c0.b)}), vec3(${f(c1.r)}, ${f(c1.g)}, ${f(c1.b)}), (t - ${f(t0)}) / ${f(t1 - t0)});\n`;
  }
  const last = a[a.length - 1][1];
  palette += `  return vec3(${f(last.r)}, ${f(last.g)}, ${f(last.b)});\n}\n`;
  return `
precision highp float;
varying vec2 vUV;
uniform sampler2D textureSampler;
${palette}
void main(void) {
  float L = texture2D(textureSampler, vUV).r;
  float tempC = L < 0.002 ? ${f(SHADOW_TEMP_C)} : pow(${k.toExponential(6)} * L, 0.25) - 273.15;
  vec3 col = palette(tempC);
  float scan = 0.92 + 0.08 * sin(vUV.y * 900.0);
  vec2 d = vUV - 0.5;
  float vig = smoothstep(0.85, 0.35, length(d));
  gl_FragColor = vec4(col * scan * vig, 1.0);
}`;
}

export function createThermalView(scene: Scene, sky: Sky, ui: AdvancedDynamicTexture): { toggle(): void; readonly on: boolean } {
  Effect.ShadersStore['pipThermalFragmentShader'] = shaderSource();
  const white = new StandardMaterial('thermalWhite', scene);
  white.diffuseColor = Color3.White();
  white.specularColor = Color3.Black();
  white.emissiveColor = Color3.Black();
  white.ambientColor = Color3.Black();

  const label = new TextBlock('thermalLabel', tr('● PIP THERMAL FEED   cold −250 °C ▸ hot +120 °C'));
  label.color = '#ffb070';
  label.fontSize = 16;
  label.fontFamily = 'monospace';
  label.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
  label.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
  label.top = '16px';
  label.left = '-20px';
  label.width = '460px';
  label.height = '24px';
  label.isVisible = false;
  ui.addControl(label);
  fitHud(ui, label, (width) => {
    label.top = '72px';
    label.width = Math.min(460, width - 28) + 'px';
    label.fontSize = width < 550 ? 11 : 14;
  });

  let on = false;
  let post: PostProcess | null = null;
  const saved = new Map<AbstractMesh, Material | null>();
  const savedLights = new Map<Light, number>();

  function enable(): void {
    for (const m of scene.meshes) {
      if (!canThermalize(m)) continue;
      saved.set(m, m.material);
      m.material = white;
    }
    for (const l of scene.lights) {
      if (l === sky.sun) continue;
      savedLights.set(l, l.intensity);
      l.intensity = 0;
    }
    sky.thermalMode = true;
    post = new PostProcess('pipThermal', 'pipThermal', [], null, 1, scene.activeCamera as Camera);
    label.isVisible = true;
  }

  function disable(): void {
    for (const [m, mat] of saved) m.material = mat;
    saved.clear();
    for (const [l, i] of savedLights) l.intensity = i;
    savedLights.clear();
    sky.thermalMode = false;
    post?.dispose();
    post = null;
    label.isVisible = false;
  }

  return {
    get on() {
      return on;
    },
    toggle() {
      on = !on;
      if (on) enable();
      else disable();
    },
  };
}
