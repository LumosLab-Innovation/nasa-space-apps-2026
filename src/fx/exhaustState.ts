import { Quaternion, Vector3 } from '@babylonjs/core/Maths/math.vector';
const clamp=(v:number,a=0,b=1)=>Math.max(a,Math.min(b,v));
const smooth=(v:number)=>{const t=clamp(v);return t*t*(3-2*t);};
export function nozzleLength(time:number,index:number){return [.84,1.04,.93,1.12,.9,1.01][index%6]*(1+.075*Math.sin(time*(2.1+index*.27)+index*2.3)+.025*Math.sin(time*7.3+index));}
export function auxiliaryPulse(t:number){let value=0;for(const [at,duration,level] of [[.72,.18,1],[1.23,.13,.8],[2.55,.11,.55]]){const u=(t-at)/duration;if(u>=0&&u<=1)value=Math.max(value,Math.min(1,u/.15,(1-u)/.2)*level);}const departure=.68*smooth((t-2.7)/.35)*(1-smooth((t-4.8)/.45));return Math.max(value,departure);}
/** Brake-entry clock is unwarped and pause-aware; only Orion's small auxiliaries fire. */
export function orionDeparturePower(stage:string,elapsed:number){return stage==='brake'?auxiliaryPulse(elapsed+.72):0;}
export function attitudePulse(time:number,magnitude:number){
 const period=.36,phase=time%period,width=clamp(.11+magnitude*.13,.11,.29);
 return magnitude>.012&&phase<width?clamp(Math.min(phase/.02,(width-phase)/.03))*clamp(.35+magnitude*2):0;
}
export type ExhaustSnapshot={time:number;power:number;contactTime:number;contactPower:number;previous:number[]|null;velocity:number[];demand:number[];pulse:number};
/** Visual only: no forces, fuel or camera writes. Time is real unpaused playback time. */
export class ExhaustState{
 time=0;power=0;contactTime=-1;contactPower=0;previous:Quaternion|null=null;velocity=Vector3.Zero();demand=Vector3.Zero();pulse=0;
 step(dt:number,throttle:number,orientation:Quaternion,active:boolean,contact:boolean){
  if(contact&&this.contactTime<0){this.contactTime=0;this.contactPower=this.power;}
  if(dt<=0)return;
  this.time+=dt;
  if(this.contactTime>=0){this.contactTime+=dt;this.power=this.contactPower*(1-smooth((this.contactTime-.4)/.8));}
  else this.power+=(clamp(throttle)-this.power)*(1-Math.exp(-dt*18));
  if(this.power<.0001)this.power=0;
  const current=orientation.normalizeToNew();
  if(this.previous&&active&&!contact){
   if(Quaternion.Dot(current,this.previous)<0)current.scaleInPlace(-1);
   const delta=this.previous.conjugate().multiply(current).normalize();
   const sin=Math.hypot(delta.x,delta.y,delta.z),angle=2*Math.atan2(sin,Math.max(0,delta.w));
   const rate=sin>1e-8?new Vector3(delta.x,delta.y,delta.z).scale(angle/(sin*dt)):Vector3.Zero();
   // Reject transform discontinuities on resets, not real bounded attitude changes.
   if(angle>.35){this.velocity.setAll(0);this.demand.setAll(0);}
   else{
    const filtered=Vector3.Lerp(this.velocity,rate,1-Math.exp(-dt*14));
    const acceleration=filtered.subtract(this.velocity).scale(1/dt);
    this.demand=Vector3.Lerp(this.demand,acceleration,1-Math.exp(-dt*12));this.velocity.copyFrom(filtered);
    if(this.demand.length()<.012)this.demand.setAll(0);
   }
  }else{this.velocity.setAll(0);this.demand.setAll(0);}
  this.previous=current;
  this.pulse=active&&!contact?attitudePulse(this.time,this.demand.length()):0;
 }
 snapshot():ExhaustSnapshot{return {time:this.time,power:this.power,contactTime:this.contactTime,contactPower:this.contactPower,previous:this.previous?.asArray()??null,velocity:this.velocity.asArray(),demand:this.demand.asArray(),pulse:this.pulse};}
 restore(s:ExhaustSnapshot){this.time=s.time;this.power=s.power;this.contactTime=s.contactTime;this.contactPower=s.contactPower;this.previous=s.previous?Quaternion.FromArray(s.previous):null;this.velocity.copyFromFloats(...s.velocity as [number,number,number]);this.demand.copyFromFloats(...s.demand as [number,number,number]);this.pulse=s.pulse;}
 reset(){this.restore(new ExhaustState().snapshot());}
}
