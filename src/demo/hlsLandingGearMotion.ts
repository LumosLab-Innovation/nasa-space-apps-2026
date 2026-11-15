/** Inferred game mechanism, not HLS flight hardware. t=0 flight; t=1 deployed. */
export const GEAR_DURATION=7;
const stage=(t:number,a:number,b:number)=>{
 const x=Math.max(0,Math.min(1,(t-a)/(b-a)));
 return x*x*x*(x*(x*6-15)+10);
};
export function landingGearPose(t:number){return {door:stage(t,0,.22),leg:stage(t,.22,.78),foot:stage(t,.78,1)};}
export function stepLandingGear(state:{position:number;velocity:number},target:0|1,dt:number){
 if(dt<=0)return {...state};
 const acceleration=.65,limit=1/GEAR_DURATION;
 const desired=(target===1?1:-1)*Math.min(limit,Math.sqrt(2*acceleration*Math.abs(target-state.position)));
 const velocity=state.velocity+Math.max(-acceleration*dt,Math.min(acceleration*dt,desired-state.velocity));
 const position=state.position+(state.velocity+velocity)*.5*dt;
 if(position<=0)return {position:0,velocity:0};if(position>=1)return {position:1,velocity:0};
 return {position,velocity};
}
