import { describe, it, expect } from 'vitest';
import { Keyboard } from '../src/player/keyboard';
describe('mission keyboard ownership',()=>{
 it('dormant scene cannot consume gameplay or create fresh presses on handoff',()=>{
  const target=new EventTarget(), outgoing=new Keyboard(target as unknown as Window),incoming=new Keyboard(target as unknown as Window);
  incoming.setEnabled(false);
  target.dispatchEvent(Object.assign(new Event('keydown'),{code:'Space',repeat:false}));
  expect(outgoing.isHeld('Space')).toBe(true);expect(incoming.isHeld('Space')).toBe(false);
  incoming.setEnabled(true,outgoing.heldCodes());outgoing.dispose();
  expect(incoming.isHeld('Space')).toBe(true);expect(incoming.consume('Space')).toBe(false);
  target.dispatchEvent(Object.assign(new Event('keyup'),{code:'Space'}));
  expect(incoming.isHeld('Space')).toBe(false);incoming.dispose();
 });
});
