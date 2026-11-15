const {chromium}=require('C:/Users/ADMIN/AppData/Local/npm-cache/_npx/9833c18b2d85bc59/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-gpu']});
 try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});page.on('pageerror',console.error);
 await page.goto('http://localhost:5173/?intro=only');await page.waitForFunction(()=>window.__intro,undefined,{timeout:120000});
 const result=await page.evaluate(async()=>{
  const B=await import(performance.getEntriesByType('resource').find(e=>e.name.includes('/@babylonjs_core.js?')).name);
  const old=window.__intro.scene,e=old.getEngine();e.stopRenderLoop();
  const s=new B.Scene(e);s.clearColor=new B.Color4(.025,.035,.05,1);
  const camera=new B.ArcRotateCamera('inspection',-.95,1.95,19,new B.Vector3(0,.2,0),s);camera.minZ=.01;
  const key=new B.DirectionalLight('inspectionKey',new B.Vector3(-.6,-.4,1),s);key.intensity=1.8;
  const fill=new B.HemisphericLight('inspectionFill',new B.Vector3(0,1,0),s);fill.intensity=.65;
  const {loadModel}=await import('/src/models/loadModel.ts');const m=await loadModel(s,'orion');for(const mesh of m.meshes){const mt=mesh.material;mt.emissiveColor=mt.albedoColor.scale(.08);if(mt.albedoTexture){mt.emissiveTexture=mt.albedoTexture;mt.emissiveColor=new B.Color3(.12,.12,.12);}mt.reflectionTexture=old.materials.find(m=>m.name.includes('Orion')&&m.reflectionTexture)?.reflectionTexture;mt.environmentIntensity=.6;}
  await s.whenReadyAsync();s.render();window.__inspect={s,camera,m};
  return {vertices:m.meshes.reduce((n,m)=>n+m.getTotalVertices(),0),meshes:m.meshes.length};
 });
 await page.waitForTimeout(1500);await page.screenshot({path:'docs/screens/orion-detail-inspection.png'});
 await page.evaluate(()=>{const {camera}=window.__inspect;camera.setTarget(camera.target.constructor.FromArray([0,-2,0]));camera.alpha=-1.3;camera.beta=2.65;camera.radius=8;window.__inspect.s.render();});
 await page.waitForTimeout(600);await page.screenshot({path:'docs/screens/orion-engine-inspection.png'});console.log(result);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});

