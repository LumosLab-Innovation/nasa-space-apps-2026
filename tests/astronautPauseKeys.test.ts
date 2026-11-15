import { expect, it } from 'vitest';
import { Keyboard } from '../src/player/keyboard';

it('preserves only held E across Pause, but observes releases while paused', () => {
  const target = new EventTarget();
  const keyboard = new Keyboard(target as unknown as Window);
  const key = (type: string, code: string) => target.dispatchEvent(Object.assign(new Event(type), { code, repeat: false }));
  key('keydown', 'KeyE'); key('keydown', 'KeyW');
  keyboard.reset(['KeyE']);
  expect(keyboard.isHeld('KeyE')).toBe(true);
  expect(keyboard.isHeld('KeyW')).toBe(false);
  expect(keyboard.consume('KeyE')).toBe(false);
  keyboard.reset(['KeyE']);
  expect(keyboard.isHeld('KeyE')).toBe(true);
  key('keyup', 'KeyE'); keyboard.reset(['KeyE']);
  expect(keyboard.isHeld('KeyE')).toBe(false);
  keyboard.dispose();
});
