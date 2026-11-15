const fs=require('node:fs'),assert=require('node:assert/strict');
const b=fs.readFileSync('public/models/orion.glb'),j=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)));
const binStart=20+b.readUInt32LE(12)+8;
function values(i){const a=j.accessors[i],v=j.bufferViews[a.bufferView],n={SCALAR:1,VEC2:2,VEC3:3,VEC4:4}[a.type],size={5123:2,5125:4,5126:4}[a.componentType],read={5123:'readUInt16LE',5125:'readUInt32LE',5126:'readFloatLE'}[a.componentType];return Array.from({length:a.count},(_,k)=>Array.from({length:n},(_,d)=>b[read](binStart+(v.byteOffset||0)+(a.byteOffset||0)+k*(v.byteStride||size*n)+d*size)));}
const tris=j.meshes.reduce((sum,m)=>sum+m.primitives.reduce((n,p)=>n+j.accessors[p.indices].count/3,0),0);
assert.ok(tris<=25000,`triangle budget: ${tris}`);assert.ok(b.length<=2*1024*1024,`size ${b.length}`);
// No triangle may close the main nozzle mouth: points at the aft lip must stay on the rim.
const engine=j.nodes.find(n=>n.name==='engine');assert.ok(engine);
const primitives=j.meshes[engine.mesh].primitives;
const points=primitives.flatMap(p=>values(p.attributes.POSITION));
const aft=Math.min(...points.map(p=>p[1]));
const mouth=points.filter(p=>p[1]<aft+.035);
assert.ok(mouth.length>20);assert.ok(Math.min(...mouth.map(p=>Math.hypot(p[0],p[2])))>.58,'open broad mouth facing aft');
const shell=primitives.find(p=>j.materials[p.material].name==='Orion_Engine');
const shellPositions=values(shell.attributes.POSITION),shellNormals=values(shell.attributes.NORMAL);
assert.ok(shellPositions.every((p,i)=>p[0]*shellNormals[i][0]+p[2]*shellNormals[i][2]>0),'outer bell normals face outward');
assert.ok((j.images||[]).length>=1,'embedded solar texture');
assert.ok(j.images.every(i=>i.bufferView!==undefined&&!i.uri),'no untracked texture requests');
console.log(JSON.stringify({bytes:b.length,triangles:tris,primitives:j.meshes.reduce((s,m)=>s+m.primitives.length,0),images:j.images.length,aft,mouthRadius:Math.min(...mouth.map(p=>Math.hypot(p[0],p[2])))},null,2));
