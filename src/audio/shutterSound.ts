/** Original camera-shutter foley for a notebook photo: two short filtered noise clicks, no audio asset. */
export function shutterSamples(sampleRate: number): Float32Array {
  const samples = new Float32Array(Math.round(sampleRate * 0.12));
  // Shutter opening (brighter, louder) then closing (softer) about 65 ms later.
  const clicks = [
    { at: 0, gain: 0.15, decay: 0.004, bright: 0.6 },
    { at: 0.065, gain: 0.11, decay: 0.006, bright: 0.35 },
  ];
  let seed = 4093;
  let low = 0;
  for (let i = 0; i < samples.length; i++) {
    const t = i / sampleRate;
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const white = (seed / 4294967296) * 2 - 1;
    low += (white - low) * 0.3;
    let v = 0;
    for (const c of clicks) {
      const dt = t - c.at;
      if (dt < 0) continue;
      const attack = Math.min(1, dt / 0.0008);
      v += c.gain * attack * Math.exp(-dt / c.decay) * (c.bright * white + (1 - c.bright) * low);
    }
    samples[i] = Math.max(-0.2, Math.min(0.2, v));
  }
  return samples;
}
