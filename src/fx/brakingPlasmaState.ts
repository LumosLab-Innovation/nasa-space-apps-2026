const smooth=(value:number)=>{const x=Math.max(0,Math.min(1,value));return x*x*(3-2*x);};

/** Cinematic envelope, measured in unwarped, unpaused gameplay seconds. */
export class BrakingPlasmaState {
  time=0;
  power=0;
  private started=false;
  private fadeTime:number|undefined;
  update(dt:number,braking:boolean,altitudeM:number,throttle:number){
    if(!braking){this.power=0;return;}
    if(!this.started){
      if(throttle<=0||altitudeM>13000||altitudeM<=1100)return;
      this.started=true;
    }
    const seconds=Math.max(0,dt);
    this.time+=seconds;
    if(altitudeM<=1100)this.fadeTime??=0;
    if(this.fadeTime!==undefined)this.fadeTime+=seconds;
    this.power=smooth(this.time/1.2)*(1-smooth((this.fadeTime??0)/2));
  }
}
