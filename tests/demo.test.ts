import { describe, expect, it } from 'vitest';
import { DemoDirector, DEMO_HINTS } from '../src/demo/demoDirector';
describe('decision demo', () => {
  it('requires a decision and an observed dawn; N cannot fake completion', () => {
    const d = new DemoDirector();
    expect(d.input('skip')).toBe('context');
    expect(d.input('begin')).toBe('energy');
    expect(d.input('dawn')).toBe('energy');
    expect(d.input('skip')).toBe('energy');
    expect(d.input('chosen')).toBe('outcome');
    expect(d.input('dawn')).toBe('end');
    expect(d.input('begin')).toBe('end');
  });
  it('explains the data and leaves the decision to the player', () => {
    expect(DEMO_HINTS.context).toContain('NASA');
    expect(DEMO_HINTS.energy).toContain('What');
  });
});
