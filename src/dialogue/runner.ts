import type { PipExpression } from '../pip/faceArt';
import { lightDelayOneWayS } from '../physics/lunar';
import { setFlag, type GameState } from '../core/gameState';

export type Speaker = 'pip' | 'mica' | 'houston' | 'commander' | 'player';
/** Pip's face screen moods (chibi art in src/pip/faceArt.ts). */
export type PipFace = PipExpression;

export interface Line {
  speaker: Speaker;
  text: string;
  face?: PipFace;
  pauseBeforeMs?: number;
  setFlag?: string;
}
export type Script = Record<string, Line[]>;

/** Round-trip radio delay Moon↔Earth, in ms. */
export function houstonDelayMs(): number {
  return Math.round(2 * lightDelayOneWayS() * 1000);
}

export class DialogueRunner {
  private id: string | null = null;
  private index = 0;

  constructor(private readonly script: Script, private readonly state: GameState) {}

  get active(): boolean {
    return this.id !== null;
  }

  start(id: string): Line {
    if (!this.script[id]?.length) throw new Error(`Unknown dialogue: ${id}`);
    this.id = id;
    this.index = 0;
    return this.show();
  }

  next(): Line | null {
    if (this.id === null) return null;
    this.index += 1;
    if (this.index >= this.script[this.id].length) {
      setFlag(this.state, `dialogue:${this.id}:done`);
      this.id = null;
      return null;
    }
    return this.show();
  }

  private show(): Line {
    const raw = this.script[this.id!][this.index];
    if (raw.setFlag) setFlag(this.state, raw.setFlag);
    if (raw.speaker === 'houston' && raw.pauseBeforeMs === undefined) {
      return { ...raw, pauseBeforeMs: houstonDelayMs() };
    }
    return raw;
  }
}
