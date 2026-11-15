import { Constants, MeshBuilder, Scene, ShaderMaterial, Texture, Vector3 } from '@babylonjs/core';

const ATMOSPHERE_SCALE = 1.19;

const vertexSource = `
  precision highp float;
  attribute vec3 position;
  attribute vec3 normal;
  attribute vec2 uv;
  uniform mat4 world;
  uniform mat4 worldViewProjection;
  varying vec3 surfaceNormal;
  varying vec3 worldPosition;
  varying vec2 mapUv;

  void main() {
    surfaceNormal = mat3(world) * normal;
    worldPosition = (world * vec4(position, 1.0)).xyz;
    // Undo the longitude mirror of Babylon's left-handed sphere.
    mapUv = vec2(1.0 - uv.x, uv.y);
    gl_Position = worldViewProjection * vec4(position, 1.0);
  }
`;

const fragmentSource = `
  precision highp float;
  uniform vec3 cameraPosition;
  uniform vec3 sunDirection;
  uniform sampler2D blueMarble;
  uniform float sunlitHaloGain;
  varying vec3 surfaceNormal;
  varying vec3 worldPosition;
  varying vec2 mapUv;

  void main() {
    vec3 normal = normalize(surfaceNormal);
    vec3 view = normalize(cameraPosition - worldPosition);
    float sun = dot(normal, sunDirection);
    float lit = smoothstep(-0.12, 0.52, sun);
    #ifdef ATMOSPHERE
      // At orbital distances the shell and globe can share a depth-buffer value.
      // Mask rays that intersect the globe instead of relying on depth to hide the shell.
      float viewCos = dot(normal, view);
      float closest = ${ATMOSPHERE_SCALE} * sqrt(max(0.0, 1.0 - viewCos * viewCos));
      if (closest <= 1.0) discard;
      float altitude = (closest - 1.0) / (${ATMOSPHERE_SCALE} - 1.0);
      // A narrow atmospheric limb with a softer, wider photographic halo.
      float limb = 1.0 - smoothstep(0.0, 0.23, altitude);
      float halo = 1.0 - smoothstep(0.0, 1.0, altitude);
      float scattering = mix(0.08, 1.0, lit);
      float haloGain = mix(1.0, sunlitHaloGain, lit);
      vec3 glow = vec3(0.40, 0.66, 0.92) * (0.46 * limb)
                + vec3(0.12, 0.34, 0.68) * (0.22 * halo * halo * haloGain);
      gl_FragColor = vec4(glow * scattering, 1.0);
    #else
      vec3 albedo = texture2D(blueMarble, mapUv).rgb;
      float daylight = pow(max(sun, 0.0), 0.38);
      float rim = pow(1.0 - max(dot(normal, view), 0.0), 5.0);
      vec3 haze = vec3(0.28, 0.50, 0.78) * rim * lit * 0.48;
      gl_FragColor = vec4(albedo * (0.005 + 0.995 * daylight) + haze, 1.0);
    #endif
  }
`;

export function loadEarthTexture(scene: Scene, bytes: ArrayBuffer): Promise<Texture> {
  const url = URL.createObjectURL(new Blob([bytes], { type: 'image/jpeg' }));
  scene.onDisposeObservable.addOnce(() => URL.revokeObjectURL(url));
  return new Promise((resolve, reject) => {
    const texture = new Texture(url, scene, false, false, undefined,
      () => resolve(texture), (message) => reject(new Error(message)));
    texture.name = 'NASA Blue Marble';
  });
}

export function createEarthGlobe(name: string, scene: Scene, radius: number, texture: Texture, sunlitHaloGain = 1) {
  const mesh = MeshBuilder.CreateSphere(name, { diameter: 2 * radius, segments: 48 }, scene);
  const shell = MeshBuilder.CreateSphere(name + 'Atmosphere', { diameter: 2 * ATMOSPHERE_SCALE * radius, segments: 48 }, scene);
  const attributes = ['position', 'normal', 'uv'];
  const uniforms = ['world', 'worldViewProjection', 'cameraPosition', 'sunDirection'];
  const shader = { vertexSource, fragmentSource };
  const globe = new ShaderMaterial(name + 'Surface', scene, shader, {
    attributes, uniforms, samplers: ['blueMarble'],
  });
  globe.setTexture('blueMarble', texture);
  const atmosphere = new ShaderMaterial(name + 'Air', scene, shader, {
    attributes, uniforms: [...uniforms, 'sunlitHaloGain'], defines: ['ATMOSPHERE'], needAlphaBlending: true,
  });
  atmosphere.setFloat('sunlitHaloGain', sunlitHaloGain);
  atmosphere.cullBackFaces = false;
  atmosphere.alphaMode = Constants.ALPHA_ADD;
  mesh.material = globe;
  shell.material = atmosphere;
  shell.parent = mesh;
  mesh.isPickable = shell.isPickable = false;
  return {
    mesh,
    setSunDirection(direction: Vector3) {
      globe.setVector3('sunDirection', direction);
      atmosphere.setVector3('sunDirection', direction);
    },
  };
}
