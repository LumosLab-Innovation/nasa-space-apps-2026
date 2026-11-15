export const smoother = (value:number) => {const t=Math.max(0,Math.min(1,value));return t*t*t*(10+t*(-15+6*t));};
/** Orbital rendering is in km. Stop exaggerating the 50 m craft before the low approach. */
export const flightScale=(heightM:number)=>.001+.099*smoother((heightM-1500)/13500);
/** Keep depth precision at wide burn-entry distances without clipping nearby hull/terrain. */
export const flightNearPlaneKm=(hullGapKm:number,terrainClearanceKm:number)=>
 Math.max(.0005,Math.min(.85,hullGapKm*.2,terrainClearanceKm*.2));
/** Ground-relative bottom of a conservative cylinder, not the old orbit origin six km behind the ship. */
export function hullClearanceLift(heightM:number,rootClearanceM:number,lengthM:number,radiusM:number,axisCos:number,modelScale:number){
 const c=Math.max(-1,Math.min(1,axisCos));
 const extent=(lengthM*.5*Math.abs(c)+radiusM*Math.sqrt(1-c*c))*modelScale*1000;
 return heightM+extent-rootClearanceM;
}
/** Manual mode gives the player time to react; automatic playback keeps its existing pace. */
export const flightWarp=(elapsed:number,heightM:number,automatic=true)=>1+(automatic?9:3)*smoother(elapsed/5)*smoother((heightM-1200)/1000);

/** Visual extension only: preserve boundary height AND slope, then meet the original orbital DEM. */
export function continueTerrainHeight(x:number,z:number,sample:(x:number,z:number)=>number,far:(x:number,z:number)=>number,half=750){
 const bx=Math.max(-half,Math.min(half,x)),bz=Math.max(-half,Math.min(half,z));
 const dx=x-bx,dz=z-bz,distance=Math.max(Math.abs(dx),Math.abs(dz));
 const left=Math.max(-half,bx-3),right=Math.min(half,bx+3),back=Math.max(-half,bz-3),front=Math.min(half,bz+3);
 const gx=(sample(right,bz)-sample(left,bz))/(right-left),gz=(sample(bx,front)-sample(bx,back))/(front-back);
 // Gradually remove metre-scale edge noise instead of stretching each bump into a kilometre-long ridge.
 const blur=160*smoother(distance/500);
 let base=0;
 for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++)base+=sample(Math.max(-half,Math.min(half,bx+i*blur)),Math.max(-half,Math.min(half,bz+j*blur)))*(i===0?2:1)*(j===0?2:1)/16;
 const near=base+(gx*8*Math.tanh(dx/8)+gz*8*Math.tanh(dz/8))*(1-smoother(distance/80));
 return near+(far(x,z)-near)*smoother(distance/2000);
}
