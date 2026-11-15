const {chromium}=require('C:/Users/ADMIN/AppData/Local/npm-cache/_npx/9833c18b2d85bc59/node_modules/playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});const report={errors:[],frames:[]};try{
 const page=await browser.newPage({viewport:{width:1440,height:810}});page.on('pageerror',e=>report.errors.push(String(e)));
 await page.addInitScript(()=>localStorage.setItem('pipmica.lang','vi'));
 await page.goto((process.env.URL||'http://localhost:5174/')+'?intro=only&assist=1');await page.waitForFunction(()=>window.__intro,undefined,{timeout:180000});await page.keyboard.press('Enter');await page.waitForTimeout(4000);
 await page.evaluate(async()=>{const {readOrbitalElevation,renderedTerrainClearance}=await import('/src/world/orbitalTerrain.ts');window.__clearance=renderedTerrainClearance;window.__elevation=await readOrbitalElevation(await(await fetch('/textures/moon/lola-elevation-delta-v1.bin')).arrayBuffer());window.__intro.director.stage='brake';window.__intro.director.stepBrake=()=>[];});
 for(const height of [1000,500,300,100]){
  await page.evaluate(h=>{window.__intro.director.brake.h=h;},height);await page.waitForTimeout(height===1000?3500:500);
  const frame=await page.evaluate(()=>{
   const {hlsRig,scene,director}=window.__intro,h=hlsRig.parent,V=h.position.constructor,up=h.position.normalizeToNew(),forward=new V(-up.z,0,up.x).normalize(),side=V.Cross(up,forward).normalize(),camera=scene.activeCamera;
   h.computeWorldMatrix(true);let lowest=Infinity;
   for(const m of h.getChildMeshes())if(m.isEnabled()&&m.isVisible&&m.name!=='hlsPlume'){m.computeWorldMatrix(true);for(const p of m.getBoundingInfo().boundingBox.vectorsWorld)lowest=Math.min(lowest,window.__clearance(p,window.__elevation)*1000);}
   const delta=camera.position.subtract(h.position).scale(1000),target=camera.getTarget().subtract(h.position).scale(1000);
   return {height:director.brake.h,scale:h.scaling.x,hullClearance:lowest,cameraClearance:window.__clearance(camera.position,window.__elevation)*1000,back:-V.Dot(delta,forward),up:V.Dot(delta,up),side:V.Dot(delta,side),targetForward:V.Dot(target,forward)};
  });
  const d=.8*(110+100*height/1000);
  assert.ok(Math.abs(frame.back-d)<1,'camera distance matches selected preview');assert.ok(Math.abs(frame.up-.45*d)<1);assert.ok(Math.abs(frame.side-.3*d)<1);assert.ok(Math.abs(frame.targetForward-.6*d)<1);
  assert.equal(frame.scale,.001);assert.ok(Math.abs(frame.hullClearance-height)<5);assert.ok(frame.cameraClearance>1);
  await page.screenshot({path:`docs/screens/close-approach-${height}m.png`});report.frames.push(frame);
 }
 assert.deepEqual(report.errors,[]);console.log('PASS close camera',report.frames);
}finally{fs.writeFileSync('docs/screens/close-camera-qa.json',JSON.stringify(report,null,2));await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
