// Same scene/camera/driver on/off measurement. Software rasterizer results are not a hardware FPS claim.
const {chromium}=require('C:/Users/ADMIN/AppData/Local/npm-cache/_npx/9833c18b2d85bc59/node_modules/playwright');
const fs=require('node:fs');
(async()=>{const b=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--use-angle=d3d11','--ignore-gpu-blocklist'],ignoreDefaultArgs:['--enable-unsafe-swiftshader']});try{
 const p=await b.newPage({viewport:{width:1440,height:810}});await p.goto('http://localhost:5173/.superpowers/exhaust-review.html');await p.waitForFunction(()=>window.review,undefined,{timeout:180000});
 const result=await p.evaluate(async()=>{const r=window.review;r.engine.stopRenderLoop();r.choose('main');r.root.position.y=25;r.cam.radius=90;r.effect.update(1,.65,false);r.rig.update(0);r.engine.runRenderLoop(()=>r.scene.render());await r.scene.whenReadyAsync();await new Promise(resolve=>setTimeout(resolve,500));r.engine.stopRenderLoop();const meshes=r.scene.meshes.filter(m=>m.name.startsWith('exhaust')),rows=[];
  for(const enabled of [true,false,true,false]){meshes.forEach(m=>m.setEnabled(enabled));const values=[];for(let i=0;i<35;i++){const start=performance.now();if(enabled)r.effect.update(1/60,.65,false);r.scene.render();r.engine._gl.finish();if(i>=10)values.push(performance.now()-start);}values.sort((a,b)=>a-b);rows.push({enabled,p50:values[Math.floor(values.length*.5)],p95:values[Math.floor(values.length*.95)]});await new Promise(resolve=>setTimeout(resolve,100));}
  return {renderer:r.engine.getGlInfo(),viewport:[1440,810],method:'CPU submission plus gl.finish; stationary diagnostic scene, 25 samples per block after 10 warm frames; alternating on/off',rows};
 });fs.writeFileSync('docs/screens/exhaust-benchmark.json',JSON.stringify(result,null,2));console.log(result);
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
