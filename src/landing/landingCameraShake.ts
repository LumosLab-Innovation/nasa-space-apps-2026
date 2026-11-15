const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const ease=(v:number)=>{const t=clamp(v);return t*t*(3-2*t);};

/** Visual-only displacement in camera-plane metres; independent of simulation time warp. */
export class LandingCameraShake {
 private time=0;
 private contactTime=-1;
 private approachAmplitude=0;
 private contactAmplitude=0;
 private current={x:0,y:0};

 step(dt:number,height:number,throttle:number,contact:boolean):{x:number;y:number} {
  if(dt<=0)return this.current;
  this.time+=dt;
  if(contact&&this.contactTime<0){this.contactTime=0;this.contactAmplitude=this.approachAmplitude;}
  let amplitude:number;
  if(this.contactTime>=0){
   this.contactTime+=dt;
   const t=this.contactTime;
   amplitude=this.contactAmplitude*(1-ease(t/.4))+.50*ease(t/.06)*(1-ease(t/1.1));
  }else{
   amplitude=.14*ease((20-height)/20)*clamp(throttle);
   this.approachAmplitude=amplitude;
  }
  if(amplitude===0)return this.current={x:0,y:0};
  const t=this.time*Math.PI*2;
  return this.current={
   x:amplitude*(.65*Math.sin(t*7.3)+.35*Math.sin(t*11.7)),
   y:amplitude*(.65*Math.sin(t*8.9+.6)+.35*Math.sin(t*13.1+1.4)),
  };
 }

 reset():void {
  this.time=0;this.contactTime=-1;this.approachAmplitude=this.contactAmplitude=0;
  this.current={x:0,y:0};
 }
}
