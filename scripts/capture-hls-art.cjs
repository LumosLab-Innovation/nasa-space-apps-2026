const {chromium}=require(process.env.PLAYWRIGHT_PATH||'C:/Users/ADMIN/AppData/Local/npm-cache/_npx/9833c18b2d85bc59/node_modules/playwright');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-gpu']});
 try{
  const page=await browser.newPage({viewport:{width:1470,height:720},deviceScaleFactor:1});
  await page.goto('http://localhost:5173/?intro=only');await page.waitForFunction(()=>window.__intro,undefined,{timeout:120000});
  await page.keyboard.press('Enter');await page.waitForTimeout(4200);
  const crop=await page.evaluate(()=>{
   const {scene:s,hlsRig}=window.__intro,e=s.getEngine(),c=s.activeCamera;
   e.stopRenderLoop();for(const t of s.textures)if(t.layer)t.layer.isEnabled=false;
   const V=c.position.constructor,M=c.getWorldMatrix().constructor;
   c.fov=.72;
   const h=hlsRig.parent,o=s.getTransformNodeByName('orion');
   const nodes=[h,o].filter(Boolean);window.__artShips=nodes;
   const bounds=()=>{
    s.render();const viewport=c.viewport.toGlobal(1470,720);
    const points=nodes.flatMap(n=>n.getChildMeshes().filter(m=>m.isEnabled()&&m.isVisible).flatMap(m=>{
     m.computeWorldMatrix(true);return m.getBoundingInfo().boundingBox.vectorsWorld.map(p=>V.Project(p,M.Identity(),s.getTransformMatrix(),viewport));
    }));
    return {x0:Math.min(...points.map(p=>p.x)),x1:Math.max(...points.map(p=>p.x)),y0:Math.min(...points.map(p=>p.y)),y1:Math.max(...points.map(p=>p.y))};
   };
   for(let i=0;i<4;i++){
    const b=bounds(),target=c.getTarget(),forward=target.subtract(c.position).normalize(),right=V.Cross(c.upVector,forward).normalize(),up=V.Cross(forward,right).normalize();
    const d=V.Distance(h.getAbsolutePosition(),c.position),unit=2*d*Math.tan(c.fov/2)/720;
    c.setTarget(target.add(right.scale(((b.x0+b.x1)/2-1010)*unit)).add(up.scale((405-(b.y0+b.y1)/2)*unit)));
   }
   hlsRig.update(0);const b=bounds();
   return {left:Math.max(0,Math.floor(b.x0)-8),top:Math.max(0,Math.floor(b.y0)-8),width:Math.ceil(b.x1-b.x0)+16,height:Math.ceil(b.y1-b.y0)+16};
  });
  await page.screenshot({path:'docs/screens/hls-menu-frame.png'});
  await page.evaluate(()=>{for(const n of window.__artShips)n.setEnabled(false);window.__intro.scene.render();});
  await page.screenshot({path:'docs/screens/hls-loading-background.png'});
  await page.evaluate(()=>{
   const s=window.__intro.scene,ships=window.__artShips;
   const keep=new Set(ships.flatMap(n=>n.getChildMeshes()));
   for(const m of s.meshes)if(!keep.has(m))m.setEnabled(false);
   for(const n of ships)n.setEnabled(true);
   s.clearColor.a=0;s.render();
  });
  await page.screenshot({path:'docs/screens/hls-loading-ship-layer.png',omitBackground:true});
  await page.evaluate(()=>{const s=window.__intro.scene;s.clearColor.set(1,1,1,1);s.render();});
  await page.screenshot({path:'docs/screens/hls-loading-ship-white.png'});
  fs.writeFileSync('docs/screens/hls-art-crop.json',JSON.stringify(crop,null,2));console.log(crop);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
