/** The judge demo and development jumps start on the surface. */
export function introMode(search: string, dev: boolean): 'intro' | 'skip' {
  const q = new URLSearchParams(search);
  if (q.get('demo') === '1' || (dev && q.get('jump'))) return 'skip';
  return 'intro';
}
