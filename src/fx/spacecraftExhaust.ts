import {Color3,Color4,Constants,Matrix,Mesh,MeshBuilder,Quaternion,ShaderMaterial,SolidParticleSystem,StandardMaterial,Vector3,Vector4,VertexData,type Scene,type TransformNode} from '@babylonjs/core';
import {ExhaustState,nozzleLength,type ExhaustSnapshot} from './exhaustState';
import {exhaustAssets} from './exhaustAssets';
import {exhaustVertex,exhaustFragment,surfaceExhaustFragment} from './exhaustShaders';
import {rcsNozzles,selectRcsPair,type ExhaustNozzle} from './exhaustNozzles';
import {withPreparationTarget} from '../core/preparationRender';
import {fillSurfaceFan,FAN_ROWS,FAN_COLUMNS,groundPlane} from './exhaustSurface';
type Particle={p:Vector3;v:Vector3;age:number;life:number;size:number;alpha:number};
export type ExhaustTransfer={state:ExhaustSnapshot;particles:number[]};
const align=(d:Vector3)=>{const a=Vector3.Cross(Vector3.Down(),d),dot=Vector3.Dot(Vector3.Down(),d);return a.lengthSquared()<1e-8?(dot>0?Quaternion.Identity():Quaternion.RotationAxis(Vector3.Right(),Math.PI)):Quaternion.RotationAxis(a.normalize(),Math.acos(Math.max(-1,Math.min(1,dot))));};
/** Fixed renderer resources; particles live in world space, transferable via the meter-scale mount. */
export class SpacecraftExhaust{
 readonly state=new ExhaustState();private disposed=false;private readonly jets:{n:ExhaustNozzle;mesh:Mesh;mat:ShaderMaterial;strength:number;length:number}[]=[];
 private readonly rcs:ExhaustNozzle[];private readonly particles:Particle[]=[];private readonly sps:SolidParticleSystem;private readonly particlesMat:StandardMaterial;
 private readonly fans:Mesh[]=[];private readonly fanData:Float32Array[]=[];private readonly fanMat:ShaderMaterial;
 private seed=391;private carry=0;private last=Matrix.Identity();private hasLast=false;private readonly inverse=Matrix.Identity();private scale=1;private readonly positions=Array.from({length:8},()=>Vector3.Zero());
 private readonly transfer:ExhaustTransfer={state:this.state.snapshot(),particles:[]};
 constructor(private scene:Scene,readonly mount:TransformNode,nozzles:ExhaustNozzle[],private ground?: (x:number,z:number)=>number,withRcs=true){
  const assets=exhaustAssets(scene);this.rcs=withRcs?rcsNozzles():[];
  const all=[...nozzles,...this.rcs];
  for(let i=0;i<all.length;i++){
   const n=all[i],mesh=new Mesh('exhaust-'+n.kind+'-'+i,scene),vd=new VertexData();
   // Crossed transparent ribbons. No opaque cone or cylinder surface.
   vd.positions=[-1,0,0,1,0,0,1,-1,0,-1,-1,0,0,0,-1,0,0,1,0,-1,1,0,-1,-1];vd.uvs=[0,0,1,0,1,1,0,1,0,0,1,0,1,1,0,1];vd.indices=[0,1,2,0,2,3,4,5,6,4,6,7];vd.applyToMesh(mesh);
   const mat=new ShaderMaterial('exhaustShader-'+i,scene,{vertexSource:exhaustVertex,fragmentSource:exhaustFragment},{attributes:['position','uv'],uniforms:['world','worldViewProjection','clock','seed','power','brightness','coreBoost','coreWidthBoost','groundPlane','groundClip'],samplers:['wispTex','glowTex','grainTex'],needAlphaBlending:true});
   mat.setFloat('brightness',n.kind==='rcs'?1.55:n.kind==='aux'?1.15:1.1);
   mat.setFloat('coreBoost',n.kind==='rcs'?.25:n.kind==='main'?.18:0);
   mat.setFloat('coreWidthBoost',n.kind==='main'?.14:0);
   mat.backFaceCulling=false;mat.disableDepthWrite=true;mat.alphaMode=Constants.ALPHA_ADD;mat.setTexture('wispTex',assets.wisp);mat.setTexture('glowTex',assets.glow);mat.setTexture('grainTex',assets.grain);mat.setFloat('seed',i*1.71);mat.setFloat('power',0);mat.setFloat('clock',0);mat.setFloat('groundClip',0);mat.setVector4('groundPlane',new Vector4(0,1,0,1e10));
   mesh.parent=mount;mesh.position.copyFrom(n.position);mesh.rotationQuaternion=align(n.direction);mesh.material=mat;mesh.isPickable=false;mesh.isVisible=false;
   this.jets.push({n,mesh,mat,strength:0,length:0});
  }
  this.sps=new SolidParticleSystem('exhaustWisps',scene,{updatable:true,isPickable:false});this.sps.billboard=true;this.sps.computeParticleRotation=false;this.sps.computeParticleTexture=false;
  const quad=MeshBuilder.CreatePlane('exhaustPooledQuad',{size:1},scene);this.sps.addShape(quad,160);quad.dispose();const mesh=this.sps.buildMesh();mesh.isPickable=false;mesh.hasVertexAlpha=true;mesh.alwaysSelectAsActiveMesh=true;
  this.particlesMat=new StandardMaterial('exhaustWispsMat',scene);this.particlesMat.disableLighting=true;this.particlesMat.emissiveColor=new Color3(.45,.62,.9);this.particlesMat.diffuseTexture=assets.wisp;this.particlesMat.opacityTexture=assets.wisp;this.particlesMat.disableDepthWrite=true;this.particlesMat.backFaceCulling=false;this.particlesMat.alphaMode=Constants.ALPHA_ADD;mesh.material=this.particlesMat;
  for(let i=0;i<160;i++){this.particles.push({p:Vector3.Zero(),v:Vector3.Zero(),age:1,life:0,size:0,alpha:0});this.sps.particles[i].color=new Color4(1,1,1,0);this.sps.particles[i].isVisible=false;}mesh.isVisible=false;
  this.fanMat=new ShaderMaterial('exhaustGroundFlow',scene,{vertexSource:exhaustVertex,fragmentSource:surfaceExhaustFragment},{attributes:['position','uv'],uniforms:['world','worldViewProjection','clock','power'],needAlphaBlending:true});this.fanMat.disableDepthWrite=true;this.fanMat.backFaceCulling=false;this.fanMat.alphaMode=Constants.ALPHA_ADD;this.fanMat.setFloat('clock',0);this.fanMat.setFloat('power',0);
  if(ground)for(let i=0;i<1;i++){const fan=new Mesh('exhaustSurfaceFlow-'+i,scene),v=new VertexData();const data=new Float32Array((FAN_ROWS+1)*(FAN_COLUMNS+1)*3);v.positions=data;v.indices=[];v.uvs=[];
   for(let row=0;row<=FAN_ROWS;row++)for(let col=0;col<=FAN_COLUMNS;col++){v.uvs.push(col/FAN_COLUMNS,row/FAN_ROWS);if(row<FAN_ROWS&&col<FAN_COLUMNS){const a=row*(FAN_COLUMNS+1)+col,b=a+FAN_COLUMNS+1;v.indices.push(a,a+1,b+1,a,b+1,b);}}
   v.applyToMesh(fan,true);fan.material=this.fanMat;fan.isPickable=false;fan.alwaysSelectAsActiveMesh=true;fan.isVisible=false;this.fans.push(fan);this.fanData.push(data);}
  scene.onDisposeObservable.addOnce(()=>this.dispose());
 }
 private random(){this.seed=(Math.imul(this.seed,1664525)+1013904223)>>>0;return this.seed/4294967296;}
 update(dt:number,throttle:number,rcsActive:boolean,contact=false,auxPower?:number){
  if(this.disposed)return;this.mount.computeWorldMatrix(true);const matrix=this.mount.getWorldMatrix();matrix.invertToRef(this.inverse);const rotation=new Quaternion(),scaling=new Vector3();matrix.decompose(scaling,rotation);this.scale=Math.abs(scaling.y);
  this.state.step(dt,throttle,rotation,rcsActive,contact);this.drawJets(auxPower);
  if(dt>0){
   for(const p of this.particles){p.age+=dt;if(p.age<p.life){p.p.addInPlace(p.v.scale(dt));if(this.ground&&p.p.y<this.ground(p.p.x,p.p.z))p.age=p.life;}}
   const active=this.jets.filter(j=>j.strength>.015);this.carry+=dt*active.length*18;
   // Bounded pool; discard any emission backlog instead of allocating at throttle spikes.
   let count=Math.min(32,Math.floor(this.carry));this.carry-=Math.floor(this.carry);
   while(count-->0&&active.length){const j=active[Math.floor(this.random()*active.length)],p=this.particles.find(p=>p.age>=p.life);if(!p)break;
    const start=Vector3.TransformCoordinates(j.n.position,matrix),direction=Vector3.TransformNormal(j.n.direction,matrix).normalize();
    p.p.copyFrom(start);p.age=0;p.life=j.n.kind==='main'?.18+this.random()*.22:.08+this.random()*.1;p.size=(j.n.kind==='main'?2.5:.24)*this.scale;p.alpha=j.strength*.17;
    p.v.copyFrom(direction.scale(j.length*this.scale/p.life*.9));
    if(this.hasLast){const old=Vector3.TransformCoordinates(j.n.position,this.last);const inherited=start.subtract(old).scale(1/dt);if(inherited.length()<this.scale*5000)p.v.addInPlace(inherited);}
   }
  }
  this.last.copyFrom(matrix);this.hasLast=true;this.drawParticles();this.drawGround();
 }
 private drawJets(auxPower?:number){
  const pair=selectRcsPair(this.rcs,this.state.demand);let r=0;
  for(let i=0;i<this.jets.length;i++){const j=this.jets[i];let power=this.state.power;
   if(j.n.kind==='rcs'){power=(pair.includes(r)?this.state.pulse:0);r++;}
   if(j.n.kind==='aux')power=auxPower??0;
   j.strength=power;j.length=(j.n.kind==='main'?4+23*power:j.n.kind==='aux'?.6+2.1*power:.9+2.5*power)*nozzleLength(this.state.time,i);
   const width=j.n.radius*(j.n.kind==='main'?4.2:j.n.kind==='rcs'?9:4.2);
   j.mesh.scaling.set(width,j.length,width);j.mesh.isVisible=power>.001;
   j.mat.setFloat('clock',this.state.time);j.mat.setFloat('power',power);if(this.ground){const p=Vector3.TransformCoordinates(j.n.position,this.mount.getWorldMatrix());j.mat.setVector4('groundPlane',Vector4.FromArray(groundPlane(p.x,p.z,this.ground)));j.mat.setFloat('groundClip',1);}
  }
 }
 private drawParticles(){let alive=0;for(let i=0;i<this.particles.length;i++){const p=this.particles[i],s=this.sps.particles[i],u=p.age/Math.max(.001,p.life);s.isVisible=u<1;if(s.isVisible){alive++;s.position.copyFrom(p.p);s.scaling.setAll(p.size*(1+u*3));s.color!.a=p.alpha*Math.sin(u*Math.PI)*(1-u);}}this.sps.mesh.isVisible=alive>0;if(alive&&this.scene.activeCamera)this.sps.setParticles();}
 private drawGround(){if(!this.ground)return;const matrix=this.mount.getWorldMatrix();let nearest=Infinity;for(const j of this.jets)if(j.n.kind==='main'){const p=Vector3.TransformCoordinates(j.n.position,matrix);nearest=Math.min(nearest,p.y-this.ground(p.x,p.z));}
  const reach=4+23*this.state.power,near=Math.max(0,Math.min(1,(reach-nearest)/Math.max(1,reach)));const strength=near*this.state.power;const center=this.mount.getAbsolutePosition();const radius=(8+30*Math.sqrt(this.state.power))*near;
  this.fanMat.setFloat('power',strength);this.fanMat.setFloat('clock',this.state.time);
  for(let i=0;i<this.fans.length;i++){const fan=this.fans[i];fan.isVisible=strength>.003;if(!fan.isVisible)continue;const a=0,r=radius;
   const data=this.fanData[i];fillSurfaceFan(data,center.x,center.z,a,r,this.state.time,this.ground);fan.updateVerticesData('position',data);}
 }
 snapshot():ExhaustTransfer{this.transfer.state=this.state.snapshot();const data=this.transfer.particles;data.length=0;this.mount.computeWorldMatrix(true);const inv=this.mount.getWorldMatrix().clone().invert();for(const p of this.particles)if(p.age<p.life){const pos=Vector3.TransformCoordinates(p.p,inv),v=Vector3.TransformNormal(p.v,inv);data.push(pos.x,pos.y,pos.z,v.x,v.y,v.z,p.age,p.life,p.size/Math.max(1e-9,this.scale),p.alpha);}return this.transfer;}
 present(s:ExhaustTransfer){this.mount.computeWorldMatrix(true);const matrix=this.mount.getWorldMatrix(),scale=new Vector3(),rotation=new Quaternion();matrix.decompose(scale,rotation);this.scale=Math.abs(scale.y);this.state.restore(s.state);this.state.previous=rotation;
  for(let i=0;i<this.particles.length;i++){const p=this.particles[i],k=i*10;if(k<s.particles.length){p.p.copyFrom(Vector3.TransformCoordinates(Vector3.FromArray(s.particles,k),matrix));p.v.copyFrom(Vector3.TransformNormal(Vector3.FromArray(s.particles,k+3),matrix));p.age=s.particles[k+6];p.life=s.particles[k+7];p.size=s.particles[k+8]*this.scale;p.alpha=s.particles[k+9];}else p.life=0;}
  this.last.copyFrom(matrix);this.hasLast=true;this.drawJets();this.drawParticles();this.drawGround();}
 reset(){
  if(this.disposed)return;
  this.state.reset();for(const p of this.particles)p.life=0;this.carry=0;this.hasLast=false;
  for(const j of this.jets){j.strength=0;j.mesh.isVisible=false;j.mat.setFloat('power',0);}
  this.sps.mesh.isVisible=false;for(const fan of this.fans)fan.isVisible=false;
 }
 async warm(){await withPreparationTarget(this.scene,async()=>{for(const j of this.jets){j.mesh.isVisible=true;j.mesh.scaling.setAll(1);j.mat.setFloat('power',.01);await j.mat.forceCompilationAsync(j.mesh);}this.sps.mesh.isVisible=true;for(const f of this.fans){f.isVisible=true;await this.fanMat.forceCompilationAsync(f);}this.scene.render();this.sps.mesh.isVisible=false;for(const j of this.jets){j.mesh.isVisible=false;j.mat.setFloat('power',0);}for(const f of this.fans)f.isVisible=false;});}
 get diagnostics(){return {time:this.state.time,power:this.state.power,pulse:this.state.pulse,demand:this.state.demand.asArray(),particles:this.particles.filter(p=>p.age<p.life).length,jets:this.jets.filter(j=>j.strength>.001).map(j=>({kind:j.n.kind,position:j.n.position.asArray(),power:j.strength})),contactTime:this.state.contactTime};}
 dispose(){if(this.disposed)return;this.disposed=true;for(const j of this.jets){j.mesh.dispose();j.mat.dispose();}this.sps.dispose();this.particlesMat.dispose();for(const f of this.fans)f.dispose();this.fanMat.dispose();}
}
