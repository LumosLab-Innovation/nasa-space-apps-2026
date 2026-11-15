import {Mesh,VertexData,ShaderMaterial,Constants,Vector3,type Scene,type TransformNode} from '@babylonjs/core';
import {BrakingPlasmaState} from './brakingPlasmaState';

// Approved old-B preview, deliberately not the later flicker version.
// Artistic re-entry-inspired overlay: not a lunar-atmosphere simulation.
const vs=`precision highp float;attribute vec3 position;attribute vec3 normal;attribute vec2 uv;uniform mat4 worldViewProjection;uniform mat4 world;varying vec2 vUV;varying vec3 vNormal;varying vec3 vPosition;void main(){vUV=uv;vNormal=normalize(mat3(world)*normal);vPosition=(world*vec4(position,1.)).xyz;gl_Position=worldViewProjection*vec4(position,1.);}`;
const fs=`precision highp float;varying vec2 vUV;varying vec3 vNormal;varying vec3 vPosition;uniform vec3 eye;uniform float clock;uniform float power;uniform float strength;uniform float outer;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
void main(){
 float a=vUV.x*6.2831853,y=vUV.y;vec2 around=vec2(cos(a),sin(a));
 float broad=noise(around*2.5+vec2(y*4.-clock*2.4,clock*.16));
 float fine=noise(around*16.+vec2(y*7.-clock*6.5,clock*.23));
 float filaments=pow(noise(around*22.+vec2(y*2.-clock*4.8,0.)),4.);
 float facing=abs(dot(normalize(vNormal),normalize(eye-vPosition)));
 float rim=pow(1.-facing,2.4);
 float front=exp(-pow((y-.105)/(.055+broad*.025),2.));
 float flow=smoothstep(.10,.18,y)*pow(1.-y,2.)*smoothstep(.38,.74,broad);
 float breakup=.55+.45*fine;
 // Local bright front, sparse streaming tongues. No opaque body coating.
 float edge=front*(.35+.65*rim)*breakup;
 float trail=flow*(filaments*5.+fine*.24)*(.25+.75*rim);
 float opacity=(edge*1.1+trail*1.05)*strength*power;
 if(outer>.5)opacity=(front*.26+flow*.12)*rim*strength*power;
 opacity*=smoothstep(0.,.035,y)*(1.-smoothstep(.64,1.,y));
 vec3 warm=mix(vec3(.76,.16,.08),vec3(1.,.45,.22),fine);
 vec3 hot=mix(vec3(1.,.52,.33),vec3(1.,.87,.73),rim*.65+fine*.25);
 gl_FragColor=vec4(mix(warm,hot,front*.85),min(.8,opacity));
}`;
function shell(scene:Scene,mount:TransformNode,name:string,strength:number,outer=0){
 const length=28,breadth=1.05;
 const mesh=new Mesh(name,scene),data=new VertexData(),pos:number[]=[],norm:number[]=[],uv:number[]=[],idx:number[]=[];const rings=72,sides=96;
 for(let j=0;j<=rings;j++){const t=j/rings,y=-.9+t*length;
 // Rounded detached front transitions into an expanding, open wake.
 // Slightly tighter approved B: 8% narrower, with length and shader motion unchanged.
 const r=.92*(5.65+breadth*t*3.2+outer*.45)*Math.sqrt(Math.min(1,t/.105));
 for(let i=0;i<=sides;i++){const a=i/sides*Math.PI*2;pos.push(Math.cos(a)*r,y,Math.sin(a)*r);uv.push(i/sides,t);if(j<rings&&i<sides){const k=j*(sides+1)+i;idx.push(k,k+sides+2,k+1,k,k+sides+1,k+sides+2);}}}
 VertexData.ComputeNormals(pos,idx,norm);data.positions=pos;data.normals=norm;data.uvs=uv;data.indices=idx;data.applyToMesh(mesh);mesh.parent=mount;mesh.isPickable=false;
 const mat=new ShaderMaterial(name+'Shader',scene,{vertexSource:vs,fragmentSource:fs},{attributes:['position','normal','uv'],uniforms:['worldViewProjection','world','clock','power','strength','outer','eye'],needAlphaBlending:true});mat.alphaMode=Constants.ALPHA_ADD;mat.disableDepthWrite=true;mat.backFaceCulling=true;mat.setFloat('strength',strength);mat.setFloat('outer',outer);mat.setFloat('power',0);mat.setFloat('clock',0);mesh.material=mat;return {mesh,mat};
}
/** Independent additive overlay; never changes lighting, camera, physics or existing FX. */
export class BrakingPlasma {
  private readonly state=new BrakingPlasmaState();
  private readonly layers:ReturnType<typeof shell>[];
  private disposed=false;
  private readonly cameraObserver;
  constructor(private readonly scene:Scene,mount:TransformNode){
    this.layers=[shell(scene,mount,'brakingPlasmaCore',1.8),shell(scene,mount,'brakingPlasmaHalo',.9,1)];
    for(const {mesh,mat} of this.layers){mesh.setEnabled(false);mat.setVector3('eye',Vector3.Zero());}
    this.cameraObserver=scene.onBeforeCameraRenderObservable.add(camera=>{
      for(const {mat} of this.layers)mat.setVector3('eye',camera.globalPosition);
    });
    scene.onDisposeObservable.addOnce(()=>this.dispose());
  }
  async warm(){
    await Promise.all(this.layers.map(({mesh,mat})=>mat.forceCompilationAsync(mesh)));
  }
  update(dt:number,braking:boolean,altitudeM:number,throttle:number){
    if(this.disposed)return;
    this.state.update(dt,braking,altitudeM,throttle);
    for(const {mesh,mat} of this.layers){
      mesh.setEnabled(this.state.power>0);
      mat.setFloat('clock',this.state.time);mat.setFloat('power',this.state.power);
    }
  }
  get diagnostics(){return {variant:'approved-old-B',power:this.state.power,time:this.state.time};}
  dispose(){
    if(this.disposed)return;this.disposed=true;
    this.scene.onBeforeCameraRenderObservable.remove(this.cameraObserver);
    for(const {mesh,mat} of this.layers){mesh.dispose();mat.dispose();}
  }
}
