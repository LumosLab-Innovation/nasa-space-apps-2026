const {chromium}=require('C:/Users/ADMIN/AppData/Local/npm-cache/_npx/9833c18b2d85bc59/node_modules/playwright');
const fs=require('fs'),assert=require('node:assert/strict');
const mode=process.env.MODE||'auto',out=`docs/screens/braking-stable-${mode}${process.env.BENCH?'-bench':''}`;
async function button(p,id){const q=await p.evaluate(id=>{for(const s of window.__engine.scenes)for(const t of s.textures){const c=t.getControlByName?.(id);if(c?.isVisible){const m=c._currentMeasure;return{x:m.left+m.width/2,y:m.top+m.height/2};}}},id);assert.ok(q,id);await p.mouse.click(q.x,q.y);}
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-gpu']});
 const context=await browser.newContext({viewport:{width:1440,height:810}}),p=await context.newPage();
 const report={mode,errors:[],bad:[]};
 p.on('pageerror',e=>report.errors.push(String(e)));p.on('response',r=>{if(r.status()>=400)report.bad.push(r.status()+' '+r.url())});
 try{
  await p.addInitScript(()=>localStorage.setItem('pipmica.lang','vi'));
  await p.goto('http://localhost:5173/');await p.waitForFunction(()=>window.__engine?.scenes.some(s=>s.activeCamera?.name==='mainMenuCamera'));await p.waitForTimeout(500);
  await button(p,'new');await p.waitForTimeout(250);await button(p,mode==='auto'?'auto':'fly');
  await p.waitForFunction(()=>window.__intro,undefined,{timeout:180000});console.log('LOADED');
  await p.evaluate(async()=>{
   window.__qaFrames=[];window.__qaPause=(await import('/src/core/pause.ts')).gamePauseClock;
   const {Quaternion}=await import('/node_modules/@babylonjs/core/Maths/math.vector.js');
   const w=window.__preparedSurface,begin=w.descent.beginBridge.bind(w.descent);
   w.descent.beginBridge=data=>{begin(data);const r=w.hlsRig.parent,q=r.rotationQuaternion||Quaternion.RotationYawPitchRoll(r.rotation.y,r.rotation.x,r.rotation.z);
    const before=Quaternion.FromArray(data.presentation.rotation);window.__transferQA={positionError:r.position.subtract(r.position.constructor.FromArray(data.presentation.position)).length(),angleError:2*Math.acos(Math.min(1,Math.abs(Quaternion.Dot(before,q)))),before:data.presentation,after:{...w.descent.state}};};
   const {renderedTerrainClearance,readOrbitalElevation}=await import('/src/world/orbitalTerrain.ts');
   const elevation=await readOrbitalElevation(await(await fetch('/textures/moon/lola-elevation-delta-v1.bin')).arrayBuffer());
   let prev=performance.now();
   function sample(t){const i=window.__intro,w=window.__world,s=i?.scene||w?.scene,r=i?.hlsRig?.parent||w?.hlsRig?.parent,c=s?.activeCamera;
    const V=r?.position.constructor,base=i&&r?V.TransformCoordinates(new V(0,-i.hlsRig.dockingHeight/2,0),r.computeWorldMatrix(true)).scale(1000).asArray():null;
    window.__qaFrames.push({t,dt:t-prev,stage:i?.director.stage,flight:i?{...i.director.flight}:null,h:i?.director.brake.h??w?.descent?.state.h,land:w?.descent?{...w.descent.state}:null,base,
     bridge:i?.bridgeTime,paused:window.__qaPause.isPaused,root:r?.position.asArray(),camera:c?.position.asArray(),cameraClearance:i?renderedTerrainClearance(c.position,elevation)*1000:null,
     black:s?.textures.some(x=>{const f=x.getControlByName?.('introFade');return f?.isVisible&&f.alpha>.01;})});prev=t;requestAnimationFrame(sample);}requestAnimationFrame(sample);
   window.__startClip=()=>{const stream=document.querySelector('canvas').captureStream(30),chunks=[];const recorder=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp9',videoBitsPerSecond:4000000});window.__stopClip=()=>new Promise(resolve=>{recorder.onstop=async()=>{stream.getTracks().forEach(t=>t.stop());const b=await new Blob(chunks,{type:'video/webm'}).arrayBuffer();let binary='';for(const x of new Uint8Array(b))binary+=String.fromCharCode(x);resolve(btoa(binary));};recorder.stop();});recorder.ondataavailable=e=>chunks.push(e.data);recorder.start();};
  });
  await p.keyboard.press('Enter');
  let ignitionRecording=false;
  for(let i=0;i<400;i++){await p.waitForTimeout(220);const stage=await p.evaluate(()=>window.__intro?.director.stage);if(stage==='undock'&&!ignitionRecording&&process.env.VIDEO){await p.evaluate(()=>window.__startClip());ignitionRecording=true;}if(stage==='brake')break;await p.keyboard.press('Enter');}
  await p.waitForFunction(()=>window.__intro?.director.stage==='brake',undefined,{timeout:10000});console.log('BRAKE');
  if(mode!=='auto'){
   // Fly the manual throttle with actual key pulses; no state/position overrides.
   await p.evaluate(async()=>{const {stepFlight}=await import('/src/landing/guidedFlight.ts');window.__manualTimer=setInterval(()=>{const d=window.__intro?.director;if(!d||d.stage!=='brake'||window.__qaPause.isPaused)return;
    const want=stepFlight(d.flight,{assist:true,throttle:0,ground:d.ground},1/120),on=want.throttle>d.flight.throttle;
    window.dispatchEvent(new KeyboardEvent(on?'keydown':'keyup',{code:'Space',bubbles:true}));},40);});
  }
  if(ignitionRecording){await p.waitForTimeout(8000);const clip=await p.evaluate(()=>window.__stopClip());fs.writeFileSync(out+'-ignition.webm',Buffer.from(clip,'base64'));}
  if(process.env.INTERACT){await p.waitForTimeout(500);await p.keyboard.press('Escape');await p.waitForFunction(()=>window.__qaPause.isPaused);const state=await p.evaluate(()=>({...window.__intro.director.flight}));await p.waitForTimeout(350);assert.deepEqual(await p.evaluate(()=>({...window.__intro.director.flight})),state);await p.keyboard.press('Escape');report.pauseIgnition=true;}
  await p.waitForFunction(()=>window.__intro?.director.brake.h<12200,undefined,{timeout:60000});
  if(!process.env.BENCH)await p.evaluate(()=>window.__startClip());
  await p.waitForFunction(()=>window.__intro?.director.brake.h<9800,undefined,{timeout:60000});
  if(!process.env.BENCH)await p.screenshot({path:out+'-10km.png'});
  await p.waitForFunction(()=>window.__intro?.director.brake.h<7800,undefined,{timeout:60000});
  if(!process.env.BENCH){const clip=await p.evaluate(()=>window.__stopClip());fs.writeFileSync(out+'-high-burn.webm',Buffer.from(clip,'base64'));}
  await p.waitForFunction(()=>window.__intro?.director.brake.h<1150,undefined,{timeout:180000});
  console.log('1150m');if(!process.env.BENCH)await p.evaluate(()=>window.__startClip());
  await p.waitForFunction(()=>window.__intro?.director.brake.h<1000,undefined,{timeout:60000});if(!process.env.BENCH)await p.screenshot({path:out+'-1000m.png'});
  await p.waitForFunction(()=>window.__intro?.director.brake.h<700,undefined,{timeout:60000});console.log('700m');
  if(process.env.INTERACT){await p.keyboard.press('Escape');await p.waitForFunction(()=>window.__qaPause.isPaused);const before=await p.evaluate(()=>({...window.__intro.director.flight}));await p.waitForTimeout(400);assert.deepEqual(await p.evaluate(()=>({...window.__intro.director.flight})),before);await p.keyboard.press('Escape');await p.setViewportSize({width:1280,height:720});await p.waitForTimeout(80);await p.setViewportSize({width:1440,height:810});report.pause=true;}
  await p.waitForFunction(()=>window.__intro?.director.brake.h<500,undefined,{timeout:60000});if(!process.env.BENCH)await p.screenshot({path:out+'-500m.png'});console.log('500m');
  if(process.env.INTERACT){await p.waitForFunction(()=>window.__intro?.bridgeTime>.5,undefined,{timeout:30000});await p.keyboard.press('Escape');await p.waitForFunction(()=>window.__qaPause.isPaused);const state=await p.evaluate(()=>({...window.__intro.director.flight}));await p.waitForTimeout(350);assert.deepEqual(await p.evaluate(()=>({...window.__intro.director.flight})),state);await p.keyboard.press('Escape');report.pauseBridge=true;}
  if(mode!=='auto'){await p.waitForFunction(()=>window.__intro?.director.brake.h<310,undefined,{timeout:30000});await p.evaluate(()=>clearInterval(window.__manualTimer));await p.keyboard.down('Space');await p.keyboard.down('KeyD');}
  await p.waitForFunction(()=>window.__world,undefined,{timeout:60000});console.log('HANDOFF');
  report.handoff=await p.evaluate(()=>({state:window.__world.descent.state,root:window.__world.hlsRig.parent.position.asArray(),loops:window.__engine._activeRenderLoops.length}));
  report.transfer=await p.evaluate(()=>window.__transferQA);
  assert.ok(report.transfer.positionError<.001,'handoff preserves position');assert.ok(report.transfer.angleError<.001,'handoff preserves full orientation');
  if(!process.env.BENCH)await p.screenshot({path:out+'-300m.png'});await p.waitForTimeout(1500);
  if(!process.env.BENCH){const encoded=await p.evaluate(()=>window.__stopClip());fs.writeFileSync(out+'.webm',Buffer.from(encoded,'base64'));}
  if(mode!=='auto'){const current=await p.evaluate(()=>window.__world.descent.state);assert.ok(current.tiltDeg>report.transfer.after.tiltDeg,'held D survives');assert.ok(current.fuelKg<report.transfer.after.fuelKg,'held Space survives');report.heldInputs=true;await p.evaluate(()=>clearInterval(window.__manualTimer));await p.keyboard.up('Space');await p.keyboard.up('KeyD');await p.keyboard.press('KeyH');}
  report.frames=await p.evaluate(()=>window.__qaFrames);
  const ignitionIndex=report.frames.findIndex(f=>f.flight?.t>0);
  if(ignitionIndex>0){const a=report.frames[ignitionIndex-1],b=report.frames[ignitionIndex];report.ignition={dt:b.dt,distance:Math.hypot(...a.base.map((v,j)=>v-b.base[j]))};assert.ok(report.ignition.distance<1685*Math.min(.1,b.dt/1000)+10,'no visual-base jump at ignition');}
  const flying=report.frames.filter(f=>f.flight&&!f.paused),entry=flying.find(f=>f.h<=1000),end=flying.at(-1);
  report.duration=(end.t-entry.t)/1000-report.frames.filter(f=>f.paused&&f.t>=entry.t&&f.t<=end.t).reduce((sum,f)=>sum+f.dt,0)/1000;
  const high=flying.filter(f=>f.h<12000&&f.h>8000),angles=high.map(f=>f.flight.pitch*180/Math.PI);
  report.highBurn={minPitch:Math.min(...angles),maxPitch:Math.max(...angles),variation:angles.reduce((v,a,i)=>i?v+Math.abs(a-angles[i-1]):0,0)};
  console.log('highBurn',report.highBurn);
  if(mode==='auto'){assert.ok(report.highBurn.maxPitch-report.highBurn.minPitch<2,'no high-burn pitching oscillation');assert.ok(report.highBurn.variation<3,'no repeated high-burn reversals');}
  console.log('duration',report.duration,'handoff',report.handoff.state);
  if(mode==='auto')assert.ok(report.duration>=25&&report.duration<=35,'nominal 25–35 sec');
  assert.equal(flying.filter(f=>f.stage==='brake'&&f.black).length,0,'no black frame during burn');
  assert.equal(report.handoff.loops,1);assert.deepEqual(report.errors,[]);assert.deepEqual(report.bad,[]);
  if(process.env.CONTACT){await p.waitForFunction(()=>window.__world.descent.phase==='contact',undefined,{timeout:120000});report.contact=true;await p.screenshot({path:out+'-contact.png'});console.log('CONTACT');}
 }finally{if(!report.frames)report.frames=await p.evaluate(()=>window.__qaFrames||[]).catch(()=>[]);fs.writeFileSync(out+'.json',JSON.stringify(report,null,2));await context.close();await browser.close();}
 console.log('PASS',out);
})().catch(e=>{console.error(e);process.exitCode=1;});

