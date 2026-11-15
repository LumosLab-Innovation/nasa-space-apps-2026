/** Artistic metre-scale microterrain; not additional NASA DEM measurements. */
const smooth=(a:number,b:number,x:number)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
const hollows=[[-8.5,-5.6,2.1,.72],[3.4,-7.2,1.65,.52],[6.8,6.5,3,.85],[-8,7,3.4,.9],[11,-4,3.1,.8],[-14,-13,4.2,1.0],[1,14,2.7,.7]];
// Irregular shallow pocks around, rather than under, the lander.
for(let i=0;i<48;i++){
  const a=i*2.399963, r=7+((i*17)%29)*.72;
  hollows.push([Math.cos(a)*r,Math.sin(a)*r,.4+(i%5)*.16,.08+(i%4)*.035]);
}
export function heritageGroundHeight(x:number,z:number):number {
  const r=Math.hypot(x,z);
  let h=.18*Math.sin(x*.17+.7)*Math.cos(z*.21)+.07*Math.sin(x*.54+z*.38)+.018*Math.cos(x*1.17-z*.88);
  for(const [cx,cz,radius,depth] of hollows){
    const dx=x-cx,dz=z-cz,angle=Math.atan2(dz,dx);
    const d=Math.hypot(dx,dz)/(radius*(1+.07*Math.sin(angle*3+cx)));
    h-=depth*Math.exp(-Math.pow(d,4)*2.2);
    h+=depth*.24*Math.exp(-Math.pow((d-1)/.22,2));
  }
  // Preserve the engine clearance and the four NASA-model footpad contact areas.
  let support=smooth(1.8,2.6,r);
  for(const [px,pz] of [[4.25,0],[-4.25,0],[0,4.25],[0,-4.25]])support*=smooth(.7,1.3,Math.hypot(x-px,z-pz));
  return h*support*(1-smooth(45,100,r));
}
/** Allocate most vertices to the camera's 64 m neighbourhood; keep a continuous distant horizon. */
export function heritageGroundAxis(t:number):number {
  const a=Math.abs(t);
  return Math.sign(t)*(a<=.8?a*40:32+Math.pow((a-.8)/.2,2)*568);
}

export const HERITAGE_SUBDIVISIONS=320;
export function heritageGroundInverse(x:number):number {
  const a=Math.abs(x);return Math.sign(x)*(a<=32?a/40:.8+.2*Math.sqrt((a-32)/568));
}
/** Match Babylon's actual ground triangles, so decals never intersect a steep crater lip. */
export function sampleHeritageGround(positions:ArrayLike<number>,x:number,z:number):number {
  const n=HERITAGE_SUBDIVISIONS;
  const col=Math.max(0,Math.min(n-1,Math.floor((heritageGroundInverse(x)+1)*n/2)));
  const row=Math.max(0,Math.min(n-1,Math.floor((1-heritageGroundInverse(z))*n/2)));
  const a=(row*(n+1)+col)*3,b=a+3,c=a+(n+1)*3,d=c+3;
  const fx=(x-positions[a])/(positions[b]-positions[a]),fz=(positions[a+2]-z)/(positions[a+2]-positions[c+2]);
  return fx>=fz?positions[a+1]*(1-fx)+positions[b+1]*(fx-fz)+positions[d+1]*fz
    :positions[a+1]*(1-fz)+positions[c+1]*(fz-fx)+positions[d+1]*fx;
}
