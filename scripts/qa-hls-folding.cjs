const {chromium}=require(process.env.PLAYWRIGHT_PATH||'C:/Users/ADMIN/AppData/Local/npm-cache/_npx/9833c18b2d85bc59/node_modules/playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const out=path.resolve(__dirname,'../docs/screens');
const sub=(a,b)=>a.map((v,i)=>v-b[i]);const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);const clamp=t=>Math.max(0,Math.min(1,t));
function segmentDistance([p1,q1],[p2,q2]){
 const d1=sub(q1,p1),d2=sub(q2,p2),r=sub(p1,p2);const a=dot(d1,d1),e=dot(d2,d2),b=dot(d1,d2),c=dot(d1,r),f=dot(d2,r),den=a*e-b*b;
 let s=den>1e-12?clamp((b*f-c*e)/den):0;let t=(b*s+f)/e;
 if(t<0){t=0;s=clamp(-c/a);}else if(t>1){t=1;s=clamp((b-c)/a);}
 return Math.hypot(...r.map((v,i)=>v+s*d1[i]-t*d2[i]));
}
function pointSegment(p,[a,b]){const d=sub(b,a),t=clamp(dot(sub(p,a),d)/dot(d,d));return Math.hypot(...p.map((v,i)=>v-a[i]-t*d[i]));}
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-gpu']});
 try {
 const context=await browser.newContext({viewport:{width:1600,height:1050},deviceScaleFactor:1});
 const page=await context.newPage();const errors=[];
 page.on('pageerror',e=>errors.push(String(e)));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 await page.goto('http://localhost:5173/preview/hls.html',{waitUntil:'networkidle'});
 await page.waitForFunction(()=>window.__hlsReview?.ready);
 const sampled=await page.evaluate(()=>{
  const api=window.__hlsReview;api.setView('detail');api.setPose('surface',true);const results=[];
  for(const lod of ['near','far']){
   api.setLod(lod);
   for(let i=0;i<=1000;i++){api.seekElevator(i/1000);results.push({lod,t:i/1000,clearance:api.clearance(),transforms:api.transforms()[lod],stages:api.metrics().stages});}
  }return results;
 });
 for(const sample of sampled){
  assert.equal(sample.transforms.cables.enabled,true,`suspension hidden at ${sample.t}`);
  const rails=sample.clearance.railSegments;
  for(const side of [0,1])for(const a of rails[side])for(const b of rails[2])assert.ok(segmentDistance(a,b)>.07,`rail collision at ${sample.t}`);
  for(const link of sample.clearance.connections){
   assert.equal(link.visible,true,`hidden ${link.name} at ${sample.t}`);
   for(let end=0;end<2;end++)assert.ok(Math.hypot(...sub(link.actual[end],link.anchors[end]))<.0001,`disconnected ${link.name} at ${sample.t}`);
  }
  assert.ok(Math.hypot(...sub(sample.clearance.hinge,sample.clearance.socket))<.0001,`floating floor hinge at ${sample.t}`);
  for(const foot of sample.clearance.guardSockets)assert.ok(Math.hypot(...sub(foot.actual,foot.socket))<.0001,`floating guard foot at ${sample.t}`);
  assert.deepEqual(sample.clearance.armScale,[1,1,1],'telescoping arm translates, not scales');
  assert.ok(sample.clearance.armReach-1<4.925,'moving arm remains engaged in housing');
  assert.ok(sample.clearance.minHullRadius>=4.5,`hull collision ${sample.lod} at ${sample.t}`);
  assert.equal(sample.clearance.overlapsHousing,false,`housing collision ${sample.lod} at ${sample.t}`);
  assert.equal(sample.clearance.overlapsLandingGear,false,`landing gear blocks elevator at ${sample.t}`);
  assert.equal(sample.clearance.overlapsGearDoors,false,`open gear doors block elevator at ${sample.t}`);
  assert.ok(sample.clearance.min[1]>=0,`floor below ground ${sample.t}`);
  if(sample.t===0){assert.ok(sample.clearance.max[2]<5.3,'folded mechanism projects less than 0.8m beyond hull');assert.ok(sample.transforms.cables.links.filter(l=>l.name.startsWith('cableDrop')).every(l=>l.scale[1]<.4),'cables reeled in close to carriage');}
 }
 await page.evaluate(()=>{window.__hlsReview.setLod('near');window.__hlsReview.setView('docking');});
 await page.waitForTimeout(300);await page.screenshot({path:path.join(out,'hls-folded-docking.png')});
 const engineChecks=[];
 for(const lod of ['near','far']){
  await page.evaluate(lod=>{window.__hlsReview.setLod(lod);window.__hlsReview.setView('underside');},lod);
  const check=await page.evaluate(()=>window.__hlsReview.engineBay());
  assert.equal(check.bells,6);assert.ok(check.hits.every(h=>h.y!==null&&h.y<3.4),'closed engine bay at every sampled ray');engineChecks.push({lod,rays:check.hits.length,bells:check.bells});
 }
 await page.evaluate(()=>window.__hlsReview.setLod('near'));
 for(const view of ['underside','engine-detail']){
  await page.evaluate(view=>window.__hlsReview.setView(view),view);await page.waitForTimeout(250);
  await page.screenshot({path:path.join(out,`hls-v3-${view}.png`)});
 }
 for(const [name,t]of [['stowed',0],['floor-opening',.28],['ready-to-lower',.52]]){
  await page.evaluate(t=>{window.__hlsReview.setView('detail');window.__hlsReview.seekElevator(t);},t);
  await page.waitForTimeout(150);await page.screenshot({path:path.join(out,`hls-elevator-${name}.png`)});
 }
 // Exercise actual time-based transforms in each mechanical stage, including pause and reversal.
 for(const t of [.07,.25,.43,.7]){
  await page.evaluate(t=>{window.__hlsReview.setView('detail');window.__hlsReview.setPose('surface');window.__hlsReview.seekElevator(t);},t);
  const a=await page.evaluate(()=>window.__hlsReview.transforms());
  await page.waitForTimeout(120);assert.deepEqual(await page.evaluate(()=>window.__hlsReview.transforms()),a,'paused whole rig');
  await page.click('#pause');await page.waitForTimeout(130);await page.click('#pause');
  const b=await page.evaluate(()=>window.__hlsReview.transforms());assert.notDeepEqual(a.near,b.near,'resumed rig');
  const before=await page.evaluate(()=>window.__hlsReview.transforms());
  await page.evaluate(()=>window.__hlsReview.setPose('flight'));
  assert.deepEqual(await page.evaluate(()=>window.__hlsReview.transforms()),before,'reverse does not snap');
  await page.click('#pause');await page.waitForTimeout(100);await page.click('#pause');
  assert.notDeepEqual(await page.evaluate(()=>window.__hlsReview.transforms()),before,'reverse moves');
 }
 // Camera navigation must leave detail usable rather than unexpectedly paused.
 await page.evaluate(()=>window.__hlsReview.setView('detail'));assert.equal(await page.evaluate(()=>window.__hlsReview.metrics().paused),false);
 assert.deepEqual(errors,[]);
 const nearFarPoseEquivalent=sampled.slice(0,1001).every((s,i)=>JSON.stringify(s.clearance)===JSON.stringify(sampled[i+1001].clearance));assert.ok(nearFarPoseEquivalent,'LOD mechanism/clearance equality');
 const report={ok:true,errors,clearanceSamples:sampled.length,allStagesPauseResumeReverse:true,guardClearanceAndCableAttachments:true,continuousSuspensionAndDeckHinges:true,engineChecks,flightEnvelope:sampled[0].clearance,nearFarPoseEquivalent};
 // Record live Babylon motion (not a generated mockup).
 await context.close();
 const videoContext=await browser.newContext({viewport:{width:1280,height:900},recordVideo:{dir:out,size:{width:1280,height:900}}});
 const vp=await videoContext.newPage();await vp.goto('http://localhost:5173/preview/hls.html',{waitUntil:'networkidle'});await vp.waitForFunction(()=>window.__hlsReview?.ready);
 await vp.addStyleTag({content:'header,nav,footer,.reference,.label,.caption{display:none!important}body{margin:0!important;padding:0!important}main{display:block!important;padding:0!important;height:100vh!important}.render{width:100vw!important;height:100vh!important;border:0!important}canvas{width:100vw!important;height:100vh!important}'});
 await vp.evaluate(()=>{window.dispatchEvent(new Event('resize'));window.__hlsReview.setView('engine-detail');});
 await vp.waitForTimeout(2500);
 await vp.evaluate(()=>{const a=window.__hlsReview;a.setView('detail');a.setPose('flight',true);window.captureFollow=setInterval(()=>{const y=a.transforms().near.carY;const travel=33.1-y;a.camera(2.05,1.43,12+1.3*travel,[0,(35.65+y)/2,3.8]);},33);});
 await vp.waitForTimeout(700);await vp.evaluate(()=>window.__hlsReview.setPose('surface'));
 await vp.waitForFunction(()=>window.__hlsReview.metrics().elevator===1,{timeout:60000});
 const surface=await vp.evaluate(()=>window.__hlsReview.transforms().near.carY);assert.ok(Math.abs(surface-.22)<.001);
 await vp.screenshot({path:path.join(out,'hls-v3-elevator-surface.png')});await vp.waitForTimeout(1000);
 await vp.evaluate(()=>window.__hlsReview.setPose('flight'));
 await vp.waitForFunction(()=>window.__hlsReview.metrics().elevator===0,{timeout:60000});
 const stowed=await vp.evaluate(()=>window.__hlsReview.transforms().near.carY);assert.ok(Math.abs(stowed-33.1)<.001);
 await vp.screenshot({path:path.join(out,'hls-v3-elevator-stowed.png')});await vp.waitForTimeout(800);
 await vp.evaluate(()=>clearInterval(window.captureFollow));
 const video=vp.video();await videoContext.close();await video.saveAs(path.join(out,'hls-mechanics-full-cycle.webm'));await video.delete();
 fs.writeFileSync(path.join(out,'hls-folding-qa.json'),JSON.stringify({...report,fullCycleRecorded:true,surfaceY:surface,stowedY:stowed},null,2));
 console.log('PASS: 2002 clearance samples including guardrails, landing gear and cable attachments, flight envelope, pause/resume/reverse across all stages; screenshots and full-cycle animation captured.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
