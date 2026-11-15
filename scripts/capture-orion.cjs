const {chromium}=require('C:/Users/ADMIN/AppData/Local/npm-cache/_npx/9833c18b2d85bc59/node_modules/playwright');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-gpu']});
 try {
 const page=await browser.newPage({viewport:{width:1440,height:810}});
 page.on('pageerror',e=>console.error(e));
 await page.goto('http://localhost:5173/?intro=only');
 await page.waitForFunction(()=>window.__intro,undefined,{timeout:120000});
 await page.keyboard.press('Enter'); await page.waitForTimeout(4200);
 const before=process.argv.includes('--before');
 const saved=before?null:JSON.parse(fs.readFileSync('.superpowers/orion-detail/frame.json','utf8'));
 const state=await page.evaluate(saved=>{
  const s=window.__intro.scene,c=s.activeCamera;
  s.getEngine().stopRenderLoop();
  const names=['orion','hlsOrbit'];
  const ships=s.transformNodes.filter(n=>names.includes(n.name));
  const vector=v=>v.asArray();
  if(saved){
   // Older baseline records Orion only. Move its companion by the same delta
   // before restoring it, keeping the docked pair together in this frozen QA shot.
   if(!saved.ships.some(n=>n.name==='hlsOrbit')) {
    const o=s.getTransformNodeByName('orion'),h=s.getTransformNodeByName('hlsOrbit');
    const p=saved.ships.find(n=>n.name==='orion')?.position;
    if(o&&h&&p)h.position.addInPlace(o.position.constructor.FromArray(p).subtract(o.position));
   }
   c.position.copyFromFloats(...saved.camera.position);c.setTarget(c.position.constructor.FromArray(saved.camera.target));c.fov=saved.camera.fov;
   for(const v of saved.ships){const n=s.getTransformNodeByName(v.name);if(n){n.position.copyFromFloats(...v.position);n.rotation.copyFromFloats(...v.rotation);if(v.q)n.rotationQuaternion=n.rotationQuaternion.constructor.FromArray(v.q);}}
  }
  s.render();
  return {camera:{position:vector(c.position),target:vector(c.getTarget()),fov:c.fov},ships:ships.map(n=>({name:n.name,position:vector(n.position),rotation:vector(n.rotation),q:n.rotationQuaternion?.asArray()}))};
 },saved);
 if(before)fs.writeFileSync('.superpowers/orion-detail/frame.json',JSON.stringify(state));
 await page.screenshot({path:`docs/screens/orion-${before?'before':'after'}-game.png`});
 console.log(JSON.stringify(state));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
