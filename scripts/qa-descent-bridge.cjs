const {chromium}=require('C:/Users/ADMIN/AppData/Local/npm-cache/_npx/9833c18b2d85bc59/node_modules/playwright');
const fs=require('fs'),assert=require('assert/strict');
async function button(p,id){const q=await p.evaluate(id=>{for(const s of window.__engine.scenes)for(const t of s.textures){const c=t.getControlByName?.(id);if(c?.isVisible){const m=c._currentMeasure;return{x:m.left+m.width/2,y:m.top+m.height/2}}}},id);assert.ok(q,id);await p.mouse.click(q.x,q.y);await p.waitForTimeout(200)}
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-gpu']});const report={errors:[],flows:[]};
try{for(const mode of ['auto','fly']){
 const context=await browser.newContext({viewport:{width:1440,height:810},recordVideo:{dir:'docs/screens/descent-bridge-video',size:{width:1440,height:810}}});const p=await context.newPage();p.on('pageerror',e=>report.errors.push(String(e)));
 await p.addInitScript(()=>localStorage.setItem('pipmica.lang','vi'));
 await p.goto('http://localhost:5173/');await p.waitForFunction(()=>window.__engine?.scenes.some(s=>s.activeCamera?.name==='mainMenuCamera'));await p.waitForTimeout(700);
 await button(p,'new');await button(p,mode);await p.waitForFunction(()=>window.__intro,undefined,{timeout:120000});
 await p.keyboard.press('Enter');await p.waitForTimeout(4600);
 await p.evaluate(()=>{const d=window.__intro.director;d.stage='brake';d.brake.h=510;d.brake.v=90;d.alarmFired=true;});
 // Clear radio lines before the camera bridge; only setup is accelerated, bridge runs at real speed.
 for(let i=0;i<12;i++){await p.keyboard.press('Enter');await p.waitForTimeout(250);if(await p.evaluate(()=>window.__intro?.bridgeTime!=null))break;}
 await p.keyboard.down('Space');
 await p.waitForFunction(()=>window.__intro?.bridgeTime>0||window.__world,undefined,{timeout:30000});
 await p.screenshot({path:`docs/screens/descent-${mode}-bridge.png`});
 await p.waitForFunction(()=>window.__world,undefined,{timeout:20000});
 await p.screenshot({path:`docs/screens/descent-${mode}-join.png`});
 await p.waitForFunction(()=>!window.__world.descent.cinematic,undefined,{timeout:20000});
 const handoff=await p.evaluate(()=>({state:window.__world.descent.state,scenes:window.__engine.scenes.length,loading:!!document.querySelector('progress'),held:window.__world.keyboard.isHeld('Space'),rig:window.__world.hlsRig.inspect(),camera:window.__scene.activeCamera.position.asArray()}));
 assert.equal(handoff.loading,false);assert.equal(handoff.scenes,1);assert.ok(handoff.held);assert.ok(handoff.state.h>290&&handoff.state.h<=300);
 await p.keyboard.up('Space');await p.screenshot({path:`docs/screens/descent-${mode}-control.png`});
 await button(p,'pauseButton');const before=await p.evaluate(()=>JSON.stringify(window.__world.descent.state));await p.waitForTimeout(600);assert.equal(await p.evaluate(()=>JSON.stringify(window.__world.descent.state)),before);await button(p,'resume');
 if(mode==='fly'){await p.keyboard.down('KeyD');await p.keyboard.down('Space');await p.waitForTimeout(600);await p.keyboard.up('KeyD');await p.keyboard.up('Space');const tilt=await p.evaluate(()=>window.__world.descent.state.tiltDeg);assert.ok(tilt>0);await p.keyboard.press('KeyH');}
 await p.waitForFunction(()=>window.__world.descent?.phase==='contact',undefined,{timeout:90000});await p.screenshot({path:`docs/screens/descent-${mode}-contact.png`});
 report.flows.push({mode,handoff,video:await p.video().path()});fs.writeFileSync('docs/screens/descent-bridge-qa.json',JSON.stringify(report,null,2));await context.close();}
 assert.deepEqual(report.errors,[]);
}finally{fs.writeFileSync('docs/screens/descent-bridge-qa.json',JSON.stringify(report,null,2));await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});

