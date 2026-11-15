// Focused near-ground fixture, not an end-to-end flight or real-time performance pass.
const {chromium}=require('C:/Users/ADMIN/AppData/Local/npm-cache/_npx/9833c18b2d85bc59/node_modules/playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
async function button(p,id){
 console.log('fixture menu action',id);
 await p.waitForFunction(id=>window.__engine?.scenes.some(s=>s.textures.some(t=>!!t.getControlByName?.(id))),id,{timeout:60000});
 await p.evaluate(id=>{for(const s of window.__engine.scenes)for(const t of s.textures){const c=t.getControlByName?.(id);if(c){c.onPointerClickObservable.notifyObservers({buttonIndex:0},-1,c,c);return;}}},id);
}(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--use-angle=d3d11','--ignore-gpu-blocklist'],ignoreDefaultArgs:['--enable-unsafe-swiftshader']});
 const report={fixture:'50 m final-descent entry, original camera/controller/terrain',cases:[]};
 try{for(const mode of ['auto','fly']){
  const c=await browser.newContext({viewport:{width:1440,height:810}}),p=await c.newPage(),errors=[];
  p.on('pageerror',e=>{errors.push(String(e));console.log('PAGE ERROR',String(e))});await p.addInitScript(()=>localStorage.setItem('pipmica.lang','vi'));await p.goto('http://localhost:5173/');await p.waitForFunction(()=>window.__engine?.scenes.some(s=>s.activeCamera?.name==='mainMenuCamera'),undefined,{timeout:180000});await p.waitForTimeout(1600);await button(p,'new');await button(p,mode);
  await p.waitForFunction(()=>window.__intro&&window.__preparedSurface,undefined,{timeout:180000});
  await p.evaluate(async()=>{
   const {Vector3,Quaternion}=await import('/node_modules/@babylonjs/core/Maths/math.vector.js');const {sampleHeight}=await import('/src/data/heightmap.ts');const {HLS_POS}=await import('/src/world/zones.ts');
   const w=window.__preparedSurface,e=window.__engine;e.stopRenderLoop();window.__contactWorld=w;
   w.hlsRig.setTargets(1,0,true);const root=w.hlsRig.parent,y=sampleHeight(w.hm,HLS_POS.x,HLS_POS.z),cam=w.scene.activeCamera;
   const presentation={position:[HLS_POS.x,y+50,HLS_POS.z],rotation:Quaternion.RotationYawPitchRoll(root.rotation.y,0,0).asArray(),scale:1,camera:cam.position.asArray(),target:[HLS_POS.x,y+65,HLS_POS.z],up:[0,1,0],fov:cam.fov,h:50,vy:-2,vx:0,offset:0,throttle:.5,rig:w.hlsRig.snapshotMotion()};
   w.descent.beginBridge({presentation,startHeight:50,startSpeed:0,throttle:.5,cameraPosition:presentation.camera,cameraTarget:presentation.target,cameraUp:[0,1,0],fov:cam.fov,rig:presentation.rig,held:[]});w.setDormant(false,[]);
   window.__contactFrames=[];w.scene.onAfterRenderObservable.add(()=>window.__contactFrames.push({phase:w.descent.phase,h:w.descent.state.h,...w.descent.exhaustDiagnostics,fanCount:w.scene.meshes.filter(m=>m.name.startsWith('exhaustSurfaceFlow')&&m.isVisible).length}));
   const stream=document.querySelector('canvas').captureStream(30),chunks=[],rec=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp9',videoBitsPerSecond:4000000});rec.ondataavailable=e=>chunks.push(e.data);rec.start();window.__endContact=()=>new Promise(resolve=>{rec.onstop=async()=>{stream.getTracks().forEach(t=>t.stop());const a=new Uint8Array(await new Blob(chunks).arrayBuffer());let b='';for(const n of a)b+=String.fromCharCode(n);resolve(btoa(b));};rec.stop();});
   e.runRenderLoop(()=>w.scene.render());
  });
  if(mode==='fly'){await p.keyboard.down('Space');await p.keyboard.down('KeyD');await p.waitForTimeout(650);await p.keyboard.up('KeyD');await p.keyboard.up('Space');const tilted=await p.evaluate(()=>window.__contactWorld.descent.state.tiltDeg);assert.ok(tilted>0);await p.keyboard.press('KeyH');}
  await p.waitForFunction(()=>window.__contactWorld.descent.phase==='contact',undefined,{timeout:300000});await p.screenshot({path:`docs/screens/exhaust-contact-${mode}.png`});
  await p.waitForFunction(()=>window.__contactWorld.descent.exhaustDiagnostics.contactTime>=1.3,undefined,{timeout:15000});
  const frames=await p.evaluate(()=>window.__contactFrames),tail=frames.at(-1),contacts=frames.filter(f=>f.phase==='contact');
  assert.ok(contacts.some(f=>f.contactTime<.4&&f.power>.05&&f.fanCount>0),'visible fan holds briefly at contact');assert.equal(tail.power,0);assert.equal(tail.pulse,0);assert.equal(tail.fanCount,0);assert.ok(frames.every(f=>f.particles<=160));assert.deepEqual(errors,[]);
  const clip=await p.evaluate(()=>window.__endContact());fs.writeFileSync(`docs/screens/exhaust-contact-${mode}.webm`,Buffer.from(clip,'base64'));report.cases.push({mode,manualInputThenAssist:mode==='fly',errors,frames});console.log('PASS contact fixture',mode);await c.close();
 }}finally{fs.writeFileSync('docs/screens/exhaust-contact-qa.json',JSON.stringify(report,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
