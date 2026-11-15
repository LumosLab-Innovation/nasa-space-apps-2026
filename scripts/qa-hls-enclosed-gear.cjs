const {chromium}=require('C:/Users/ADMIN/AppData/Local/npm-cache/_npx/9833c18b2d85bc59/node_modules/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 try{
  const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://localhost:5173/preview/hls.html');await page.waitForFunction(()=>window.__hlsReview?.ready);
  const samples=await page.evaluate(()=>{
   const a=window.__hlsReview;a.setView('gear');const samples=[];
   for(const lod of ['near','far']){a.setLod(lod);for(let i=0;i<=100;i++){a.seekLegs(i/100);samples.push({lod,...a.enclosedGear(),engine:a.legEngineClearance()});}}
   return samples;
  });
  fs.writeFileSync('docs/screens/hls-enclosed-samples.json',JSON.stringify(samples,null,2));
  for(const s of samples){
   const label=`${s.lod} phase ${s.deployment}`;
   assert.equal(s.wallViolations,0,`${label}: gear crosses solid hull/cavity wall`);
   assert.equal(s.engine.intersections,0,`${label}: engine envelope intrusion`);
   assert.ok(s.doorSeparation>.02,`${label}: door/leg separation ${s.doorSeparation}`);
   assert.ok(s.hingeError<.0001,`${label}: detached main hinge`);
   if(s.deployment===0){
    assert.ok(s.maxRadius<4.43,`${label}: exposed stowed gear ${s.maxRadius}`);
    assert.ok(s.minY>5&&s.maxY<15.6);
    assert.ok(s.cavityRays.every(r=>r.name?.startsWith('doorMesh_')&&r.radius>4.43),`${label}: closed doors leave gap`);
   }
   if(s.deployment===1){
    assert.ok(Math.abs(s.minY)<.001,`${label}: feet not on ground`);
    assert.ok(s.cavityRays.every(r=>r.name?.startsWith('gearCavity_')&&r.radius<3.51),`${label}: fake cavity or obstructed opening`);
   }
  }
  await page.evaluate(()=>{const a=window.__hlsReview;a.setLod('near');a.setView('gear');});
  for(const [name,t]of [['closed',0],['doors-open',.22],['swing',.5],['open',1]]){
   await page.evaluate(t=>window.__hlsReview.seekLegs(t),t);await page.waitForTimeout(120);
   await page.locator('#review').screenshot({path:`docs/screens/hls-enclosed-${name}.png`});
  }
  await page.evaluate(()=>window.__hlsReview.setView('underside'));await page.waitForTimeout(120);
  await page.locator('#review').screenshot({path:'docs/screens/hls-enclosed-underside.png'});
  const world=await page.evaluate(()=>{
   const a=window.__hlsReview;a.setView('gear');const upright=a.worldGear();
   a.setView('docking');const docking=a.worldGear();a.setLod('far');const far=a.worldGear();
   a.setLod('near');return {upright,docking,far};
  });
  for(let i=0;i<6;i++){
   const p=world.upright[i],q=world.docking[i];
   assert.ok(Math.hypot(q[0]+p[1],q[1]-p[0],q[2]-p[2])<.0001,'world gear follows docking assembly rotation');
   assert.ok(Math.hypot(...q.map((v,j)=>v-world.far[i][j]))<.0001,'world LOD endpoints match');
  }
  await page.evaluate(()=>{const a=window.__hlsReview;a.setView('surface');a.camera(2,1.35,38,[0,9,0]);});await page.waitForTimeout(200);
  await page.locator('#review').screenshot({path:'docs/screens/hls-enclosed-ground.png'});
  for(const t of [.1,.5,.9]){
   await page.evaluate(t=>{const a=window.__hlsReview;a.setView('gear');a.setPose('surface');a.seekLegs(t);},t);
   const before=await page.evaluate(()=>window.__hlsReview.transforms());await page.waitForTimeout(120);
   assert.deepEqual(await page.evaluate(()=>window.__hlsReview.transforms()),before,'paused all gear joints');
   await page.click('#pause');await page.waitForTimeout(150);await page.click('#pause');
   const moved=await page.evaluate(()=>window.__hlsReview.transforms());assert.notDeepEqual(moved,before);
   await page.evaluate(()=>window.__hlsReview.setPose('flight'));
   assert.deepEqual(await page.evaluate(()=>window.__hlsReview.transforms()),moved,'reverse does not snap');
   await page.click('#pause');await page.waitForTimeout(450);await page.click('#pause');
   assert.notDeepEqual(await page.evaluate(()=>window.__hlsReview.transforms()),moved,'reverse moves');
  }
  assert.deepEqual(errors,[]);
  await context.close();
  const vc=await browser.newContext({viewport:{width:1280,height:900},recordVideo:{dir:'docs/screens',size:{width:1280,height:900}}});
  const vp=await vc.newPage();await vp.goto('http://localhost:5173/preview/hls.html');await vp.waitForFunction(()=>window.__hlsReview?.ready);
  await vp.addStyleTag({content:'header,nav,footer,.reference,.label,.caption{display:none!important}body{margin:0!important;padding:0!important}main{display:block!important;padding:0!important;height:100vh!important}.render{width:100vw!important;height:100vh!important;border:0!important}canvas{width:100vw!important;height:100vh!important}'});
  await vp.evaluate(()=>{window.dispatchEvent(new Event('resize'));window.__hlsReview.setView('gear');});
  await vp.waitForTimeout(800);await vp.evaluate(()=>window.__hlsReview.setPose('surface'));
  await vp.waitForFunction(()=>window.__hlsReview.metrics().deployment===1,null,{timeout:60000});await vp.waitForTimeout(1000);
  await vp.evaluate(()=>window.__hlsReview.setPose('flight'));
  await vp.waitForFunction(()=>window.__hlsReview.metrics().deployment===0,null,{timeout:60000});await vp.waitForTimeout(1000);
  await vp.evaluate(()=>window.__hlsReview.setView('underside'));await vp.waitForTimeout(1200);
  const video=vp.video();await vc.close();await video.saveAs('docs/screens/hls-enclosed-cycle.webm');await video.delete();
  fs.writeFileSync('docs/screens/hls-enclosed-qa.json',JSON.stringify({ok:true,samples:samples.length,closedMaxRadius:Math.max(...samples.filter(s=>s.deployment===0).map(s=>s.maxRadius)),minDoorSeparation:Math.min(...samples.map(s=>s.doorSeparation)),realCavities:true,worldDockingAndLod:true,pauseReverse:true,fullCycle:true,errors},null,2));
  console.log('PASS enclosed gear: actual geometry, cavity ray probes, pause/reverse, full video',samples.length);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
