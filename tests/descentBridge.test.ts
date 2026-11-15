import { describe, it, expect } from 'vitest';
import { bridgeSample, BRIDGE_SECONDS, BRIDGE_SWITCH_S } from '../src/landing/descentBridge';
describe('cinematic descent trajectory', () => {
  it('descends monotonically and hands off at the playable state, without a reset', () => {
    let previous=500;
    for(let t=0;t<=5;t+=.01){const s=bridgeSample(t);expect(s.h).toBeLessThanOrEqual(previous+1e-6);expect(s.h).toBeGreaterThanOrEqual(300);previous=s.h;}
    expect(bridgeSample(BRIDGE_SECONDS)).toMatchObject({h:300,vy:-12,vx:4,offset:0});
    expect(bridgeSample(0).h).toBe(500);
  });
  it('position derivatives match velocity at handoff',()=>{
    const e=.0001,a=bridgeSample(5-e),b=bridgeSample(5);
    expect((b.h-a.h)/e).toBeCloseTo(b.vy,1);
    expect((b.offset-a.offset)/e).toBeCloseTo(b.vx,1);
    expect(Math.abs(bridgeSample(BRIDGE_SWITCH_S).offset)).toBeLessThan(30);
  });
  it('clamps overshoot and supports a slightly lower threshold crossing',()=>{
    expect(bridgeSample(10,480)).toEqual(bridgeSample(5,480));
    expect(bridgeSample(-1,480).h).toBe(480);
  });
});
