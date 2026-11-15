import {it,expect,vi,beforeEach} from 'vitest';
const resize=vi.hoisted(()=>vi.fn());
const render=vi.hoisted(()=>vi.fn());
beforeEach(()=>vi.clearAllMocks());
vi.mock('@babylonjs/core',()=>({
 RenderTargetTexture:class {constructor(){} resize=resize;dispose=vi.fn()},
 EffectRenderer:class {render=render;dispose(){}},
 EffectWrapper:class {effect={executeWhenCompiled:(f:()=>void)=>f(),onErrorObservable:{addOnce(){}},setTexture(){},setFloat(){}};onApplyObservable={add(){}};dispose(){}},
}));
import {createLiveTransition} from '../src/landing/liveTransition';
it('resizes both render targets to the current canvas aspect before blending',async()=>{
 let width=1440,height=810;
 const engine={getRenderWidth:()=>width,getRenderHeight:()=>height,restoreDefaultFramebuffer(){}};
 const scene=()=>({activeCamera:{outputRenderTarget:null},layers:[],render(){}});
 const blend=await createLiveTransition(engine as never,scene() as never,scene() as never);
 width=900;height=900;blend.render(.5);
 expect(resize).toHaveBeenCalledTimes(2);expect(resize).toHaveBeenCalledWith({width:900,height:900});
 blend.render(.6);expect(resize).toHaveBeenCalledTimes(2);
 blend.dispose();
});
it('warms the compositor offscreen without overwriting loading or either sampled input',async()=>{
 const engine={getRenderWidth:()=>1440,getRenderHeight:()=>810,restoreDefaultFramebuffer(){}};
 const previous={};const inputs:unknown[]=[];
 const scene=()=>({activeCamera:{outputRenderTarget:previous},layers:[],render(){inputs.push(this.activeCamera.outputRenderTarget)}});
 const outgoing=scene(),incoming=scene();
 const blend=await createLiveTransition(engine as never,outgoing as never,incoming as never);
 blend.warm();
 const destination=render.mock.calls[0][1];
 expect(destination).toBeDefined();
 expect(inputs).not.toContain(destination);
 expect(destination.dispose).toHaveBeenCalledOnce();
 expect(outgoing.activeCamera.outputRenderTarget).toBe(previous);
 expect(incoming.activeCamera.outputRenderTarget).toBe(previous);
 render.mockClear();blend.render(.5);
 expect(render.mock.calls[0]).toHaveLength(1); // Only actual gameplay presents to the canvas.
 blend.dispose();
});
