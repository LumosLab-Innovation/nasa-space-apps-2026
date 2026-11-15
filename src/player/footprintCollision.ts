/** An on-foot exclusion zone: height-independent so the player cannot jump onto the rover. */
export interface Footprint { x:number; z:number; yaw:number; halfX:number; halfZ:number }
export interface XZ { x:number; z:number }
export interface FootprintContact extends XZ { contacts:XZ[] }
const SKIN=.001;

/** Sweep against an expanded oriented rectangle; then slide, rather than teleport across it. */
export function resolveFootprint(from:XZ,to:XZ,box:Footprint,padding:number):FootprintContact {
  const c=Math.cos(box.yaw),s=Math.sin(box.yaw);
  const local=(p:XZ)=>({x:(p.x-box.x)*c-(p.z-box.z)*s,z:(p.x-box.x)*s+(p.z-box.z)*c});
  const a=local(from),b=local(to),delta={x:b.x-a.x,z:b.z-a.z};
  const half={x:box.halfX+padding,z:box.halfZ+padding};
  const contacts:XZ[]=[];
  // Loading an old save, or towing MICA into the player, may start inside.
  if(Math.abs(a.x)<half.x&&Math.abs(a.z)<half.z){
    const axis=half.x-Math.abs(a.x)<half.z-Math.abs(a.z)?'x':'z';
    const sign=a[axis]<0?-1:1;
    a[axis]=sign*(half[axis]+SKIN);
    contacts.push(axis==='x'?{x:sign,z:0}:{x:0,z:sign});
  }
  for(let pass=0;pass<3;pass++){
    let near=-Infinity,far=Infinity,normal:XZ={x:0,z:0},miss=false;
    for(const axis of ['x','z'] as const){
      if(Math.abs(delta[axis])<1e-12){
        if(Math.abs(a[axis])>half[axis]){miss=true;break;}
        continue;
      }
      const t1=(-half[axis]-a[axis])/delta[axis],t2=(half[axis]-a[axis])/delta[axis];
      const entry=Math.min(t1,t2),exit=Math.max(t1,t2);
      if(entry>near){
        near=entry;const sign=delta[axis]>0?-1:1;
        normal=axis==='x'?{x:sign,z:0}:{x:0,z:sign};
      }
      far=Math.min(far,exit);
    }
    if(miss||near<0||near>1||near>far||far<0){a.x+=delta.x;a.z+=delta.z;break;}
    a.x+=delta.x*near+normal.x*SKIN;a.z+=delta.z*near+normal.z*SKIN;
    contacts.push(normal);
    delta.x*=1-near;delta.z*=1-near;
    const inward=delta.x*normal.x+delta.z*normal.z;
    if(inward<0){delta.x-=normal.x*inward;delta.z-=normal.z*inward;}
  }
  const rotate=(p:XZ)=>({x:p.x*c+p.z*s,z:-p.x*s+p.z*c});
  const world=rotate(a);
  return {x:world.x+box.x,z:world.z+box.z,contacts:contacts.map(rotate)};
}
