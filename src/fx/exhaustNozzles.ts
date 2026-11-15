import {Vector3} from '@babylonjs/core/Maths/math.vector';
export type ExhaustNozzle={position:Vector3;direction:Vector3;radius:number;kind:'main'|'rcs'|'aux'};
/** Inferred, flush game layout; not a certified HLS drawing. */
export function rcsNozzles():ExhaustNozzle[]{const jets:ExhaustNozzle[]=[];for(const y of [11,29])for(let k=0;k<4;k++)for(const sign of [-1,1]){const a=Math.PI/8+k*Math.PI/2;const radial=new Vector3(Math.cos(a),0,Math.sin(a)),tangent=new Vector3(-Math.sin(a),0,Math.cos(a)).scale(sign);jets.push({position:radial.scale(4.57).add(new Vector3(0,y,0)).add(tangent.scale(.22)),direction:tangent,radius:.12,kind:'rcs'});}return jets;}
const pairCache=new WeakMap<ExhaustNozzle[],{pair:[number,number];torque:Vector3}[]>();
export function selectRcsPair(jets:ExhaustNozzle[],demand:Vector3):[number,number]{
 let candidates=pairCache.get(jets);if(!candidates){candidates=[];const center=new Vector3(0,20,0);for(let i=0;i<jets.length;i++)for(let j=i+1;j<jets.length;j++){if(jets[i].direction.add(jets[j].direction).lengthSquared()>.001)continue;const torque=Vector3.Cross(jets[i].position.subtract(center),jets[i].direction.negate()).add(Vector3.Cross(jets[j].position.subtract(center),jets[j].direction.negate()));candidates.push({pair:[i,j],torque});}pairCache.set(jets,candidates);}
 let best=.00001,pair:[number,number]=[-1,-1];for(const c of candidates){const score=Vector3.Dot(c.torque,demand);if(score>best){best=score;pair=c.pair;}}return pair;
}
/** Blender +Z up becomes Babylon +Y, Blender +Y becomes Babylon -Z. */
export function orionAuxiliaries():ExhaustNozzle[]{return Array.from({length:8},(_,k)=>{const a=k*Math.PI/4+Math.PI/8;return {position:new Vector3(1.46*Math.cos(a),-2.20-1.45*.26,-1.46*Math.sin(a)),direction:Vector3.Down(),radius:.72*.26,kind:'aux'};});}
