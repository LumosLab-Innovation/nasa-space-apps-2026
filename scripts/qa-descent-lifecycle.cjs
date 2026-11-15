const {chromium}=require('C:/Users/ADMIN/AppData/Local/npm-cache/_npx/9833c18b2d85bc59/node_modules/playwright');const fs=require('fs'),assert=require('assert/strict');
async function button(p,id){const q=await p.evaluate(id=>{for(const s of window.__engine.scenes)for(const t of s.textures){const c=t.getControlByName?.(id);if(c?.isVisible){const m=c._currentMeasure;return{x:m.left+m.width/2,y:m.top+m.height/2}}}},id);assert.ok(q,id);await p.mouse.click(q.x,q.y);await p.waitForTimeout(100)}
(async()=>{const b=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-gpu']});let results;
try{const p=await b.newPage({viewport:{width:1440,height:810}});await p.goto('http://localhost:5173/');await p.waitForFunction(()=>window.__engine?.scenes.some(s=>s.activeCamera?.name==='mainMenuCamera'));await p.waitForTimeout(300);await button(p,'new');await button(p,'auto');await p.waitForFunction(()=>window.__intro,undefined,{timeout:120000});await p.keyboard.press('Enter');await p.waitForTimeout(4300);
await p.evaluate(()=>{const d=window.__intro.director;d.stage='brake';d.brake.h=500;d.brake.v=100;d.alarmFired=true;window.__freezeJoin=setInterval(()=>{if(window.__world){clearInterval(window.__freezeJoin);window.__world.pauseMenu.open()}},5)});
for(let i=0;i<35;i++){await p.keyboard.press('Enter');await p.waitForTimeout(180);if(await p.evaluate(()=>window.__intro?.bridgeTime>.4))break;}
await button(p,'settingsButton');
const orbitPaused=await p.evaluate(()=>window.__intro.bridgeTime);await p.waitForTimeout(600);assert.equal(await p.evaluate(()=>window.__intro.bridgeTime),orbitPaused,'Settings freezes orbit bridge');await p.keyboard.press('Escape');
await p.waitForFunction(()=>window.__world?.pauseMenu.isOpen,undefined,{timeout:30000});
results=await p.evaluate(()=>{const c=[...document.body.querySelectorAll('canvas')].find(c=>c.style.position==='fixed');return{time:window.__world.descent.bridgeTime,pauseReadable:!c||c.style.display==='none'||(c.style.opacity!==''&&Number(c.style.opacity)===0)}});
await button(p,'skip');await p.waitForTimeout(200);
Object.assign(results,await p.evaluate(()=>({physics:window.__scene.physicsEnabled,cameraAttached:window.__world.player.camera.inputs.attachedToElement,active:!!window.__world.descent,overlays:[...document.body.querySelectorAll('canvas')].filter(c=>c.style.position==='fixed').length})));
fs.writeFileSync('docs/screens/descent-lifecycle-qa.json',JSON.stringify(results,null,2));assert.ok(results.pauseReadable,'Pause visible during overlap');assert.ok(results.physics,'Physics reenabled after skip');assert.ok(results.cameraAttached,'Camera attached after skip');assert.equal(results.overlays,0);
}finally{console.log(results);await b.close()}})().catch(e=>{console.error(e);process.exit(1)});

