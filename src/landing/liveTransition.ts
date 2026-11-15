import { EffectRenderer, EffectWrapper, RenderTargetTexture, type Engine, type Scene, type Layer } from '@babylonjs/core';

/** World-only targets. Scene updates stay with their owner; the incoming scene remains dormant. */
export async function createLiveTransition(engine:Engine,outgoing:Scene,incoming:Scene) {
  const dimensions=()=>{const ratio=Math.min(1,1920/engine.getRenderWidth(),1080/engine.getRenderHeight());return {width:Math.round(engine.getRenderWidth()*ratio),height:Math.round(engine.getRenderHeight()*ratio)};};
  let size=dimensions();
  const a=new RenderTargetTexture('descentOutgoing',size,outgoing,false),b=new RenderTargetTexture('descentIncoming',size,incoming,false);
  const renderer=new EffectRenderer(engine);
  const effect=new EffectWrapper({engine,name:'liveDescentBlend',samplerNames:['outgoing','incoming'],uniformNames:['blend'],
    fragmentShader:'precision highp float; varying vec2 vUV; uniform sampler2D outgoing; uniform sampler2D incoming; uniform float blend; void main(){gl_FragColor=mix(texture2D(outgoing,vUV),texture2D(incoming,vUV),blend);}'});
  await new Promise<void>((resolve,reject)=>{
    effect.effect.executeWhenCompiled(()=>resolve());effect.effect.onErrorObservable.addOnce(()=>reject(new Error('Descent compositor compilation failed')));
  });
  let amount=0,disposed=false;
  function syncSize(){const next=dimensions();if(next.width!==size.width||next.height!==size.height){a.resize(next);b.resize(next);size=next;}}
  effect.onApplyObservable.add(()=>{effect.effect.setTexture('outgoing',a);effect.effect.setTexture('incoming',b);effect.effect.setFloat('blend',amount);});
  function world(scene:Scene,target:RenderTargetTexture){
    const camera=scene.activeCamera!,previous=camera.outputRenderTarget;camera.outputRenderTarget=target;
    const states=scene.layers.map(l=>l.isEnabled);scene.layers.forEach(l=>{l.isEnabled=false;});
    try{scene.render();}finally{scene.layers.forEach((l,i)=>{l.isEnabled=states[i];});camera.outputRenderTarget=previous;}
  }
  return {
    warm(){
      syncSize();
      // A third target avoids both flashing the canvas and sampling our own output.
      const target=new RenderTargetTexture('descentWarmup',size,outgoing,false);
      try{world(outgoing,a);world(incoming,b);renderer.render(effect,target);}
      finally{engine.restoreDefaultFramebuffer();target.dispose();}
    },
    render(blend:number,gui?:Layer|null){
      if(disposed)return;syncSize();amount=Math.max(0,Math.min(1,blend));
      if(amount<1)world(outgoing,a);
      world(incoming,b);engine.restoreDefaultFramebuffer();renderer.render(effect);gui?.render();
    },
    dispose(){if(disposed)return;disposed=true;a.dispose();b.dispose();effect.dispose();renderer.dispose();},
  };
}
