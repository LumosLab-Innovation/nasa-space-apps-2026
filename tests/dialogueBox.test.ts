import { afterEach, beforeEach, expect, it, vi } from 'vitest';
vi.mock('@babylonjs/gui', () => {
  class Widget { addControl() {} }
  return { Control: {}, StackPanel: Widget, TextBlock: Widget };
});
vi.mock('../src/ui/hudWidgets', () => ({ hudNotice: () => ({ addControl() {} }), fitHud: () => {}, HUD_NARROW: 480 }));
import { createDialogueBox } from '../src/ui/dialogueBox';
import { DialogueRunner } from '../src/dialogue/runner';
import { createState } from '../src/core/gameState';

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] });
  vi.stubGlobal('window', { addEventListener() {}, removeEventListener() {} });
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

function box() {
  const runner = new DialogueRunner({ first: [{ speaker: 'player', text: 'A' }], second: [{ speaker: 'player', text: 'B' }] }, createState());
  const api = createDialogueBox({ addControl() {} } as never, { isDisposed: false, onDisposeObservable: { addOnce() {} } } as never, runner, {} as never);
  api.onLine = vi.fn();
  return api;
}

it('marks queued dialogue busy immediately, merges duplicate requests, then permits later replay', async () => {
  const api = box();
  const first = api.play('first');
  expect(api.busy).toBe(true);
  expect(api.play('first')).toBe(first);
  const second = api.play('second');
  await vi.runAllTimersAsync();
  await Promise.all([first, second]);
  expect(api.onLine).toHaveBeenCalledTimes(2);
  expect(api.busy).toBe(false);
  expect(api.idleSince).toBeGreaterThan(0);
  const replay = api.play('first');
  await vi.runAllTimersAsync();
  await replay;
  expect(api.onLine).toHaveBeenCalledTimes(3);
});

it('cancel stops pending lines and all callers settle', async () => {
  const api = box();
  const queued = [api.play('first'), api.play('second')];
  api.cancel();
  await vi.runAllTimersAsync();
  await Promise.all(queued);
  expect(api.busy).toBe(false);
  expect(api.onLine).not.toHaveBeenCalled();
});

it('a missing dialogue rejects its caller but does not poison the queue', async () => {
  const api = box();
  const missing = expect(api.play('missing')).rejects.toThrow('Unknown dialogue');
  const next = api.play('first');
  await vi.runAllTimersAsync();
  await missing;
  await next;
  expect(api.onLine).toHaveBeenCalledOnce();
  expect(api.busy).toBe(false);
});
