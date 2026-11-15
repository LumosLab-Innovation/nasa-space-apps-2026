const {chromium}=require('C:/Users/ADMIN/AppData/Local/npm-cache/_npx/9833c18b2d85bc59/node_modules/playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--use-angle=d3d11','--ignore-gpu-blocklist'],ignoreDefaultArgs:['--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1280,height:800}}),report={errors:[],cases:{}};
 page.on('pageerror',e=>report.errors.push(String(e)));
 try{
  await page.goto('http://localhost:5173/.superpowers/exhaust-review.html');await page.waitForFunction(()=>window.review,undefined,{timeout:180000});
  await page.evaluate(()=>{window.review.engine.stopRenderLoop();window.review.scene.clearColor.set(0.004,.008,.014,1);document.querySelector('nav').style.display='none';});
  for(const mode of ['main','rcs','ground','orion']){
   report.cases[mode]=await page.evaluate(async mode=>{
    const {Vector3,Quaternion}=await import('/node_modules/@babylonjs/core/Maths/math.vector.js');
    const {auxiliaryPulse}=await import('/src/fx/exhaustState.ts');
    const r=window.review;r.choose(mode);r.effect.update(0,0,false);r.aux.update(0,0,false,false,0);r.cam.alpha=mode==='rcs'?1.95:1.2;r.cam.beta=1.27;r.cam.radius=mode==='orion'?11:mode==='rcs'?63:78;
    r.cam.setTarget(new Vector3(0,mode==='orion'?0:mode==='main'?32:19,0));r.root.position.y=mode==='main'?25:0;
    for(let i=0;i<120;i++){
     const time=i/60;
     if(mode==='orion')r.aux.update(1/60,0,false,false,auxiliaryPulse(time));
     else {
      const t=Math.min(1,time/3),a=t*t*t*(10-15*t+6*t*t);
      if(mode==='rcs')r.root.rotationQuaternion=Quaternion.RotationAxis(Vector3.Forward(),-.2+.4*a);
      r.effect.update(1/60,mode==='rcs'?0:.65,mode==='rcs');
     }
     if(mode==='orion'&&time>=.8||mode==='rcs'&&time>.6&&r.effect.diagnostics.pulse>.5)break;
    }
    if(mode==='rcs'){const jet=r.scene.meshes.find(m=>m.name.startsWith('exhaust-rcs')&&m.isVisible&&m.position.y>20);jet.computeWorldMatrix(true);r.cam.setTarget(jet.getAbsolutePosition());r.cam.alpha=1.95;r.cam.beta=1.5;r.cam.radius=13;}
    if(mode==='orion'){r.cam.setTarget(new Vector3(0,-2,0));r.cam.alpha=1.2;r.cam.beta=2.15;r.cam.radius=12;}
    r.rig.update(0);r.engine.runRenderLoop(()=>r.scene.render());await r.scene.whenReadyAsync();await new Promise(resolve=>setTimeout(resolve,500));r.engine.stopRenderLoop();r.scene.render();
    document.querySelector('#info').textContent={main:'HLS · LUỒNG PHỤT NHIỀU LỚP · GÓC QA RIÊNG',rcs:'HLS · RCS ĐIỀU CHỈNH TƯ THẾ · GÓC QA RIÊNG',ground:'HLS · LUỒNG KHÍ XÒE SÁT ĐẤT · MẶT PHẲNG KIỂM TRA',orion:'ORION · VÒI PHỤ PHÍA SAU · ĐỘNG CƠ CHÍNH TẮT'}[mode];
    return mode==='orion'?r.aux.diagnostics:r.effect.diagnostics;
   },mode);
   assert.ok(report.cases[mode].jets.length>0,mode+' visible');
   await page.screenshot({path:'docs/screens/exhaust-review-'+mode+'.png'});
  }
  assert.deepEqual(report.errors,[]);fs.writeFileSync('docs/screens/exhaust-review.json',JSON.stringify(report,null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
