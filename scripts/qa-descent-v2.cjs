const {chromium}=require('C:/Users/ADMIN/AppData/Local/npm-cache/_npx/9833c18b2d85bc59/node_modules/playwright');
const fs=require('fs');
const assert=require('assert/strict');
async function button(p,id){const q=await p.evaluate(id=>{for(const s of window.__engine.scenes)for(const t of s.textures){const c=t.getControlByName?.(id);if(c?.isVisible){const m=c._currentMeasure;return{x:m.left+m.width/2,y:m.top+m.height/2}}}},id);assert.ok(q,id);await p.mouse.click(q.x,q.y);}
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-gpu']});
 const errors=[],report={errors};
 try{
 const context=await browser.newContext({viewport:{width:1440,height:810},...(process.env.VIDEO?{recordVideo:{dir:'docs/screens/descent-v2-video',size:{width:1440,height:810}}}:{})});
 const p=await context.newPage();p.on('pageerror',e=>{errors.push(String(e));console.log('PAGEERROR',String(e))});p.on('console',m=>{if(m.type()==='error')console.log('CONSOLE',m.text().slice(0,500))});
 await p.addInitScript(()=>localStorage.setItem('pipmica.lang','vi'));
 await p.goto('http://127.0.0.1:5174/');await p.waitForFunction(()=>window.__engine?.scenes.some(s=>s.activeCamera?.name==='mainMenuCamera'));
 await p.waitForTimeout(600);await button(p,'new');await p.waitForTimeout(300);await button(p,process.env.MODE||'auto');
 await p.waitForFunction(()=>window.__intro,undefined,{timeout:180000});console.log('INTRO READY');
 await p.keyboard.press('Enter');await p.waitForTimeout(4000);
 await p.evaluate(()=>{window.__intro.director.stage='pip';});
 await p.waitForTimeout(600);await p.screenshot({path:'docs/screens/descent-v2-approach.png'});
 for(let i=0;i<25;i++){await p.keyboard.press('Enter');await p.waitForTimeout(150);if(await p.evaluate(()=>window.__intro?.director.stage==='brake'))break;}
 await p.waitForFunction(()=>window.__intro?.director.stage==='brake',undefined,{timeout:30000});
 await p.evaluate(()=>{window.__timings=[];let last=performance.now();function f(t){window.__timings.push({dt:t-last,h:window.__intro?.director.brake.h,bridge:window.__intro?.bridgeTime,surface:!!window.__world});last=t;if(window.__timings.length<20000)requestAnimationFrame(f)}requestAnimationFrame(f)});
 await p.waitForTimeout(5000);console.log('BRAKE',await p.evaluate(()=>window.__intro.director.brake));
 if(process.env.FAST)await p.evaluate(()=>{const d=window.__intro.director;d.brake.h=620;d.alarmFired=true;});
 await p.waitForFunction(()=>window.__intro?.bridgeTime>0,undefined,{timeout:150000});
 await p.screenshot({path:'docs/screens/descent-v2-bridge.png'});
 await p.waitForFunction(()=>window.__world,undefined,{timeout:30000});console.log('HANDOFF');
 await p.screenshot({path:'docs/screens/descent-v2-landing.png'});
 report.geometry=await p.evaluate(()=>{const s=window.__world.scene;return ['terrain','descentTerrainCollar','descentMoonBackdrop'].map(name=>{const m=s.getMeshByName(name);const p=m.getVerticesData('position');let min=Infinity,max=-Infinity;for(let i=1;i<p.length;i+=3){min=Math.min(min,p[i]);max=Math.max(max,p[i])}m.computeWorldMatrix(true);return {name,min,max,bounds:m.getBoundingInfo().boundingBox.minimumWorld.asArray(),upper:m.getBoundingInfo().boundingBox.maximumWorld.asArray(),world:m.getWorldMatrix().asArray()}})}); report.handoff=await p.evaluate(()=>({h:window.__world.descent.state,scenes:window.__engine.scenes.length,active:window.__engine._activeRenderLoops.length,canvas:document.querySelectorAll('canvas').length}));
 await p.waitForTimeout(4000);
 report.after=await p.evaluate(()=>({state:window.__world.descent.state,scenes:window.__engine.scenes.length,timings:window.__timings}));
 fs.writeFileSync('docs/screens/descent-v2-qa.json',JSON.stringify(report,null,2));
 if(process.env.VIDEO){report.video=await p.video().path();console.log('VIDEO',report.video)}
 if(process.env.CONTACT){await p.waitForFunction(()=>window.__world.descent?.phase==='contact',undefined,{timeout:90000});await p.screenshot({path:'docs/screens/descent-v2-contact.png'});console.log('CONTACT');}
 await context.close();
 }finally{fs.writeFileSync('docs/screens/descent-v2-qa.json',JSON.stringify(report,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});


