import {Color3,Constants,DynamicTexture,Mesh,MultiMaterial,PBRMaterial,RawCubeTexture,Scene,SubMesh,Texture,type AssetContainer} from '@babylonjs/core';

/** Independent art-detail generator: does not advance the terrain/rock random sequence. */
export function finishEagleMaterials(scene:Scene,container:AssetContainer):void {
  const size=1024;
  const height=new Float32Array(size*size);
  const hash=(x:number,y:number,n:number)=>{
    let v=Math.imul((x%n+n)%n,374761393)^Math.imul((y%n+n)%n,668265263)^1159;
    v=Math.imul(v^(v>>>13),1274126177);return ((v^(v>>>16))>>>0)/4294967295;
  };
  // Piecewise planar folds, then smaller crinkles. Unlike cloudy noise this creates angled foil facets.
  const folded=(u:number,v:number,n:number)=>{
    const x=u*n,y=v*n,ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy;
    const a=hash(ix,iy,n),b=hash(ix+1,iy,n),c=hash(ix,iy+1,n),d=hash(ix+1,iy+1,n);
    return fx>fy?a*(1-fx)+b*(fx-fy)+d*fy:a*(1-fy)+c*(fy-fx)+d*fx;
  };
  for(let y=0;y<size;y++)for(let x=0;x<size;x++)height[y*size+x]=folded(x/size,y/size,9)*.65+folded(x/size,y/size,27)*.24+folded(x/size,y/size,73)*.07;
  const make=(name:string)=>{
    const tex=new DynamicTexture(name,size,scene,true);tex.wrapU=tex.wrapV=Texture.WRAP_ADDRESSMODE;
    tex.coordinatesIndex=1;tex.anisotropicFilteringLevel=8;return tex;
  };
  const foilColor=make('eagleFoilColor'),foilNormal=make('eagleFoilFolds'),foilMetal=make('eagleFoilRoughness');
  const maps=[foilColor,foilNormal,foilMetal].map(t=>({texture:t,ctx:t.getContext(),pixels:t.getContext().getImageData(0,0,size,size)}));
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const p=y*size+x,i=p*4,h=height[p];
    const dx=(height[y*size+(x+1)%size]-height[y*size+(x+size-1)%size])*60;
    const dy=(height[((y+1)%size)*size+x]-height[((y+size-1)%size)*size+x])*60;
    const len=Math.hypot(dx,dy,1),variation=.91+h*.13;
    const color=maps[0].pixels.data,normal=maps[1].pixels.data,mr=maps[2].pixels.data;
    color[i]=Math.round(226*variation);color[i+1]=Math.round(170*variation);color[i+2]=Math.round(73*variation);color[i+3]=255;
    normal[i]=Math.round((1-dx/len)*127.5);normal[i+1]=Math.round((1-dy/len)*127.5);normal[i+2]=Math.round((1+1/len)*127.5);normal[i+3]=255;
    mr[i]=255;mr[i+1]=Math.round(92+h*52);mr[i+2]=185;mr[i+3]=255;
  }
  for(const m of maps){m.ctx.putImageData(m.pixels,0,0);m.texture.update(false);}

  // Material-local reflection of dark sky / grey ground. Never set scene.environmentTexture.
  const faceSize=32,faces:Uint8Array[]=[];
  for(let face=0;face<6;face++){
    const data=new Uint8Array(faceSize*faceSize*4);
    for(let y=0;y<faceSize;y++)for(let x=0;x<faceSize;x++){
      const u=(x+.5)/faceSize*2-1,v=(y+.5)/faceSize*2-1;
      const dirs=[[1,-v,-u],[-1,-v,u],[u,1,v],[u,-1,-v],[u,-v,1],[-u,-v,-1]],d=dirs[face];
      const up=d[1]/Math.hypot(...d),bounce=Math.max(0,Math.min(1,(.18-up)*2));
      const level=Math.round(9+bounce*105),i=(y*faceSize+x)*4;
      data[i]=data[i+1]=data[i+2]=level;data[i+3]=255;
    }
    faces.push(data);
  }
  const reflection=new RawCubeTexture(scene,faces,faceSize,Constants.TEXTUREFORMAT_RGBA,Constants.TEXTURETYPE_UNSIGNED_BYTE,true);
  reflection.name='eagleLocalLunarReflection';reflection.gammaSpace=true;reflection.level=.65;

  const gold=container.materials.find(m=>m.name==='blinn1SG.002') as PBRMaterial|undefined;
  for(const mat of container.materials)if(mat instanceof PBRMaterial){
    for(const texture of mat.getActiveTextures())texture.anisotropicFilteringLevel=8;
    if(mat.name==='blinn1SG.002'||mat.name==='blinn9SG.001'){
      mat.albedoColor=mat.name==='blinn1SG.002'?Color3.White():new Color3(.82,.66,.42);
      mat.albedoTexture=foilColor;mat.bumpTexture=foilNormal;foilNormal.level=.85;
      mat.metallic=1;mat.roughness=1;mat.metallicTexture=foilMetal;
      mat.useRoughnessFromMetallicTextureGreen=true;mat.useRoughnessFromMetallicTextureAlpha=false;mat.useMetallnessFromMetallicTextureBlue=true;
      mat.reflectionTexture=reflection;
    }else if(['blinn4SG.002','blinn2SG.002','initialShadingGr.001','blinn7SG.002'].includes(mat.name)){
      mat.metallic=.86;mat.roughness=mat.name==='blinn4SG.002'?.3:.43;
      mat.albedoColor=mat.name==='blinn2SG.002'?new Color3(.28,.3,.32):new Color3(.67,.7,.72);
      mat.reflectionTexture=reflection;
    }else if(mat.name==='blinn6SG.001'){
      mat.metallic=.15;mat.roughness=.82;mat.albedoColor=new Color3(.025,.026,.027);
    }
  }
  let pads:PBRMaterial|undefined;
  if(gold){
    pads=new PBRMaterial('eagleBrushedFootpads',scene);pads.reflectionTexture=reflection;
    pads.albedoColor=new Color3(.49,.45,.34);pads.metallic=.82;pads.roughness=.48;
  }
  for(const mesh of container.meshes){
    if(!(mesh instanceof Mesh)||!mesh.getTotalVertices())continue;
    const mat=mesh.material;
    if(!(mat instanceof PBRMaterial)||!['blinn1SG.002','blinn9SG.001'].includes(mat.name))continue;
    const p=mesh.getVerticesData('position')!,n=mesh.getVerticesData('normal')!,uv=new Float32Array(p.length/3*2);
    for(let i=0;i<p.length;i+=3){
      const nx=Math.abs(n[i]),ny=Math.abs(n[i+1]),nz=Math.abs(n[i+2]);
      uv[i/3*2]=(ny>nx&&ny>nz?p[i]:nx>nz?p[i+2]:p[i])/.9;
      uv[i/3*2+1]=(ny>nx&&ny>nz?p[i+2]:p[i+1])/.9;
    }
    mesh.setVerticesData('uv2',uv);
    if(mat!==gold||!pads)continue;
    const foilIndices:number[]=[],padIndices:number[]=[],indices=mesh.getIndices()!;
    for(let i=0;i<indices.length;i+=3){
      const target=Math.max(p[indices[i]*3+1],p[indices[i+1]*3+1],p[indices[i+2]*3+1])<.45?padIndices:foilIndices;
      target.push(indices[i],indices[i+1],indices[i+2]);
    }
    if(!padIndices.length)continue;
    mesh.setIndices([...foilIndices,...padIndices]);mesh.releaseSubMeshes();
    const multi=new MultiMaterial('eagleFoilAndFootpads',scene);multi.subMaterials=[gold,pads];mesh.material=multi;
    new SubMesh(0,0,mesh.getTotalVertices(),0,foilIndices.length,mesh);
    new SubMesh(1,0,mesh.getTotalVertices(),foilIndices.length,padIndices.length,mesh);
  }
}
