import { catchUpGrid, countTickEvery, motifAllowed, stepBpm, targetBpm, type MusicCue, type MusicTarget } from './musicMood';
import { CHORDS, MICA_BELLS, ORGAN_PARTIALS, PEDAL, PIP_MOTIF, THEME, TOUCHDOWN_CHORD, midiToHz } from './musicScore';
import { touchdownSamples } from './touchdownSound';

/**
 * Adaptive organ score made live with the Web Audio API (no audio files, no dependencies). The mood
 * (musicMood.pickMusic) picks the layers and tempo; a 100 ms lookahead scheduler plays them on a 16th grid.
 */
export interface Music {
  setTarget(t: MusicTarget): void;
  stinger(kind: 'touchdown' | 'discovery'): void;
  /** Dry contact foley, fired immediately once by the successful landing transition. */
  touchdownImpact?(): void;
  explosionImpact?(): void;
  motif(who: 'pip' | 'mica'): void;
  setOn(on: boolean): void;
  readonly on: boolean;
  /** Music volume 0..1 (pause menu). */
  setVolume(v: number): void;
  readonly volume: number;
  duck(on: boolean): void;
  /** Creates/resumes the AudioContext; call from a user gesture. */
  unlock(): void;
  update(dt: number): void;
  dispose(): void;
  /** For dev checks (window.__music). */
  readonly debug: { level: number; bpm: number; cue: MusicCue; urgency: number; running: boolean; peak: number };
}

type Bus = 'pad' | 'octave' | 'theme' | 'pedal' | 'ostinato' | 'heart' | 'tick' | 'bells';
const BUSES: Bus[] = ['pad', 'octave', 'theme', 'pedal', 'ostinato', 'heart', 'tick', 'bells'];

/** Layer gains for each mood (crossfaded over ~2 s). */
function mix(t: MusicTarget): Record<Bus, number> {
  const z: Record<Bus, number> = { pad: 0, octave: 0, theme: 0, pedal: 0, ostinato: 0, heart: 0, tick: 0, bells: 0 };
  if (t.cue === 'silence') return z;
  if (t.cue === 'night') return { ...z, pad: 0.35, bells: 0.5 };
  if (t.cue === 'dawn') return { ...z, pad: 1, octave: 0.8, theme: 0.7, pedal: 0.5 };
  if (t.cue === 'finale') return { ...z, pad: 1, octave: 1, theme: 1, pedal: 0.8, ostinato: 0.35 };
  switch (t.level) {
    case 0:
      return { ...z, pad: 0.8, bells: 0.25 };
    case 1:
      return { ...z, pad: 1, octave: 0.6, theme: 0.6 };
    case 2:
      return { ...z, pad: 0.45, pedal: 0.8, ostinato: 0.6 };
    default:
      return { ...z, pad: 0.35, pedal: 1, ostinato: 0.9, heart: 0.8, tick: 0.5 + 0.4 * t.urgency };
  }
}

const MASTER = 0.6;
const DUCK = 0.5; // −6 dB under dialogue
const LOOKAHEAD_S = 0.1;
const TIMER_MS = 25;

export function createMusic(): Music {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let duckGain: GainNode | null = null;
  let meter: AnalyserNode | null = null;
  let reverbIn: GainNode | null = null;
  const bus = {} as Record<Bus, GainNode>;
  let pedalOsc: OscillatorNode[] = [];
  let timer: ReturnType<typeof setInterval> | null = null;

  let on = true;
  let vol = 1;
  const level = () => (on ? MASTER * vol : 0);
  let target: MusicTarget = { level: 0, urgency: 0, cue: 'none' };
  let bpm = 60;
  let nextSub = 0;
  let sub = 0;
  let pendingStinger = false;
  let touchdownBuffer: AudioBuffer | null = null;
  let explosionBuffer: AudioBuffer | null = null;

  function impulse(c: AudioContext, seconds: number): AudioBuffer {
    const len = Math.floor(c.sampleRate * seconds);
    const b = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = b.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2.5;
    }
    return b;
  }

  function build(c: AudioContext): void {
    master = c.createGain();
    master.gain.value = level();
    duckGain = c.createGain();
    duckGain.gain.value = 1;
    master.connect(duckGain).connect(c.destination);
    const contactSamples=touchdownSamples(c.sampleRate);
    touchdownBuffer=c.createBuffer(1,contactSamples.length,c.sampleRate);
    touchdownBuffer.getChannelData(0).set(contactSamples);
    explosionBuffer = c.createBuffer(1, Math.floor(c.sampleRate * 1.1), c.sampleRate);
    const explosionSamples = explosionBuffer.getChannelData(0);
    let low = 0;
    for (let i = 0; i < explosionSamples.length; i++) {
      const time = i / c.sampleRate;
      low = .94 * low + .06 * (Math.random() * 2 - 1);
      explosionSamples[i] = (low * 1.6 + Math.sin(time * 260) * .12) * Math.min(1, time / .008) * Math.exp(-time * 5);
    }
    // Output level for dev checks (window.__music.debug.peak).
    meter = c.createAnalyser();
    meter.fftSize = 512;
    duckGain.connect(meter);
    // A big empty hall: generated 4 s reverb, mixed under the dry sound.
    const conv = c.createConvolver();
    conv.buffer = impulse(c, 4);
    const wet = c.createGain();
    wet.gain.value = 0.45;
    reverbIn = c.createGain();
    reverbIn.connect(conv).connect(wet).connect(master);
    for (const b of BUSES) {
      const g = c.createGain();
      g.gain.value = 0;
      g.connect(master);
      g.connect(reverbIn);
      bus[b] = g;
    }
    // The pedal drones on its own bus (D2 with a soft fifth).
    pedalOsc = [PEDAL, PEDAL + 7, PEDAL - 12].map((m, i) => {
      const o = c.createOscillator();
      o.type = i === 0 ? 'triangle' : 'sine';
      o.frequency.value = midiToHz(m);
      const g = c.createGain();
      g.gain.value = i === 0 ? 0.22 : 0.1;
      o.connect(g).connect(bus.pedal);
      o.start();
      return o;
    });
    nextSub = c.currentTime + 0.1;
    timer = setInterval(schedule, TIMER_MS);
  }

  /** One organ note: additive partials with a slow swell and a long release. */
  function organ(dest: AudioNode, midi: number, t0: number, dur: number, vel: number, attack = 0.8, release = 1.6): void {
    if (!ctx) return;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, t0);
    env.gain.linearRampToValueAtTime(vel, t0 + attack);
    env.gain.setValueAtTime(vel, t0 + Math.max(attack, dur));
    env.gain.linearRampToValueAtTime(0, t0 + Math.max(attack, dur) + release);
    env.connect(dest);
    const f = midiToHz(midi);
    for (const [p, g] of ORGAN_PARTIALS) {
      if (f * p > 12000) continue;
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = f * p;
      const pg = ctx.createGain();
      pg.gain.value = g * 0.18;
      o.connect(pg).connect(env);
      o.start(t0);
      o.stop(t0 + Math.max(attack, dur) + release + 0.05);
    }
  }

  function pluck(dest: AudioNode, midi: number, t0: number, vel: number, type: OscillatorType = 'triangle', decay = 0.16): void {
    if (!ctx) return;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = midiToHz(midi);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(vel, t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + decay);
    o.connect(g).connect(dest);
    o.start(t0);
    o.stop(t0 + decay + 0.05);
  }

  function thump(t0: number, vel: number): void {
    if (!ctx) return;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(70, t0);
    o.frequency.exponentialRampToValueAtTime(38, t0 + 0.18);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vel, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.25);
    o.connect(g).connect(bus.heart);
    o.start(t0);
    o.stop(t0 + 0.3);
  }

  function tick(t0: number): void {
    if (!ctx) return;
    // A high metallic ping (two inharmonic partials), short and dry-ish.
    for (const [f, v] of [[2793, 0.12], [4186 * 1.07, 0.05]] as const) {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.setValueAtTime(v, t0);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.06);
      o.connect(g).connect(bus.tick);
      o.start(t0);
      o.stop(t0 + 0.08);
    }
  }

  const chords = () => (target.cue === 'dawn' ? CHORDS.dawn : CHORDS.calm);

  /** Everything that happens on one 16th note of the grid. */
  function onSixteenth(t0: number, s: number): void {
    const spb = 60 / bpm;
    // Only layers that are audible in this mood get notes (saves oscillators).
    const m = mix(target);
    const beat = Math.floor(s / 4);
    const inBeat = s % 4;
    const cycle = chords();
    const chordIdx = Math.floor(beat / 8) % cycle.length;
    const chord = cycle[chordIdx] as readonly number[];
    // Pads: a new chord every two bars.
    if (inBeat === 0 && beat % 8 === 0) {
      const dur = spb * 8;
      if (m.pad > 0) for (const n of chord) organ(bus.pad, n, t0, dur, 0.5);
      if (m.octave > 0) for (const n of chord.slice(1)) organ(bus.octave, n + 12, t0 + 0.05, dur, 0.28);
    }
    // Theme: one note per beat.
    if (m.theme > 0 && inBeat === 0) organ(bus.theme, THEME[beat % THEME.length], t0, spb * 0.9, 0.55, 0.12, 0.6);
    // Ostinato: 8ths when tense, 16ths when urgent (or the finale).
    const sixteenths = target.level === 3 || target.cue === 'finale';
    if (m.ostinato > 0 && (sixteenths || inBeat % 2 === 0)) {
      const arp = [...chord.slice(1), ...chord.slice(1).reverse()];
      pluck(bus.ostinato, arp[s % arp.length] + 12, t0, 0.22);
    }
    // Heartbeat: lub-dub on the first two beats of each bar.
    if (m.heart > 0 && beat % 4 < 2 && (inBeat === 0 || inBeat === 1)) thump(t0, inBeat === 0 ? 0.9 : 0.55);
    // Count ticks: faster as the time runs out.
    const every = Math.round(countTickEvery(target.urgency) * 4);
    if (m.tick > 0 && s % every === 0) tick(t0);
    // Sparse single notes (calm) or MICA's bells (night).
    if (m.bells > 0 && inBeat === 0 && beat % 8 === 4) {
      if (target.cue === 'night') pluck(bus.bells, MICA_BELLS[Math.floor(beat / 8) % 2] - 12, t0, 0.3, 'sine', 2.2);
      else pluck(bus.bells, chord[chord.length - 1] + 12, t0, 0.18, 'sine', 2.5);
    }
  }

  function schedule(): void {
    if (!ctx || ctx.state !== 'running') return;
    nextSub = catchUpGrid(nextSub, ctx.currentTime);
    while (nextSub < ctx.currentTime + LOOKAHEAD_S) {
      if (target.cue !== 'silence') onSixteenth(nextSub, sub);
      sub++;
      nextSub += 60 / bpm / 4;
    }
  }

  function applyMix(fast: boolean): void {
    if (!ctx) return;
    const m = mix(target);
    const tc = fast ? 0.1 : 0.7;
    for (const b of BUSES) bus[b].gain.setTargetAtTime(m[b], ctx.currentTime, tc);
  }

  function playStinger(kind: 'touchdown' | 'discovery'): void {
    if (!ctx || !master) return;
    const t0 = ctx.currentTime + 0.02;
    if (kind === 'touchdown') for (const n of TOUCHDOWN_CHORD) organ(master, n, t0, 0.2, 0.42, 0.05, 6);
    else for (const [i, n] of [74, 78, 81].entries()) pluck(master, n, t0 + i * 0.09, 0.25, 'sine', 1.6);
  }

  return {
    setTarget(t) {
      const changed = t.cue !== target.cue || t.level !== target.level || Math.abs(t.urgency - target.urgency) > 0.05;
      const wasSilent = target.cue === 'silence';
      target = t;
      if (changed) applyMix(t.cue === 'silence' || wasSilent);
    },
    stinger(kind) {
      if (!ctx) {
        pendingStinger = kind === 'touchdown';
        return;
      }
      playStinger(kind);
    },
    explosionImpact() {
      if (!ctx || !master || !explosionBuffer || ctx.state !== 'running' || !on || vol <= 0) return;
      const source = ctx.createBufferSource();
      source.buffer = explosionBuffer;
      source.connect(master);
      source.onended = () => source.disconnect();
      source.start(ctx.currentTime);
    },
    touchdownImpact() {
      // Never queue a late impact if audio is locked; reuse the gesture-unlocked context.
      if(!ctx||!master||!touchdownBuffer||ctx.state!=='running'||!on||vol<=0)return;
      const source=ctx.createBufferSource();
      source.buffer=touchdownBuffer;
      source.connect(master); // Dry output; inherits existing volume, mute and dialogue ducking.
      source.onended=()=>source.disconnect();
      source.start(ctx.currentTime);
    },
    motif(who) {
      if (!ctx || !master || !on || !motifAllowed(target.cue)) return;
      const t0 = ctx.currentTime + 0.02;
      if (who === 'pip') PIP_MOTIF.forEach((n, i) => pluck(master!, n, t0 + i * 0.14, 0.12, 'triangle', 0.22));
      else MICA_BELLS.forEach((n, i) => pluck(master!, n, t0 + i * 1.5, 0.1, 'sine', 1.4));
    },
    setOn(v) {
      on = v;
      if (ctx && master) master.gain.setTargetAtTime(level(), ctx.currentTime, 0.2);
    },
    get on() {
      return on;
    },
    setVolume(v) {
      vol = Math.max(0, Math.min(1, v));
      if (ctx && master) master.gain.setTargetAtTime(level(), ctx.currentTime, 0.1);
    },
    get volume() {
      return vol;
    },
    duck(v) {
      if (ctx && duckGain) duckGain.gain.setTargetAtTime(v ? DUCK : 1, ctx.currentTime, 0.25);
    },
    unlock() {
      try {
        if (!ctx) {
          const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
          if (!AC) return;
          ctx = new AC();
          build(ctx);
          applyMix(false);
          if (pendingStinger) playStinger('touchdown');
          pendingStinger = false;
        }
        if (ctx.state === 'suspended') void ctx.resume();
      } catch (e) {
        console.warn('[music] Web Audio unavailable', e);
      }
    },
    update(dt) {
      bpm = stepBpm(bpm, targetBpm(target), dt);
    },
    dispose() {
      if (timer) clearInterval(timer);
      for (const o of pedalOsc) o.stop();
      void ctx?.close();
      ctx = null;
      touchdownBuffer = null;
    },
    get debug() {
      let peak = 0;
      if (meter) {
        const buf = new Float32Array(meter.fftSize);
        meter.getFloatTimeDomainData(buf);
        for (const v of buf) peak = Math.max(peak, Math.abs(v));
      }
      return { level: target.level, bpm: Math.round(bpm), cue: target.cue, urgency: +target.urgency.toFixed(2), running: ctx?.state === 'running', peak: +peak.toFixed(3) };
    },
  };
}
