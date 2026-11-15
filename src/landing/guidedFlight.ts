import { G_MOON, HLS, LAND } from './descent';

/** Metres, seconds, radians. y is height above a fixed local datum, not an animation parameter. */
export interface FlightState {
 x:number; y:number; vx:number; vy:number; fuelKg:number; throttle:number; pitch:number; t:number;
}
export interface FlightCommand { lightAssist?:boolean; assist:boolean; throttle:number; ground?:number; attitudeTimeScale?:number }
const clamp=(x:number,a:number,b:number)=>Math.max(a,Math.min(b,x));
const smooth=(x:number)=>{const u=clamp(x,0,1);return u*u*u*(10+u*(-15+6*u));};
export function nominalApproach(height:number) {
 // Integrate a(height) into speed², so position, speed and acceleration describe
 // the same ~20 s trajectory. Ease acceleration out before landing thrust tapers.
 const u=clamp((height-300)/120,0,1),ay=3.8*smooth(u);
 const integral=height>=420?height-360:120*(u**6-3*u**5+2.5*u**4);
 const speed=Math.sqrt(144+2*3.8*integral);
 return {vx:4+1.5*(speed-12),vy:-speed,ax:-1.5*ay,ay};
}
const hermite=(a:number,b:number,da:number,db:number,u:number,span:number)=>
 (2*u**3-3*u*u+1)*a+(u**3-2*u*u+u)*da*span+(-2*u**3+3*u*u)*b+(u**3-u*u)*db*span;
function referenceVelocity(h:number) {
 if(h<=1000)return nominalApproach(h);
 const highV=1680*(h/15000)**.8;
 const highVy=-(7/.8)*h/Math.max(highV,1);
 if(h>=4000)return {vx:highV,vy:highVy};
 const start=nominalApproach(1000),endV=1680*(4000/15000)**.8,endVy=-8.75*4000/endV;
 const u=(h-1000)/3000;
 return {
  vx:hermite(start.vx,endV,start.ax/start.vy,.8*endV/4000,u,3000),
  vy:hermite(start.vy,endVy,start.ay/start.vy,.2*endVy/4000,u,3000),
 };
}
export function flightReference(h:number) {
 if(h<=1000)return nominalApproach(h);
 const r=referenceVelocity(h),a=referenceVelocity(h-.05),b=referenceVelocity(h+.05);
 return {...r,ax:(b.vx-a.vx)/.1*r.vy,ay:(b.vy-a.vy)/.1*r.vy};
}
export const flightStart=():FlightState=>({x:0,y:15000,vx:1680,vy:0,fuelKg:HLS.fuelKg,throttle:0,pitch:Math.PI/2,t:0});
export const availableThrust=(h:number)=>LAND.thrustN+(HLS.maxThrustN-LAND.thrustN)*smooth((h-300)/80);

/** Bounded shared thrust vector. The reference asks; the integrator alone moves the craft. */
export function stepFlight(input:FlightState,command:FlightCommand,dt:number):FlightState {
 let s={...input},remaining=Math.max(0,dt);
 while(remaining>1e-9){
  const step=Math.min(remaining,1/120);remaining-=step;
  const ground=command.ground??0,clearance=s.y-ground;
  // The high burn follows a fixed flight datum, not each terrain triangle below it.
  // Blend into actual AGL guidance before the close approach; HUD/contact always use raw ground.
  const terrainWeight=smooth((4000-clearance)/2200);
  const ref=flightReference(s.y-ground*terrainWeight);
  const playerControlled=!!command.lightAssist&&!command.assist;
  const ax=Math.min(0,ref.ax+(playerControlled?0:.55*(ref.vx-s.vx)));
  const highWeight=smooth((clearance-4000)/1000);
  const attitudeScale=clamp(command.attitudeTimeScale??1,0,1);
  // vy is radial velocity. Adding local slope * orbital speed made crater edges demand
  // abrupt climbs/dives and swung the thrust vector, especially at x10 time acceleration.
  // High-burn velocity feedback must be slower than the attitude response; otherwise
  // a gentle slew would overshoot vertical speed and command repeated pitch reversals.
  const verticalGain=1.4*(1-highWeight)+.4*attitudeScale*highWeight;
  const ay=G_MOON+ref.ay+verticalGain*(ref.vy-s.vy);
  const highBurn=clearance>4000;
  // A near-zero vector has no useful pointing direction: keep the separation attitude.
  const targetPitch=highBurn&&Math.hypot(ax,Math.max(.05,ay))<.1?s.pitch:Math.atan2(-ax,Math.max(.05,ay));
  // Guidance runs at up to x10; attitude must still slew gently in playback time.
  // Integrate this same pitch into thrust so the visible hull and forces agree.
  const attitudeStep=step*attitudeScale;
  const maxTurn=(.65*(1-highWeight)+6*Math.PI/180*highWeight)*attitudeStep;
  const response=1-highWeight*Math.exp(-attitudeStep*2);
  const pitch=s.pitch+clamp((targetPitch-s.pitch)*response,-maxTurn,maxTurn);
  const mass=HLS.dryKg+s.fuelKg;
  const maxThrust=availableThrust(clearance);
  const automatic = clamp(Math.hypot(ax,Math.max(.05,ay))*mass/maxThrust,0,1);
  // Space controls the applied throttle directly, in unpaused playback seconds.
  // Attitude assistance must not silently pull speed back toward the reference.
  const playerThrottle=clamp(s.throttle+(command.throttle>.5?.12:-.10)*step*attitudeScale,0,1);
  const wanted=command.assist?automatic:clamp(command.throttle,0,1);
  const throttle=s.fuelKg<=0?0:playerControlled?playerThrottle
    :s.throttle+clamp(wanted-s.throttle,-.5*step,.5*step);
  const force=Math.min(throttle*maxThrust,s.fuelKg*HLS.ve/step);
  const vx=s.vx-Math.sin(pitch)*force/mass*step;
  const vy=s.vy+(Math.cos(pitch)*force/mass-G_MOON)*step;
  s={x:s.x+(s.vx+vx)*.5*step,y:s.y+(s.vy+vy)*.5*step,vx,vy,pitch,
   throttle:force/maxThrust,fuelKg:Math.max(0,s.fuelKg-force/HLS.ve*step),t:s.t+step};
 }
 return s;
}
