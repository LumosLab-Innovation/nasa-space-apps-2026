/** The judge must make an actual choice before seeing its outcome. */
export type DemoStep = 'context' | 'energy' | 'outcome' | 'end';
export const DEMO_HINTS = {
  context: 'Decision demo: NASA terrain and sunlight determine the night. You decide how to share the stored energy.',
  energy: 'Compare the loads. What can you switch off, and what would you lose?',
  outcome: 'Watch the night and the consequences of your choice.',
  end: 'The full mission also includes a radiation storm, exploration and repairs before the long night.',
};
export class DemoDirector {
  step: DemoStep = 'context';
  input(event: string): DemoStep {
    if (this.step === 'context' && event === 'begin') this.step = 'energy';
    else if (this.step === 'energy' && event === 'chosen') this.step = 'outcome';
    else if (this.step === 'outcome' && event === 'dawn') this.step = 'end';
    return this.step;
  }
}
