import { Texture, type Scene } from '@babylonjs/core';
export const EXHAUST_FILES=['glow','wisp','dust','grain'].map(n=>`textures/exhaust/${n}.webp`);
export type ExhaustAssets={glow:Texture;wisp:Texture;dust:Texture;grain:Texture};
const cache=new WeakMap<Scene,ExhaustAssets>();
export async function prepareExhaustAssets(scene:Scene,files:ReadonlyMap<string,ArrayBuffer>){
 if(cache.has(scene))return cache.get(scene)!;
 const results=await Promise.allSettled(EXHAUST_FILES.map(path=>new Promise<Texture>((resolve,reject)=>{
  const bytes=files.get(path);if(!bytes){reject(new Error('Missing preloaded exhaust: '+path));return;}
  const url=URL.createObjectURL(new Blob([bytes],{type:'image/webp'}));
  const tex=new Texture(url,scene,false,false,Texture.TRILINEAR_SAMPLINGMODE,()=>{URL.revokeObjectURL(url);tex.hasAlpha=true;tex.wrapU=tex.wrapV=Texture.CLAMP_ADDRESSMODE;resolve(tex);},(_,err)=>{URL.revokeObjectURL(url);tex.dispose();reject(err??new Error(path));});
 })));
 const bad=results.find(r=>r.status==='rejected');if(bad){for(const r of results)if(r.status==='fulfilled')r.value.dispose();throw bad.reason;}
 const [glow,wisp,dust,grain]=results.map(r=>(r as PromiseFulfilledResult<Texture>).value);const assets={glow,wisp,dust,grain};cache.set(scene,assets);scene.onDisposeObservable.addOnce(()=>cache.delete(scene));return assets;
}
export function exhaustAssets(scene:Scene){const a=cache.get(scene);if(!a)throw new Error('Exhaust assets must be prepared before scene creation');return a;}
