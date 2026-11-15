import {expect,it} from 'vitest';
import {touchdownSamples} from '../src/audio/touchdownSound';

it('makes a short quiet impact with silent edges and a fading tail',()=>{
 const rate=24000,s=touchdownSamples(rate);
 expect(s.length).toBe(Math.round(rate*.55));
 expect(s[0]).toBe(0);expect(s[s.length-1]).toBe(0);
 let peak=0;for(const v of s){expect(Number.isFinite(v)).toBe(true);peak=Math.max(peak,Math.abs(v));}
 expect(peak).toBeGreaterThan(.04);expect(peak).toBeLessThanOrEqual(.16);
 const rms=(start:number,end:number)=>Math.sqrt(s.slice(start*rate,end*rate).reduce((a,v)=>a+v*v,0)/((end-start)*rate));
 expect(rms(.4,.5)).toBeLessThan(rms(.03,.13)*.15);
});
