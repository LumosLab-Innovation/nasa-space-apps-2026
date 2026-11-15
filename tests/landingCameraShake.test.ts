import {expect,it} from 'vitest';
import {LandingCameraShake} from '../src/landing/landingCameraShake';

it('only shakes near the ground with thrust and remains bounded',()=>{
 const shake=new LandingCameraShake();
 expect(shake.step(.1,20,1,false)).toEqual({x:0,y:0});
 expect(shake.step(.1,5,0,false)).toEqual({x:0,y:0});
 let peak=0;
 for(let i=0;i<120;i++){const p=shake.step(1/60,0,1,false);peak=Math.max(peak,Math.hypot(p.x,p.y));expect(Math.abs(p.x)).toBeLessThanOrEqual(.14);expect(Math.abs(p.y)).toBeLessThanOrEqual(.14);}
 expect(peak).toBeGreaterThan(.04);
});
it('freezes exactly at zero dt, then settles to exact zero after contact',()=>{
 const shake=new LandingCameraShake();
 shake.step(.3,0,.6,false);
 const first=shake.step(.08,0,0,true);
 expect(shake.step(0,0,0,true)).toEqual(first);
 let peak=Math.hypot(first.x,first.y);
 for(let i=0;i<24;i++){const p=shake.step(1/60,0,0,true);peak=Math.max(peak,Math.hypot(p.x,p.y));expect(Math.abs(p.x)).toBeLessThanOrEqual(.64);expect(Math.abs(p.y)).toBeLessThanOrEqual(.64);}
 expect(peak).toBeGreaterThan(.1);
 expect(shake.step(1.1,0,0,true)).toEqual({x:0,y:0});
 expect(shake.step(.1,0,1,true)).toEqual({x:0,y:0});
});
it('resets between attempts without a leftover impulse',()=>{
 const shake=new LandingCameraShake();shake.step(.1,0,1,true);shake.reset();
 const clean=new LandingCameraShake();
 expect(shake.step(.1,15,.5,false)).toEqual(clean.step(.1,15,.5,false));
});
