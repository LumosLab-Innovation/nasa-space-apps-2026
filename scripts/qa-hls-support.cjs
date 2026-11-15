const {chromium}=require(process.env.PLAYWRIGHT_PATH||'C:/Users/ADMIN/AppData/Local/npm-cache/_npx/9833c18b2d85bc59/node_modules/playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-gpu']});
 try{
  const page=await browser.newPage();await page.goto('http://localhost:5173/?demo=1');
  await page.waitForFunction(()=>window.__world,undefined,{timeout:120000});
  const result=await page.evaluate(async()=>{
   const {sampleHeight}=await import('/src/data/heightmap.ts'),w=window.__world,h=w.hlsRig.parent;
   return {rotation:h.rotation.asArray(),up:h.up.asArray(),support:h.getDescendants().find(n=>n.name==='hls-model').getDescendants().filter(n=>/^footPivot_/.test(n.name)).map(n=>{
    n.computeWorldMatrix(true);const center=n.getAbsolutePosition();
    const points=n.getChildMeshes().flatMap(m=>{m.computeWorldMatrix(true);return m.getBoundingInfo().boundingBox.vectorsWorld;});
    return {name:n.name,center:center.asArray(),ground:sampleHeight(w.hm,center.x,center.z),min:Math.min(...points.map(p=>p.y-sampleHeight(w.hm,p.x,p.z)))};
   })};
  });console.log(result);fs.writeFileSync('docs/screens/hls-support-check.json',JSON.stringify(result,null,2));
  assert.ok(result.support.every(p=>p.min>=-.025&&p.min<.12),'six pads follow the terrain');
  const lod=await page.evaluate(()=>{
   const w=window.__world,h=w.hlsRig.parent,C=w.player.camera.constructor,V=h.position.constructor;
   const c=new C('lodQA',1,1.3,2000,h.position.add(new V(0,25,0)),w.scene);c.maxZ=6000;w.scene.activeCamera=c;
   c.getViewMatrix(true);w.hlsRig.update(0);const far=w.hlsRig.inspect();
   c.radius=85;c.getViewMatrix(true);w.hlsRig.update(0);const near=w.hlsRig.inspect();
   return {far,near};
  });
  assert.equal(lod.far.lod,'far');assert.equal(lod.near.lod,'near');
  for(const r of [lod.far,lod.near]){
   assert.equal(r.models.filter(m=>m.enabled).length,1);assert.equal(r.models.find(m=>!m.enabled).casters,0);
   assert.equal(r.models.find(m=>m.enabled).casters,1,'settled geometry batches into one caster');
   assert.deepEqual(r.models[0].feet,r.models[1].feet,'identical LOD foot poses');
  }
  fs.writeFileSync('docs/screens/hls-lod-check.json',JSON.stringify(lod,null,2));console.log('Support and LOD QA passed');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
