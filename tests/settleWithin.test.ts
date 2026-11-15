import { describe, expect, it, vi } from 'vitest';
import { settleWithin } from '../src/core/settleWithin';

describe('settleWithin', () => {
  it('resolves by timeout when the task never settles', async () => {
    vi.useFakeTimers();
    const p = settleWithin(new Promise(() => {}), 6000);
    await vi.advanceTimersByTimeAsync(6000);
    await expect(p).resolves.toBe(true);
    vi.useRealTimers();
  });
  it('resolves false on success and on rejection', async () => {
    await expect(settleWithin(Promise.resolve(1), 1000)).resolves.toBe(false);
    await expect(settleWithin(Promise.reject(new Error('404')), 1000)).resolves.toBe(false);
  });
});
