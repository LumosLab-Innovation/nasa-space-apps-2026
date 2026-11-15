import { afterEach, describe, expect, it } from 'vitest';
import { deployPoint } from '../src/rover/roverSystem';
import { resetLanderSite, setLanderSite } from '../src/world/landerSite';
import { createState } from '../src/core/gameState';
import { ROVER, ROVER_PARK, canBoard, canLeave, initRover, roverStep, type RoverGround, type RoverState } from '../src/rover/rover';
import { restoreSteps } from '../src/save/save';
import { HLS_POS, zone } from '../src/world/zones';

const flat: RoverGround = { height: () => 0, slopeDeg: () => 0, forbidden: () => false };
const drive = (s: RoverState, input: { throttle: number; steer: number }, seconds: number, ground = flat, dt = 1 / 60) => {
  for (let t = 0; t < seconds; t += dt) s = roverStep(s, input, ground, dt);
  return s;
};

describe('lunar rover (plan 7)', () => {
  it('throttle accelerates to the top speed and brakes to a stop', () => {
    let s = drive(initRover(0, 0, 0), { throttle: 1, steer: 0 }, 2);
    expect(s.speed).toBeCloseTo(ROVER.accel * 2, 1);
    s = drive(s, { throttle: 1, steer: 0 }, 10);
    expect(s.speed).toBeCloseTo(ROVER.maxSpeedMs, 6);
    expect(s.z).toBeGreaterThan(30); // yaw 0 drives north (+z)
    s = drive(s, { throttle: -1, steer: 0 }, ROVER.maxSpeedMs / ROVER.brake + 0.1);
    expect(Math.abs(s.speed)).toBeLessThan(0.05);
  });

  it('steering turns the rover like a car (bicycle model)', () => {
    const s0 = { ...initRover(0, 0, 0), speed: 3 };
    const s = roverStep(s0, { throttle: 0.4, steer: 1 }, flat, 0.1);
    const expected = (s0.speed / ROVER.wheelbaseM) * Math.tan(ROVER.steerRad) * 0.1;
    expect(s.yaw).toBeCloseTo(expected, 2);
    // Standing still, the wheels turn but the rover does not.
    expect(roverStep(initRover(0, 0, 0), { throttle: 0, steer: 1 }, flat, 0.1).yaw).toBe(0);
  });

  it('rover refuses forbidden ground and never takes a busy Pip; a stuck rover can be left', () => {
    const steep: RoverGround = { height: () => 0, slopeDeg: (_x, z) => (z > 5 ? 25 : 0), forbidden: () => false };
    let s = drive({ ...initRover(0, 0, 0) }, { throttle: 1, steer: 0 }, 8, steep);
    expect(s.z).toBeLessThanOrEqual(5.2);
    expect(s.speed).toBe(0);
    expect(canLeave(s)).toBe(true);
    const crater = zone('darkCrater');
    const walls: RoverGround = { ...flat, forbidden: (x, z) => Math.hypot(x - crater.x, z - crater.z) < crater.radius + 10 };
    s = drive(initRover(crater.x, crater.z - 60, 0), { throttle: 1, steer: 0 }, 20, walls);
    expect(Math.hypot(s.x - crater.x, s.z - crater.z)).toBeGreaterThanOrEqual(crater.radius + 10 - 0.2);
    expect(canBoard({ distM: 2, pipMode: 'follow', pipBusy: true })).toEqual({ player: true, pip: false });
    expect(canBoard({ distM: 2, pipMode: 'follow', pipBusy: false })).toEqual({ player: true, pip: true });
    expect(canBoard({ distM: 2, pipMode: 'task', pipBusy: false }).pip).toBe(false);
    expect(canBoard({ distM: 3.5, pipMode: 'follow', pipBusy: false })).toEqual({ player: false, pip: false });
    expect(canLeave({ ...initRover(0, 0, 0), speed: 4 })).toBe(false);
  });

  it('bounce settles under lunar gravity', () => {
    let s: RoverState = { ...initRover(0, 0, 0), bounceY: 0.2 };
    let wentBelow = false;
    for (let t = 0; t < 20; t += 1 / 60) {
      s = roverStep(s, { throttle: 0, steer: 0 }, flat, 1 / 60);
      if (s.bounceY < -0.01) wentBelow = true;
    }
    expect(wentBelow).toBe(true); // springy, like the floaty Apollo footage
    expect(Math.abs(s.bounceY)).toBeLessThan(0.005);
    // A bump in the road sets the body bouncing.
    const bump: RoverGround = { height: (_x, z) => (z > 2 && z < 2.6 ? 0.15 : 0), slopeDeg: () => 0, forbidden: () => false };
    s = drive({ ...initRover(0, 0, 0), speed: 4 }, { throttle: 0.8, steer: 0 }, 1, bump);
    expect(Math.abs(s.bounceY) + Math.abs(s.bounceV)).toBeGreaterThan(0.01);
  });

  it('restore marks Pip met and parks the rover at camp', () => {
    const st = createState();
    expect(restoreSteps(st).roverAt).toBe('hls');
    st.flags.add('pip:met');
    const r = restoreSteps(st);
    expect(r.pipMet).toBe(true);
    expect(r.roverAt).toBe('camp');
    expect(Math.hypot(ROVER_PARK.x - zone('base').x, ROVER_PARK.z - zone('base').z)).toBeLessThan(15);
  });
});

describe('rover arrival after the first meeting (plan 7 final checks)', () => {
  it('waits while the greeting is still playing, comes down after a real meeting, parks after a jump', async () => {
    const { roverArrival } = await import('../src/rover/rover');
    const f = (...xs: string[]) => new Set(xs);
    // Before the landing is done the rover stays stowed, whatever the meeting says.
    expect(roverArrival('greeted', f('dialogue:meetPip:done'))).toBe('wait');
    expect(roverArrival('hidden', f())).toBe('wait');
    expect(roverArrival('overheard', f())).toBe('wait');
    // Landed: lowered right away, even before Pip is met.
    expect(roverArrival('hidden', f('landing:done'))).toBe('lower');
    expect(roverArrival('done', f('landing:done', 'pip:met'))).toBe('lower');
    // An already-deployed rover parks at camp.
    expect(roverArrival('hidden', f('landing:done', 'rover:deployed'))).toBe('park');
    expect(roverArrival('done', f('pip:met', 'rover:deployed'))).toBe('park');
    // Dev jumps and the demo mark the meeting done without a landing: park at camp.
    expect(roverArrival('done', f('dialogue:meetPip:done'))).toBe('park');
  });

  it('plays Houston alone until Pip is known, the full chat after', async () => {
    const { roverReadyKey } = await import('../src/rover/rover');
    expect(roverReadyKey(new Set(['landing:done']))).toBe('rover_ready_houston');
    expect(roverReadyKey(new Set(['pip:met']))).toBe('rover_ready');
    expect(roverReadyKey(new Set(['dialogue:meetPip:done']))).toBe('rover_ready');
  });
});

describe('rover and busy moments (plan 7 final review)', () => {
  it('the player walks during a storm, a cargo countdown, a tow or a winch pull, and Pip carrying a crate stays off the deck', async () => {
    const { mustWalk, pipBusyFor, walkReason } = await import('../src/rover/rover');
    const { VI } = await import('../src/i18n/vi');
    const calm = { storm: false, cargoCountdown: false, towing: false, winchHoldsPip: false, pipCarrying: false, pipSleeping: false };
    expect(mustWalk(calm)).toBe(false);
    expect(walkReason(calm)).toBeNull();
    for (const k of ['storm', 'cargoCountdown', 'towing', 'winchHoldsPip'] as const) {
      const busy = { ...calm, [k]: true };
      expect(mustWalk(busy), k).toBe(true);
      expect(VI[walkReason(busy)!], k).toBeTruthy();
    }
    expect(pipBusyFor(calm)).toBe(false);
    for (const k of ['pipCarrying', 'pipSleeping', 'towing', 'winchHoldsPip'] as const) expect(pipBusyFor({ ...calm, [k]: true }), k).toBe(true);
  });
});
describe('rover deploy site', () => {
  afterEach(() => resetLanderSite());
  it('deploy point follows the landed ship', () => {
    setLanderSite({ x: HLS_POS.x + 25, z: HLS_POS.z - 12 });
    expect(deployPoint()).toEqual({ x: HLS_POS.x + 35, z: HLS_POS.z - 8 });
  });
});
