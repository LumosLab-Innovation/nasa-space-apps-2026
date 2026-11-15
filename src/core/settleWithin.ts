/** Resolves when `task` settles (either way) or after `ms`, whichever comes first; never rejects. Returns true if it timed out. */
export function settleWithin(task: Promise<unknown>, ms: number): Promise<boolean> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(true), ms);
    const done = () => { clearTimeout(timer); resolve(false); };
    task.then(done, done);
  });
}
