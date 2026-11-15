/** Art-directed, time-compressed mechanism; not a NASA engineering simulation. */
export const ELEVATOR_DURATION = 12;
const clamp = (x:number) => Math.max(0,Math.min(1,x));
const stage = (t:number,a:number,b:number) => {
 const x=clamp((t-a)/(b-a));
 return x*x*x*(x*(x*6-15)+10);
};
export function elevatorPose(t:number){
 return {support:stage(t,0,.18),floor:stage(t,.18,.36),guards:stage(t,.36,.52),lower:stage(t,.52,1)};
}
export function guardPose(t:number){
 return {front:stage(t,.36,.44),sides:stage(t,.44,.52)};
}
export type ElevatorMotion={position:number;velocity:number};
/** Velocity-limited reversal avoids an instantaneous direction flip mid-stroke. */
export function stepElevatorMotion(state:ElevatorMotion,target:0|1,dt:number):ElevatorMotion{
 if(dt<=0)return {...state};
 const limit=1/ELEVATOR_DURATION,acceleration=.45;
 const desired=(target===1?1:-1)*Math.min(limit,Math.sqrt(2*acceleration*Math.abs(target-state.position)));
 const velocity=state.velocity+Math.max(-acceleration*dt,Math.min(acceleration*dt,desired-state.velocity));
 const position=state.position+(state.velocity+velocity)*.5*dt;
 if(position<=0)return {position:0,velocity:0};
 if(position>=1)return {position:1,velocity:0};
 return {position,velocity};
}
export function advanceElevator(t:number,target:0|1,dt:number){
 const step=Math.max(0,dt)/ELEVATOR_DURATION;
 return target===1?Math.min(1,t+step):Math.max(0,t-step);
}
