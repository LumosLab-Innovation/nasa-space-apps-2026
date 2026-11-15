import './hlsPreview.css';
import { landingGearPose, stepLandingGear } from './hlsLandingGearMotion';
import { componentBounds } from './hlsGeometryChecks';
import { stepElevatorMotion, elevatorPose, guardPose } from './hlsElevatorMotion';
import { ArcRotateCamera, Color3, Color4, Constants, DirectionalLight, Engine, HemisphericLight,
  LoadAssetContainerAsync, MeshBuilder, PBRMaterial, Quaternion, RawCubeTexture, Scene,
  ShadowGenerator, StandardMaterial, TransformNode, Vector3, Ray, type AssetContainer, type AbstractMesh } from '@babylonjs/core';
import '@babylonjs/loaders/glTF';

type View = 'side' | 'three-quarter' | 'surface' | 'docking' | 'detail' | 'underside' | 'engine-detail' | 'gear';
type Pose = 'flight' | 'surface';
type Lod = 'near' | 'far';
type CableLink={mesh:TransformNode;from:TransformNode;to:TransformNode};
type Ship = { container: AssetContainer; root: TransformNode; legs: {node:TransformNode; rest:Quaternion;stowAngle:number;foot:TransformNode;footAngle:number;door:TransformNode;doorRest:Quaternion;doorAngle:number;socket:TransformNode;cavity:AbstractMesh;parts:{mesh:AbstractMesh;bounds:Vector3[][]}[]}[]; car:TransformNode; floor:TransformNode; guards:TransformNode[]; arms:TransformNode; cables:TransformNode; links:CableLink[]; housing:AbstractMesh;housingBounds:Vector3[][]; start:number; meshes:AbstractMesh[]; bytes:number };
const $ = <T extends HTMLElement>(id:string) => document.getElementById(id) as T;
const canvas=$<HTMLCanvasElement>('review');
const engine=new Engine(canvas,true,{preserveDrawingBuffer:true,stencil:true});
engine.setHardwareScalingLevel(1);
const scene=new Scene(engine); scene.clearColor=new Color4(.008,.012,.019,1);
const camera=new ArcRotateCamera('review-camera',-.9,1.3,83,new Vector3(0,24,0),scene);
camera.minZ=.1; camera.maxZ=1000; camera.wheelPrecision=6; camera.panningSensibility=70;
camera.lowerRadiusLimit=4; camera.upperRadiusLimit=200; camera.attachControl(canvas,true);
const sun=new DirectionalLight('preview-sun',new Vector3(.8,-.45,-.3).normalize(),scene);
sun.position=new Vector3(-70,50,25); sun.intensity=3.1;
const fill=new HemisphericLight('preview-bounce',new Vector3(0,1,0),scene);fill.intensity=.18;
fill.groundColor=new Color3(.19,.2,.23);
const inspectionLight=new HemisphericLight('preview-engine-inspection',new Vector3(0,-1,0),scene);
inspectionLight.intensity=0;inspectionLight.diffuse=new Color3(.8,.86,1);
const shadows=new ShadowGenerator(2048,sun); shadows.usePercentageCloserFiltering=true;
shadows.filteringQuality=ShadowGenerator.QUALITY_MEDIUM;shadows.bias=.00015;shadows.normalBias=.03;
sun.shadowMinZ=1;sun.shadowMaxZ=180;sun.autoUpdateExtends=true;
const cubeSize=16;
const faces=Array.from({length:6},(_,face)=>{
 const buf=new Uint8Array(cubeSize*cubeSize*4);
 for(let y=0;y<cubeSize;y++)for(let x=0;x<cubeSize;x++){
   const value=face===2?25:face===3?76:35+Math.round(28*y/cubeSize);
   buf.set([value,value,value+3,255],(y*cubeSize+x)*4);
 }return buf;
});
const reflection=new RawCubeTexture(scene,faces,cubeSize,Constants.TEXTUREFORMAT_RGBA,Constants.TEXTURETYPE_UNSIGNED_BYTE,true);
reflection.level=.7;
scene.environmentTexture=reflection;
scene.imageProcessingConfiguration.toneMappingEnabled=true;
scene.imageProcessingConfiguration.toneMappingType=1;
scene.imageProcessingConfiguration.exposure=1.05;
const ground=MeshBuilder.CreateGround('neutral-preview-ground',{width:280,height:280},scene);
const gm=new StandardMaterial('preview-ground',scene);gm.diffuseColor=new Color3(.14,.16,.18);gm.specularColor=Color3.Black();ground.material=gm;ground.receiveShadows=true;
const pedestal=MeshBuilder.CreateDisc('scale-disc',{radius:11,tessellation:96},scene);pedestal.rotation.x=Math.PI/2;pedestal.position.y=-.008;pedestal.setEnabled(false);
let currentView:View='three-quarter',currentLod:Lod='near',desired:Pose='surface',paused=false;
let deployment=1,elevator=1,ready=false,orion:TransformNode|null=null;
let elevatorVelocity=0,gearVelocity=0;
let importMs=0,frameDrawCalls=0,drawCallsBefore=0;
scene.onBeforeRenderObservable.add(()=>{drawCallsBefore=engine._drawCalls.current;});
scene.onAfterRenderObservable.add(()=>{frameDrawCalls=engine._drawCalls.current-drawCallsBefore;});
const ships:Partial<Record<Lod,Ship>>={};
const assembly=new TransformNode('review-assembly',scene);
const started=performance.now();

async function load(lod:Lod):Promise<Ship>{
 const url=`/models/review/hls-v2${lod==='far'?'-far':''}.glb`;
 const response=await fetch(url);if(!response.ok)throw new Error(`HTTP ${response.status}: ${url}`);
 const bytes=await response.arrayBuffer();
 const container=await LoadAssetContainerAsync(new Uint8Array(bytes),scene,{pluginExtension:'.glb',name:url});
 container.addAllToScene();
 const root=container.rootNodes[0] as TransformNode;
 root.name=`review-${lod}`;
 root.parent=assembly;
 const nodes=root.getDescendants(false) as TransformNode[];
 const node=(name:string)=>{const result=nodes.find(n=>n.name===name);if(!result)throw new Error(`Thiếu ${name} trong ${lod}`);return result;};
 const legs=Array.from({length:6},(_,i)=>{
  const n=node(`legPivot_${i}`),stowAngle=n.metadata?.gltf?.extras?.stowAngleY;
  if(typeof stowAngle!=='number'||!Number.isFinite(stowAngle))throw new Error(`Thiếu góc thu chân ${i} trong ${lod}`);
  const foot=node(`footPivot_${i}`),door=node(`doorPivot_${i}`);
  return {node:n,stowAngle,foot,footAngle:foot.metadata.gltf.extras.foldAngleY,door,doorRest:door.rotationQuaternion?.clone()??Quaternion.FromEulerVector(door.rotation),doorAngle:door.metadata.gltf.extras.openAngleZ,socket:node(`gearSocket_${i}`),cavity:node(`gearCavity_${i}`) as AbstractMesh,rest:n.rotationQuaternion?.clone()??Quaternion.FromEulerVector(n.rotation),parts:n.getChildMeshes().map(mesh=>({mesh,bounds:componentBounds(mesh)}))};
 });
 const car=node('elevatorCar');
 for(const mesh of root.getChildMeshes()){
  mesh.receiveShadows=true;
  if(mesh.material instanceof PBRMaterial){mesh.material.reflectionTexture=reflection;mesh.material.environmentIntensity=.7;}
 }
 const links: CableLink[]=[];
 for(const side of ['Left','Right']){
  links.push({mesh:node('cableLead'+side),from:node('winchAnchor'+side),to:node('pulleyFeed'+side)});
  links.push({mesh:node('cableDrop'+side),from:node('suspension'+side),to:node('pulleyDrop'+side)});
 }
 const housing=node('hoistHousing') as AbstractMesh;
 const ship={container,root,legs,car,floor:node('floorHinge'),guards:['guardLeft','guardRight','guardFront'].map(node),arms:node('supportArms'),cables:node('hoistCables'),links,housing,housingBounds:componentBounds(housing),start:car.position.y,meshes:root.getChildMeshes(),bytes:bytes.byteLength};
 root.setEnabled(lod===currentLod);
 return ship;
}
function applyPose(){
 const p=elevatorPose(elevator);
 const guard=guardPose(elevator);
 const gear=landingGearPose(deployment);
 ground.setEnabled(deployment===1&&desired==='surface'&&!['docking','underside','engine-detail','gear'].includes(currentView));
 for(const ship of Object.values(ships)){
  for(const leg of ship.legs){
   leg.node.rotationQuaternion=leg.rest.multiply(Quaternion.RotationAxis(Vector3.Forward(),-leg.stowAngle*(1-gear.leg)));
   leg.foot.rotationQuaternion=Quaternion.RotationAxis(Vector3.Forward(),-leg.footAngle*(1-gear.foot));
   leg.door.rotationQuaternion=leg.doorRest.multiply(Quaternion.RotationAxis(Vector3.Up(),leg.doorAngle*gear.door));
  }
  ship.car.position.y=ship.start+(.22-ship.start)*p.lower;
  ship.car.position.z=6.05+.45*p.support;
  ship.floor.rotationQuaternion=Quaternion.RotationAxis(Vector3.Right(),-Math.PI/2*(1-p.floor));
  ship.guards[0].rotationQuaternion=Quaternion.RotationAxis(Vector3.Forward(),-Math.PI/2*(1-guard.sides));
  ship.guards[1].rotationQuaternion=Quaternion.RotationAxis(Vector3.Forward(),Math.PI/2*(1-guard.sides));
  ship.guards[2].rotationQuaternion=Quaternion.RotationAxis(Vector3.Right(),-Math.PI/2*(1-guard.front));
  ship.arms.position.z=ship.car.position.z-.95;
  ship.car.computeWorldMatrix(true);ship.arms.computeWorldMatrix(true);ship.cables.computeWorldMatrix(true);
  const inverse=ship.cables.getWorldMatrix().clone().invert();
  for(const link of ship.links){
   link.from.computeWorldMatrix(true);link.to.computeWorldMatrix(true);
   const a=Vector3.TransformCoordinates(link.from.getAbsolutePosition(),inverse);
   const b=Vector3.TransformCoordinates(link.to.getAbsolutePosition(),inverse);
   const direction=b.subtract(a),length=direction.length();direction.normalize();
   const axis=Vector3.Cross(Vector3.Up(),direction),dot=Vector3.Dot(Vector3.Up(),direction);
   link.mesh.position.copyFrom(a);link.mesh.scaling.y=length;
   link.mesh.rotationQuaternion=axis.lengthSquared()<1e-10?(dot>0?Quaternion.Identity():Quaternion.RotationAxis(Vector3.Right(),Math.PI)):Quaternion.RotationAxis(axis.normalize(),Math.acos(Math.max(-1,Math.min(1,dot))));
  }
 }
}
function setPose(p:Pose,immediate=false){
 desired=p;
 if(immediate){deployment=p==='surface'?1:0;elevator=p==='surface'?1:0;elevatorVelocity=0;gearVelocity=0;applyPose();}
 $('pose').textContent=p==='surface'?'Thu chân / thang máy':'Mở chân / thang máy';
}
function setLod(lod:Lod){
 currentLod=lod;
 for(const [name,ship]of Object.entries(ships))ship.root.setEnabled(name===lod);
 const map=shadows.getShadowMap();if(map)map.renderList=ships[lod]?.meshes??[];
 $('lod').textContent=`LOD: ${lod==='near'?'gần':'xa'}`;
 updateStats();
}
function setView(view:View){
 currentView=view;
 paused=false;$('pause').textContent='Tạm dừng';
 assembly.rotation.z=view==='docking'?Math.PI/2:0;
 for(const button of document.querySelectorAll<HTMLButtonElement>('[data-view]'))button.classList.toggle('active',button.dataset.view===view);
 ground.setEnabled(!['docking','underside','engine-detail'].includes(view));orion?.setEnabled(view==='docking');
 inspectionLight.intensity=['underside','engine-detail','gear'].includes(view)?1.3:0;
 const image=$<HTMLImageElement>('reference');
 const engineView=['underside','engine-detail'].includes(view);
 image.src=engineView?'/docs/references/hls/spacex-raptor-vacuum.png':view==='docking'?'/docs/references/hls/nasa-spacex-docking-2024.jpg':'/docs/references/hls/nasa-spacex-surface-2025.jpg';
 image.parentElement!.classList.toggle('docking',view==='docking');
 image.parentElement!.classList.toggle('engine-reference',engineView);
 $('reference-caption').textContent=engineView?'Raptor Vacuum · Khung hình video chính thức SpaceX · Tham khảo hình dáng động cơ':view==='docking'?'NASA / SpaceX · 11/2024 · Nguồn bổ trợ góc ghép nối':'Concept 07/2025 · NASA công bố 10/2026 · Cắt khung để đối chiếu thân tàu';
 const configs:Record<View,[number,number,number,Vector3]>={
  gear:[2.0,1.35,38,new Vector3(0,9,0)],
  side:[Math.PI/2,Math.PI/2,72,new Vector3(0,25,0)],
  'three-quarter':[2.1,1.42,73,new Vector3(0,24,0)],
  surface:[2.1,1.57,72,new Vector3(0,25,0)],
  docking:[Math.PI/2,1.1,67,new Vector3(-29,0,0)],
  detail:[2.0,1.4,23,new Vector3(0,36.4,0)],
  underside:[1.8,Math.PI-.02,16,new Vector3(0,2,0)],
  'engine-detail':[2.0,2.28,15,new Vector3(0,2.3,0)],
 };
 camera.setTarget(configs[view][3]);[camera.alpha,camera.beta,camera.radius]=configs[view];
 if(['docking','underside','engine-detail'].includes(view))setPose('flight',true);else setPose('surface',true);
 if(view==='detail'||view==='gear'){setPose('flight',true);}
}
function updateStats(){
 const ship=ships[currentLod];if(!ship)return;
 const tris=ship.meshes.reduce((n,m)=>n+m.getTotalIndices()/3,0);
 $('stats').textContent=`${Math.round(tris).toLocaleString('en-US')} tam giác · ${ship.meshes.filter(m=>m.getTotalVertices()>0).length} mesh · ${(ship.bytes/1000).toFixed(1)} kB GLB`;
}
function elevatorClearance(ship:Ship){
 ship.root.computeWorldMatrix(true);
 const inverse=ship.root.getWorldMatrix().clone().invert();
 const vertices=ship.car.getChildMeshes().flatMap(mesh=>{
  mesh.computeWorldMatrix(true);
  const positions=mesh.getVerticesData('position')??[];const result:Vector3[]=[];
  for(let i=0;i<positions.length;i+=3)result.push(Vector3.TransformCoordinates(Vector3.TransformCoordinates(Vector3.FromArray(positions,i),mesh.getWorldMatrix()),inverse));
  return result;
 });
 const min=vertices[0].clone();const max=min.clone();
 for(const p of vertices){min.minimizeInPlace(p);max.maximizeInPlace(p);}
 const housing=ship.housing;
 housing.computeWorldMatrix(true);
 const housingParts=ship.housingBounds.map(part=>{
  const hb=part.map(p=>Vector3.TransformCoordinates(Vector3.TransformCoordinates(p,housing.getWorldMatrix()),inverse));
  const hmin=hb[0].clone(),hmax=hb[0].clone();for(const p of hb){hmin.minimizeInPlace(p);hmax.maximizeInPlace(p);}return {hmin,hmax};
 });
 const point=(node:TransformNode,p:number[])=>{node.computeWorldMatrix(true);return Vector3.TransformCoordinates(Vector3.TransformCoordinates(Vector3.FromArray(p),node.getWorldMatrix()),inverse).asArray();};
 const sideFront=-1.62; // Must match the authored side rail's forward post.
 const railSegments=ship.guards.map((g,i)=>i<2?[
  [[0,sideFront,0],[0,sideFront,1.18]],[[0,-.1,0],[0,-.1,1.18]],
  [[0,sideFront,.55],[0,-.1,.55]],[[0,sideFront,1.18],[0,-.1,1.18]],
 ]:[
  [[-1.16,0,0],[-1.16,0,1.06]],[[1.16,0,0],[1.16,0,1.06]],
  [[-1.16,0,.5],[1.16,0,.5]],[[-1.16,0,1.06],[1.16,0,1.06]],
 ]).map((segments,i)=>segments.map(s=>s.map(p=>point(ship.guards[i],[p[0],p[2],-p[1]]))));
 const guardSockets=['Left','Right','Front'].flatMap((side,i)=>[0,1].map(j=>{
  const socket=ship.floor.getDescendants().find(n=>n.name==='guardSocket'+side+j) as TransformNode;
  return {actual:railSegments[i][j][0],socket:point(socket,[0,0,0])};
 }));
 const overlapsLandingGear=ship.legs.some(leg=>leg.parts.some(({mesh,bounds})=>{
  mesh.computeWorldMatrix(true);
  return bounds.some(part=>{
   const pts=part.map(p=>Vector3.TransformCoordinates(Vector3.TransformCoordinates(p,mesh.getWorldMatrix()),inverse));
   const lo=pts[0].clone(),hi=lo.clone();for(const p of pts){lo.minimizeInPlace(p);hi.maximizeInPlace(p);}
   return min.x<hi.x&&max.x>lo.x&&min.y<hi.y&&max.y>lo.y&&min.z<hi.z&&max.z>lo.z;
  });
 }));
 const overlapsGearDoors=ship.legs.some(leg=>leg.door.getChildMeshes().some(mesh=>{
  mesh.computeWorldMatrix(true);
  const positions=mesh.getVerticesData('position')!,points:Vector3[]=[];
  for(let i=0;i<positions.length;i+=3)points.push(Vector3.FromArray(positions,i));
  const lo=points[0].clone(),hi=lo.clone();for(const p of points){lo.minimizeInPlace(p);hi.maximizeInPlace(p);}
  // Test in door-local axes, then root axes: conservative boxes without treating
  // empty space around an angled thin door as a solid world-axis rectangle.
  const toDoor=ship.root.getWorldMatrix().multiply(mesh.getWorldMatrix().clone().invert());
  const carPoints=vertices.map(p=>Vector3.TransformCoordinates(p,toDoor));
  const cmin=carPoints[0].clone(),cmax=cmin.clone();for(const p of carPoints){cmin.minimizeInPlace(p);cmax.maximizeInPlace(p);}
  if(cmax.x<=lo.x||cmin.x>=hi.x||cmax.y<=lo.y||cmin.y>=hi.y||cmax.z<=lo.z||cmin.z>=hi.z)return false;
  const dp=points.map(p=>Vector3.TransformCoordinates(Vector3.TransformCoordinates(p,mesh.getWorldMatrix()),inverse));
  const dmin=dp[0].clone(),dmax=dmin.clone();for(const p of dp){dmin.minimizeInPlace(p);dmax.maximizeInPlace(p);}
  return min.x<dmax.x&&max.x>dmin.x&&min.y<dmax.y&&max.y>dmin.y&&min.z<dmax.z&&max.z>dmin.z;
 }));
 return {min:min.asArray(),max:max.asArray(),minHullRadius:Math.min(...vertices.filter(p=>p.y>2&&p.y<37).map(p=>Math.hypot(p.x,p.z))),
  overlapsLandingGear,overlapsGearDoors,
  railSegments,guardSockets,connections:ship.links.map(link=>({name:link.mesh.name,visible:link.mesh.isEnabled(),actual:[point(link.mesh,[0,0,0]),point(link.mesh,[0,1,0])],anchors:[point(link.from,[0,0,0]),point(link.to,[0,0,0])]})),
  hinge:point(ship.floor,[0,0,0]),socket:point(ship.car,[0,.1,-.95]),
  armReach:ship.arms.position.z,armScale:ship.arms.scaling.asArray(),
  overlapsHousing:housingParts.some(({hmin,hmax})=>min.x<hmax.x&&max.x>hmin.x&&min.y<hmax.y&&max.y>hmin.y&&min.z<hmax.z&&max.z>hmin.z)};
}
function inspectEngineBay(){
 const ship=ships[currentLod]!;ship.root.computeWorldMatrix(true);
 const world=ship.root.getWorldMatrix(),inverse=world.clone().invert();
 const bay=ship.root.getChildMeshes().find(m=>m.name==='engineBay')!;bay.computeWorldMatrix(true);
 const hits=[];
 for(let x=-4;x<=4;x+=.5)for(let z=-4;z<=4;z+=.5){
  if(Math.hypot(x,z)>4.2)continue;
  const ray=new Ray(Vector3.TransformCoordinates(new Vector3(x,-1,z),world),Vector3.TransformNormal(Vector3.Up(),world).normalize(),5);
  const hit=scene.pickWithRay(ray,m=>m===bay);
  hits.push({x,z,y:hit?.pickedPoint?Vector3.TransformCoordinates(hit.pickedPoint,inverse).y:null});
 }
 return {hits,bells:ship.root.getDescendants().filter(n=>n.name.startsWith('engineBell_')).length};
}
function inspectEnclosedGear(){
 const ship=ships[currentLod]!;ship.root.computeWorldMatrix(true);
 const inverse=ship.root.getWorldMatrix().clone().invert(),stages=landingGearPose(deployment);
 let maxRadius=0,minY=Infinity,maxY=-Infinity,wallViolations=0,crossings=0,hingeError=0,doorSeparation=Infinity;
 const cavityRays: {radius:number|null;name:string|null}[]=[];
 const vertices=(mesh:AbstractMesh)=>{
  mesh.computeWorldMatrix(true);const p=mesh.getVerticesData('position')!,points:Vector3[]=[];
  for(let i=0;i<p.length;i+=3)points.push(Vector3.TransformCoordinates(Vector3.TransformCoordinates(Vector3.FromArray(p,i),mesh.getWorldMatrix()),inverse));
  return points;
 };
 for(const leg of ship.legs){
  leg.socket.computeWorldMatrix(true);leg.node.computeWorldMatrix(true);leg.foot.computeWorldMatrix(true);leg.door.computeWorldMatrix(true);
  hingeError=Math.max(hingeError,Vector3.Distance(leg.socket.getAbsolutePosition(),leg.node.getAbsolutePosition()));
  const e=leg.cavity.metadata.gltf.extras;
  // GLTF root-local radial coordinates: Blender (x,y,z) -> (x,z,-y).
  const ca=Math.cos(e.azimuth),sa=Math.sin(e.azimuth);
  const local=(p:Vector3)=>new Vector3(p.x*ca-p.z*sa,-p.x*sa-p.z*ca,p.y);
  let legMinTangent=Infinity,legMaxRadius=0;
  const allowed=(p:Vector3)=>{
   const q=local(p),r=Math.hypot(q.x,q.y);
   return q.z>=e.low-.003&&q.z<=e.high+.003&&Math.abs(Math.atan2(q.y,q.x))<=e.halfAngle+.0001&&r>=e.backRadius-.003;
  };
  for(const {mesh}of leg.parts){
   const points=vertices(mesh),indices=mesh.getIndices()!;
   for(const p of points){
    const q=local(p),r=Math.hypot(q.x,q.y);
    maxRadius=Math.max(maxRadius,r);legMaxRadius=Math.max(legMaxRadius,r);minY=Math.min(minY,p.y);maxY=Math.max(maxY,p.y);legMinTangent=Math.min(legMinTangent,q.y);
    if(r<4.5&&p.y>2.35&&p.y<17&&!allowed(p))wallViolations++;
   }
   // Analytic intersections of actual mesh edges with the cylindrical hull.
   for(let i=0;i<indices.length;i+=3)for(let j=0;j<3;j++){
    const p=points[indices[i+j]],d=points[indices[i+(j+1)%3]].subtract(p);
    const a=d.x*d.x+d.z*d.z,b=2*(p.x*d.x+p.z*d.z),c=p.x*p.x+p.z*p.z-4.5*4.5,disc=b*b-4*a*c;
    if(a<1e-12||disc<0)continue;
    for(const t of [(-b-Math.sqrt(disc))/(2*a),(-b+Math.sqrt(disc))/(2*a)])if(t>=0&&t<=1){const hit=p.add(d.scale(t));if(hit.y>2.35&&hit.y<17){crossings++;if(!allowed(hit))wallViolations++;}}
   }
  }
  const doorPoints=leg.door.getChildMeshes().flatMap(vertices);
  if(stages.leg===0){
   // During door movement all legs are stowed; radial shells separate the assemblies.
   doorSeparation=Math.min(doorSeparation,Math.min(...doorPoints.map(p=>Math.hypot(p.x,p.z)))-legMaxRadius);
  }else{
   // Fully-open door lies on the negative tangential side of its own gear corridor.
   doorSeparation=Math.min(doorSeparation,legMinTangent-Math.max(...doorPoints.map(p=>local(p).y)));
  }
  for(const h of [5.3,9,12,15.3]){
   const origin=new Vector3(6*ca,h,-6*sa),direction=new Vector3(-ca,0,sa);
   const ray=new Ray(Vector3.TransformCoordinates(origin,ship.root.getWorldMatrix()),Vector3.TransformNormal(direction,ship.root.getWorldMatrix()).normalize(),3);
   const hit=scene.pickWithRay(ray,m=>m.name==='hull'||m===leg.cavity||leg.door.getChildMeshes().includes(m));
   const p=hit?.pickedPoint?Vector3.TransformCoordinates(hit.pickedPoint,inverse):null;
   cavityRays.push({radius:p?Math.hypot(p.x,p.z):null,name:hit?.pickedMesh?.name??null});
  }
 }
 return {deployment,stages,maxRadius,minY,maxY,wallViolations,crossings,hingeError,doorSeparation,cavityRays};
}
function inspectLegEngineClearance(){
 const ship=ships[currentLod]!;ship.root.computeWorldMatrix(true);
 const inverse=ship.root.getWorldMatrix().clone().invert();
 const bay=ship.root.getChildMeshes().find(m=>m.name==='engineBay')!;
 const bp=bay.getVerticesData('position')!;
 let radius=0,ceiling=0;
 for(let i=0;i<bp.length;i+=3){radius=Math.max(radius,Math.hypot(bp[i],bp[i+2]));ceiling=Math.max(ceiling,bp[i+1]);}
 // Conservatively protect the whole engine bay and the space immediately below it.
 const keepOutRadius=radius+.08;ceiling+=.08;
 let minRadius=Infinity,intersections=0;
 for(const leg of ship.legs)for(const {mesh} of leg.parts){
  leg.node.computeWorldMatrix(true);mesh.computeWorldMatrix(true);
  const positions=mesh.getVerticesData('position')!,indices=mesh.getIndices()!;
  const points:Vector3[]=[];
  for(let i=0;i<positions.length;i+=3)points.push(Vector3.TransformCoordinates(Vector3.TransformCoordinates(Vector3.FromArray(positions,i),mesh.getWorldMatrix()),inverse));
  for(let i=0;i<indices.length;i+=3)for(let e=0;e<3;e++){
   const a=points[indices[i+e]],b=points[indices[i+(e+1)%3]],d=b.subtract(a);
   let lo=0,hi=1;
   if(Math.abs(d.y)<1e-8){if(a.y<0||a.y>ceiling)continue;}
   else{const p=-a.y/d.y,q=(ceiling-a.y)/d.y;lo=Math.max(lo,Math.min(p,q));hi=Math.min(hi,Math.max(p,q));if(lo>hi)continue;}
   const denom=d.x*d.x+d.z*d.z;
   const t=denom>1e-12?Math.max(lo,Math.min(hi,-(a.x*d.x+a.z*d.z)/denom)):lo;
   const r=Math.hypot(a.x+t*d.x,a.z+t*d.z);minRadius=Math.min(minRadius,r);if(r<keepOutRadius)intersections++;
  }
 }
 return {deployment,keepOutRadius,ceiling,minRadius,clearance:minRadius-keepOutRadius,intersections};
}
const api={ready:false,setView,setPose,setLod,seekElevator:(t:number)=>{elevator=Math.max(0,Math.min(1,t));elevatorVelocity=0;paused=true;$('pause').textContent='Tiếp tục';applyPose();},metrics:()=>({view:currentView,lod:currentLod,paused,deployment,elevator,elevatorVelocity,gearVelocity,gearStages:landingGearPose(deployment),stages:elevatorPose(elevator),drawCalls:frameDrawCalls,meshCount:scene.meshes.length,fps:engine.getFps(),importMs}),
 seekLegs:(t:number)=>{deployment=Math.max(0,Math.min(1,t));gearVelocity=0;paused=true;$('pause').textContent='Tiếp tục';applyPose();},legEngineClearance:inspectLegEngineClearance,enclosedGear:inspectEnclosedGear,
 clearance:()=>elevatorClearance(ships[currentLod]!),engineBay:inspectEngineBay,
 worldGear:()=>ships[currentLod]!.legs.map(l=>{l.foot.computeWorldMatrix(true);return l.foot.getAbsolutePosition().asArray();}),
 camera:(alpha:number,beta:number,radius:number,target:number[])=>{camera.setTarget(Vector3.FromArray(target));camera.alpha=alpha;camera.beta=beta;camera.radius=radius;},
 transforms:()=>Object.fromEntries(Object.entries(ships).map(([lod,ship])=>[lod,{
  enabled:ship.root.isEnabled(),carY:ship.car.position.y,carZ:ship.car.position.z,legs:ship.legs.map(l=>l.node.rotationQuaternion!.asArray()),feet:ship.legs.map(l=>l.foot.rotationQuaternion!.asArray()),doors:ship.legs.map(l=>l.door.rotationQuaternion!.asArray()),
  floor:ship.floor.rotationQuaternion!.asArray(),guards:ship.guards.map(g=>g.rotationQuaternion!.asArray()),arms:ship.arms.position.asArray(),cables:{enabled:ship.cables.isEnabled(),links:ship.links.map(l=>({name:l.mesh.name,position:l.mesh.position.asArray(),scale:l.mesh.scaling.asArray(),rotation:l.mesh.rotationQuaternion!.asArray()}))},
  casterCount:ship.meshes.filter(m=>shadows.getShadowMap()?.renderList?.includes(m)).length,
  meshCount:ship.meshes.filter(m=>m.getTotalVertices()>0).length,
 }]))};
Object.assign(window,{__hlsReview:api});

async function start(){
 ships.near=await load('near');ships.far=await load('far');
 const oc=await LoadAssetContainerAsync('/models/orion.glb',scene);oc.addAllToScene();
 orion=oc.rootNodes[0] as TransformNode;
 orion.parent=assembly;
 orion.rotationQuaternion=Quaternion.RotationAxis(Vector3.Right(),Math.PI);
 orion.position.y=55.76;orion.setEnabled(false);
 for(const mesh of orion.getChildMeshes())if(mesh.material instanceof PBRMaterial){mesh.material.metallic=.2;mesh.material.roughness=.45;}
 setLod('near');setView('three-quarter');
 await scene.whenReadyAsync();importMs=Math.round(performance.now()-started);ready=true;api.ready=true;
 $('status').textContent='WEBGL · LIVE';
}
for(const button of document.querySelectorAll<HTMLButtonElement>('[data-view]'))button.onclick=()=>{if(ready)setView(button.dataset.view as View);};
$('pose').onclick=()=>{if(ready)setPose(desired==='surface'?'flight':'surface');};
$('lod').onclick=()=>{if(ready)setLod(currentLod==='near'?'far':'near');};
$('pause').onclick=()=>{paused=!paused;$('pause').textContent=paused?'Tiếp tục':'Tạm dừng';};
window.addEventListener('resize',()=>engine.resize());
engine.runRenderLoop(()=>{
 if(ready&&!paused){const dt=Math.min(engine.getDeltaTime()/1000,.05);const gear=stepLandingGear({position:deployment,velocity:gearVelocity},desired==='surface'?1:0,dt);deployment=gear.position;gearVelocity=gear.velocity;const motion=stepElevatorMotion({position:elevator,velocity:elevatorVelocity},desired==='surface'?1:0,dt);elevator=motion.position;elevatorVelocity=motion.velocity;applyPose();}
 scene.render();
});
start().catch(error=>{console.error(error);$('failure').hidden=false;$('failure').textContent='Không tải được bản xem thử: '+String(error);$('status').textContent='LỖI TẢI';});
window.addEventListener('pagehide',()=>{engine.stopRenderLoop();scene.dispose();engine.dispose();},{once:true});
