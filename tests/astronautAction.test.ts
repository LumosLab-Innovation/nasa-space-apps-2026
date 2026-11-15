import { describe, expect, it, vi } from 'vitest';
import { AstronautAction } from '../src/player/astronautAction';

const ok = { held: true, valid: true, cancel: false };
describe('astronaut action lifecycle', () => {
  it('bags a sample once at 2.8s, freezes with zero dt, recovers at 3.6s', () => {
    const a = new AstronautAction(); const commit = vi.fn();
    expect(a.start({ kind: 'sample', id: 'rock', onCommit: commit })).toBe(true);
    expect(a.start({ kind: 'sample', id: 'rock2', onCommit: commit })).toBe(false);
    a.update(2.79, ok); expect(commit).not.toHaveBeenCalled();
    a.update(0, ok); expect(a.snapshot!.time).toBeCloseTo(2.79);
    a.update(.02, ok); expect(commit).toHaveBeenCalledTimes(1);
    a.update(.8, ok); expect(a.busy).toBe(false);
    a.update(9, ok); expect(commit).toHaveBeenCalledTimes(1);
  });
  it('recovers without a reward after cancellation before bagging', () => {
    const a = new AstronautAction(); const commit = vi.fn(), cancel = vi.fn();
    a.start({ kind: 'sample', id: 'x', onCommit: commit, onCancel: cancel });
    a.update(1.9, ok); a.update(.01, { ...ok, cancel: true });
    expect(a.snapshot!.recovering).toBe(true);
    a.update(.4, ok); expect(a.busy).toBe(false);
    expect(commit).not.toHaveBeenCalled(); expect(cancel).toHaveBeenCalledTimes(1);
  });
  it('does not undo a committed sample on rescue and cancellation is idempotent', () => {
    const a = new AstronautAction(); const commit = vi.fn(), cancel = vi.fn();
    a.start({ kind: 'sample', id: 'x', onCommit: commit, onCancel: cancel });
    a.update(2.9, ok); a.cancel(); a.cancel();
    expect(commit).toHaveBeenCalledTimes(1); expect(cancel).not.toHaveBeenCalled(); expect(a.busy).toBe(false);
  });
  it('requires entry and 1.5s of held alignment before installation', () => {
    const a = new AstronautAction(); const commit = vi.fn();
    a.start({ kind: 'install', id: 'habitat', onCommit: commit });
    a.update(.6, ok); expect(a.snapshot!.progress).toBe(0);
    a.update(1.49, ok); expect(commit).not.toHaveBeenCalled();
    a.update(.02, ok); expect(commit).toHaveBeenCalledTimes(1);
    a.update(.5, { ...ok, held: false }); expect(a.busy).toBe(false);
  });
  it.each(['release', 'invalid'])('cancels installation on %s before commit', (reason) => {
    const a = new AstronautAction(); const commit = vi.fn(), cancel = vi.fn();
    a.start({ kind: 'install', id: 'antenna', onCommit: commit, onCancel: cancel });
    a.update(1.2, ok);
    a.update(.01, { ...ok, held: reason !== 'release', valid: reason !== 'invalid' });
    a.update(4, ok); expect(commit).not.toHaveBeenCalled(); expect(cancel).toHaveBeenCalledTimes(1);
  });
  it('invalid samples cancel before a frame can cross the commit marker', () => {
    const a = new AstronautAction(); const commit = vi.fn();
    a.start({ kind: 'sample', id: 'x', onCommit: commit });
    a.update(2.7, ok); a.update(.2, { ...ok, valid: false });
    expect(commit).not.toHaveBeenCalled();
  });
});
