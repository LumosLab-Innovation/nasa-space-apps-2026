import { Color3, Constants, Mesh, MeshBuilder, RawTexture, Scene, StandardMaterial, Vector3, VertexBuffer } from '@babylonjs/core';

const LIFE = 7.8;
const fraction = (x:number) => x-Math.floor(x);
const random = (i:number) => fraction(Math.sin(i*127.1+311.7)*43758.5453);
const ease = (x:number) => {const t=Math.max(0,Math.min(1,x));return t*t*(3-2*t);};
function noise(x:number,y:number,z:number):number {
  const ix=Math.floor(x),iy=Math.floor(y),iz=Math.floor(z),a=ease(x-ix),b=ease(y-iy),c=ease(z-iz);
  const hash=(x:number,y:number,z:number)=>{let n=Math.imul(x,374761393)^Math.imul(y,668265263)^Math.imul(z,2147483647);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295;};
  const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
  return mix(mix(mix(hash(ix,iy,iz),hash(ix+1,iy,iz),a),mix(hash(ix,iy+1,iz),hash(ix+1,iy+1,iz),a),b),mix(mix(hash(ix,iy,iz+1),hash(ix+1,iy,iz+1),a),mix(hash(ix,iy+1,iz+1),hash(ix+1,iy+1,iz+1),a),b),c);
}
/** Four baked density projections. No network fetch or ray-marching on failure. */
function puffAtlas(scene:Scene):RawTexture {
  const cell=128,size=cell*2,pixels=new Uint8Array(size*size*4);
  for(let tile=0;tile<4;tile++)for(let y=0;y<cell;y++)for(let x=0;x<cell;x++){
    const nx=(x+.5-cell/2)/(cell/2),ny=(y+.5-cell/2)/(cell/2);
    let opacity=0,light=0;
    for(let k=0;k<12;k++){
      const z=1-(k+.5)/6,dist=Math.sqrt(nx*nx+ny*ny+z*z);
      const broad=noise(nx*3+tile*7,ny*3+11,z*3+17);
      const detail=noise(nx*10+3,ny*10+tile*13,z*10+9);
      const density=Math.max(0,.78-dist+(broad-.4)*.55+(detail-.5)*.10)*ease((1-dist)/.18);
      const alpha=1-Math.exp(-density*1.25),weight=alpha*(1-opacity);
      // Directional highlights and interior occlusion make each puff read as a volume.
      const shade=Math.max(.16,Math.min(.88,.36+.28*z-.24*ny-.12*nx+detail*.16-opacity*.13));
      light+=weight*shade;opacity+=weight;
    }
    const index=((y+Math.floor(tile/2)*cell)*size+x+(tile%2)*cell)*4;
    const value=opacity>0?Math.round(light/opacity*255):0;
    pixels[index]=pixels[index+1]=pixels[index+2]=value;
    pixels[index+3]=Math.round(opacity*255);
  }
  const texture=RawTexture.CreateRGBATexture(pixels,size,size,scene,true,false);
  texture.hasAlpha=true;return texture;
}

/** Precompiled, reusable breakup: short hot core, dense expanding cloud, ballistic fragments. */
export class FlightExplosion {
  private readonly smoke:Mesh[]=[];
  private readonly hot:Mesh[]=[];
  private readonly fragments:Mesh[]=[];
  private readonly materials:StandardMaterial[]=[];
  private readonly texture:RawTexture;
  private readonly center=Vector3.Zero();
  private readonly velocity=Vector3.Zero();
  private radius=1;
  private age=LIFE;
  private disposed=false;
  private floor?: (x:number,z:number)=>number;
  constructor(private readonly scene:Scene){
    this.texture=puffAtlas(scene);
    const smoke=new StandardMaterial('failureSmokeMaterial',scene);
    smoke.diffuseTexture=this.texture;smoke.useAlphaFromDiffuseTexture=true;
    smoke.disableLighting=true;smoke.emissiveColor=new Color3(.95,.96,1);
    smoke.backFaceCulling=false;smoke.disableDepthWrite=true;
    smoke.transparencyMode=StandardMaterial.MATERIAL_ALPHABLEND;
    const fire=smoke.clone('failureFlashMaterial');
    fire.emissiveColor=new Color3(3.2,1.05,.22);fire.alphaMode=Constants.ALPHA_ADD;
    const metal=new StandardMaterial('failureFragmentMaterial',scene);
    metal.diffuseColor=new Color3(.44,.46,.49);metal.emissiveColor=new Color3(.14,.14,.14);metal.specularColor=new Color3(.3,.3,.3);
    this.materials.push(smoke,fire,metal);
    for(let i=0;i<46;i++){
      const hot=i>=38,mesh=MeshBuilder.CreatePlane(hot?`failureFlash${i-38}`:`failureSmoke${i}`,{size:1},scene);
      const cell=i%4,u=(cell%2)*.5,v=Math.floor(cell/2)*.5;
      mesh.setVerticesData(VertexBuffer.UVKind,[u,v,u+.5,v,u+.5,v+.5,u,v+.5]);
      mesh.billboardMode=Mesh.BILLBOARDMODE_ALL;mesh.material=hot?fire:smoke;
      (hot?this.hot:this.smoke).push(mesh);
    }
    for(let i=0;i<26;i++){
      // Curved hull slivers plus narrow structural ribs, rather than identical cubes.
      const mesh=i%3===0?MeshBuilder.CreateBox(`failureFragment${i}`,{width:.15,height:1,depth:.10},scene):MeshBuilder.CreateCylinder(`failureFragment${i}`,{diameter:1,height:.65,arc:.2,tessellation:8,cap:Mesh.NO_CAP,sideOrientation:Mesh.DOUBLESIDE},scene);
      mesh.material=metal;this.fragments.push(mesh);
    }
    for(const mesh of this.meshes){mesh.isPickable=false;mesh.setEnabled(false);}
    scene.onDisposeObservable.addOnce(()=>this.dispose());
  }
  private get meshes():Mesh[]{return [...this.smoke,...this.hot,...this.fragments];}
  get activeCount():number{return this.meshes.filter(m=>m.isEnabled()).length;}
  async warm():Promise<void>{await Promise.all(this.materials.map((mat,i)=>mat.forceCompilationAsync([this.smoke[0],this.hot[0],this.fragments[0]][i])));}
  start(center:Vector3,radius:number,velocity=Vector3.Zero(),floor?:(x:number,z:number)=>number):void{
    if(this.disposed)return;
    this.reset();this.center.copyFrom(center);this.velocity.copyFrom(velocity);this.radius=Math.max(.001,radius);this.floor=floor;this.age=0;this.update(0);
  }
  update(dt:number):void{
    if(this.disposed)return;
    this.age=Math.min(LIFE,this.age+Math.max(0,dt));
    const t=this.age,r=this.radius;
    if(t>=LIFE){this.reset();return;}
    const origin=this.center.add(this.velocity.scale(t));
    this.smoke.forEach((mesh,i)=>{
      const delay=.025+random(i+31)*.25,age=Math.max(0,t-delay);
      const life=5.4+random(i+2)*1.95;
      mesh.setEnabled(t>=delay&&age<life);
      // Seven uneven lobes leave sightlines between clouds for outgoing debris.
      const group=i%7;
      const angles=[.15,.9,1.8,2.8,4.05,4.55,5.6];
      const angle=angles[group]+(random(i+4)-.5)*.28;
      const vertical=(random(group+206)*1.6-.8)+(random(i+6)-.5)*.24;
      const speed=.8+random(group+207)*.8+(random(i+7)-.5)*.18;
      const spread=r*(.18+age*speed);
      mesh.position.set(origin.x+Math.cos(angle)*spread,origin.y+vertical*spread*.8,origin.z+Math.sin(angle)*spread);
      // Growth settles while centres keep separating: puffs do not merge into a solid sphere.
      const size=r*(.65+random(i+8)*.45+(1-Math.exp(-age*.9))*(1+random(i+9)*.45));
      mesh.scaling.set(size,size*(.75+random(i+10)*.5),size);
      mesh.rotation.z=angle+age*(random(i+11)-.5)*.18;
      const fadeAt=life*(.38+random(i+14)*.15);
      mesh.visibility=ease(age/.12)*(1-ease((age-fadeAt)/(life-fadeAt)))*(.62+random(i+13)*.23);
      if(this.floor)mesh.position.y=Math.max(mesh.position.y,this.floor(mesh.position.x,mesh.position.z)+size*.28);
    });
    this.hot.forEach((mesh,i)=>{
      const life=.3+random(i+50)*.55,age=t-i*.018;
      mesh.setEnabled(age>=0&&age<life);
      const a=i*2.39996,spread=Math.max(0,age)*r*.85;
      mesh.position.set(origin.x+Math.cos(a)*spread,origin.y+Math.sin(i*3.1)*spread*.6,origin.z+Math.sin(a)*spread);
      mesh.scaling.setAll(r*(1.05+Math.max(0,age)*3.4));mesh.rotation.z=a;
      mesh.visibility=Math.max(0,1-age/life)**1.5*.9;
    });
    this.fragments.forEach((mesh,i)=>{
      const life=4.7+random(i+90)*1.5,angle=random(i+100)*Math.PI*2,spread=r*t*(1.6+random(i+110)*2.4);
      mesh.setEnabled(t<life);
      mesh.position.set(origin.x+Math.cos(angle)*spread,origin.y+(random(i+120)*1.8-.9)*spread,origin.z+Math.sin(angle)*spread);
      if(this.floor)mesh.position.y=Math.max(mesh.position.y-.81*t*t,this.floor(mesh.position.x,mesh.position.z)+r*.05);
      mesh.rotation.set(t*(.5+random(i)*4),angle+t*2,-t*(.7+random(i+20)*2));
      const size=r*(.16+random(i+130)*.18);mesh.scaling.set(size,size*(.6+random(i+140)),size);
      mesh.visibility=1-ease((t-life+.8)/.8);
    });
  }
  reset():void{this.age=LIFE;for(const mesh of this.meshes)mesh.setEnabled(false);}
  dispose():void{if(this.disposed)return;this.disposed=true;for(const mesh of this.meshes)mesh.dispose();for(const mat of this.materials)mat.dispose();this.texture.dispose();}
}
