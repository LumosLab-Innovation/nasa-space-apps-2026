import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
function inspect(relative,maxTriangles){
 const buffer=fs.readFileSync(path.join(root,relative));
 assert.equal(buffer.toString('ascii',0,4),'glTF');assert.equal(buffer.readUInt32LE(4),2);assert.equal(buffer.readUInt32LE(8),buffer.length);
 const json=JSON.parse(buffer.toString('utf8',20,20+buffer.readUInt32LE(12)));
 const binaryStart=28+buffer.readUInt32LE(12);
 const parents=new Map();
 json.nodes.forEach((n,i)=>(n.children??[]).forEach(c=>{assert.ok(!parents.has(c),'unique parent');parents.set(c,i);}));
 function world(point,index){
  let p=[...point],steps=0;
  while(index!==undefined){
   assert.ok(++steps<=json.nodes.length,'acyclic hierarchy');
   const n=json.nodes[index];
   if(n.matrix){const m=n.matrix;const [x,y,z]=p;p=[m[0]*x+m[4]*y+m[8]*z+m[12],m[1]*x+m[5]*y+m[9]*z+m[13],m[2]*x+m[6]*y+m[10]*z+m[14]];}
   else{
    p=p.map((x,i)=>x*(n.scale?.[i]??1));
    const [x,y,z,w]=n.rotation??[0,0,0,1];const [px,py,pz]=p;
    const tx=2*(y*pz-z*py),ty=2*(z*px-x*pz),tz=2*(x*py-y*px);
    p=[px+w*tx+y*tz-z*ty,py+w*ty+z*tx-x*tz,pz+w*tz+x*ty-y*tx];
    p=p.map((x,i)=>x+(n.translation?.[i]??0));
   }
   index=parents.get(index);
  }return p;
 }
 function points(index){
  const n=json.nodes[index];let result=[];
  if(n.mesh!==undefined)for(const primitive of json.meshes[n.mesh].primitives){
   const a=json.accessors[primitive.attributes.POSITION];assert.equal(a.componentType,5126);
   const v=json.bufferViews[a.bufferView];const offset=binaryStart+(v.byteOffset??0)+(a.byteOffset??0);
   for(let i=0;i<a.count;i++)result.push(world([0,1,2].map(c=>buffer.readFloatLE(offset+i*(v.byteStride??12)+c*4)),index));
  }
  for(const child of n.children??[])result.push(...points(child));
  return result;
 }
 function bounds(p){return {min:[0,1,2].map(i=>Math.min(...p.map(v=>v[i]))),max:[0,1,2].map(i=>Math.max(...p.map(v=>v[i])))};}
 const find=name=>json.nodes.findIndex(n=>n.name===name);
 const carPoints=points(find('elevatorCar'));
 assert.ok(!carPoints.some(p=>p[1]>2&&p[1]<37&&Math.hypot(p[0],p[2])<4.5-.001),'raised elevator penetrates cylindrical hull');
 assert.ok(find('hoistHousing')>=0,'fixed hoist must be measurable separately');
 const carBox=bounds(carPoints),hoistBox=bounds(points(find('hoistHousing')));
 assert.ok([0,1,2].some(i=>carBox.max[i]<hoistBox.min[i]||carBox.min[i]>hoistBox.max[i]),'basket overlaps fixed hoist housing');
 const names=json.nodes.map(n=>n.name);
 const required=['hls_root','hull','legs','thrusters','engineBay','elevator','elevatorCar','elevatorCarrier','floorHinge','guardLeft','guardRight','guardFront','supportArms','hoistCables','dockingAnchor','engineAnchor','elevatorFloor',...['Left','Right'].flatMap(side=>['suspension','winchAnchor','pulleyFeed','pulleyDrop','cableLead','cableDrop'].map(p=>p+side)),...Array.from({length:6},(_,i)=>`legPivot_${i}`),...Array.from({length:6},(_,i)=>`engineBell_${i}`)];
 for(const name of required)assert.equal(names.filter(n=>n===name).length,1,`${relative}: unique ${name}`);
 for(let i=0;i<6;i++)for(const prefix of ['footPivot_','doorPivot_','gearSocket_','gearCavity_']){
  const name=prefix+i;assert.equal(names.filter(n=>n===name).length,1,`unique enclosed gear ${name}`);
  const n=json.nodes[find(name)];
  if(prefix==='footPivot_')assert.ok(Number.isFinite(n.extras?.foldAngleY),'finite foot angle');
  if(prefix==='doorPivot_')assert.ok(Number.isFinite(n.extras?.openAngleZ),'finite door angle');
  required.push(name);
 }
 for(const name of ['elevatorCar',...Array.from({length:6},(_,i)=>`legPivot_${i}`)]){
  const n=json.nodes.find(n=>n.name===name);assert.ok(n.children?.length&&points(find(name)).length>0,`${name}: must own moving geometry`);
  if(name.startsWith('legPivot'))assert.ok(Number.isFinite(n.extras?.stowAngleY)&&n.extras.stowAngleY<0&&n.extras.stowAngleY>-Math.PI,`${name}: outward swing-up metadata`);
 }
 assert.ok(Number.isFinite(json.nodes[find('elevatorCar')].extras?.surfaceZ),'surface rest height');
 const docking=world([0,0,0],find('dockingAnchor'));assert.ok(docking[1]>49&&docking[1]<51&&Math.hypot(docking[0],docking[2])<.01,'world docking point at nose');
 const worldBounds=bounds(points(find('hls_root')));
 assert.ok(worldBounds.min[1]>=-.05&&worldBounds.max[1]>49&&worldBounds.max[1]<51,'positive world-space height');
 assert.ok(worldBounds.max.every((x,i)=>Number.isFinite(x)&&x>worldBounds.min[i]),'positive finite world volume');
 const textures=[];
 for(const image of json.images??[]){
  assert.ok(image.bufferView!==undefined&&!image.uri,'embed all images');
  assert.equal(image.mimeType,'image/png','checker handles PNG atlas');
  const v=json.bufferViews[image.bufferView];const offset=binaryStart+(v.byteOffset??0);
  assert.equal(buffer.toString('ascii',offset+1,offset+4),'PNG');
  const width=buffer.readUInt32BE(offset+16),height=buffer.readUInt32BE(offset+20);
  assert.ok(width>0&&width<=2048&&height>0&&height<=2048,'texture dimensions within budget');textures.push({width,height});
 }
 for(const b of json.buffers)assert.ok(!b.uri,'no external buffers');
 let triangles=0,primitives=0;
 for(const m of json.meshes)for(const p of m.primitives){
  assert.equal(p.mode??4,4,'triangles only');triangles+=json.accessors[p.indices].count/3;primitives++;
  const pos=json.accessors[p.attributes.POSITION];assert.ok(pos.min.every(Number.isFinite)&&pos.max.every(Number.isFinite),'finite bounds');
 }
 assert.ok(triangles<maxTriangles,`${triangles} exceeds budget ${maxTriangles}`);
 assert.ok(primitives<=38,`${primitives} base-pass draw calls exceeds enclosed gear candidate budget`);
 const rig=required.filter(name=>/^(legPivot|footPivot|doorPivot|gearSocket|gearCavity)/.test(name)||['hls_root','elevator','elevatorCar','dockingAnchor','engineAnchor'].includes(name)).map(name=>{const n=json.nodes[find(name)];return {name,translation:n.translation,rotation:n.rotation,scale:n.scale,stowAngle:n.extras?.stowAngleY,footAngle:n.extras?.foldAngleY,doorAngle:n.extras?.openAngleZ,surfaceHeight:n.extras?.surfaceZ,parent:json.nodes[parents.get(find(name))]?.name};});
 return {file:relative,bytes:buffer.length,triangles,primitives,nodes:json.nodes.length,materials:json.materials.length,textures,worldBounds,clearanceVerified:true,rig};
}
const assets=[inspect('public/models/review/hls-v2.glb',45000),inspect('public/models/review/hls-v2-far.glb',15000)];
assert.ok(assets.reduce((n,a)=>n+a.bytes,0)<4000000,'total asset budget');
assert.deepEqual(assets[0].rig,assets[1].rig,'near/far rig transforms and metadata must match');
console.log(JSON.stringify({ok:true,assets:assets.map(({rig,...data})=>data)},null,2));
