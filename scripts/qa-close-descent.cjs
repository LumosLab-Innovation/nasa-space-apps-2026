const {chromium}=require('C:/Users/ADMIN/AppData/Local/npm-cache/_npx/9833c18b2d85bc59/node_modules/playwright');
const fs=require('fs'),assert=require('node:assert/strict');
const mode=process.env.MODE||'auto',base=process.env.URL||'http://127.0.0.1:5174/',out=`docs/screens/close-descent-${mode}${process.env.CANCEL?'-cancel':process.env.BENCH?'-bench':''}`;
async function button(p,id){const pos=await p.evaluate(id=>{for(const s of window.__engine.scenes)for(const t of s.textures){const c=t.getControlByName?.(id);if(c?.isVisible){const m=c._currentMeasure;return{x:m.left+m.width/2,y:m.top+m.height/2}}}},id);assert.ok(pos,`button ${id}`);await p.mouse.click(pos.x,pos.y);}
(async()=>{
const b=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-gpu']});
const report={mode,base,errors:[],failedRequests:[]};let context;
try{
context=await b.newContext({viewport:{width:1440,height:810},...(process.env.VIDEO?{recordVideo:{dir:'docs/screens/descent-final-video',size:{width:1440,height:810}}}:{})});
const p=await context.newPage();p.on('pageerror',e=>report.errors.push(String(e)));p.on('response',r=>{if(r.status()>=400)report.failedRequests.push({url:r.url(),status:r.status()})});
await p.addInitScript(()=>localStorage.setItem('pipmica.lang','vi'));
await p.goto(base);await p.waitForFunction(()=>window.__engine?.scenes.some(s=>s.activeCamera?.name==='mainMenuCamera'));await p.waitForTimeout(600);await button(p,'new');await p.waitForTimeout(300);await button(p,mode);
await p.waitForFunction(()=>window.__intro,undefined,{timeout:180000});console.log(mode,'LOADED');
report.gpu=await p.evaluate(()=>window.__engine.getGlInfo());
report.presentation=await p.evaluate(()=>{const s=window.__preparedSurface.scene;return {material:s.getMeshByName('terrain').material.name,collar:!!s.getMeshByName('descentTerrainCollar'),backdrop:!!s.getMeshByName('descentMoonBackdrop')};});
assert.equal(report.presentation.material,'regolith');assert.equal(report.presentation.collar,false);assert.equal(report.presentation.backdrop,false);
await p.evaluate(()=>{window.__profile=[];const w=window.__preparedSurface;if(!w)return;const s=w.scene;let physics=0,update=0,render=0;s.onBeforePhysicsObservable.add(()=>{physics=performance.now()});s.onAfterPhysicsObservable.add(()=>window.__profile.push({kind:'physics',ms:performance.now()-physics,active:!!window.__world}));s.onBeforeRenderObservable.add(()=>{update=performance.now();render=update},-1,true);s.onBeforeRenderObservable.add(()=>window.__profile.push({kind:'update',ms:performance.now()-update,active:!!window.__world}));s.onAfterRenderObservable.add(()=>window.__profile.push({kind:'render',ms:performance.now()-render,active:!!window.__world}));});
await p.evaluate(async()=>{window.__pause=(await import('/src/core/pause.ts')).gamePauseClock;window.__sample=(await import('/src/data/heightmap.ts')).sampleHeight;window.__frames=[];let last=performance.now();function tick(t){const i=window.__intro,w=window.__world;const cam=(w?.scene||i?.scene)?.activeCamera;const fade=i?.scene.textures.find(t=>t.getControlByName?.('introFade'))?.getControlByName('introFade');window.__frames.push({dt:t-last,t,stage:i?.director.stage,bridge:i?.bridgeTime,h:w?.descent?.state.h??i?.director.brake.h,paused:window.__pause.isPaused,world:!!w,black:fade?.isVisible?fade.alpha:0,camera:cam?.position.asArray()});last=t;requestAnimationFrame(tick)}requestAnimationFrame(tick)});
await p.keyboard.press('Enter');
if(process.env.FAST){await p.waitForTimeout(4000);await p.evaluate(()=>{window.__intro.director.stage='pip';});}
// Only advance dialogue via real input. Do not teleport craft or override flight physics.
for(let j=0;j<300;j++){await p.waitForTimeout(250);if(await p.evaluate(()=>window.__intro?.director.stage==='brake'))break;await p.keyboard.press('Enter');}
await p.waitForFunction(()=>window.__intro?.director.stage==='brake',undefined,{timeout:15000});console.log(mode,'BRAKING');
if(process.env.FAST){await p.waitForTimeout(4000);await p.evaluate(()=>{window.__intro.director.brake.h=1100;});}
if(process.env.CANCEL){
 await p.waitForFunction(()=>window.__intro?.director.brake.h<999);await p.keyboard.press('Escape');await p.waitForTimeout(30);await button(p,'skip');
 await p.waitForFunction(()=>window.__world);await p.waitForTimeout(1500);
 const view=await p.evaluate(()=>{const s=window.__world.scene;return{material:s.getMeshByName('terrain').material.name,backdrop:s.getMeshByName('descentMoonBackdrop')?.isEnabled()??false,descent:!!window.__world.descent};});
 assert.equal(view.material,'regolith');assert.equal(view.backdrop,false);assert.equal(view.descent,false);report.cancelledPreparation=view;assert.deepEqual(report.errors,[]);return;
}
await p.waitForFunction(()=>window.__intro?.bridgeTime>.9,undefined,{timeout:180000});
if(process.env.INTERACT){
 await p.keyboard.press('Escape');const t=await p.evaluate(()=>window.__intro.bridgeTime);await p.waitForTimeout(400);assert.equal(await p.evaluate(()=>window.__intro.bridgeTime),t,'bridge clock pauses');await p.keyboard.press('Escape');report.pauseBridge=true;
 await p.setViewportSize({width:1280,height:720});await p.waitForTimeout(100);await p.setViewportSize({width:1440,height:810});report.resizeBridge=true;
 await p.waitForFunction(()=>window.__intro?.bridgeTime>3.6);await p.keyboard.press('Escape');const overlap=await p.evaluate(()=>window.__intro.bridgeTime);await p.waitForTimeout(350);assert.equal(await p.evaluate(()=>window.__intro.bridgeTime),overlap,'overlap pauses');await p.keyboard.press('Escape');report.pauseOverlap=true;
}
if(mode==='fly'){await p.waitForFunction(()=>window.__intro?.bridgeTime>4.3);await p.keyboard.down('Space');await p.keyboard.down('KeyD');}
await p.waitForFunction(()=>window.__world,undefined,{timeout:30000});console.log(mode,'HANDOFF');
report.handoff=await p.evaluate(()=>{const w=window.__world,r=w.hlsRig.parent,p=r.position,g=window.__sample(w.hm,p.x,p.z);return {state:w.descent.state,ground:g,root:p.asArray(),clearance:p.y-g,footClearance:p.y-w.hlsRig.contactHeight((x,z)=>window.__sample(w.hm,x,z)),camera:w.scene.activeCamera.position.asArray(),loops:window.__engine._activeRenderLoops.length,canvases:document.querySelectorAll('canvas').length}});
assert.ok(report.handoff.clearance>280&&report.handoff.clearance<330,'handoff really above ground ~300m');assert.equal(report.handoff.loops,1);assert.equal(report.handoff.canvases,1);
await p.waitForTimeout(300);
if(mode==='fly'){const state=await p.evaluate(()=>window.__world.descent.state);assert.ok(state.tiltDeg>0,'held D survived handoff');assert.ok(state.fuelKg<report.handoff.state.fuelKg,'held Space consumes fuel');await p.keyboard.up('Space');await p.keyboard.up('KeyD');report.heldInputs=true;await p.keyboard.press('KeyH');}
if(process.env.INTERACT){await p.keyboard.press('Escape');await p.waitForTimeout(100);const h=await p.evaluate(()=>window.__world.descent.state.h);await p.waitForTimeout(300);assert.equal(await p.evaluate(()=>window.__world.descent.state.h),h,'landing pauses');await p.keyboard.press('Escape');report.pauseLanding=true;}
if(!process.env.BENCH)await p.screenshot({path:out+'-300m.png'});
await p.waitForTimeout(3000);assert.equal(await p.evaluate(()=>window.__engine.scenes.length),1,'outgoing scene retired');report.retired=true;
report.landingCamera=await p.evaluate(()=>{const w=window.__world,c=w.scene.activeCamera,g=window.__sample(w.hm,c.position.x,c.position.z);return {radius:c.radius,height:w.descent.state.h,targetHeight:c.target.y-w.hlsRig.parent.position.y,clearance:c.position.y-g,beta:c.beta};});
assert.ok(Math.abs(report.landingCamera.radius-(110+Math.max(0,report.landingCamera.height)*.25))<.1,'restored close landing camera');
assert.ok(Math.abs(report.landingCamera.targetHeight-18)<.1);assert.ok(report.landingCamera.clearance>1,'camera above terrain');
assert.ok(Math.abs(report.landingCamera.beta-1.05)<1e-5,'landing pitch stays stable as target descends');
report.frames=await p.evaluate(()=>window.__frames);assert.equal(report.frames.filter(x=>x.bridge>0&&x.black>0).length,0,'no black GUI during bridge');
report.profile=await p.evaluate(()=>window.__profile);
if(process.env.CONTACT){await p.waitForFunction(()=>window.__world.descent?.state.h<101,undefined,{timeout:90000});if(!process.env.BENCH)await p.screenshot({path:out+'-100m.png'});await p.waitForFunction(()=>window.__world.descent?.phase==='contact',undefined,{timeout:90000});report.contact=true;if(!process.env.BENCH)await p.screenshot({path:out+'-contact.png'});console.log(mode,'CONTACT');}
assert.deepEqual(report.errors,[]);
if(process.env.VIDEO)report.video=await p.video().path();
}finally{fs.writeFileSync(out+'.json',JSON.stringify(report,null,2));await context?.close();await b.close();}
console.log('PASS',out);
})().catch(e=>{console.error(e);process.exitCode=1});
