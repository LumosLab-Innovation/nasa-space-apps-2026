const {chromium}=require('C:/Users/ADMIN/AppData/Local/npm-cache/_npx/9833c18b2d85bc59/node_modules/playwright');
const fs=require('fs');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-gpu']});
 const page=await browser.newPage({viewport:{width:1440,height:810}}),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 try{
 await page.addInitScript(()=>localStorage.setItem('pipmica.lang','vi'));
 await page.goto('http://localhost:5173/?intro=only&assist=1');
 await page.waitForFunction(()=>window.__intro,undefined,{timeout:120000});
 await page.keyboard.press('Enter');await page.waitForTimeout(4200);
 await page.screenshot({path:'docs/screens/orbit-restored-approved-terrain-earth.png'});
 const result=await page.evaluate(()=>{
 const s=window.__intro.scene,e=s.getMeshByName('introEarth'),m=s.getMeshByName('moon');
 return {earth:!!e&&e.isEnabled(),earthVertices:e?.getTotalVertices(),moon:!!m&&m.isEnabled(),moonVertices:m?.getTotalVertices(),moonSource:m?.metadata,sceneMeshes:s.meshes.length};
 });
 fs.writeFileSync('docs/screens/orbit-restored-qa.json',JSON.stringify({result,errors},null,2));
 console.log(JSON.stringify({result,errors}));
 if(!result.earth||!result.moon||errors.length)throw new Error('Restoration failed');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
