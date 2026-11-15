import { describe, expect, it } from 'vitest';
import { InputLock, readDigit, sceneInputGate, shouldStepSurvival } from '../src/ui/inputLock';

const keys = (pressed: string[]) => {
  const s = new Set(pressed);
  return { consume: (c: string) => s.delete(c) };
};

describe('story panels lock the world behind them', () => {
  it('input lock blocks movement and world interactions while a story panel is open', () => {
    const lock = new InputLock();
    const walk = { forward: 1, right: -1, jump: true, lope: true };
    expect(sceneInputGate(lock, walk)).toEqual(walk);
    lock.push('panel');
    lock.push('rescue');
    expect(lock.locked).toBe(true);
    expect(sceneInputGate(lock, walk)).toEqual({ forward: 0, right: 0, jump: false, lope: false });
    lock.pop('panel');
    expect(lock.locked).toBe(true);
    lock.pop('rescue');
    expect(lock.locked).toBe(false);
    lock.pop('rescue'); // popping twice never goes negative
    lock.push('panel');
    expect(lock.locked).toBe(true);
  });

  it('readDigit reads 1..max and ignores others', () => {
    expect(readDigit(keys(['Digit2']), 4)).toBe(2);
    expect(readDigit(keys(['Numpad3']), 4)).toBe(3);
    expect(readDigit(keys(['Digit5']), 4)).toBeNull();
    expect(readDigit(keys(['KeyE']), 4)).toBeNull();
  });

  it('paused survival does not drain', () => {
    expect(shouldStepSurvival(false, false)).toBe(true);
    expect(shouldStepSurvival(true, false)).toBe(false);
    expect(shouldStepSurvival(false, true)).toBe(false);
  });
});
