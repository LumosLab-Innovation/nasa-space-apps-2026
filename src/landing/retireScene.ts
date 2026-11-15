import type { Scene } from '@babylonjs/core';
/** Bound synchronous work by both item count and CPU time; never dispose a populated scene on handoff. */
export function retireScene(scene:Scene,extra:()=>void=()=>{}) {
  scene.metadata={...scene.metadata,retired:true};scene.detachControl();scene.physicsEnabled=false;
  const queue:(()=>void)[]=[];
  for(const mesh of [...scene.meshes])queue.push(()=>mesh.dispose(true,false));
  for(const n of [...scene.transformNodes])queue.push(()=>n.dispose(true));
  for(const m of [...scene.materials])queue.push(()=>m.dispose(false,false));
  for(const t of [...scene.textures])queue.push(()=>t.dispose());
  queue.push(extra,()=>scene.dispose());
  const tick=()=>{
    if(scene.isDisposed)return;
    const start=performance.now();let count=0;
    while(queue.length&&count++<8&&performance.now()-start<2)queue.shift()!();
    if(queue.length)requestAnimationFrame(tick);
  };
  // Leave the first playable frames free of retirement work.
  setTimeout(()=>requestAnimationFrame(tick),250);
}
