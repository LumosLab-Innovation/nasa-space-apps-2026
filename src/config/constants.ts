/** Global constants (spec §7, plan Global Constraints). */
export const LUNAR_G = 1.62; // m/s^2
export const EARTH_G = 9.81; // m/s^2
export const WORLD_SIZE_M = 1500;
export const TERRAIN_VERTS = 513;
/** Approx. Shackleton–de Gerlache connecting ridge. See public/data/ephemeris/SOURCES.md */
export const SITE = { latDeg: -89.45, lonDegEast: 222.7 } as const;
export const MOON_RADIUS_KM = 1737.4;
export const EARTH_MOON_KM = 384400;
export const C_KM_S = 299792.458;
export const SOLAR_CONST = 1361; // W/m^2
export const SIGMA = 5.670374e-8; // Stefan–Boltzmann
/**
 * Simulated seconds per real second. 20× keeps the Sun visibly circling (shadows turn ~0.17°/real minute)
 * while the real Earth-up window (88 h from the 2028-09-10 start) lasts ~4.4 h of play (final review, Plan 3).
 */
export const TIME_SCALE = 20;

/** Real seconds. 150 s × TIME_SCALE 20 = 50 simulated minutes, like real particle-storm warning times. */
export const STORM = { warningS: 150, stormS: 45 };
