import { describe, expect, it } from 'vitest';
import { MicaRepair } from '../src/mica/repair';

const atCleaning = () => {
  const r = new MicaRepair();
  r.arriveAtBase();
  return r;
};

describe('MicaRepair', () => {
  it('starts towing and moves to cleaning at camp', () => {
    const r = new MicaRepair();
    expect(r.stage).toBe('towing');
    r.arriveAtBase();
    expect(r.stage).toBe('cleaning');
  });
  it('four EDS pulses clear the dust for 20 energy, then the panel can be opened', () => {
    const r = atCleaning();
    for (let i = 0; i < 4; i++) r.eds();
    expect(r.dust).toBe(0);
    expect(r.energyUsed).toBe(20);
    expect(r.stage).toBe('openPanel');
  });
  it('ignores EDS outside the cleaning stage', () => {
    const r = new MicaRepair();
    r.eds();
    expect(r.dust).toBe(1);
    expect(r.energyUsed).toBe(0);
  });
  it('Pip must be within 3 m to open the panel', () => {
    const r = atCleaning();
    for (let i = 0; i < 4; i++) r.eds();
    expect(r.pipOpen(5)).toBe(false);
    expect(r.pipOpen(2)).toBe(true);
    expect(r.stage).toBe('swapBoard');
    r.playerSwap();
    expect(r.stage).toBe('warming');
  });
  it('warming faster than 2 C/s is refused with a warning', () => {
    const r = atCleaning();
    for (let i = 0; i < 4; i++) r.eds();
    r.pipOpen(2);
    r.playerSwap();
    r.warm(3, 10);
    expect(r.warning).toBe('tooFast');
    expect(r.batteryC).toBe(-40);
  });
  it('gentle warming to 0 C wakes MICA', () => {
    const r = atCleaning();
    for (let i = 0; i < 4; i++) r.eds();
    r.pipOpen(2);
    r.playerSwap();
    r.warm(2, 20);
    expect(r.batteryC).toBe(0);
    expect(r.stage).toBe('awake');
    expect(r.warning).toBeNull();
  });
});
