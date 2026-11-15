import {
  Color3, Color4, DynamicTexture, Mesh, MeshBuilder, PBRMaterial, Scene, SolidParticleSystem, StandardMaterial, Vector3,
  type Material, type TargetCamera,
} from '@babylonjs/core';
import { LUNAR_G } from '../config/constants';
import { sampleHeight, type Heightmap } from '../data/heightmap';
import { burstCount, burstVelocities, plumeVelocities, sprayVelocities, stepGrain, timeToGround, type Grain } from './ballistic';

const REGOLITH = new Color3(0.42, 0.41, 0.39);
/** Fine-dust colour in full sunlight and in shadow (lit by Earthshine and the lamps only). */
const FINE_LIT = 0.62;
const FINE_SHADE = 0.07;

interface Puff extends Grain {
  age: number;
  life: number;
  size0: number;
  grow: number;
  alpha0: number;
  aspect: number;
  clustered: boolean;
  light: number;
  roll: number;
  spin: number;
  fadeStart: number;
}
type V = { vx: number; vy: number; vz: number };

/** Babylon caches the constructor camera; this scene switches exploration/landing cameras. */
class DustParticles extends SolidParticleSystem {
  faceCamera(camera: TargetCamera): void { this._camera=camera; }
}

/**
 * Lunar dust in two layers (Plan 7, spec §3.3):
 * - grains: real, lit geometry (smooth little rocks drawn as thin instances), dark in shadow and bright in
 *   sunlight or lamp light, as real regolith is;
 * - fine dust: soft round billboards that fade as they fly, coloured once per emission from the sunlight at
 *   that spot (no per-particle shadow lookups).
 * Both fly clean parabolas under lunar gravity with no air drag and die on touching the ground: nothing
 * hangs in the air. Fixed capacities: when full, new dust is skipped instead of allocating more.
 */
export class DustSystem {
  readonly material: Material;
  /** Brightness of fine dust at (x, z), 0..1 (set by the scene from its SunlightCache); default lit. */
  lightAt: (x: number, z: number) => number = () => 1;
  private readonly mesh: Mesh;
  private readonly grains: Grain[] = [];
  private readonly sizes: Float32Array;
  private readonly matrices: Float32Array;
  private count = 0;
  private uploadedCount = 0;
  private trickleCarry = 0;
  private seed = 12345;
  private readonly puffs: Puff[] = [];
  private fineCount = 0;
  private readonly sps: DustParticles | null = null;
  private fineShown = 0;
  private plumeLobeAge = Infinity;
  private plumeLobeLife = 0;
  private readonly plumeLobes = Array.from({length:3},()=>({angle:0,radius:0,spread:0,drift:0,speed:1,lift:1}));

  constructor(private readonly scene: Scene, private readonly hm: Heightmap, private readonly capacity = 3000, private readonly fineCapacity = 600) {
    const mat = new PBRMaterial('dustGrain', scene);
    mat.albedoColor = REGOLITH;
    mat.roughness = 1;
    mat.metallic = 0;
    mat.environmentIntensity = 0;
    mat.emissiveColor = Color3.Black();
    this.material = mat;
    // A smooth-shaded icosphere: a rounded grain that catches the low Sun on one side.
    this.mesh = MeshBuilder.CreateIcoSphere('dustGrains', { radius: 1, subdivisions: 1, flat: false }, scene);
    this.mesh.material = mat;
    this.mesh.isPickable = false;
    this.mesh.receiveShadows = true;
    this.mesh.alwaysSelectAsActiveMesh = true;
    for (let i = 0; i < capacity; i++) this.grains.push({ x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, alive: false });
    this.sizes = new Float32Array(capacity);
    this.matrices = new Float32Array(capacity * 16);
    this.mesh.thinInstanceSetBuffer('matrix', this.matrices, 16, false);
    this.mesh.thinInstanceCount = 0;
    // With zero thin instances Babylon would draw the source rock itself at the origin: keep it hidden.
    this.mesh.isVisible = false;

    for (let i = 0; i < fineCapacity; i++) {
      this.puffs.push({ x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, alive: false, age: 0, life: 1, size0: 0.1, grow: 1, alpha0: 0.3, aspect: 1, clustered: false, light: 1, roll: 0, spin: 0, fadeStart: .18 });
    }
    if (fineCapacity > 0) this.sps = this.buildFine(scene);
  }

  /** Soft puffs: camera-facing quads with a radial alpha texture, unlit (their colour carries the light). */
  private buildFine(scene: Scene): DustParticles {
    const sps = new DustParticles('dustFine', scene, { updatable: true, isPickable: false });
    sps.billboard = true;
    sps.computeParticleRotation = false;
    sps.computeParticleTexture = true;
    const quad = MeshBuilder.CreatePlane('dustPuff', { size: 1 }, scene);
    sps.addShape(quad, this.fineCapacity);
    quad.dispose();
    const mesh = sps.buildMesh();
    mesh.isPickable = false;
    mesh.hasVertexAlpha = true;
    mesh.alwaysSelectAsActiveMesh = true;
    const m = new StandardMaterial('dustFineMat', scene);
    m.disableLighting = true;
    m.emissiveColor = Color3.White();
    m.backFaceCulling = false;
    m.disableDepthWrite = true;
    if (typeof document !== 'undefined') {
      // Two atlas cells: original boot/rover puff, and irregular landing dust.
      const tex = new DynamicTexture('dustFineTex', { width: 128, height: 64 }, scene, false);
      const ctx = tex.getContext() as unknown as CanvasRenderingContext2D;
      const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, 'rgba(255,255,255,1)');
      g.addColorStop(0.45, 'rgba(255,255,255,0.55)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 64, 64);
      const cluster = ctx.createImageData(64,64);
      const lobes=[[-.4,.12,.44,.52],[.15,-.24,.55,.38],[.42,.23,.35,.42],[-.12,.37,.48,.32],[.03,.02,.6,.6]];
      for(let y=0;y<64;y++)for(let x=0;x<64;x++){
        const u=(x-31.5)/32,v=(y-31.5)/32;
        let density=0;
        for(const [cx,cy,sx,sy] of lobes)density+=.45*Math.exp(-2*((u-cx)**2/sx**2+(v-cy)**2/sy**2));
        const edge=Math.max(0,1-u*u-v*v),grain=.88+.12*Math.sin(x*1.7+y*.8)*Math.sin(y*1.3-x*.4),k=(y*64+x)*4;
        // Baked soft relief: denser cores stay light, folds and edges are darker.
        // This is a cloud-shape cue, not an extra scene light or a terrain change.
        const shade=Math.max(.46,Math.min(1,.60+.36*Math.min(1,density)-.06*(u+v)));
        cluster.data[k]=cluster.data[k+1]=cluster.data[k+2]=255*shade;
        cluster.data[k+3]=255*Math.min(.95,density)*edge**.7*grain;
      }
      ctx.putImageData(cluster,64,0);
      tex.update();
      tex.hasAlpha = true;
      m.diffuseTexture = tex;
      m.opacityTexture = tex;
    }
    mesh.material = m;
    for (const p of sps.particles) {
      p.isVisible = false;
      p.color = new Color4(1, 1, 1, 0);
    }
    // Billboarding needs a camera; this first upload only hides the particles, so do it without.
    sps.billboard = false;
    sps.setParticles();
    sps.billboard = true;
    mesh.isVisible = false;
    return sps;
  }

  get alive(): number {
    return this.count;
  }

  get fineAlive(): number {
    return this.fineCount;
  }

  private rand = (): number => (this.seed = (this.seed * 16807) % 2147483647) / 2147483647;

  private spawn(x: number, y: number, z: number, v: V): void {
    if (this.count >= this.capacity) return;
    const g = this.grains[this.count];
    g.x = x;
    g.y = y;
    g.z = z;
    g.vx = v.vx;
    g.vy = v.vy;
    g.vz = v.vz;
    g.alive = true;
    this.sizes[this.count] = 0.012 + this.rand() * 0.02;
    this.count++;
  }

  /** One fine-dust puff; `light` is sampled once per emission by the caller. */
  private spawnFine(x: number, y: number, z: number, v: V, size: number, grow: number, alpha: number, light: number, aspect = 1, clustered = false): void {
    if (this.fineCount >= this.fineCapacity) return;
    const p = this.puffs[this.fineCount];
    p.x = x;
    p.y = y;
    p.z = z;
    p.vx = v.vx;
    p.vy = v.vy;
    p.vz = v.vz;
    p.alive = true;
    p.age = 0;
    // Ballistic flight time over flat ground at the launch height; it also dies early if it meets a slope.
    p.life = Math.max(0.15, timeToGround(v.vy, 0.05, LUNAR_G));
    if(clustered)p.life=Math.min(4.4+this.rand()*.8,timeToGround(v.vy,.35,LUNAR_G));
    p.size0 = size;
    p.grow = grow;
    p.alpha0 = alpha;
    p.aspect = aspect;
    p.clustered = clustered;
    p.light = light;
    p.roll=clustered?(this.rand()-.5)*.8:0;
    p.spin=clustered?(this.rand()<.5?-1:1)*(.06+this.rand()*.12):0;
    p.fadeStart=clustered?.08+this.rand()*.24:.18;
    this.fineCount++;
  }

  private light(x: number, z: number): number {
    const k = Math.min(1, Math.max(0, this.lightAt(x, z)));
    return FINE_SHADE + (FINE_LIT - FINE_SHADE) * k;
  }

  /** Ballistic grains and larger rising clumps in uneven, sustained emission patches. */
  plume(at: Vector3, speedMs: number, n: number): void {
    if(n<=0)return;
    for (const v of plumeVelocities(n, speedMs, this.rand)) {
      const r = 2 + this.rand() * 3;
      const a = Math.atan2(v.vx, v.vz);
      const before = this.count;
      const x=at.x+r*Math.sin(a),z=at.z+r*Math.cos(a);
      this.spawn(x, sampleHeight(this.hm,x,z)+0.1, z, v);
      if (this.count > before) this.sizes[before] = 0.012 + this.rand() * 0.035;
    }
    const density=Math.min(1,n/40);
    if(this.plumeLobeAge>=this.plumeLobeLife){
      this.plumeLobeAge=0;this.plumeLobeLife=.7+this.rand()*.5;
      for(const lobe of this.plumeLobes){
        lobe.angle=this.rand()*Math.PI*2;lobe.radius=2.5+this.rand()*4;lobe.spread=.25+this.rand()*.6;
        lobe.drift=lobe.angle+(this.rand()-.5)*1.1;lobe.speed=.7+this.rand()*.7;lobe.lift=.9+this.rand()*.2;
      }
    }
    // Each emission starts as two overlapping lobes with different launch vectors.
    // They peel apart continuously, without spawning new particles later in flight.
    const clumps=Math.ceil(n/(6-density));
    for(let i=0;i<clumps;i+=2){
      // Bias one patch for several emissions; randomising the whole ring every frame
      // averages into a uniform halo. Patch radius, width and drift are independent.
      const lobe=this.plumeLobes[Math.floor(this.rand()**2*this.plumeLobes.length)];
      const a=lobe.angle+(this.rand()-.5)*lobe.spread,r=lobe.radius+(this.rand()-.5)*2;
      const x=at.x+r*Math.sin(a),z=at.z+r*Math.cos(a),drift=lobe.drift+(this.rand()-.5)*.5;
      const speed=(.08+.13*this.rand())*speedMs*lobe.speed;
      const v={vx:Math.sin(drift)*speed,vz:Math.cos(drift)*speed,vy:(2.8+.55*density+this.rand()*.9)*lobe.lift};
      const size=(6+this.rand()*4)*(1+.25*density),alpha=(.28+.26*density)*(.75+.25*this.rand());
      const fork=(this.rand()<.5?-1:1)*(1.8+this.rand()*1.8),tx=Math.cos(drift),tz=-Math.sin(drift);
      this.spawnFine(x,sampleHeight(this.hm,x,z)+.35,z,v,
        size*.9,1.25+this.rand()*.35,alpha,
        this.light(x,z),.65+this.rand()*.2,true);
      if(i+1<clumps){
        const childX=x+tx*fork*.18,childZ=z+tz*fork*.18;
        this.spawnFine(childX,sampleHeight(this.hm,childX,childZ)+.35,childZ,
          {vx:v.vx*.8+tx*fork,vz:v.vz*.8+tz*fork,vy:v.vy*(.86+this.rand()*.23)},
          size*(.42+this.rand()*.18),1.15+this.rand()*.3,alpha*(.75+this.rand()*.2),
          this.light(childX,childZ),.65+this.rand()*.2,true);
      }
    }
  }

  /** A boot or body hitting the ground (or pushing off) at this speed. */
  burst(at: Vector3, impactSpeedMs: number): void {
    const n = burstCount(impactSpeedMs);
    for (const v of burstVelocities(n, impactSpeedMs, this.rand)) {
      const r = this.rand() * 0.25;
      const a = this.rand() * Math.PI * 2;
      this.spawn(at.x + r * Math.sin(a), at.y + 0.03, at.z + r * Math.cos(a), v);
    }
    if (n === 0) return;
    const light = this.light(at.x, at.z);
    for (const v of burstVelocities(Math.min(30, Math.ceil(n / 5)), impactSpeedMs * 0.7, this.rand)) {
      this.spawnFine(at.x, at.y + 0.05, at.z, v, 0.12 + this.rand() * 0.12, 2.5, 0.35, light);
    }
  }

  /** Continuous dust behind a moving foot: a small kick of grains and a faint puff. */
  trickle(at: Vector3, dirYaw: number, speedMs: number, dt: number): void {
    if (speedMs < 0.1) return;
    this.trickleCarry += 30 * Math.min(speedMs, 4) * dt;
    const n = Math.floor(this.trickleCarry);
    this.trickleCarry -= n;
    if (n === 0) return;
    const vs = sprayVelocities(n, dirYaw, Math.min(speedMs, 4) * 0.6, this.rand);
    // Very slow feet throw nothing (sprayVelocities returns []): never index past what it returned.
    if (vs.length === 0) return;
    for (const v of vs) this.spawn(at.x, at.y + 0.02, at.z, v);
    const light = this.light(at.x, at.z);
    for (let i = 0; i < Math.ceil(vs.length / 3); i++) this.spawnFine(at.x, at.y + 0.04, at.z, vs[i], 0.1 + this.rand() * 0.1, 2.5, 0.25, light);
  }

  /** Wheel "rooster tail": n grains flung backwards off a tyre moving at speedMs, with a soft trail. */
  spray(at: Vector3, dirYaw: number, speedMs: number, n: number): void {
    const vs = sprayVelocities(n, dirYaw, speedMs, this.rand);
    if (vs.length === 0) return;
    for (const v of vs) this.spawn(at.x, at.y + 0.05, at.z, v);
    const light = this.light(at.x, at.z);
    for (let i = 0; i < Math.ceil(vs.length / 2); i++) this.spawnFine(at.x, at.y + 0.08, at.z, vs[i], 0.15 + this.rand() * 0.2, 3, 0.3, light);
  }

  update(dt: number): void {
    if (dt <= 0) return;
    this.plumeLobeAge+=dt;
    const ground = (x: number, z: number) => sampleHeight(this.hm, x, z);
    let i = 0;
    while (i < this.count) {
      const g = this.grains[i];
      stepGrain(g, dt, ground);
      if (!g.alive) {
        // Swap-remove keeps the live grains packed at the front of the pool.
        const last = this.count - 1;
        this.grains[i] = this.grains[last];
        this.grains[last] = g;
        const s = this.sizes[i];
        this.sizes[i] = this.sizes[last];
        this.sizes[last] = s;
        this.count--;
        continue;
      }
      i++;
    }
    this.updateFine(dt, ground);
    this.mesh.isVisible = this.count > 0;
    // Nothing alive now or last frame: skip the GPU upload entirely.
    if (this.count === 0 && this.uploadedCount === 0) return;
    const m = this.matrices;
    for (let k = 0; k < this.count; k++) {
      const g = this.grains[k];
      const s = this.sizes[k];
      const o = k * 16;
      m[o] = s; m[o + 1] = 0; m[o + 2] = 0; m[o + 3] = 0;
      m[o + 4] = 0; m[o + 5] = s; m[o + 6] = 0; m[o + 7] = 0;
      m[o + 8] = 0; m[o + 9] = 0; m[o + 10] = s; m[o + 11] = 0;
      m[o + 12] = g.x; m[o + 13] = g.y; m[o + 14] = g.z; m[o + 15] = 1;
    }
    this.mesh.thinInstanceCount = this.count;
    this.mesh.thinInstanceBufferUpdated('matrix');
    this.uploadedCount = this.count;
  }

  private updateFine(dt: number, ground: (x: number, z: number) => number): void {
    let i = 0;
    while (i < this.fineCount) {
      const p = this.puffs[i];
      stepGrain(p, dt, ground);
      p.age += dt;
      if (!p.alive || p.age >= p.life) {
        p.alive = false;
        const last = this.fineCount - 1;
        this.puffs[i] = this.puffs[last];
        this.puffs[last] = p;
        this.fineCount--;
        continue;
      }
      i++;
    }
    const sps = this.sps;
    if (!sps || !this.scene.activeCamera) return;
    sps.faceCamera(this.scene.activeCamera as TargetCamera);
    if (this.fineCount === 0 && this.fineShown === 0) return;
    const n = Math.max(this.fineCount, this.fineShown);
    for (let k = 0; k < n; k++) {
      const q = sps.particles[k];
      if (k >= this.fineCount) {
        q.isVisible = false;
        continue;
      }
      const p = this.puffs[k];
      const t = p.age / p.life;
      const s = p.size0 * (1 + (p.grow - 1) * t);
      q.isVisible = true;
      q.position.set(p.x, p.y, p.z);
      // Small, independently signed rolls suggest tumbling wisps, not a synchronized vortex.
      q.rotation.z=p.roll+p.spin*p.age*(1-Math.exp(-p.age*2));
      q.scaling.set(s, s * p.aspect, s);
      const dissolve=Math.max(0,(t-p.fadeStart)/(1-p.fadeStart));
      const fade=p.clustered?Math.min(1,p.age/.12)*(1-dissolve*dissolve*(3-2*dissolve)):1-t*t;
      q.uvs.set(p.clustered?.503:0,0,p.clustered?1:.497,1);
      q.color!.set(p.light, p.light * 0.98, p.light * 0.94, p.alpha0 * fade);
    }
    sps.setParticles(0, n - 1, true);
    sps.mesh.isVisible = this.fineCount > 0;
    this.fineShown = this.fineCount;
  }
}
