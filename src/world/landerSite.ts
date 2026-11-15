import { HLS_POS } from './zones';

type P2 = { x: number; z: number };

/** Where the lander actually stands (set on touchdown); defaults to the fixed landing-zone constant. */
let site: P2 = { x: HLS_POS.x, z: HLS_POS.z };

/** A copy: callers cannot mutate the stored site. */
export const landerSite = (): P2 => ({ x: site.x, z: site.z });
export const setLanderSite = (p: P2): void => { site = { x: p.x, z: p.z }; };
export const resetLanderSite = (): void => { site = { x: HLS_POS.x, z: HLS_POS.z }; };
