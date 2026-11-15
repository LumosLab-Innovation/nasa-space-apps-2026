const {chromium}=require('C:/Users/ADMIN/AppData/Local/npm-cache/_npx/9833c18b2d85bc59/node_modules/playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
async function button(p,id){await p.waitForFunction(id=>window.__engine?.scenes.some(s=>s.textures.some(t=>t.getControlByName?.(id)?.isVisible)),id,{timeout:60000});const q=await p.evaluate(id=>{for(const s of window.__engine.scenes)for(const t of s.textures){const c=t.getControlByName?.(id);if(c?.isVisible){const m=c._currentMeasure;return{x:m.left+m.width/2,y:m.top+m.height/2}}}},id);await p.mouse.click(q.x,q.y);await p.waitForTimeout(180)}
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-gpu']});
 const report={errors:[],bad:[],flows:[]};
 try{
 for(const mode of ['new','continue']){
  const context=await browser.newContext({viewport:{width:1440,height:810}});const page=await context.newPage();
  page.on('pageerror',e=>report.errors.push(String(e)));page.on('response',r=>{if(r.status()>=400)report.bad.push(r.status()+' '+r.url())});
  await page.addInitScript(()=>{localStorage.setItem('pipmica.lang','vi');localStorage.setItem('pipmica.save',JSON.stringify({v:1,modules:['solarTower'],samples:['breccia'],dataLogs:['commDelay'],flags:['landing:done'],cards:[],clockMs:Date.UTC(2028,8,10,8),savedAt:Date.now()}))});
  await page.addInitScript(()=>{
   window.__loadingWrites={};window.__loadingWriteExamples=[];
   const attach=()=>{
    const engine=window.__engine;if(!engine){setTimeout(attach,10);return;}
    let owner='outside-scene',bound=null;const gl=engine._gl;
    const bind=gl.bindFramebuffer.bind(gl);gl.bindFramebuffer=(type,target)=>{if(type===gl.FRAMEBUFFER||type===gl.DRAW_FRAMEBUFFER)bound=target;return bind(type,target)};
    const hook=s=>{const original=s.render.bind(s);s.render=(...args)=>{const prev=owner;owner=s.activeCamera?.name||'no-camera';try{return original(...args)}finally{owner=prev}}};
    engine.scenes.forEach(hook);engine.onNewSceneAddedObservable.add(hook);
    for(const name of ['drawElements','drawArrays','clear']){const original=gl[name].bind(gl);gl[name]=(...args)=>{
     if(bound===null&&document.querySelector('#mission-load-progress')&&owner!=='loadingCamera'){
      const key=owner+':'+name;window.__loadingWrites[key]=(window.__loadingWrites[key]||0)+1;
      if(window.__loadingWriteExamples.length<30)window.__loadingWriteExamples.push({owner,name,progress:document.querySelector('progress').value,time:performance.now()});
     }return original(...args);
    }}
   };attach();
  });
  let release;const gate=new Promise(r=>release=r);let requests=0;
  await page.route('**/models/orion.glb',async r=>{requests++;await gate;await r.continue()});
  await page.goto('http://localhost:5173/');await page.waitForFunction(()=>window.__engine?.scenes.some(s=>s.activeCamera?.name==='mainMenuCamera'));
  await page.waitForFunction(()=>window.__engine.scenes.some(s=>s.textures.some(t=>t.getControlByName?.('menuOrbit')?.isLoaded)));
  await page.waitForTimeout(300);
  await page.screenshot({path:`docs/screens/loading-flicker-after-${mode}-menu.png`});
  assert.equal(requests,0,'menu stays lazy');
  if(mode==='new'){await button(page,'new');await button(page,'auto');await page.screenshot({path:'docs/screens/loading-flicker-after-new-confirm.png'});await button(page,'start')}else await button(page,'continue');
  await page.waitForFunction(()=>{const p=document.querySelector('progress');return p&&p.value>0&&p.value<100},undefined,{timeout:45000});
  const stalled=await page.evaluate(()=>({value:document.querySelector('progress')?.value,intro:!!window.__intro,surface:!!window.__world}));
  assert.ok(stalled.value<100&&!stalled.intro&&!stalled.surface,'blocked Orion prevents gameplay');
  await page.screenshot({path:`docs/screens/loading-flicker-after-${mode}-loading.png`});
  const driftBefore=await page.evaluate(()=>{const s=window.__engine.scenes.find(s=>s.activeCamera?.name==='loadingCamera');const t=s.textures.find(t=>t.getControlByName?.('loadingShip'));const ship=t.getControlByName('loadingShip'),track=t.getControlByName('loadingTrack');return {ship:[ship.leftInPixels,ship.topInPixels],track:[track._currentMeasure.left,track._currentMeasure.top],ready:ship.isLoaded,source:ship.source}});
  assert.ok(driftBefore.ready,'approved ship image decoded');await page.waitForTimeout(600);
  const driftAfter=await page.evaluate(()=>{const s=window.__engine.scenes.find(s=>s.activeCamera?.name==='loadingCamera');const t=s.textures.find(t=>t.getControlByName?.('loadingShip'));const ship=t.getControlByName('loadingShip'),track=t.getControlByName('loadingTrack');return {ship:[ship.leftInPixels,ship.topInPixels],track:[track._currentMeasure.left,track._currentMeasure.top]}});
  assert.notDeepEqual(driftBefore.ship,driftAfter.ship,'ship drifts');assert.deepEqual(driftBefore.track,driftAfter.track,'progress stays still');
  await page.evaluate(()=>{window.__loadingValues=[];const el=document.querySelector('progress');if(el){window.__loadingValues.push(el.value);window.__loadingObserver=new MutationObserver(()=>window.__loadingValues.push(el.value));window.__loadingObserver.observe(el,{attributes:true})}});
  release();await page.waitForFunction(mode=>mode==='new'?!!window.__intro:!!window.__world,mode,{timeout:120000});
  const loaded=await page.evaluate(()=>{const s=window.__intro?.scene||window.__scene;return{progress:window.__loadingValues,meshes:s.getNodeByName('orion-model')?.getChildMeshes().length||0,textures:s.textures.filter(t=>/Orion/.test(t.name)).map(t=>({name:t.name,ready:t.isReady()}))}});
  assert.ok(loaded.progress.every((p,i,a)=>i===0||p>=a[i-1]),'monotonic progress');
  assert.ok(loaded.progress.includes(100),'real progress reaches 100');assert.equal(requests,1);assert.equal(loaded.meshes,mode==='new'?36:0);assert.ok(loaded.textures.every(t=>t.ready));
  if(mode==='new')await page.keyboard.press('Enter');await page.waitForTimeout(4200);
  await page.screenshot({path:`docs/screens/loading-flicker-after-${mode}-ready.png`});
  await button(page,'pauseButton');await page.waitForTimeout(300);await button(page,'resume');
  const restored=mode==='continue'?await page.evaluate(()=>({modules:[...window.__world.state.modules],samples:[...window.__world.state.samples],dataLogs:[...window.__world.state.dataLogs]})):null;
  if(restored)assert.deepEqual(restored,{modules:['solarTower'],samples:['breccia'],dataLogs:['commDelay']},'continue restores saved progress');
  const framebuffer=await page.evaluate(()=>({writes:window.__loadingWrites,examples:window.__loadingWriteExamples})); console.log(mode,JSON.stringify(framebuffer)); assert.deepEqual(framebuffer.writes,{},mode+": only loading may draw to the screen"); report.flows.push({framebuffer,mode,stalled,requests,driftBefore,driftAfter,restored,...loaded});await context.close();
 }
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.bad,[]);
 }finally{fs.writeFileSync('docs/screens/loading-flicker-after-menu-qa.json',JSON.stringify(report,null,2));await browser.close()}
 console.log(JSON.stringify(report,null,2));
})().catch(e=>{console.error(e);process.exit(1)});



