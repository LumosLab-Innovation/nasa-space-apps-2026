import { describe, expect, it } from 'vitest';
import { Act5Director, nightBlockers } from '../src/story/act5';

const ready = { memory: true, inCamp: true, dialogueBusy: false, towing: false, locked: false, stormActive: false };

describe('Act 5 director', () => {
  it('act 5 starts only once, only when memory is restored and the player is in camp and idle', () => {
    const d = new Act5Director();
    expect(d.canStart({ ...ready, memory: false })).toBe(false);
    expect(d.canStart({ ...ready, inCamp: false })).toBe(false);
    expect(d.canStart({ ...ready, dialogueBusy: true })).toBe(false);
    expect(d.canStart({ ...ready, towing: true })).toBe(false);
    expect(d.canStart({ ...ready, locked: true })).toBe(false);
    expect(d.canStart(ready)).toBe(true);
    expect(d.next('start')).toBe('titleCard');
    expect(d.canStart(ready)).toBe(false);
  });

  it('stages advance only on their own event', () => {
    const d = new Act5Director();
    expect(d.next('dataSent')).toBe('waiting');
    d.next('start');
    expect(d.next('beginNight')).toBe('titleCard');
    expect(d.next('titleDone')).toBe('prep');
    expect(d.next('dataSent')).toBe('prep');
    const path = ['beginNight', 'plannerDone', 'nightDone', 'dawnDone', 'dataSent', 'boarded', 'liftoffDone'] as const;
    const stages = path.map((e) => d.next(e));
    expect(stages).toEqual(['nightPlanner', 'night', 'dawn', 'sendData', 'farewell', 'liftoff', 'record']);
    expect(d.next('start')).toBe('record');
  });

  it('night cannot begin until notch chosen and ice sampled, and says what is missing', () => {
    expect(nightBlockers({ notchChosen: false, ice: false })).toHaveLength(2);
    expect(nightBlockers({ notchChosen: true, ice: false })[0]).toMatch(/ice/i);
    expect(nightBlockers({ notchChosen: false, ice: true })[0]).toMatch(/Sun will rise/i);
    expect(nightBlockers({ notchChosen: true, ice: true })).toEqual([]);
  });
});
