import { Matrix, Mesh, Scene, ShaderMaterial, Texture, Vector3, Vector4, VertexData } from '@babylonjs/core';
import { buildOrbitalGeometry, type Elevation } from './orbitalTerrain';

const vertexSource = `
  precision highp float;
  attribute vec3 position;
  attribute vec3 normal;
  attribute vec2 uv;
  uniform mat4 worldViewProjection;
  uniform mat4 world;
  uniform mat4 sourceFrame;
  uniform float geographicUv;
  varying vec3 localPosition;
  varying vec3 surfaceNormal;
  varying vec2 moonUv;
  varying vec3 radial;

  void main() {
    localPosition = (world * vec4(position,1.0)).xyz;
    vec3 sourcePosition = (sourceFrame * vec4(position,1.0)).xyz;
    surfaceNormal = mat3(sourceFrame) * normal;
    radial = normalize(sourcePosition);
    moonUv = geographicUv > 0.5 ? vec2((atan(-sourcePosition.z,-sourcePosition.x)+3.14159265)/6.28318530,(1.57079633-asin(radial.y))/3.14159265) : uv;
    gl_Position = worldViewProjection * vec4(position, 1.0);
  }
`;

const fragmentSource = `
  precision highp float;
  uniform sampler2D globeMap;
  uniform sampler2D tranquilityMap;
  uniform sampler2D reliefMap;
  uniform vec4 tranquilityRegion;
  uniform vec3 sunDirection;
  uniform vec4 localCutout;
  uniform float geographicUv;
  varying vec3 localPosition;
  varying vec3 surfaceNormal;
  varying vec2 moonUv;
  varying vec3 radial;

  void main() {
    if(localCutout.w > 0.5 && max(abs(localPosition.x-localCutout.x),abs(localPosition.z-localCutout.y)) < localCutout.z) discard;
    vec2 detailUv = (moonUv - tranquilityRegion.xy) / tranquilityRegion.zw;
    vec2 edge = min(detailUv, 1.0 - detailUv);
    float detailWeight = smoothstep(0.0, 0.13, min(edge.x, edge.y));
    // Both maps are sampled with mipmaps, including at the grazing angle near the horizon.
    vec3 globe = texture2D(globeMap, moonUv).rgb;
    vec3 detail = texture2D(tranquilityMap, detailUv).rgb;
    // R/G = tangent-space normal XY, B = DEM ray-traced Sun visibility, all linear data.
    vec2 reliefUv = (moonUv - vec2(192.0/360.0,78.0/180.0)) / vec2(24.0/360.0,24.0/180.0);
    vec2 re = min(reliefUv,1.0-reliefUv);
    float reliefWeight = smoothstep(0.0,0.032,min(re.x,re.y)) * (1.0-geographicUv);
    vec3 relief = texture2D(reliefMap,reliefUv).rgb;
    vec2 xy = relief.rg*2.0-1.0;
    vec3 up = normalize(radial);
    vec3 east = normalize(vec3(-up.z,0.0,up.x));
    vec3 north = normalize(cross(east,up));
    vec3 detailedNormal = east*xy.x+north*xy.y+up*sqrt(max(0.0,1.0-dot(xy,xy)));
    vec3 geometryNormal = normalize(mix(normalize(surfaceNormal),up,geographicUv*0.82));
    vec3 n = normalize(mix(geometryNormal,detailedNormal,reliefWeight));
    float light = max(0.0, dot(n, sunDirection));
    float shadow = mix(1.0,relief.b,reliefWeight);
    vec3 color = mix(globe, detail, detailWeight) * (0.035 + 1.6 * light * shadow);
    gl_FragColor = vec4(color, 1.0);
  }
`;

function loadMoonMap(scene: Scene, bytes: ArrayBuffer, repeatLongitude: boolean): Promise<Texture> {
  const url = URL.createObjectURL(new Blob([bytes], { type: 'image/webp' }));
  scene.onDisposeObservable.addOnce(() => URL.revokeObjectURL(url));
  return new Promise((resolve, reject) => {
    const texture = new Texture(url, scene, false, false, Texture.TRILINEAR_SAMPLINGMODE,
      () => resolve(texture), (message) => reject(new Error(message)));
    texture.wrapU = repeatLongitude ? Texture.WRAP_ADDRESSMODE : Texture.CLAMP_ADDRESSMODE;
    texture.wrapV = Texture.CLAMP_ADDRESSMODE;
    texture.anisotropicFilteringLevel = scene.getEngine().getCaps().maxAnisotropy;
  });
}

export async function createOrbitalMoon(scene: Scene, globeBytes: ArrayBuffer, detailBytes: ArrayBuffer,
  reliefBytes: ArrayBuffer, elevation: Elevation, sunDirection: Vector3) {
  const [globeMap, tranquilityMap, reliefMap] = await Promise.all([
    loadMoonMap(scene, globeBytes, true),
    loadMoonMap(scene, detailBytes, false),
    loadMoonMap(scene, reliefBytes, false),
  ]);
  reliefMap.gammaSpace = false;
  const geometry = buildOrbitalGeometry(elevation);
  const data = new VertexData();
  data.positions = geometry.positions;
  data.indices = geometry.indices;
  data.uvs = geometry.uvs;
  const normals: number[] = [];
  VertexData.ComputeNormals(geometry.positions, geometry.indices, normals);
  data.normals = normals;
  const moon = new Mesh('moon', scene);
  data.applyToMesh(moon, false);
  const material = new ShaderMaterial('moonMat', scene, { vertexSource, fragmentSource }, {
    attributes: ['position', 'normal', 'uv'],
    uniforms: ['worldViewProjection', 'world', 'sourceFrame', 'geographicUv', 'localCutout', 'tranquilityRegion', 'sunDirection'],
    samplers: ['globeMap', 'tranquilityMap', 'reliefMap'],
  });
  material.setTexture('globeMap', globeMap);
  material.setVector4('localCutout',new Vector4(0,0,0,0));
  material.setMatrix('sourceFrame',Matrix.Identity());material.setFloat('geographicUv',0);
  material.setTexture('tranquilityMap', tranquilityMap);
  material.setTexture('reliefMap', reliefMap);
  // Moon Trek EQ matrix 6, columns 68–78 and rows 27–36, counted from 180° W and 90° N.
  material.setVector4('tranquilityRegion', new Vector4(68 / 128, 27 / 64, 11 / 128, 10 / 64));
  material.setVector3('sunDirection', sunDirection);
  moon.material = material;
  moon.isPickable = false;
  moon.freezeWorldMatrix();
  moon.metadata = { elevationSource: 'NASA LRO/LOLA 64 ppd', heightScale: 1, triangles: geometry.indices.length/3 };
  return moon;
}
