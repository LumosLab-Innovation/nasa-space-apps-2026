import { describe, expect, it } from 'vitest';
import { assistedThrottle, assistedLandingInput, manualTouchdown, BrakingFailureMonitor, FailureAttempt, brakingBand } from '../src/landing/assistedFlight';
import { flightStart, stepFlight } from '../src/landing/guidedFlight';
import { landStart } from '../src/landing/descent';

describe('assisted manual control', () => {
  it('keeps player authority and limits feedback', () => {
    expect(assistedThrottle(.5, 1, true, .08)).toBeCloseTo(.76);
    expect(assistedThrottle(.5, 0, false, .08)).toBeCloseTo(.30);
  });
  it('recovers tilt gently and honours steering', () => {
    const state = { ...landStart(), tiltDeg: 10, vx: 3 };
    expect(assistedLandingInput(state, false, 0).tiltInput).toBeCloseTo(-3 / 8);
    expect(assistedLandingInput({ ...state, tiltDeg: 5 }, false, 1).tiltInput).toBeCloseTo(5 / 8);
    expect(assistedLandingInput({ ...state, fuelKg: 0 }, true, 0).throttle).toBe(0);
  });
  it('permits a gentle imperfect manual landing but rejects unsafe contact', () => {
    const s = { ...landStart(), h: 0, vy: -1.8, vx: 1.4, tiltDeg: 7 };
    expect(manualTouchdown(s)).toBe('ok');
    expect(manualTouchdown({ ...s, vy: -2.1 })).toBe('tooFast');
    expect(manualTouchdown({ ...s, tiltDeg: 9 })).toBe('tipped');
    expect(manualTouchdown({ ...s, h: .01 })).toBeNull();
    expect(brakingBand(4)).toEqual({ lo: 1, hi: 7 });
  });
});

describe('failure rules and first-attempt choice', () => {
  it.each([30, 60, 120])('gives grace and sustained correction time at %i FPS', fps => {
    const monitor = new BrakingFailureMonitor();
    let result: string | null = null;
    for (let i = 0; i < fps * 7.9; i++) result = monitor.update(1 / fps, 1000, 200, 100, -12);
    expect(result).toBeNull();
    for (let i = 0; i < fps * .2; i++) result = monitor.update(1 / fps, 1000, 200, 100, -12);
    expect(result).toBe('brakingFast');
    monitor.reset();
    expect(monitor.update(.1, 300, 4, 4, -26)).toBe('approachFast');
  });
  it('clears severe error when recovered', () => {
    const m = new BrakingFailureMonitor();
    for (let i = 0; i < 50; i++) m.update(.1, 1000, 200, 100, -12);
    m.update(.1, 1000, 100, 100, -12);
    for (let i = 0; i < 30; i++) expect(m.update(.1, 1000, 200, 100, -12)).toBeNull();
  });
  it('offers a choice after two seconds, never auto-retries and locks repeated choices', () => {
    const a = new FailureAttempt();
    expect(a.fail('brakingFast')).toBe(true);
    expect(a.fail('impact')).toBe(false);
    a.update(1.9); expect(a.canChoose).toBe(false);
    a.update(.1); expect(a.canChoose).toBe(true);
    a.update(60); expect(a.reason).toBe('brakingFast');
    expect(a.choose()).toBe(true); expect(a.choose()).toBe(false);
    a.reset(); expect(a.active).toBe(false);
  });
});

// The flight integrator, rather than a copied controller, must respect playback time.
it.each([30,60,120])('bounds manual throttle slew at %i FPS and either time warp', fps => {
  for (const warp of [1,10]) {
    let s = flightStart();
    for (let frame=0;frame<fps;frame++) {
      const next=stepFlight(s,{assist:false,lightAssist:true,throttle:1,attitudeTimeScale:1/warp},warp/fps);
      expect(Math.abs(next.throttle-s.throttle)).toBeLessThanOrEqual(.12/fps+1e-8);
      s=next;
    }
    expect(s.throttle).toBeCloseTo(.12,5);
    const dry=stepFlight({...s,fuelKg:0},{assist:false,lightAssist:true,throttle:1},1/fps);
    expect(dry.throttle).toBe(0);
    expect(dry.fuelKg).toBe(0);
  }
});
