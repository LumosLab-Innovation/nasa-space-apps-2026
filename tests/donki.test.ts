import { describe, expect, it } from 'vitest';
import fixture from './fixtures/donki-sep.json';
import { loadStormEvent, parseSep, pickStorm, stormBlurb } from '../src/data/donki';

const ok = (body: unknown) => Promise.resolve({ ok: true, json: () => Promise.resolve(body) });

describe('DONKI solar particle events', () => {
  it('parseSep keeps valid events sorted and drops broken ones', () => {
    const evs = parseSep(fixture);
    expect(evs.map((e) => e.id)).toEqual(['2024-05-09T13:59:00-SEP-001', '2024-05-11T02:15:00-SEP-001', '2024-05-13T06:00:00-SEP-001']);
    expect(evs[1].instrument).toBe('GOES-P: EPEAD 10-500 MeV');
    expect(evs[2].link).toBeNull();
    expect(parseSep({ not: 'an array' })).toEqual([]);
  });

  it('pickStorm prefers the latest measured event over model forecasts', () => {
    expect(pickStorm(parseSep(fixture))!.id).toBe('2024-05-11T02:15:00-SEP-001');
    expect(pickStorm([])).toBeNull();
  });

  it('loadStormEvent falls back to the cache when the API fails, then to none', async () => {
    let calls = 0;
    const apiDown = (url: string) => {
      calls++;
      return url.includes('DONKI-API') ? Promise.reject(new Error('503')) : ok(fixture);
    };
    const r1 = await loadStormEvent(apiDown, Date.parse('2026-11-07T00:00Z'));
    expect(r1.source).toBe('cache');
    expect(r1.event!.id).toBe('2024-05-11T02:15:00-SEP-001');
    expect(calls).toBe(2);
    const r2 = await loadStormEvent(() => Promise.reject(new Error('offline')), 0);
    expect(r2).toEqual({ event: null, source: 'none' });
  });

  it('loadStormEvent uses live data when the last 60 days have events, asking for at most 60 days', async () => {
    let asked = '';
    const live = (url: string) => {
      asked = url;
      return ok(fixture);
    };
    const r = await loadStormEvent(live, Date.parse('2024-05-20T00:00Z'));
    expect(r.source).toBe('live');
    const q = new URL(asked).searchParams;
    const days = (Date.parse(q.get('endDate')!) - Date.parse(q.get('startDate')!)) / 86400_000;
    expect(days).toBeLessThanOrEqual(60);
  });

  it('stormBlurb names the real date and never invents one', () => {
    const ev = pickStorm(parseSep(fixture));
    expect(stormBlurb(ev)).toMatch(/11 May 2024/);
    expect(stormBlurb(ev)).toMatch(/GOES-P/);
    expect(stormBlurb(null)).not.toMatch(/\d/);
  });
});
