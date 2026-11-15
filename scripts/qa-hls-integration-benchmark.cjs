const { chromium }=require(process.env.PLAYWRIGHT_PATH||'C:/Users/ADMIN/AppData/Local/npm-cache/_npx/9833c18b2d85bc59/node_modules/playwright');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-gpu']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:810}});
  await page.goto('http://localhost:5173/?intro=only&assist=1');
  await page.waitForFunction(()=>window.__intro,{timeout:120000});
  await page.keyboard.press('Enter');await page.waitForTimeout(4000);await page.keyboard.press('Escape');
  const result=await page.evaluate(async()=>{
   const s=window.__intro.scene,engine=s.getEngine();
   const times=[];let before=0;
   const a=s.onBeforeRenderObservable.add(()=>before=performance.now());
   const b=s.onAfterRenderObservable.add(()=>times.push(performance.now()-before));
   await new Promise(r=>setTimeout(r,6000));s.onBeforeRenderObservable.remove(a);s.onAfterRenderObservable.remove(b);
   times.splice(0,30);times.sort((a,b)=>a-b);
   return {samples:times.length,medianMs:times[Math.floor(times.length*.5)],p95Ms:times[Math.floor(times.length*.95)],drawCalls:engine._drawCalls.current,meshes:s.meshes.length};
  });
  const label=process.argv[2]||'after';fs.writeFileSync(`docs/screens/hls-integration-benchmark-${label}.json`,JSON.stringify(result,null,2));console.log(result);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
