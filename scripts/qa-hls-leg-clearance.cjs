const {chromium}=require('C:/Users/ADMIN/AppData/Local/npm-cache/_npx/9833c18b2d85bc59/node_modules/playwright');
const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 try{
  const page=await browser.newPage({viewport:{width:1600,height:1050}});const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://localhost:5173/preview/hls.html');await page.waitForFunction(()=>window.__hlsReview?.ready);
  const samples=await page.evaluate(()=>{
   const a=window.__hlsReview;a.setView('engine-detail');const samples=[];
   for(const lod of ['near','far']){a.setLod(lod);for(let i=0;i<=100;i++){a.seekLegs(i/100);samples.push({lod,...a.legEngineClearance()});}}
   return samples;
  });
  fs.writeFileSync(path.resolve('docs/screens/hls-leg-clearance-samples.json'),JSON.stringify(samples,null,2));
  for(const s of samples)assert.equal(s.intersections,0,`${s.lod} legs intrude into engine bay at deployment=${s.deployment}, clearance=${s.clearance.toFixed(3)}m`);
  await page.evaluate(()=>{const a=window.__hlsReview;a.setLod('near');a.setView('engine-detail');});await page.waitForTimeout(200);
  await page.screenshot({path:'docs/screens/hls-leg-clearance-stowed.png'});
  await page.evaluate(()=>window.__hlsReview.setPose('surface',true));await page.waitForTimeout(200);
  await page.screenshot({path:'docs/screens/hls-leg-clearance-deployed.png'});
  assert.deepEqual(errors,[]);
  fs.writeFileSync(path.resolve('docs/screens/hls-leg-clearance-qa.json'),JSON.stringify({ok:true,samples:samples.length,minClearance:Math.min(...samples.map(s=>s.clearance)),errors},null,2));
  console.log('PASS',samples.length,'poses, minimum protected-bay clearance',Math.min(...samples.map(s=>s.clearance)));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
