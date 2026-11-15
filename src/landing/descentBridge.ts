import type { HlsRig } from '../models/hlsRig';
import type { ExhaustTransfer } from '../fx/spacecraftExhaust';
export const BRIDGE_SECONDS = 5;
export const BRIDGE_SWITCH_S = 3.5;
export const BRIDGE_OVERLAP_S = .45;
export const easeBridge = (x: number) => { const t=Math.max(0,Math.min(1,x)); return t*t*(3-2*t); };
/** Scripted guidance; endpoint derivatives match the playable landStart state. */
export function bridgeSample(seconds: number, startHeight=500, startSpeed=100) {
  const t=Math.max(0,Math.min(1,seconds/BRIDGE_SECONDS)), t2=t*t,t3=t2*t;
  const h=(2*t3-3*t2+1)*startHeight+(t3-2*t2+t)*-200+(-2*t3+3*t2)*300+(t3-t2)*-60;
  const vy=((6*t2-6*t)*startHeight+(3*t2-4*t+1)*-200+(-6*t2+6*t)*300+(3*t2-2*t)*-60)/5;
  const speed=Math.max(4,Math.min(120,startSpeed));
  const vx=4+(speed-4)*(1-3*t2+2*t3);
  const integral=t-t3+.5*t2*t2;
  const offset=-5*(4*(1-t)+(speed-4)*(.5-integral));
  return {h,vy,vx,offset:offset===0?0:offset};
}
export interface DescentHandoff {
  startHeight: number; startSpeed: number; throttle: number;
  cameraPosition: number[]; cameraTarget: number[]; cameraUp: number[]; fov: number;
  rig: ReturnType<HlsRig['snapshotMotion']>; held: string[];
  presentation: FlightPresentation;
}
/** Metres in the destination world, shared by both scene adapters. */
export interface FlightPresentation {
  exhaust?:ExhaustTransfer;
  position:number[]; rotation:number[]; scale:number;
  camera:number[]; target:number[]; up:number[]; fov:number;
  h:number;vy:number;vx:number;offset:number;throttle:number;
  rig:ReturnType<HlsRig['snapshotMotion']>;
}
