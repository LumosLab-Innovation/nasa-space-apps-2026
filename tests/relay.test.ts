import { describe, expect, it } from 'vitest';
import { relayStep } from '../src/challenges/earthRelay';

describe('Earth View Peak relay', () => {
  it('relay deploys only with Earth up and aligns only with Pip near', () => {
    expect(relayStep('packed', 'deploy', true, false)).toEqual({ next: 'deployed', reason: 'ok' });
    expect(relayStep('deployed', 'align', true, false)).toEqual({ next: 'deployed', reason: 'needPip' });
    expect(relayStep('deployed', 'align', true, true)).toEqual({ next: 'aligned', reason: 'ok' });
  });

  it('relay refuses with a reason when Earth is hidden', () => {
    expect(relayStep('packed', 'deploy', false, true)).toEqual({ next: 'packed', reason: 'noEarth' });
  });

  it('actions out of order do nothing', () => {
    expect(relayStep('packed', 'align', true, true)).toEqual({ next: 'packed', reason: 'nothing' });
    expect(relayStep('aligned', 'deploy', true, true)).toEqual({ next: 'aligned', reason: 'nothing' });
  });
});
