const {chromium}=require('C:/Users/ADMIN/AppData/Local/npm-cache/_npx/9833c18b2d85bc59/node_modules/playwright');
const fs=require('fs'),assert=require('assert/strict');
async function button(p,id){const q=await p.evaluate(id=>{for(const s of window.__engine.scenes)for(const t of s.textures){const c=t.getControlByName?.(id);if(c?.isVisible){const m=c._currentMeasure;return{x:m.left+m.width/2,y:m.top+m.height/2}}}},id);assert.ok(q,id);await p.mouse.click(q.x,q.y);await p.waitForTimeout(200)}
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-gpu']});const report={errors:[],flows:[]};
try{for(const mode of ['auto','fly']){
 const context=await browser.newContext({viewport:{width:1440,height:810},recordVideo:{dir:'docs/screens/descent-bridge-video',size:{width:1440,height:810}}});const videoStart=Date.now();const p=await context.newPage();p.on('pageerror',e=>report.errors.push(String(e)));
 await p.addInitScript(()=>localStorage.setItem('pipmica.lang','vi'));
 await p.goto('http://localhost:5173/');await p.waitForFunction(()=>window.__engine?.scenes.some(s=>s.activeCamera?.name==='mainMenuCamera'));await p.waitForTimeout(700);
 await button(p,'new');await button(p,mode);await p.waitForFunction(()=>window.__intro,undefined,{timeout:120000});
 await p.keyboard.press('Enter');await p.waitForTimeout(4600);
 const dormantBefore=await p.evaluate(()=>{const w=window.__preparedSurface;return{clock:w.clock.nowMs,rig:w.hlsRig.inspect().gear,position:w.player.position.asArray(),physics:w.scene.physicsEnabled}});
 await p.keyboard.down('KeyW');await p.waitForTimeout(400);await p.keyboard.up('KeyW');
 const dormantAfter=await p.evaluate(()=>{const w=window.__preparedSurface;return{clock:w.clock.nowMs,rig:w.hlsRig.inspect().gear,position:w.player.position.asArray(),physics:w.scene.physicsEnabled}});
 assert.deepEqual(dormantAfter,dormantBefore);assert.equal(dormantBefore.physics,false);
 await p.evaluate(()=>{
   window.__frames=[];window.__loads=0;
   new MutationObserver(ms=>{for(const m of ms)for(const n of m.addedNodes)if(n.nodeType===1&&(n.matches?.('progress')||n.querySelector?.('progress')))window.__loads++}).observe(document.body,{subtree:true,childList:true});
   const collect=(scene,rig,isOrbit)=>scene.onAfterRenderObservable.add(()=>{
     const bridge=isOrbit?window.__intro?.bridgeTime:window.__world?.descent?.bridgeTime;
     if(bridge==null)return;
     const node=rig.parent,V=node.position.constructor,offset=isOrbit?-rig.dockingHeight/2:0;
     node.computeWorldMatrix(true);const vp=scene.activeCamera.viewport.toGlobal(1440,810);
     const point=y=>V.Project(new V(0,y+offset,0),node.getWorldMatrix(),scene.getTransformMatrix(),vp).asArray();
     window.__frames.push({at:performance.now(),orbit:isOrbit,bridge,base:point(0),tip:point(50)});
   });
   collect(window.__intro.scene,window.__intro.hlsRig,true);collect(window.__preparedSurface.scene,window.__preparedSurface.hlsRig,false);
 });
 await p.evaluate(()=>{const d=window.__intro.director;d.stage='brake';d.brake.h=510;d.brake.v=90;d.alarmFired=true;});
 // Clear radio lines before the camera bridge; only setup is accelerated, bridge runs at real speed.
 for(let i=0;i<12;i++){await p.keyboard.press('Enter');await p.waitForTimeout(250);if(await p.evaluate(()=>window.__intro?.bridgeTime!=null))break;}
 const clipStart=(Date.now()-videoStart)/1000;await p.keyboard.down('Space');
 await p.waitForFunction(()=>window.__intro?.bridgeTime>0||window.__world,undefined,{timeout:30000});
 await p.screenshot({path:`docs/screens/descent-${mode}-bridge.png`});
 await p.waitForFunction(()=>window.__world,undefined,{timeout:20000});
 await p.screenshot({path:`docs/screens/descent-${mode}-join.png`});
 await p.waitForFunction(()=>!window.__world.descent.cinematic,undefined,{timeout:20000});
 const handoff=await p.evaluate(()=>({state:window.__world.descent.state,scenes:window.__engine.scenes.length,loading:!!document.querySelector('progress'),held:window.__world.keyboard.isHeld('Space'),rig:window.__world.hlsRig.inspect(),camera:window.__scene.activeCamera.position.asArray()}));
 assert.equal(handoff.loading,false);assert.equal(handoff.scenes,1);assert.ok(handoff.held);assert.ok(handoff.state.h>290&&handoff.state.h<=300);
 await p.keyboard.up('Space');await p.screenshot({path:`docs/screens/descent-${mode}-control.png`});
 await p.waitForTimeout(1500);
 await button(p,'pauseButton');const before=await p.evaluate(()=>JSON.stringify(window.__world.descent.state));await p.waitForTimeout(600);assert.equal(await p.evaluate(()=>JSON.stringify(window.__world.descent.state)),before);await button(p,'resume');
 if(mode==='fly'){await p.keyboard.down('KeyD');await p.keyboard.down('Space');await p.waitForTimeout(600);await p.keyboard.up('KeyD');await p.keyboard.up('Space');const tilt=await p.evaluate(()=>window.__world.descent.state.tiltDeg);assert.ok(tilt>0);await p.keyboard.press('KeyH');}
 await p.waitForFunction(()=>window.__world.descent?.phase==='contact',undefined,{timeout:90000});await p.screenshot({path:`docs/screens/descent-${mode}-contact.png`});
 await p.waitForFunction(()=>!window.__world.descent,undefined,{timeout:45000});
 const exit=await p.evaluate(()=>({physics:window.__scene.physicsEnabled,cameraAttached:window.__world.player.camera.inputs.attachedToElement,loads:window.__loads,frames:window.__frames}));
 assert.ok(exit.physics&&exit.cameraAttached);assert.equal(exit.loads,0);
 const lastOrbit=exit.frames.filter(f=>f.orbit).at(-1),firstSurface=exit.frames.find(f=>!f.orbit);
 const alignment=Math.hypot(lastOrbit.tip[0]-firstSurface.tip[0],lastOrbit.tip[1]-firstSurface.tip[1]);assert.ok(alignment<2,`ship join alignment ${alignment}px`);
 report.flows.push({mode,handoff,dormantBefore,exit,alignment,clipStart,video:await p.video().path()});fs.writeFileSync('docs/screens/descent-bridge-final-qa.json',JSON.stringify(report,null,2));await context.close();}
 assert.deepEqual(report.errors,[]);
}finally{fs.writeFileSync('docs/screens/descent-bridge-final-qa.json',JSON.stringify(report,null,2));await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});

