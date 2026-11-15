const {chromium}=require(process.env.PLAYWRIGHT_PATH||'C:/Users/ADMIN/AppData/Local/npm-cache/_npx/9833c18b2d85bc59/node_modules/playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
async function button(page,id){
 await page.waitForFunction(id=>window.__engine?.scenes.some(s=>s.textures.some(t=>t.getControlByName?.(id)?.isVisible)),id,{timeout:60000});
 const p=await page.evaluate(id=>{for(const s of window.__engine.scenes)for(const t of s.textures){const c=t.getControlByName?.(id);if(c?.isVisible){const m=c._currentMeasure;return {x:m.left+m.width/2,y:m.top+m.height/2};}}},id);
 await page.mouse.click(p.x,p.y);await page.waitForTimeout(250);
}
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-gpu']});
 const context=await browser.newContext({viewport:{width:1440,height:810},recordVideo:{dir:'docs/screens/hls-lifecycle-video',size:{width:1440,height:810}}});
 const page=await context.newPage(),errors=[],progress=[];
 page.on('pageerror',e=>errors.push(String(e)));
 await page.addInitScript(()=>{
  localStorage.setItem('pipmica.lang','vi');localStorage.setItem('pipmica.save',JSON.stringify({v:1,modules:[],samples:[],dataLogs:[],flags:['landing:done'],cards:[],clockMs:Date.UTC(2028,8,10,8),savedAt:Date.now()}));
  window.__qaProgress=[];new MutationObserver(()=>{const p=document.querySelector('progress');if(p)window.__qaProgress.push(p.value);}).observe(document,{subtree:true,attributes:true,childList:true,attributeFilter:['value']});
 });
 try{
  let release,arrive;const gate=new Promise(r=>release=r),reached=new Promise(r=>arrive=r);
  await page.route('**/models/hlsFar.glb',async route=>{arrive();await gate;await route.continue();});
  await page.goto('http://localhost:5173/');await button(page,'continue');await reached;await page.waitForTimeout(1800);
  const stalled=await page.evaluate(()=>({progress:document.querySelector('progress')?.value,world:!!window.__world}));
  assert.ok(stalled.progress>10&&stalled.progress<100&&!stalled.world,'actually pending GLB holds real progress');
  await page.screenshot({path:'docs/screens/hls-game-loading.png'});release();await page.waitForFunction(()=>window.__world,undefined,{timeout:120000});
  progress.push(...await page.evaluate(()=>window.__qaProgress));
  assert.ok(progress.includes(100));assert.ok(progress.every((x,i)=>!i||x>=progress[i-1]));
  await page.unroute('**/models/hlsFar.glb');
  // Use a close review camera in the actual surface scene, without altering lighting/terrain.
  const surface=await page.evaluate(()=>{
   const w=window.__world,s=w.scene,h=w.hlsRig.parent,C=w.player.camera.constructor,V=h.position.constructor;
   const camera=new C('hlsEvidence',Math.PI/2-h.rotation.y+.65,1.38,91,h.position.add(new V(0,24,0)),s);camera.minZ=.2;camera.maxZ=6000;s.activeCamera=camera;
   return w.hlsRig.inspect();
  });
  await page.waitForTimeout(500);await page.screenshot({path:'docs/screens/hls-game-surface-close.png'});
  // Observe real geometry contact gaps, not just the root position.
  const support=await page.evaluate(async()=>{
   const {sampleHeight}=await import('/src/data/heightmap.ts');const w=window.__world;
   const mesh=w.hlsRig.parent.getDescendants().find(n=>n.name==='hls-model');return mesh.getDescendants().filter(n=>/^footPivot_/.test(n.name)).map(n=>{
    const points=n.getChildMeshes().flatMap(m=>{m.computeWorldMatrix(true);return m.getBoundingInfo().boundingBox.vectorsWorld;});
    return {name:n.name,minClearance:Math.min(...points.map(p=>p.y-sampleHeight(w.hm,p.x,p.z)))};
   });
  });assert.ok(support.every(p=>p.minClearance>=-.025&&p.minClearance<.12),'all six pads close to terrain without penetration');
  await button(page,'pauseButton');await button(page,'main');await button(page,'exit');
  let fail=true;await page.route('**/models/hlsFar.glb',async route=>{if(fail)await route.fulfill({status:503,body:'QA unavailable'});else await route.continue();});
  await button(page,'continue');await page.waitForFunction(()=>window.__engine.scenes.some(s=>s.textures.some(t=>t.getControlByName?.('loadingActions')?.isVisible)),undefined,{timeout:120000});
  const failed=await page.evaluate(()=>({world:!!window.__world,progress:document.querySelector('progress')?.value,scenes:window.__engine.scenes.length}));
  assert.equal(failed.world,false);assert.ok(failed.progress<100);await page.screenshot({path:'docs/screens/hls-game-load-failure.png'});
  fail=false;await button(page,'retryLoading');await page.waitForFunction(()=>window.__world,undefined,{timeout:120000});
  assert.equal(await page.evaluate(()=>window.__engine.scenes.length),1,'retry disposes failed startup');
  const liftoffStart=Date.now();
  await page.evaluate(async()=>{
   const {createEnding}=await import('/src/story/endingSystem.ts');const w=window.__world,h=w.hlsRig.parent;
   let stage='farewell';const ending=createEnding({...w,hls:h,mica:()=>w.micaSys.mica,totalCards:0,cards:[],dialogue:{busy:false,play:()=>Promise.resolve()}},{next(event){if(event==='boarded')stage='liftoff';}},null);
   w.player.teleport(h.position.x+7,h.position.z);window.__liftBase=h.position.y;window.__liftSamples=[];
   ending.update('farewell',0,w.player,{consume:k=>k==='KeyE'});
   w.scene.onBeforeRenderObservable.add(()=>{
    if(w.pauseMenu.isOpen)return;
    ending.update(stage,Math.min(.1,w.scene.getEngine().getDeltaTime()/1000),w.player,{consume:()=>false});
    window.__liftSamples.push({height:h.position.y-window.__liftBase,...w.hlsRig.inspect()});
   });
  });
  await page.waitForTimeout(3000);await button(page,'pauseButton');
  const frozen=await page.evaluate(()=>window.__world.hlsRig.inspect());await page.waitForTimeout(500);assert.deepEqual(await page.evaluate(()=>window.__world.hlsRig.inspect()),frozen);await button(page,'resume');
  await page.waitForFunction(()=>window.__world.hlsRig.parent.position.y-window.__liftBase>2,undefined,{timeout:30000});
  await page.screenshot({path:'docs/screens/hls-game-liftoff.png'});
  await page.waitForFunction(()=>window.__world.hlsRig.inspect().gear===0,undefined,{timeout:20000});
  const lift=await page.evaluate(()=>window.__liftSamples);
  assert.ok(lift.every(f=>f.height<.001||f.elevator===0),'no ascent before elevator stows');
  assert.ok(lift.every(f=>f.gear===1||f.height>2),'no gear folds at ground');
  assert.ok(lift.every(f=>f.models.filter(m=>m.enabled).length===1&&f.models.find(m=>!m.enabled).casters===0),'single visible LOD/caster set throughout');
  assert.ok(lift.every(f=>f.models.every(m=>m.cableError<.002)),'continuous cable attachment');
  assert.deepEqual(errors,[]);
  fs.writeFileSync('docs/screens/hls-lifecycle-qa.json',JSON.stringify({errors,stalled,progress,surface,support,failed,frames:lift.length,liftSeconds:(Date.now()-liftoffStart)/1000,maxCableError:Math.max(...lift.flatMap(f=>f.models.map(m=>m.cableError)))},null,2));
  console.log('Lifecycle QA passed');
 }catch(e){await page.screenshot({path:'docs/screens/hls-lifecycle-failure.png'});throw e;}
 finally{await context.close();await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
