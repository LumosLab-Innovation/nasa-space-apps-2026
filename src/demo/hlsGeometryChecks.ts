import { type AbstractMesh,Vector3 } from '@babylonjs/core';

/** Local bounds per disconnected geometric component, welding split normal/UV vertices.
 * Avoids treating the empty space between the housing and its outboard winches as solid.
 */
export function componentBounds(mesh:AbstractMesh):Vector3[][]{
 const positions=mesh.getVerticesData('position')!,indices=mesh.getIndices()!;
 const parents=Array.from({length:positions.length/3},(_,i)=>i);
 const find=(i:number):number=>parents[i]===i?i:(parents[i]=find(parents[i]));
 const union=(a:number,b:number)=>{parents[find(a)]=find(b);};
 const welded=new Map<string,number>();
 for(let i=0;i<parents.length;i++){
  const key=[positions[i*3],positions[i*3+1],positions[i*3+2]].map(v=>v.toFixed(5)).join(',');
  const previous=welded.get(key);if(previous!==undefined)union(i,previous);else welded.set(key,i);
 }
 for(let i=0;i<indices.length;i+=3){union(indices[i],indices[i+1]);union(indices[i],indices[i+2]);}
 const groups=new Map<number,Vector3[]>();
 for(let i=0;i<parents.length;i++){const key=find(i),group=groups.get(key)??[];group.push(Vector3.FromArray(positions,i*3));groups.set(key,group);}
 return [...groups.values()].map(points=>{
  const min=points[0].clone(),max=min.clone();for(const p of points){min.minimizeInPlace(p);max.maximizeInPlace(p);}
  return Array.from({length:8},(_,i)=>new Vector3(i&1?max.x:min.x,i&2?max.y:min.y,i&4?max.z:min.z));
 });
}
