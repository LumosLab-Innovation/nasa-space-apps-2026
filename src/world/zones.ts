import type { ModuleId } from '../core/gameState';

/**
 * Journey layout on the real LOLA Connecting Ridge terrain (+z north, +x east, metres from the site).
 * Every position was chosen by scripts/scout-layout.ts against REAL light: JPL Horizons Sun/Earth for the
 * mission window planMission() picks in 2028 (spec v3 §7, §10.1). tests/layout.test.ts re-checks each
 * constraint on the shipped data, so moving a stop by hand fails the build if the light no longer fits.
 */
export type ZoneId = 'landing' | 'base' | 'solarHill' | 'boulderField' | 'freshCrater' | 'earthPeak' | 'tracks' | 'darkCrater';

export interface Zone {
  id: ZoneId;
  name: string;
  x: number;
  z: number;
  radius: number;
}
type P2 = { x: number; z: number };

const LANDING: P2 = { x: 80, z: -240 };
const BASE: P2 = { x: -60, z: -300 };
const add = (p: P2, dx: number, dz: number): P2 => ({ x: p.x + dx, z: p.z + dz });

/** Inside the Dark Crater: never sunlit at any hour of 2028 (a permanently shadowed spot). */
export const ICE_SPOT: P2 = { x: -180, z: -500 };
/** On the Dark Crater's rim, lit ~28% of the mission window: half in sunlight, half in shadow. */
export const MICA_POS: P2 = { x: -162, z: -568 };
/** Antenna spot with Earth in line of sight for the whole mission window. */
export const RELAY_SPOT: P2 = { x: -40, z: -460 };
/** A ≥17° slope with a rolling-boulder trail from top to bottom. */
export const BOULDER = { top: { x: -177, z: -270 } as P2, bottom: { x: -200, z: -280 } as P2 };
const HILL_SITE: P2 = { x: 200, z: -240 };
const HILL_CRATE: P2 = { x: 209.6, z: -263.1 };
/** Top of the Sunny Hill climb, where the player plants the winch anchor. */
export const WINCH_ANCHOR: P2 = add(HILL_SITE, 1.5, -4);
const TRACKS_START: P2 = { x: -108, z: -428 };

export const ZONES: Zone[] = [
  { id: 'landing', name: 'Landing Zone', ...LANDING, radius: 60 },
  { id: 'base', name: 'Shackleton Camp', ...BASE, radius: 45 },
  { id: 'solarHill', name: 'Sunny Hill', ...HILL_SITE, radius: 30 },
  { id: 'boulderField', name: 'Rolling Boulder Field', ...BOULDER.bottom, radius: 50 },
  { id: 'freshCrater', name: 'Fresh Crater', x: 0, z: -120, radius: 50 },
  { id: 'earthPeak', name: 'Earth View Peak', ...RELAY_SPOT, radius: 30 },
  { id: 'tracks', name: 'Strange Tracks', ...TRACKS_START, radius: 30 },
  // 30 m: the permanently dark floor; MICA's tracks skirt the rim at 35 m or more.
  { id: 'darkCrater', name: 'Dark Crater', ...ICE_SPOT, radius: 30 },
];

export const zone = (id: ZoneId): Zone => ZONES.find((z) => z.id === id)!;

/** Where the player steps off the lander elevator; Pip rolls in from the camp side. */
export const HLS_POS: P2 = add(LANDING, 0, -2);
export const PLAYER_SPAWN: P2 = add(LANDING, 8, 8);
export const PIP_SPAWN: P2 = add(LANDING, -25, -15);
/** The Artemis IV flag goes up a few metres from the lander. */
export const FLAG_SPOT: P2 = add(LANDING, -12, 12);

/** Cargo crates dropped away from camp (lander plumes would sandblast the base) and where each module goes. */
export const CRATES: { moduleId: ModuleId; x: number; z: number; site: P2 }[] = [
  { moduleId: 'solarTower', ...HILL_CRATE, site: HILL_SITE },
  { moduleId: 'radiator', x: -190, z: -300, site: add(BASE, 14, -8) },
  { moduleId: 'habitat', ...add(LANDING, -20, 20), site: add(BASE, -4, 12) },
  { moduleId: 'antenna', x: 15, z: -130, site: add(BASE, -16, -6) },
];

/**
 * MICA's wobbling tracks from the Strange Tracks stop to the rim where it stalled, with one spin-in-place
 * loop halfway (it was turning its flat panels toward the Sun).
 */
export const TRACKS_PATH: P2[] = (() => {
  const pts: P2[] = [];
  const n = 18;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = TRACKS_START.x + (MICA_POS.x - TRACKS_START.x) * t;
    const z = TRACKS_START.z + (MICA_POS.z - TRACKS_START.z) * t;
    const wobble = Math.sin(t * Math.PI * 5) * 5 * (0.4 + t); // weaker machine, wobblier line
    pts.push({ x: x + wobble, z });
    if (i === 9) {
      for (const a of [0.5, 1.5, 2.5, 3.5]) pts.push({ x: x + wobble + Math.cos(a * 1.57) * 5, z: z + Math.sin(a * 1.57) * 5 });
    }
  }
  pts[pts.length - 1] = { x: MICA_POS.x + 2, z: MICA_POS.z + 3 };
  return pts;
})();

/** Sample spots (spec §5.2), each in the zone where that rock type belongs. */
export const SAMPLE_SPOTS: { sampleId: 'anorthosite' | 'breccia' | 'glassBeads' | 'regolith' | 'freshCrater' | 'iceRegolith'; x: number; z: number }[] = [
  { sampleId: 'anorthosite', ...add(LANDING, 14, 24) },
  { sampleId: 'breccia', ...add(BOULDER.bottom, 6, -8) },
  { sampleId: 'glassBeads', x: 5, z: -112 },
  { sampleId: 'regolith', ...add(BASE, -20, 40) },
  { sampleId: 'freshCrater', x: -6, z: -128 },
  { sampleId: 'iceRegolith', ...ICE_SPOT },
];

/** Act 1 spots, laid out around the lander as in Plan 1. */
export const EXPERIMENT_SPOT: P2 = add(LANDING, 18, 15);
export const REF_ROCK_SPOT: P2 = add(LANDING, 4, 24);
export const ANTENNA_SPOT: P2 = add(LANDING, -6, 16);
/** Regolith-covered storm shelter Pip built at camp over seven months (Act 4 radiation storm, Plan 4). */
export const SHELTER_POS: P2 = add(BASE, 2, -18);
/** Where MICA is parked for repairs, inside camp. */
export const REPAIR_SPOT: P2 = add(BASE, 10, 16);
/** Where the lunar rover waits at camp (Plan 7) when the game continues from a save or a dev jump. */
export const ROVER_PARK: P2 = add(BASE, 10, 6);
