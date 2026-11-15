import {
  Color3, LoadAssetContainerAsync, DirectionalLight, DynamicTexture, HemisphericLight, Mesh, MeshBuilder, Quaternion,
  Scene, ShadowGenerator, StandardMaterial, TransformNode, Vector3, VertexData, Texture,
} from '@babylonjs/core';
import { heritageGroundHeight as groundHeight, heritageGroundAxis, HERITAGE_SUBDIVISIONS, sampleHeritageGround } from './heritageGround';
import { finishEagleMaterials } from './eagleMaterials';
import { HERITAGE_LAYER } from '../landing/apolloHeritageShot';

/** Metre-scale illustrative diorama. Kept near the origin, away from kilometre-scale orbital geometry. */
export async function createApolloHeritage(scene: Scene, sunDirection: Vector3, modelBytes: ArrayBuffer) {
  const root=new TransformNode('apolloHeritage',scene);
  let seed=19690720;
  const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const material=(name: string,hex: string,spec=0)=>{
    const m=new StandardMaterial(name,scene);m.diffuseColor=Color3.FromHexString(hex);
    m.specularColor=new Color3(spec,spec,spec);m.specularPower=48;return m;
  };
  const metal=material('eagleAluminium','#93999c',.65);
  const mount=(m: Mesh,mat: StandardMaterial)=>{m.parent=root;m.material=mat;m.layerMask=HERITAGE_LAYER;m.isPickable=false;return m;};
  const cylinder=(name:string,r:number,h:number,x:number,y:number,z:number,mat:StandardMaterial,n=24)=>{
    const m=mount(MeshBuilder.CreateCylinder(name,{diameter:r*2,height:h,tessellation:n},scene),mat);m.position.set(x,y,z);return m;
  };
  const strut=(name:string,a:Vector3,b:Vector3,r:number,mat:StandardMaterial)=>{
    const m=cylinder(name,r,Vector3.Distance(a,b),0,0,0,mat,12);
    m.position.copyFrom(a.add(b).scale(.5));
    const dir=b.subtract(a).normalize(),axis=Vector3.Cross(Vector3.Up(),dir);
    m.rotationQuaternion=axis.lengthSquared()<1e-10?Quaternion.Identity():Quaternion.RotationAxis(axis.normalize(),Math.acos(Math.max(-1,Math.min(1,dir.y))));
    return m;
  };

  // Official NASA/Michael D. Carbajal model, prepared offline with the ascent stage removed.
  const container=await LoadAssetContainerAsync(new Uint8Array(modelBytes),scene,{pluginExtension:'.glb',name:'apollo11-descent.glb'});
  container.addAllToScene();
  for(const node of container.rootNodes)node.parent=root;
  const eaglePivot=new TransformNode('eagleOrientation',scene);eaglePivot.parent=root;eaglePivot.rotation.y=Math.PI;
  for(const node of container.rootNodes)node.parent=eaglePivot;
  for(const mesh of container.meshes){mesh.layerMask=HERITAGE_LAYER;mesh.isPickable=false;}
  finishEagleMaterials(scene,container);

  const ground=MeshBuilder.CreateGround('heritageGround',{width:1200,height:1200,subdivisions:HERITAGE_SUBDIVISIONS,updatable:true},scene);
  const gp=ground.getVerticesData('position')!,detailUv=new Float32Array(gp.length/3*2);
  for(let i=0;i<gp.length;i+=3){
    gp[i]=heritageGroundAxis(gp[i]/600);gp[i+2]=heritageGroundAxis(gp[i+2]/600);
    gp[i+1]=groundHeight(gp[i],gp[i+2]);
    detailUv[i/3*2]=gp[i]/3;detailUv[i/3*2+1]=gp[i+2]/3;
  }
  ground.updateVerticesData('position',gp);ground.setVerticesData('uv2',detailUv);ground.refreshBoundingInfo();
  const normals:number[]=[];VertexData.ComputeNormals(gp,ground.getIndices()!,normals);ground.updateVerticesData('normal',normals);
  const regolith=material('heritageRegolith','#FFFFFF',0);
  const size=2048,dust=new DynamicTexture('heritageDust',size,scene,true),dc=dust.getContext();
  const normalSize=512,relief=new DynamicTexture('heritageGrainNormals',normalSize,scene,true),rc=relief.getContext();
  const pixels=dc.getImageData(0,0,size,size),np=rc.getImageData(0,0,normalSize,normalSize),heights=new Float32Array(normalSize*normalSize);
  // Periodic value noise avoids directional stripes and repeats seamlessly at tile boundaries.
  const noise=(x:number,y:number,cells:number)=>{
    const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy;
    const sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy);
    const hash=(a:number,b:number)=>{
      let n=Math.imul((a%cells+cells)%cells,374761393)^Math.imul((b%cells+cells)%cells,668265263)^1969;
      n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295;
    };
    const top=hash(ix,iy)*(1-sx)+hash(ix+1,iy)*sx,bottom=hash(ix,iy+1)*(1-sx)+hash(ix+1,iy+1)*sx;
    return (top*(1-sy)+bottom*sy)*2-1;
  };
  // One unique, quiet albedo map across the complete mesh UV domain, never tiled.
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const subtle=noise(x/size*69,y/size*69,69)*3+noise(x/size*211,y/size*211,211)*2;
    const value=94+subtle+(rand()-.5)*10,i=(y*size+x)*4;
    pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=Math.round(value);pixels.data[i+3]=255;
  }
  // A separate UV channel keeps fine grains physically small across the uneven ground grid.
  for(let y=0;y<normalSize;y++)for(let x=0;x<normalSize;x++){
    heights[y*normalSize+x]=noise(x/normalSize*64,y/normalSize*64,64)*.25+(rand()-.5)*.18;
  }
  for(let y=0;y<normalSize;y++)for(let x=0;x<normalSize;x++){
    const dx=(heights[y*normalSize+(x+1)%normalSize]-heights[y*normalSize+(x+normalSize-1)%normalSize]);
    const dy=(heights[((y+1)%normalSize)*normalSize+x]-heights[((y+normalSize-1)%normalSize)*normalSize+x]);
    const length=Math.hypot(dx,dy,1),i=(y*normalSize+x)*4;
    np.data[i]=Math.round(127.5*(1-dx/length));np.data[i+1]=Math.round(127.5*(1-dy/length));np.data[i+2]=Math.round(127.5*(1+1/length));np.data[i+3]=255;
  }
  dc.putImageData(pixels,0,0);rc.putImageData(np,0,0);dust.update(false);relief.update(false);
  dust.wrapU=dust.wrapV=Texture.CLAMP_ADDRESSMODE;
  relief.wrapU=relief.wrapV=Texture.WRAP_ADDRESSMODE;relief.coordinatesIndex=1;
  dust.anisotropicFilteringLevel=relief.anisotropicFilteringLevel=8;
  regolith.diffuseTexture=dust;regolith.bumpTexture=relief;relief.level=.3;
  mount(ground,regolith);ground.receiveShadows=true;

  // Low-poly rocks are illustrative micro-detail, not falsely inferred from the orbital DEM.
  const rockMat=material('heritageRocks','#67686a',0);
  for(let i=0;i<85;i++){
    const x=(rand()-.5)*75,z=(rand()-.5)*75;
    if(Math.hypot(x,z)<8)continue;
    const size=.09+rand()*.35;
    const rock=mount(MeshBuilder.CreatePolyhedron('heritageRock'+i,{type:1,size},scene),rockMat);
    rock.position.set(x,sampleHeritageGround(gp,x,z)+size*.2,z);rock.scaling.set(1,.4+rand()*.35,1);rock.rotation.set(rand(),rand()*6,rand());
  }

  // Footprint atlas: a shallow dark sole, alternating tread ridges and a defined heel.
  const boot=new DynamicTexture('apolloBootprint',{width:96,height:192},scene,true),bc=boot.getContext();
  bc.clearRect(0,0,96,192);bc.fillStyle='rgba(32,31,30,.86)';bc.beginPath();
  bc.moveTo(25,181);bc.lineTo(17,139);bc.lineTo(17,57);bc.quadraticCurveTo(17,8,48,8);bc.quadraticCurveTo(79,8,79,57);bc.lineTo(76,139);bc.lineTo(69,181);bc.closePath();bc.fill();
  bc.strokeStyle='rgba(185,182,176,.9)';bc.lineWidth=5;
  for(let y=35;y<137;y+=12){bc.beginPath();bc.moveTo(25,y);bc.lineTo(71,y+2);bc.stroke();}
  bc.strokeRect(28,149,37,23);bc.strokeStyle='rgba(158,155,150,.72)';bc.lineWidth=3;bc.beginPath();bc.moveTo(25,179);bc.lineTo(18,139);bc.lineTo(18,57);bc.quadraticCurveTo(18,10,48,10);bc.quadraticCurveTo(78,10,78,57);bc.lineTo(75,139);bc.stroke();boot.hasAlpha=true;boot.update();
  const footprintMat=material('apolloFootprints','#FFFFFF',0);footprintMat.diffuseTexture=boot;footprintMat.useAlphaFromDiffuseTexture=true;footprintMat.zOffset=-1;
  const fp:number[]=[],fu:number[]=[],fi:number[]=[];
  const paths=[[[0,-4.4],[-1,-7],[-4,-11],[-8,-17]],[[.1,-4.5],[-3,-4],[-5.8,1.4]],[[-3,-4],[-4,3],[2,6],[6,2]]];
  let step=0;
  for(const points of paths)for(let k=0;k<points.length-1;k++){
    const [ax,az]=points[k],[bx,bz]=points[k+1],len=Math.hypot(bx-ax,bz-az),dx=(bx-ax)/len,dz=(bz-az)/len;
    for(let s=.35;s<len;s+=.63){
      const sign=step++%2?1:-1,x=ax+dx*s+dz*sign*.14,z=az+dz*s-dx*sign*.14,base=fp.length/3;
      const across=4,along=8;
      for(let j=0;j<=along;j++)for(let i=0;i<=across;i++){
        const u=(i/across-.5)*.25,v=(j/along-.5)*.37;
        const xx=x+dz*u+dx*v,zz=z-dx*u+dz*v;fp.push(xx,sampleHeritageGround(gp,xx,zz)+.009,zz);
        fu.push(i/across,1-j/along);
        if(i<across&&j<along){const n=base+j*(across+1)+i;fi.push(n,n+1,n+across+2,n,n+across+2,n+across+1);}
      }
    }
  }
  const footMesh=mount(new Mesh('apolloFootprintTrails',scene),footprintMat),fd=new VertexData();
  fd.positions=fp;fd.indices=fi;fd.uvs=fu;const fn:number[]=[];VertexData.ComputeNormals(fp,fi,fn);fd.normals=fn;fd.applyToMesh(footMesh);
  footprintMat.backFaceCulling=false;footMesh.receiveShadows=true;footMesh.metadata={footprintCount:step,illustrative:true};

  // A commemorative reconstruction requested by the player; static folds, crossbar, no lunar wind.
  const flagOrigin=new Vector3(-6.2,sampleHeritageGround(gp,-6.2,1.5),1.5);
  cylinder('apolloFlagPole',.018,2.42,flagOrigin.x,flagOrigin.y+1.21,flagOrigin.z,metal,16);
  strut('apolloFlagCrossbar',flagOrigin.add(new Vector3(0,2.34,0)),flagOrigin.add(new Vector3(1.52,2.34,0)),.012,metal);
  const flagTexture=new DynamicTexture('apolloUSFlag',{width:760,height:400},scene,true),cc=flagTexture.getContext();
  for(let i=0;i<13;i++){cc.fillStyle=i%2?'#eeeae1':'#b22234';cc.fillRect(0,i*400/13,760,400/13+1);}
  cc.fillStyle='#3c3b6e';cc.fillRect(0,0,304,400*7/13);
  cc.fillStyle='#ffffff';
  for(let row=0;row<9;row++)for(let col=0;col<(row%2?5:6);col++){
    const cx=(row%2?50:25)+col*50,cy=13+row*23.5;
    cc.beginPath();for(let p=0;p<10;p++){const a=-Math.PI/2+p*Math.PI/5,r=p%2?3:7;const x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r;if(p===0)cc.moveTo(x,y);else cc.lineTo(x,y);}cc.closePath();cc.fill();
  }
  flagTexture.update(false);const cloth=material('apolloFlagCloth','#FFFFFF',.03);cloth.diffuseTexture=flagTexture;cloth.backFaceCulling=false;cloth.twoSidedLighting=true;cloth.emissiveColor=new Color3(.1,.1,.1);
  const flag=mount(new Mesh('apolloUSFlagCloth',scene),cloth),vd=new VertexData();const vp:number[]=[],vu:number[]=[],vi:number[]=[];
  for(let y=0;y<=12;y++)for(let x=0;x<=24;x++){
    const u=x/24,v=y/12;vp.push(flagOrigin.x+u*1.52,flagOrigin.y+2.34-v*.8,flagOrigin.z+.07*Math.sin(u*17+v*3)*Math.sin(v*Math.PI/2));vu.push(u,v);
    if(x<24&&y<12){const i=y*25+x;vi.push(i,i+25,i+1,i+1,i+25,i+26);}
  }
  vd.positions=vp;vd.indices=vi;vd.uvs=vu;const vn:number[]=[];VertexData.ComputeNormals(vp,vi,vn);vd.normals=vn;vd.applyToMesh(flag);
  flag.metadata={reconstruction:true,standingFlagIsIllustrative:true};

  const meshes=root.getChildMeshes();
  const key=new DirectionalLight('heritageSun',sunDirection.scale(-1),scene);key.intensity=2.4;key.position=sunDirection.scale(35);
  key.includedOnlyMeshes=meshes;key.shadowFrustumSize=35;key.shadowMinZ=.1;key.shadowMaxZ=80;
  const fill=new HemisphericLight('heritageFill',Vector3.Up(),scene);fill.intensity=.22;fill.includedOnlyMeshes=meshes;
  const shadows=new ShadowGenerator(2048,key);shadows.usePercentageCloserFiltering=true;shadows.bias=.00015;shadows.normalBias=.025;
  // The continuous 1.2 km ground receives prop shadows; exclude it as a caster to avoid PCF self-shadow striping.
  for(const m of meshes){m.receiveShadows=true;if(m!==ground&&m!==footMesh)shadows.addShadowCaster(m,false);}
  root.metadata={illustrative:true,units:'metres',hasStandingUSFlag:true};
  const setActive=(active:boolean)=>{root.setEnabled(active);key.setEnabled(active);fill.setEnabled(active);};
  setActive(false);
  return {root,meshes,setActive,flagOrigin};
}
