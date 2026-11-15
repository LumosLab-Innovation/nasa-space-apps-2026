const {chromium}=require(process.env.PLAYWRIGHT_PATH||'C:/Users/ADMIN/AppData/Local/npm-cache/_npx/9833c18b2d85bc59/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-gpu']});
 try{
  const page=await browser.newPage();await page.goto('http://localhost:5173/?demo=1');
  await page.waitForFunction(()=>window.__world,undefined,{timeout:120000});
  await page.evaluate(()=>window.__world.startLanding(true));await page.waitForTimeout(1200);
  const error=await page.evaluate(()=>{
   const w=window.__world,h=w.hlsRig.parent,f=w.scene.getMeshByName('descentFlame'),V=h.position.constructor;
   h.computeWorldMatrix(true);f.computeWorldMatrix(true);
   const actual=V.TransformCoordinates(new V(0,7,0),f.getWorldMatrix());
   const expected=V.TransformCoordinates(new V(0,w.hlsRig.engineHeight,0),h.getWorldMatrix());
   return {gap:V.Distance(actual,expected),tilt:h.rotation.z,throttle:f.scaling.y};
  });console.log(error);assert.ok(error.gap<.002,'plume remains attached at partial throttle and tilt');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
