import { Color3,HemisphericLight,Matrix,Mesh,Quaternion,Vector3,Vector4,VertexData, type ShaderMaterial } from '@babylonjs/core';
import type { SurfaceWorld } from '../scenes/surfaceScene';
import { createOrbitalMoon } from '../world/orbitalMoon';
import { ORBIT_SUN_LON,readOrbitalElevation,renderedTerrainClearance,renderedSurfaceRadius } from '../world/orbitalTerrain';
import { latLonToSphere } from './moonMath';
import { sampleHeight } from '../data/heightmap';
import {continueTerrainHeight} from './descentGeometry';
import { MOON_TEXTURE,MOON_DETAIL_TEXTURE,MOON_RELIEF_TEXTURE,MOON_ELEVATION,missionFile,type MissionFiles } from '../scenes/missionAssets';

/** Reuse the approved spherical NASA mesh outside the unchanged playable core. No replacement polar UV mesh. */
export async function prepareDescentBackdrop(world:SurfaceWorld,files:MissionFiles){
 const scene=world.scene,elevation=await readOrbitalElevation(missionFile(files,MOON_ELEVATION));
 const p=latLonToSphere(0,ORBIT_SUN_LON,1),sun=new Vector3(p.x,p.y,p.z);
 const moon=await createOrbitalMoon(scene,missionFile(files,MOON_TEXTURE),missionFile(files,MOON_DETAIL_TEXTURE),missionFile(files,MOON_RELIEF_TEXTURE),elevation,sun);
 moon.unfreezeWorldMatrix();moon.name='descentMoonBackdrop';
 const material=moon.material as ShaderMaterial;
 material.setVector4('localCutout',new Vector4(0,0,12000,1));
 const fill=new HemisphericLight('descentFill',Vector3.Up(),scene);fill.intensity=0;
 const collar=new Mesh('descentTerrainCollar',scene),n=512,perimeter=n*4,radii=Array.from({length:49},(_,i)=>750+11250*(i/48)**2);
 const positions=new Float32Array(perimeter*radii.length*3),indices:number[]=[],normals=new Float32Array(positions.length);
 for(let ring=0;ring<radii.length-1;ring++)for(let i=0;i<perimeter;i++){const a=ring*perimeter+i,b=ring*perimeter+(i+1)%perimeter,c=a+perimeter,d=b+perimeter;indices.push(a,c,b,b,c,d);}
 const data=new VertexData();data.positions=positions;data.indices=indices;data.normals=normals;data.applyToMesh(collar,true);
 const core=scene.getMeshByName('terrain')!,originalMaterial=core.material;
 const localMaterial=material.clone('descentRegolith');localMaterial.setVector4('localCutout',new Vector4(0,0,0,0));localMaterial.setFloat('geographicUv',1);
 collar.setVerticesData('uv',new Float32Array(positions.length/3*2));collar.material=localMaterial;collar.isPickable=false;
 // Compile the exact shaders/buffers under the initial loading screen.
 await Promise.all([material.forceCompilationAsync(moon),localMaterial.forceCompilationAsync(core),localMaterial.forceCompilationAsync(collar)]);
 moon.setEnabled(false);collar.setEnabled(false);
 let active=false;
 scene.onBeforeRenderObservable.add(()=>{
   if(active&&!world.descent){moon.setEnabled(false);collar.setEnabled(false);core.material=originalMaterial;fill.intensity=0;world.sky.cinematicSun=null;active=false;}
 });
 const controller={
  async configure(origin:Vector3,basis:Quaternion,landing:Vector3){
   const inverse=Matrix.Compose(Vector3.One(),basis.conjugate(),Vector3.Zero());
   const rotation=Matrix.Compose(Vector3.One(),basis,Vector3.Zero());
   const sourceFrame=Matrix.Compose(new Vector3(.001,.001,.001),basis,origin.subtract(Vector3.TransformNormal(landing.scale(.001),rotation)));
   const toWorld=(v:Vector3)=>origin.add(Vector3.TransformNormal(v.subtract(landing).scale(.001),rotation));
   let k=0;
   for(const radius of radii){
    if(scene.isDisposed||!world.descent?.cinematic)return;
    for(let side=0;side<4;side++)for(let j=0;j<n;j++){
    const v=-radius+2*radius*j/n;
    const [x,z]=side===0?[v,-radius]:side===1?[radius,v]:side===2?[-v,radius]:[-radius,-v];

    const probe=toWorld(new Vector3(x,0,z));
    // Height of the preserved spherical DEM expressed in the destination's tangent frame.
    const far=-renderedTerrainClearance(probe,elevation)*1000;
    positions[k++]=x;positions[k++]=continueTerrainHeight(x,z,(a,b)=>sampleHeight(world.hm,a,b),()=>far);positions[k++]=z;
   }
    await new Promise<void>(resolve=>setTimeout(resolve,0));
   }
   if(scene.isDisposed||!world.descent?.cinematic)return;
   VertexData.ComputeNormals(positions,indices,normals);collar.updateVerticesData('position',positions);collar.updateVerticesData('normal',normals);collar.refreshBoundingInfo();
   const coreNormals=core.getVerticesData('normal')!;
   for(let i=0;i<perimeter;i++){const x=positions[i*3],z=positions[i*3+2],c=Math.round((x/1500+.5)*(world.hm.size-1)),r=Math.round((z/1500+.5)*(world.hm.size-1)),index=(r*world.hm.size+c)*3;normals.set([coreNormals[index],coreNormals[index+1],coreNormals[index+2]],i*3);}
   collar.updateVerticesData('normal',normals);
   localMaterial.setMatrix('sourceFrame',sourceFrame);core.material=localMaterial;
   moon.scaling.setAll(1000);moon.rotationQuaternion=basis.conjugate();moon.position.copyFrom(landing.subtract(Vector3.TransformNormal(origin.scale(1000),inverse)));moon.computeWorldMatrix(true);
   world.sky.cinematicSun={direction:Vector3.TransformNormal(sun.scale(-1),inverse),intensity:1.6};world.sky.update();fill.intensity=.12;fill.diffuse=Color3.White();
   moon.setEnabled(true);collar.setEnabled(true);active=true;
  },
 };
 // Warm the actual backdrop, local material and additional lighting together, not only their shaders in isolation.
 const point=latLonToSphere(0,23.473,renderedSurfaceRadius(0,23.473,elevation)),origin=new Vector3(point.x,point.y,point.z);
 const up=origin.normalizeToNew(),x=Vector3.Up(),z=Vector3.Cross(x,up).normalize();
 const basis=Quaternion.FromRotationMatrix(Matrix.FromValues(x.x,x.y,x.z,0,up.x,up.y,up.z,0,z.x,z.y,z.z,0,0,0,0,1));
 await controller.configure(origin,basis,world.hlsRig.parent.position.subtract(new Vector3(0,300,0)));
 await world.hlsRig.warm();
 scene.render();await scene.whenReadyAsync();scene.render();
 return controller;
}
