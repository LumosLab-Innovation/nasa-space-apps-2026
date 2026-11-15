import { describe, expect, it } from 'vitest';
import fixture from './fixtures/donki-sep.json';
import { STORM, isSheltered, stormStep } from '../src/challenges/solarStorm';
import { createState, setFlag } from '../src/core/gameState';
import { loadStormEvent } from '../src/data/donki';
import { missionRecord } from '../src/story/ending';
import { compass, daysText, formatDay, sendClock } from '../src/story/timeText';
import { GameClock } from '../src/core/clock';
import { HLS_POS } from '../src/world/zones';

const ok = (body: unknown) => Promise.resolve({ ok: true, json: () => Promise.resolve(body) });

describe('plan 4 deferred minors (plan 5, task 6)', () => {
  it('leaving the shelter during the storm counts as exposure once', () => {
    // Sheltered through the warning, then outside for 6 s during the storm.
    let s = stormStep('idle', 0, 'start', true, 0);
    s = stormStep(s.phase, s.t, 'tick', true, STORM.warningS + 0.1);
    expect(s.phase).toBe('storm');
    expect(s.exposed).toBe(false);
    let exposures = 0;
    let outS = 0;
    let was = false;
    for (let i = 0; i < 120; i++) {
      const r = stormStep(s.phase, s.t, 'tick', false, 0.1, outS, was);
      outS = r.outS;
      if (r.exposed) {
        exposures++;
        was = true;
      }
      s = r;
    }
    expect(exposures).toBe(1);
    // Stepping out for less than 5 s is fine.
    const brief = stormStep('storm', 30, 'tick', false, 4, 0, false);
    expect(brief.exposed).toBe(false);
    expect(stormStep('storm', 26, 'tick', true, 0.1, brief.outS, false).outS).toBe(0);
  });

  it('the lander only shelters you right next to its hull (6 m)', () => {
    expect(isSheltered({ x: HLS_POS.x + 5, z: HLS_POS.z })).toBe(true);
    expect(isSheltered({ x: HLS_POS.x + 8, z: HLS_POS.z })).toBe(false);
    expect(isSheltered({ x: HLS_POS.x, z: HLS_POS.z + 25 })).toBe(false);
  });

  it('directions and dates come from the real night', () => {
    expect(compass(147)).toBe('south-east');
    expect(compass(0)).toBe('north');
    expect(compass(359)).toBe('north');
    expect(compass(270)).toBe('west');
    expect(formatDay(Date.parse('2028-11-29T19:20Z'))).toBe('29 November 2028');
    expect(daysText(86)).toBe('three and a half days');
    expect(daysText(72)).toBe('three days');
    expect(daysText(30)).toBe('one and a half days');
  });

  it('the clock can be held at a moment without ever running past it', () => {
    const c = new GameClock(1_000_000, 20);
    c.tick(10);
    expect(c.nowMs).toBe(1_000_000 + 200_000);
    c.capAt(1_100_000);
    expect(c.nowMs).toBe(1_100_000);
    c.capAt(2_000_000);
    expect(c.nowMs).toBe(1_100_000);
  });

  it('the clock holds one hour before Earth sets while MICA\'s data waits to be sent', () => {
    const earth = Date.parse('2028-12-04T00:00Z');
    expect(sendClock(earth - 5 * 3600_000, earth)).toBe(earth - 5 * 3600_000);
    expect(sendClock(earth - 1800_000, earth)).toBe(earth - 3600_000);
    expect(sendClock(earth + 3600_000, earth)).toBe(earth - 3600_000);
  });

  it('with no data logs on board the record says the freezer was switched off, not that a log was lost', () => {
    const s = createState();
    setFlag(s, 'act5:started');
    setFlag(s, 'act5:freezerOff');
    const line = missionRecord(s, 30).decisions.find((d) => d.startsWith('Science data'))!;
    expect(line).toContain('sample freezer was switched off');
    expect(line).not.toContain('log lost');
    setFlag(s, 'act5:dataLost');
    expect(missionRecord(s, 30).decisions.find((d) => d.startsWith('Science data'))).toContain('one data log lost');
  });

  it('live with only model forecasts falls back to the cache', async () => {
    const modelOnly = [{ sepID: '2026-10-20T00:00:00-SEP-001', eventTime: '2026-10-20T00:00Z', instruments: [{ displayName: 'MODEL: SEPMOD' }] }];
    const r = await loadStormEvent((url: string) => ok(url.includes('DONKI-API') ? modelOnly : fixture), Date.parse('2026-11-07T00:00Z'));
    expect(r.source).toBe('cache');
    expect(r.event!.instrument!.startsWith('MODEL')).toBe(false);
    // If the cache has nothing measured either, the live forecast is still better than nothing.
    const r2 = await loadStormEvent((url: string) => (url.includes('DONKI-API') ? ok(modelOnly) : Promise.reject(new Error('404'))), Date.parse('2026-11-07T00:00Z'));
    expect(r2.source).toBe('live');
    expect(r2.event!.id).toBe('2026-10-20T00:00:00-SEP-001');
  });
});

import { anchorPrompt } from '../src/challenges/winch';
import { loadModel, missingNodes, type Importer } from '../src/models/loadModel';

describe('plan 3 and plan 2 player-facing minors (plan 5, task 7)', () => {
  it('the winch anchor only takes E within reach and says how far the ring is', () => {
    expect(anchorPrompt(2)).toEqual({ text: 'E — plant the winch anchor', canPlant: true });
    const far = anchorPrompt(4.3);
    expect(far.canPlant).toBe(false);
    expect(far.text).toBe('Walk to the anchor marker: 1.8 m to go');
  });

  it('a GLB that breaks the node contract falls back to the placeholder', async () => {
    expect(missingNodes('mica', ['mica_root', 'chassis'])).toContain('wheel_1');
    const fakeRoot = {
      name: '', getChildMeshes: () => [], getDescendants: () => [{ name: 'mica_root' }], dispose: () => { disposed = true; },
    };
    let disposed = false;
    const importer = (async () => ({ instantiateModelsToScene: () => ({ rootNodes: [fakeRoot] }) })) as unknown as Importer;
    const m = await loadModel({} as never, 'mica', importer);
    expect(m).toBeNull();
    expect(disposed).toBe(true);
  });
});

import { IntroDirector } from '../src/landing/introDirector';
import { flightWarp } from '../src/landing/descentGeometry';
import { failureLineId, landStart } from '../src/landing/descent';
import { escapeKeepsLanding } from '../src/landing/finalDescent';
import { catchUpGrid, motifAllowed } from '../src/audio/musicMood';
import { cargoOffersQ } from '../src/challenges/cargoLanding';

describe('final review fixes (plan 5)', () => {
  it('the nominal 1202 alarm leaves at least 10 s before the burn ends, so Houston can answer', () => {
    for (const throttle of [1]) {
      const d = new IntroDirector({ assist: true });
      while (d.stage !== 'brake') d.next();
      let t = 0;
      let alarmAt = -1;
      while (d.stage === 'brake' && t < 120) {
        if (d.stepBrake(1 / 30, throttle, flightWarp(t,d.brake.h)).includes('alarm')) alarmAt = t;
        t += 1 / 30;
      }
      expect(alarmAt).toBeGreaterThanOrEqual(0);
      expect(t - alarmAt).toBeGreaterThanOrEqual(10);
    }
  });

  it("character motifs never play during a silence or on sad lines", () => {
    expect(motifAllowed('silence')).toBe(false);
    expect(motifAllowed('none', 'sad')).toBe(false);
    expect(motifAllowed('none', 'worried')).toBe(false);
    expect(motifAllowed('none', 'happy')).toBe(true);
    expect(motifAllowed('night')).toBe(true);
  });

  it('the cargo Q never takes the key from a busy winch', () => {
    const base = { pipSafe: false, hasShelter: true, nearPip: true, pipMode: 'follow', winchBusy: false };
    expect(cargoOffersQ(base)).toBe(true);
    expect(cargoOffersQ({ ...base, winchBusy: true })).toBe(false);
    expect(cargoOffersQ({ ...base, pipSafe: true })).toBe(false);
    expect(cargoOffersQ({ ...base, pipMode: 'goto' })).toBe(false);
  });

  it('the music grid skips notes that are already late instead of playing them all at once', () => {
    expect(catchUpGrid(10, 12)).toBeCloseTo(12.01, 6);
    expect(catchUpGrid(12.05, 12)).toBe(12.05);
  });

  it('every failed touchdown gets its own explanation: tipped, out of fuel, drifting, too hard', () => {
    const s = { ...landStart(), h: 0, vy: -0.5, vx: 0.2, tiltDeg: 0 };
    expect(failureLineId('tipped', { ...s, tiltDeg: 9 })).toBe('land_tipped');
    expect(failureLineId('tooFast', { ...s, vy: -6, fuelKg: 0 })).toBe('land_noFuel');
    expect(failureLineId('tooFast', { ...s, vx: 2.5 })).toBe('land_drift');
    expect(failureLineId('tooFast', { ...s, vy: -3 })).toBe('land_tooFast');
  });

  it('Esc after touchdown keeps the landing (and its discoveries)', () => {
    expect(escapeKeepsLanding('contact')).toBe(true);
    expect(escapeKeepsLanding('flying')).toBe(false);
    expect(escapeKeepsLanding('failed')).toBe(false);
  });
});
