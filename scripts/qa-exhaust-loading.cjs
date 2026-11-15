// Existing loading regression, isolated storage and the same software-render QA driver.
const fs=require('node:fs');
let source=fs.readFileSync(__dirname+'/qa-loading-flicker.cjs','utf8');
source=source.replace("args:['--enable-gpu']", "args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-background-timer-throttling','--disable-renderer-backgrounding']");
source=source.replaceAll('loading-flicker-after','exhaust-loading');
source=source.replace('async function button(p,id){','async function button(p,id){console.log("click",id);await p.bringToFront();await p.waitForFunction(id=>window.__engine?.scenes.some(s=>s.textures.some(t=>{const c=t.getControlByName?.(id);return c?.isVisible&&c._currentMeasure.width>0;})),id,{timeout:60000});await p.waitForTimeout(400);');
source=source.replace('await page.waitForTimeout(300);','await page.waitForTimeout(1600);');
source=source.replace("assert.ok(loaded.progress.includes(100)", "const fx=await page.evaluate(()=>window.__engine.scenes.flatMap(s=>s.textures).filter(t=>t.url?.startsWith('blob:')).map(t=>t.isReady()));assert.ok(fx.every(Boolean),'all prepared blob textures ready');assert.ok(loaded.progress.includes(100)");
eval(source);
