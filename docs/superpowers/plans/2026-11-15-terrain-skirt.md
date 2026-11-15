# Terrain Skirt Implementation Plan

> **Abandoned 2026-11-15 (user decision):** the implemented skirt rendered as floating walls/overhangs during the descent (user screenshot at 178 m). All code was removed and the game restored to the previous visible 1.5 km boundary. Kept only as a record.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hide the square 1.5 km map edge (QA P2) with a visual terrain skirt that uses the core's own material, and have PIP explain the now-invisible boundary once.

**Architecture:** A pure height function (`skirtHeight`) mirrors/re-samples the NASA heightmap outside the core, fades relief, subtracts game-scale lunar curvature and is capped by a "horizon guard" so it can never hide a Sun/Earth the science says is visible. A mesh builder turns it into watertight square rings around the unchanged core terrain. Cameras and sky objects are pushed further out so the skirt is drawn. A tiny once-per-session notice plays a PIP line when the world clamp stops the player or rover.

**Tech Stack:** TypeScript, Babylon.js 9.34, Vitest (`npm test -- --maxWorkers=1`), Vite.

**Spec:** `docs/superpowers/specs/2026-11-15-terrain-skirt-design.md` (approved 2026-11-15).

## Global Constraints

- Core terrain (`src/world/terrain.ts`, mesh `terrain`, material `regolith`, 513×513, 1,500 m) is not modified in geometry, material, lighting or shadows.
- No new dataset; heightmap bytes unchanged. Approved descent camera, flight physics, HUD, handoff timing unchanged.
- Sunlight / Earth visibility / night science keeps reading the heightmap only (`src/world/lighting.ts` untouched).
- Skirt mesh name `terrainSkirt`; `isPickable = false`; no physics; not a shadow caster; `receiveShadows = true`; same material instance as `terrain`.
- All distances are game metres. Game-scale Moon radius for curvature: 868,700 m (half of 1,737,400 m, because the world is squeezed ×0.5).
- Skirt half-extent 12,000 m.
- Edge line plays once per play session (not saved), only when no dialogue is playing, no input lock, no descent, no story panel.
- Working tree contains unrelated uncommitted work: stage only the files each task names. Commit only if the user has authorised commits for this run.
- Run tests with `npm test -- --maxWorkers=1`.

## Review Focus

1. Watertight seam: a skirt inner-ring vertex that differs from the core edge by float error shows a hairline crack against the black sky. Test: inner ring positions equal core edge positions exactly (Task 2).
2. Horizon guard at ridge viewpoints (camp/landing ~55 m high): a skirt hill that rises into view above −0.27° where the core horizon is lower would hide the Sun. Test over all azimuths at the five checkpoints (Task 1).
3. Corners of the square ring: diagonal regions (both |x|,|z| > 750) must use the same distance-outside-core formula, or a crease/cliff appears along the diagonals. Test: height continuous across the diagonal line (Task 1).
4. Sky objects behind far terrain: Sun disc/Earth/stars at 4 km would be painted onto 4–12 km ground. Test: `SKY_DIST` > skirt rim distance from any playable point, and camera `maxZ` > `SKY_DIST × 1.1` (Task 2).
5. Edge notice spam / silence: hitting the edge while a dialogue plays must not consume the one-time line; repeated hits never replay it. Test (Task 3).

---

### Task 0: Baseline captures (before any code change)

**Files:**
- Create: `docs/screens/terrain-skirt/README.md` (list of captures and FPS numbers)

- [ ] **Step 1:** `npm run dev`; in Chrome at 1440×900 capture "before" PNGs into `docs/screens/terrain-skirt/before-*.png`: descent at ~300, ~208, ~150 m in Autopilot and in Manual; standing on Sunny Hill (`zone('solarHill')`) looking outward to the south and west; the liftoff/ending wide shot. Use the dev globals `window.__world` / `window.__intro` to reach states quickly.
- [ ] **Step 2:** Record FPS (mean and p95 frame time over ~10 s) at the descent ~208 m and at Sunny Hill. Write the numbers and the GPU/browser into the README.
- [ ] **Step 3: Commit** `docs/screens/terrain-skirt/` (if commits authorised).

### Task 1: Skirt height function with horizon guard

**Files:**
- Create: `src/world/terrainSkirt.ts`
- Test: `tests/terrainSkirt.test.ts`

**Interfaces:**
- Consumes: `sampleHeight`, `Heightmap` (`src/data/heightmap.ts`); `horizonElevationDeg` (`src/world/lighting.ts`); `zone`, `MICA_POS`, `RELAY_SPOT` (`src/world/zones.ts`); `WORLD_SIZE_M` (`src/config/constants.ts`).
- Produces:
  - `export const SKIRT_HALF_M = 12_000`
  - `export const GAME_MOON_RADIUS_M = 868_700`
  - `export function outsideCoreM(x: number, z: number, coreHalf?: number): number` — Euclidean distance from (x,z) to the core square (0 inside).
  - `export function curvatureDropM(d: number): number` — `d*d / (2*GAME_MOON_RADIUS_M)`.
  - `export interface HorizonGuardPoint { x: number; z: number; eyeM: number; floorDeg: number }`
  - `export const GUARD_POINTS: HorizonGuardPoint[]` — Sun rule (eye 0.5, floor −0.27°) at `zone('landing')`, `zone('base')`, `zone('solarHill')`, `MICA_POS`, `RELAY_SPOT`; plus Earth rule (eye 2, floor −1°) at `RELAY_SPOT`.
  - `export interface SkirtField { height(x: number, z: number): number }`
  - `export function createSkirtField(hm: Heightmap, guard?: HorizonGuardPoint[]): SkirtField` — precomputes the guard; `height` returns `sampleHeight` inside the core and the skirt height outside.
  - `export function skirtHorizonDeg(field: SkirtField, hm: Heightmap, p: {x:number;z:number;eyeM:number}, azDeg: number, stepM?: number): number` — max elevation angle of skirt terrain (outside the core only, out to `SKIRT_HALF_M`) seen from p along azDeg (0 = +z, 90 = +x, as in `lighting.ts`).

- [ ] **Step 1: Write the failing tests** in `tests/terrainSkirt.test.ts` (use the real heightmap the way `tests/lighting.test.ts`/`tests/heightmap.test.ts` load it; fall back to `generateCraterField(513, 1500, 7)` only if those tests do):
  - `outsideCoreM(0,0)===0`, `outsideCoreM(760,0)≈10`, `outsideCoreM(760,760)≈Math.hypot(10,10)`.
  - `curvatureDropM(11_000)` ≈ 69.6 (±0.1); monotonic increasing over 0…12,000.
  - `field.height` equals `sampleHeight(hm,x,z)` (|Δ| < 1e-4) at 200 points along each of the four edges and at the four corners, approached from 0.01 m outside.
  - Continuity: for 500 random points outside the core, `|height(p) − height(p + 0.5 m in x)| < 2 m`; includes points on the diagonals |x|=|z|>750 (Review Focus 3).
  - Finite everywhere on a 200 m grid over ±12,000 m.
  - Horizon guard: for every `GUARD_POINTS` entry and every az in 0,2,…,358: `skirtHorizonDeg(field,hm,p,az) ≤ Math.max(horizonElevationDeg(hm,p.x,p.z,az,p.eyeM,2200), p.floorDeg) + 0.05` (Review Focus 2). `maxDistM = 2200` covers the whole core (diagonal 2,121 m); the science default of 1,400 m can stop short of the far edge, and the skirt may legitimately continue an edge the core already shows.
  - No duplicated landmark: the Dark Crater (`ICE_SPOT` = (−180, −500)) mirrored about the south edge lands at (−180, −1000). Sample a 9×9 grid at 15 m spacing around both points, each relative to its own centre height: mean |field.height(mirror grid) − sampleHeight(original grid)| > 2 m.
- [ ] **Step 2: Run** `npm test -- --maxWorkers=1 tests/terrainSkirt.test.ts` → FAIL (module missing).
- [ ] **Step 3: Implement `src/world/terrainSkirt.ts`.** Algorithm for `height` outside the core (d = `outsideCoreM`):
  ```
  fold(v)        = reflect v into [-750, 750] (triangle wave, period 3000)
  mirrored       = sampleHeight(hm, fold(x), fold(z))
  alternate      = sampleHeight(hm, fold(z + 911), fold(-x + 437))   // rotated 90° + offset: non-mirrored relief
  detail         = lerp(mirrored, alternate, smoother(d / 120))     // mirror only in a 120 m seam band
  base           = lerp(edgeMean(x,z), 0, smoother(d / 2000))       // edgeMean: mean of sampleHeight over ±80 m along the nearest core edge point; heightmap mean is 0
  relief         = 1 - 0.85 * smoother(d / 2500)
  raw            = base + (detail - base) * relief - curvatureDropM(d)
  excess         = max(0, raw - guardLimit(x,z))
  height         = raw - excess * smoother(d / 60)                 // guard fades in over the first 60 m: no step at the seam
  guardLimit     = min over GUARD_POINTS g of: g.eye + tan(max(sciHorizon_g(az_g), g.floorDeg)) × dist(g, x,z)
  ```
  `smoother` is the existing quintic in `src/landing/descentGeometry.ts` (import it). `sciHorizon_g(az)` is precomputed for 720 half-degree buckets per guard point with `horizonElevationDeg(hm, g.x, g.z, az, g.eyeM, 2200)`; use the minimum of the two neighbouring buckets. `g.eye = sampleHeight(hm,g.x,g.z) + g.eyeM`; `az_g` is the azimuth from g to (x,z) with the `lighting.ts` convention. Core edge points lie inside that 2,200 m horizon, so the guard is (near) inactive at the seam and continuity holds. The constants 120 / 80 / 2000 / 0.85 / 2500 are starting values; tune for looks in Task 4 without breaking the tests.
- [ ] **Step 4: Run** the test file → PASS. Then the full suite → PASS.
- [ ] **Step 5: Commit** `src/world/terrainSkirt.ts tests/terrainSkirt.test.ts` — `feat: terrain skirt height field with horizon guard`.

### Task 2: Skirt mesh, scene wiring, far view, docs

**Files:**
- Modify: `src/world/terrainSkirt.ts` (add mesh builder)
- Modify: `src/scenes/surfaceScene.ts:121-126` (create skirt after `createTerrain`)
- Modify: `src/config/constants.ts` (add `FAR_VIEW_M`)
- Modify: `src/world/sky.ts:10` (`SKY_DIST`)
- Modify: `src/player/astronaut.ts:132` (`camera.maxZ`)
- Modify: `src/story/endingSystem.ts:141` (`cam.maxZ`)
- Modify: `DESIGN.md:78` (replace the sentence accepting the visible boundary)
- Test: `tests/terrainSkirt.test.ts`, `tests/sky.test.ts`

**Interfaces:**
- Consumes: `createSkirtField`, `SKIRT_HALF_M` (Task 1).
- Produces:
  - `export const SKIRT_RINGS = 48`, `export const SKIRT_SEGMENTS_PER_SIDE = 512`
  - `export function buildSkirtRings(hm: Heightmap, field: SkirtField): { positions: Float32Array; indices: Uint32Array }` — pure, testable.
  - `export function createTerrainSkirt(scene: Scene, hm: Heightmap, core: Mesh): Mesh`
  - `export const FAR_VIEW_M = 60_000` in `src/config/constants.ts`.

- [ ] **Step 1: Write failing tests:**
  - `buildSkirtRings`: vertex count `(SKIRT_RINGS+1) * 4 * 512`; ring 0 vertex k equals the core edge grid vertex exactly (x, y from `hm.heights[r*513+c]`, z) for all 2048 perimeter points, walking sides in order z=−750 (x ascending), x=+750 (z ascending), z=+750 (x descending), x=−750 (z descending) (Review Focus 1); outermost ring half-extent is exactly 12,000; ring half-extents strictly increasing with `r_k = 750 + 11250 * (k/48)^2`; all indices < vertex count; triangle winding gives upward normals (cross product y > 0) for a flat test heightmap.
  - `createTerrainSkirt` with `NullEngine` (pattern in `tests/astronautInteraction.test.ts`): name `terrainSkirt`, `material === core.material`, `isPickable === false`, `receiveShadows === true`, no physics body, and `scene.getMeshByName('terrain')` still returns the core.
  - `tests/sky.test.ts`: export `SKY_DIST` from `sky.ts`; assert `SKY_DIST ≥ 40_000` (> 12,000 + 750·√2 + margin) and `FAR_VIEW_M > SKY_DIST * 1.1` (Review Focus 4).
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement.**
  - `buildSkirtRings`: ring k half-extent `r_k` as above; 512 points per side at `-r + 2r·j/512`; ring 0 heights read straight from `hm.heights` (not `sampleHeight`) so they match bit-for-bit; other rings from `field.height`. Quads between ring k and k+1 by matching perimeter index (same count per ring → no T-junctions).
  - `createTerrainSkirt`: compute normals with `VertexData.ComputeNormals`, then overwrite ring-0 normals with the core's edge normals (`core.getVerticesData('normal')` at the matching grid index). Same material instance, flags from Global Constraints, `freezeWorldMatrix()`, `doNotSyncBoundingInfo = true`. Do not add to `sky.shadows` casters.
  - `surfaceScene.ts`: `createTerrainSkirt(scene, hm, terrain)` immediately after `createTerrain`.
  - `SKY_DIST = 50_000` (sun disc and Earth radii already derive from it, so angular sizes are unchanged). `astronaut.camera.maxZ = FAR_VIEW_M`; ending `cam.maxZ = FAR_VIEW_M`.
  - `DESIGN.md` line 78: replace "The existing 1.5 km playable terrain has a finite visible boundary from some elevated angles; this revision does not resculpt or expand it." with a short paragraph: the 1.5 km core is surrounded by a 12 km illustrative skirt derived from the same NASA LOLA heightmap (mirrored at the seam, re-sampled beyond, relief faded, game-scale curvature), visual only, capped so it never hides a Sun/Earth the terrain science says is visible; the boundary is still enforced 10 m inside the core and PIP explains it once.
- [ ] **Step 4: Run** the full suite → PASS; `npm run build` → succeeds (existing large-chunk warning is expected).
- [ ] **Step 5: Commit** the files above — `feat: terrain skirt hides the map edge`.

### Task 3: PIP edge notice

**Files:**
- Create: `src/story/edgeNotice.ts`
- Modify: `src/player/astronaut.ts:269-277` (expose edge hit)
- Modify: `src/rover/roverSystem.ts:241-246` (expose edge hit)
- Modify: `src/content/lines.en.ts`, `src/content/lines.vi.ts` (append `pip_edge` at the end of both)
- Modify: `src/scenes/surfaceScene.ts` (wire after `player.update`)
- Test: `tests/edgeNotice.test.ts`

**Interfaces:**
- Produces:
  - `export interface EdgeNotice { update(hitEdge: boolean, canSpeak: boolean): boolean; readonly said: boolean }`
  - `export function createEdgeNotice(): EdgeNotice` — returns true exactly once: the first call with `hitEdge && canSpeak`.
  - `Astronaut.atWorldEdge: boolean` — true for the frame in which `clampToWorld` changed the position.
  - Rover system return object gains `readonly atWorldEdge: boolean` — true for the frame its blocked branch fires and `clampToWorld(ax, az)` differs from `(ax, az)` (the probe point ahead).

- [ ] **Step 1: Write failing tests** `tests/edgeNotice.test.ts`:
  - `update(false,true)` → false; `update(true,false)` → false and `said === false` (Review Focus 5); then `update(true,true)` → true; afterwards `update(true,true)` → false forever.
  - `LINES.pip_edge` and `LINES_VI.pip_edge` exist, one line each, speaker `pip` (the existing parity test in `tests/i18n.test.ts` covers key order).
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement.**
  - Lines (exact copy):
    - EN: `pip_edge: [{ speaker: 'pip', face: 'worried', text: "Whoa, that's too far! Our battery and oxygen won't get us back from out there. Let's stay near camp." }]`
    - VI: `pip_edge: [{ speaker: 'pip', face: 'worried', text: 'Ôi, xa quá rồi! Pin và O2 của mình không đủ để quay về từ ngoài đó đâu. Mình ở gần trại thôi nhé.' }]`
  - Rover keeps its existing toast; the PIP line is additional.
  - `surfaceScene.ts`, right after `player.update(...)`: `if (edgeNotice.update(player.atWorldEdge || rover.atWorldEdge, !dialogue.busy && !lock.locked && !descent?.active && !panel.open)) void dialogue.play('pip_edge');` — `edgeNotice` created once per `createSurfaceScene` call (a page reload/new game starts a fresh session).
- [ ] **Step 4: Run** full suite → PASS (including `tests/i18n.test.ts`).
- [ ] **Step 5: Commit** — `feat: PIP explains the map boundary once`.

### Task 4: Visual QA, tuning and FPS

**Files:**
- Modify: `docs/screens/terrain-skirt/README.md`; add `after-*.png`
- Modify (tuning only): constants in `src/world/terrainSkirt.ts`

- [ ] **Step 1:** Repeat every Task 0 capture as `after-*.png` from the same positions/heights/camera.
- [ ] **Step 2:** Inspect each pair. Pass = no straight edge, square corner, black gap, ground popping in, hairline seam or brightness step at the 750 m boundary; ground near the ship looks unchanged; no Sun/Earth/stars painted onto distant ground; no obvious mirrored copy of the Dark Crater. If skirt relief looks fake or repetitive, tune the Task 1 constants and re-run `tests/terrainSkirt.test.ts` after each change.
- [ ] **Step 3:** Walk/drive into the boundary once: the PIP line appears once, in English and (after switching language) Vietnamese in a fresh session; never during the descent.
- [ ] **Step 4:** Re-measure FPS at the same two spots; record before/after numbers in the README. If p95 frame time worsens by more than ~2 ms, reduce outer-ring resolution (keep ring 0 at 512 segments; halve segments every N rings only with stitched transitions) and re-measure.
- [ ] **Step 5:** Run `node scripts/qa-close-descent.cjs` (dev server running) → its collar/backdrop assertions still pass. Full suite and `npm run build` → pass.
- [ ] **Step 6: Commit** README, captures and any tuning — `test: terrain skirt visual QA and FPS`.
