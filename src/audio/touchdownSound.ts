/** Original dry landing-gear foley: a restrained low thud, no external audio asset. */
export function touchdownSamples(sampleRate:number):Float32Array {
 const samples=new Float32Array(Math.round(sampleRate*.55));
 let seed=1729,lowNoise=0;
 for(let i=0;i<samples.length;i++){
  const t=i/sampleRate;
  seed=(Math.imul(seed,1664525)+1013904223)>>>0;
  lowNoise+=(seed/4294967296*2-1-lowNoise)*.035;
  const phase=2*Math.PI*(55*t+4*(1-Math.exp(-t/.1)));
  const attack=Math.min(1,t/.008),tail=Math.min(1,(samples.length-1-i)/(sampleRate*.04));
  const envelope=.16*attack*Math.exp(-t*9)*tail;
  samples[i]=envelope*(.82*Math.sin(phase)+.12*Math.sin(phase*2.1)+.06*lowNoise);
 }
 return samples;
}
