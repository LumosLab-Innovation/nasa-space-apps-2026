export const HERITAGE_LAYER = 0x20000000;
const clamp = (v: number) => Math.max(0,Math.min(1,v));
export function heritageShot(seconds: number) {
  const t=clamp((seconds-2.1)/8);
  return {
    local: seconds >= 2.1,
    fade: seconds < 2.1 ? clamp((seconds-1.6)/.5) : 1-clamp((seconds-2.1)/.5),
    travel: t*t*(3-2*t),
  };
}
export function markerVisible(x: number,y: number,z: number,width: number,height: number,horizon: number) {
  return horizon>0 && z>0 && z<1 && x>=18 && x<=width-18 && y>=80 && y<=height-75;
}
