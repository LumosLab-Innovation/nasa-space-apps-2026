// Reuse the established uninterrupted manual/auto flight QA with stable menu readiness.
const fs=require('fs');
let source=fs.readFileSync(__dirname+'/qa-twenty-second.cjs','utf8');
// Preserve the approved gameplay framing. SOFTWARE_QA records (does not pass)
// the wall-clock timing gate on the tool host's Microsoft Basic renderer.
if(process.env.SOFTWARE_QA)source=source.replace("if(mode==='auto')assert.ok(report.duration>=18&&report.duration<=22,'nominal 18–22 sec');", "report.nominalTimingPass=report.duration>=18&&report.duration<=22;report.softwareTimingLimitation=true;");
source=source.replace("args:['--enable-gpu']", "args:['--use-angle=d3d11','--ignore-gpu-blocklist'],ignoreDefaultArgs:['--enable-unsafe-swiftshader']");
source=source.replace("console.log('LOADED');", "console.log('LOADED');report.renderer=await p.evaluate(()=>window.__engine.getGlInfo());console.log(report.renderer);");
source=source.replace("p.on('pageerror'", "p.on('console',m=>{if((m.type()==='error'||/GL_INVALID/.test(m.text()))&&!m.location().url?.endsWith('/favicon.ico'))report.errors.push({text:m.text(),location:m.location()});});p.on('pageerror'");
source=source.replace('async function button(p,id){','async function button(p,id){await p.waitForFunction(id=>window.__engine?.scenes.some(s=>s.textures.some(t=>{const c=t.getControlByName?.(id);return c?.isVisible&&c._currentMeasure.width>0;})),id,{timeout:60000});await p.waitForTimeout(350);');
source=source.replace("await p.waitForTimeout(500);","await p.waitForTimeout(1600);");
source=source.replace('h:i?.director.brake.h??w?.descent?.state.h,land:', 'vfx:i?.scene.metadata?.exhaust??w?.descent?.exhaustDiagnostics,orionVfx:i?.scene.metadata?.orionExhaust,h:i?.director.brake.h??w?.descent?.state.h,land:');
source=source.replace("if(process.env.CONTACT){", "if(process.env.CONTACT){await p.evaluate(()=>window.__startClip());");
source=source.replace("timeout:120000", "timeout:300000");
if(process.env.CONTACT_FIXTURE)source=source.replace("if(process.env.CONTACT){", "if(process.env.CONTACT){report.contactFixture=true;await p.evaluate(()=>Object.assign(window.__world.descent.state,{h:20,vy:-2,vx:0,tiltDeg:0}));");
source=source.replace("if(!report.frames)","report.finalState=await p.evaluate(()=>({phase:window.__world?.descent?.phase,state:window.__world?.descent?.state,fx:window.__world?.descent?.exhaustDiagnostics})).catch(()=>null);if(!report.frames)");
source=source.replace("console.log('CONTACT');", "console.log('CONTACT');await p.waitForFunction(()=>window.__world.descent.exhaustDiagnostics.contactTime>=1.2,undefined,{timeout:15000});report.cutoff=await p.evaluate(()=>window.__world.descent.exhaustDiagnostics);assert.equal(report.cutoff.power,0,'main plume reaches zero after contact');assert.equal(report.cutoff.pulse,0,'RCS off at contact');const contactClip=await p.evaluate(()=>window.__stopClip());fs.writeFileSync(out+'-touchdown.webm',Buffer.from(contactClip,'base64'));");
eval(source);
