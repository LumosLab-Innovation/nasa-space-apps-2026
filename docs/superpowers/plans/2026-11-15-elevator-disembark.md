# Elevator Disembark Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** After a successful HLS touchdown, the camera glides to the elevator side, the existing astronaut rides the elevator car down, and the player takes the first step off; the ship stays where it touched down.

**Architecture:** A pure timeline module (stages + camera path) and a thin Babylon adapter (`src/landing/disembark.ts`) that `finalDescent` hands control to at touchdown. Small additions to `HlsRig` (car anchor, front gate), `Astronaut` (standing ride, place on a floor) and a `landerSite` module that replaces the fixed `HLS_POS` wherever gameplay depends on the ship's real position.

**Tech Stack:** Babylon.js 9 + Havok, TypeScript, Vitest, Playwright (dev QA).

**Spec:** `docs/superpowers/specs/2026-11-14-elevator-disembark-design.md`

## Global Constraints

- Main checkout `C:\Users\ADMIN\Downloads\NASA_Hackathon`, branch `codex/axemu-character-rig`, shared with other live sessions (Codex, map-edge session). Touch shared files only with small in-place edits (Edit tool), never whole-file rewrites. Before editing a shared file, message the other sessions with the file list (SendMessage). **No commits** until the user asks; record work in the ledger.
- Use the existing astronaut model; no model/clip changes.
- Gameplay time only (`gamePauseClock`): pause freezes camera, car, astronaut exactly.
- No camera snap/cut from touchdown to hand-over; hand-over pose = gameplay beta **1.25**, radius **7**, alpha chosen so the camera is outside the hull (≥ 5.5 m from hull axis).
- Elevator duration stays `ELEVATOR_DURATION = 12` s.
- Ship stays at its touchdown position for the session; Continue restores at `HLS_POS` (no save-schema change). Skip during flight keeps today's `HLS_POS` behaviour; skip after touchdown keeps the touchdown position.
- State commit at hand-over (today's `finish(true)` effects, incl. `landing:done`, card unlocks, `landing` lock pop). Presentation (title banner, discoveries toast) after the first step or 20 s after hand-over, whichever first. No extra dialogue line.
- Title banner is non-blocking and translucent (no full-screen black card, no input lock). Strings via `tr()` with entries in `src/i18n/vi.ts`.
- Reduced camera motion (`reducedCameraMotion()`): camera move duration halved and no overshoot.
- Failed landings never start the disembark; rig-less fallback behaves exactly as today.

## Review Focus

- Pause mid-ride then resume: astronaut stays glued to the car floor, camera continues without a jump → Task 1 test `pause leaves the camera pose unchanged`, Task 5 Playwright check.
- Esc pressed at every stage (camera move, riding, arrived): ends in a playable state with the ship at its touchdown position and no duplicate unlocks → Task 6 test `skip during disembark commits once and keeps the touchdown position`.
- Player never presses a key after hand-over: banner/toast still appear after 20 s, autosave works → Task 1 test `presentation falls back after 20 s`.
- Touchdown far from `HLS_POS` (e.g. +25 m): storm shelter, rover deploy, ending boarding and hull collider follow the real ship → Task 3 tests.
- Frame-rate independence: camera path sampled at 30/60/144 FPS ends on the same pose → Task 1 test `camera path is frame-rate independent`.

---

### Task 1: Pure disembark timeline and camera path

**Files:**
- Create: `src/landing/disembarkTimeline.ts`
- Test: `tests/disembarkTimeline.test.ts`

**Interfaces:**
- Produces:
  - `type CamPose = { alpha: number; beta: number; radius: number; target: [number, number, number] }`
  - `type DisembarkStage = 'deploying' | 'riding' | 'arrived' | 'stepped' | 'done'`
  - `const DISEMBARK = { appearAt: .30, cameraMoveS: 3.5, presentFallbackS: 20, stepOffM: 1.2 }`
  - `stageFor(s: { elevator: number; deployed: boolean; gate: number; steppedOff: boolean; sinceHandOver: number }): DisembarkStage` — `deploying` until elevator ≥ appearAt; `riding` until deployed && gate ≥ 1; `arrived` until steppedOff or sinceHandOver ≥ presentFallbackS; then `stepped`; `done` is set by the adapter after presentation.
  - `sidePose(carTop: [number,number,number], outwardYaw: number): CamPose` — side three-quarter view framing the car at the airlock and the hull: radius 22, beta 1.32, alpha = outward direction rotated +55°.
  - `endPose(carFloor: [number,number,number], outwardYaw: number, hullCentre: [number,number,number]): CamPose` — beta 1.25, radius 7, target carFloor + (0, 0.8, 0), alpha = outward direction rotated +55° (camera outside the hull).
  - `cameraAt(poses: { from: CamPose; side: CamPose; end: CamPose }, move: number, descend: number): CamPose` — `move` (0..1) blends from→side, `descend` (0..1, elevator `lower` stage) blends side→end; angles interpolated along the shortest arc; smoothstep easing on both.
  - `moveProgress(sinceTouchdown: number, reduced: boolean): number` — 0 before 1 s, eased to 1 over `cameraMoveS` (half when reduced).

- [ ] **Step 1: Write the failing tests** in `tests/disembarkTimeline.test.ts`:
  - `stages run deploying → riding → arrived → stepped in order` (sweep elevator 0→1, gate 0→1, then steppedOff true; assert sequence has no back-steps).
  - `presentation falls back after 20 s` (`stageFor({elevator:1,deployed:true,gate:1,steppedOff:false,sinceHandOver:20})` → `'stepped'`; at 19.9 → `'arrived'`).
  - `end pose is the gameplay framing outside the hull` (beta 1.25, radius 7; camera position computed from pose is ≥ 5.5 m horizontally from hullCentre for 8 outward yaws).
  - `camera path has no jumps` (sample move/descend on a 600-step schedule matching the real timing; max per-step change of target ≤ 0.15 m, alpha/beta ≤ 0.02 rad, radius ≤ 0.1 m; first sample equals `from`, last equals `end` within 1e-6).
  - `camera path is frame-rate independent` (simulate 30/60/144 FPS through `moveProgress`; final poses equal within 1e-6).
  - `pause leaves the camera pose unchanged` (dt 0 → identical pose).
- [ ] **Step 2:** `npx vitest run tests/disembarkTimeline.test.ts --maxWorkers=1` → FAIL (module missing).
- [ ] **Step 3:** Implement the interfaces above in `src/landing/disembarkTimeline.ts` (no Babylon imports).
- [ ] **Step 4:** Run → PASS.
- [ ] **Step 5:** Ledger entry (no commit).

### Task 2: HLS rig car anchor and front gate

**Files:**
- Modify: `src/demo/hlsElevatorMotion.ts` (add `frontGuardOpen`), `src/models/hlsRig.ts` (in-place: gate state in `applyPose`/`update`, new API)
- Test: `tests/hlsElevatorMotion.test.ts` (append)

**Interfaces:**
- Produces:
  - `frontGuardOpen(t: number, gate: number): number` = `guardPose(t).front * (1 - stage(gate, 0, 1))` (gate opening folds the front guard back to its stowed, collision-checked angle).
  - `HlsRig.setGate(open: 0 | 1): void`, `HlsRig.gateOpen: number` (0..1, eased, 1.2 s full stroke, gameplay `dt` only), `HlsRig.carAnchor(): { floor: Vector3; top: Vector3; outwardYaw: number }` — world position of the near-LOD car floor centre (car node absolute position, floor height measured once from the car mesh bounds), the car position at elevator 0 (airlock level, `top`), and the yaw pointing out of the car away from the hull.
  - `stowElevator`/`setTargets(…, immediate)` reset `gate` to 0.

- [ ] **Step 1: Failing tests** (append to `tests/hlsElevatorMotion.test.ts`): `front gate is closed at gate 0 and stowed at gate 1` (`frontGuardOpen(1,0) === guardPose(1).front`, `frontGuardOpen(1,1) === 0`), `front gate opens monotonically` (gate 0→1 in 50 steps, non-increasing).
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement `frontGuardOpen`; in `hlsRig.ts` use it for `ship.guards[2]` and add the gate state/API (in-place edits only).
- [ ] **Step 4:** Run the file plus `tests/hlsLandingGearMotion.test.ts` → PASS.
- [ ] **Step 5:** Ledger entry.

### Task 3: Lander site follows the real touchdown

**Files:**
- Create: `src/world/landerSite.ts`, `tests/landerSite.test.ts`
- Modify (in-place reads of `HLS_POS` → `landerSite()`): `src/challenges/solarStorm.ts:62`, `src/rover/roverSystem.ts:22,33` (`DEPLOY` becomes `deployPoint()`), `src/survival/survivalSystem.ts:65`, `src/story/endingSystem.ts:133,144,165,170`; `src/scenes/surfaceScene.ts` (hull collider placement extracted to a local `placeHullCollider()` that recreates the static `PhysicsAggregate` at the rig's root; called at start and on landing commit; `resetLanderSite()` at scene creation)
- Test: `tests/storm.test.ts`, `tests/rover.test.ts`, `tests/ending.test.ts` (append one case each)

**Interfaces:**
- Produces: `landerSite(): P2`, `setLanderSite(p: P2): void`, `resetLanderSite(): void` (default `HLS_POS`).

- [ ] **Step 1: Failing tests:** `landerSite.test.ts` (`defaults to HLS_POS`, `set then reset`); storm: `shelter follows the landed ship` (after `setLanderSite({x: HLS_POS.x + 25, z: HLS_POS.z})`, a point 2 m from the new site is protected, one 2 m from `HLS_POS` is not); rover: `deploy point follows the landed ship`; ending: `farewell approach uses the landed ship`. Each test calls `resetLanderSite()` in `afterEach`.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement module and in-place replacements (announce file list to other sessions first).
- [ ] **Step 4:** Run the four test files plus `tests/zones.test.ts` → PASS.
- [ ] **Step 5:** Ledger entry.

### Task 4: Astronaut standing ride and floor placement

**Files:**
- Modify: `src/player/gait.ts` (export `STANDING_POSE`, the idle pose currently built inline as `{ ...ZERO, bob: -BODY.flexM }`), `src/player/astronaut.ts` (in-place)
- Test: `tests/gait.test.ts` (append), `tests/astronautRide.test.ts` (new)

**Interfaces:**
- Produces:
  - `rideRootY(at: { y: number }, standing: boolean): number` exported from `astronaut.ts` (standing: `at.y + HEIGHT / 2`; seated: `at.y - 0.82 + HEIGHT / 2`).
  - `Astronaut.setRide(at: { x; y; z; yaw; standing?: boolean } | null)` — standing applies `STANDING_POSE`, no rover camera swing.
  - `Astronaut.placeOnFloor(x: number, y: number, z: number, yaw: number): void` — clears the ride, puts the capsule centre at `y + HEIGHT/2`, zero velocity, sets facing yaw and camera target (like `teleport`, but at a given floor height).

- [ ] **Step 1: Failing tests:** `rideRootY` values for both modes; `STANDING_POSE` equals the idle pose used by gait when still (compare with the gait output for a grounded, motionless step).
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement (in-place edits).
- [ ] **Step 4:** Run `tests/astronautRide.test.ts tests/gait.test.ts tests/astronautRig.test.ts` → PASS.
- [ ] **Step 5:** Ledger entry.

### Task 5: Disembark adapter and act banner

**Files:**
- Create: `src/landing/disembark.ts`, `src/ui/actBanner.ts`
- Modify: `src/i18n/vi.ts` (append keys: `"W — take your first step"`, banner reuses the existing card string)
- Test: `tests/disembark.test.ts` (NullEngine scene with a fake rig/player exposing the Task 2/4 interfaces)

**Interfaces:**
- Consumes: Task 1 timeline, Task 2 rig API, Task 4 astronaut API.
- Produces:
  - `createDisembark(w: { scene: Scene; ui: AdvancedDynamicTexture; hud: Hud; player: Astronaut }, o: { rig: HlsRig; from: CamPose; hullCentre: Vector3; touchdownAt: number; onHandOver: () => void }): Disembark`
  - `interface Disembark { readonly stage: DisembarkStage; update(dt: number, move: MoveInput): void; skip(): void; dispose(): void }`
  - `showActBanner(ui: AdvancedDynamicTexture, text: string, seconds?: number): () => void` (translucent lower-third, fades in 0.6 s / out 0.8 s, gameplay time, returns dispose).
- Behaviour: own ArcRotateCamera driven by `cameraAt`; player enabled and `setRide({...rig.carAnchor().floor, yaw: outwardYaw, standing: true})` every frame from `appearAt` on; when elevator deployed → `rig.setGate(1)`; when gate = 1: temporary static box collider (car footprint, top at floor height), `player.placeOnFloor(...)`, camera hand-over to `player.camera` with `endPose` values, prompt via `w.hud` hint, `onHandOver()` once; stepped off = player ≥ `stepOffM` horizontally from the floor anchor (the normal `onStep` handler makes the boot print and dust); then banner (`tr('Sea of Tranquility, 1969…\n\nSouth Pole, 2028.')`) + `tr('New discoveries in your Science Notebook (Tab)')` toast, remove collider, `stage = 'done'`. `skip()` jumps to hand-over state immediately (gate open, player placed, collider, commit) then presentation. `dispose()` removes camera, collider, banner, prompt.

- [ ] **Step 1: Failing tests:** `hands over exactly once when the gate is open`, `astronaut rides glued to the car floor` (fake rig moves the floor; ride target equals anchor each frame), `skip at riding commits once and leaves a playable player`, `dispose removes camera and collider`.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run → PASS.
- [ ] **Step 5:** Ledger entry.

### Task 6: Hand control from finalDescent to the disembark

**Files:**
- Modify (in-place, announce first): `src/landing/finalDescent.ts`, `src/scenes/surfaceScene.ts` (pass a disembark factory and call `setLanderSite` + `placeHullCollider()` on commit)
- Test: `tests/descent.test.ts` (append)

**Interfaces:**
- Consumes: Task 3 `setLanderSite`, Task 5 `createDisembark`.
- `createFinalDescent(..., opts)` gains `disembark?: (ctx: { hls: TransformNode; rig: HlsRig; from: CamPose; commit: () => void }) => Disembark`.
- Behaviour: on successful contact with a rig and a factory, after the existing 1 s contact settle create the disembark (`from` = current descent camera pose); stop the card timer and descent camera writes; each `update` forwards to `disembark.update`. `commit` = today's `finish(true)` minus: no `hls.position` snap (keep touchdown position, call `setLanderSite` with it), no teleport to `PLAYER_SPAWN`, no camera swap (disembark already swapped), no title card. `skip()` during disembark → `disembark.skip()`. Failed attempts and rig-less runs unchanged.

- [ ] **Step 1: Failing tests:** `successful contact hands control to the disembark factory once`, `skip during disembark commits once and keeps the touchdown position`, `failed contact never creates a disembark`, `without a factory the landing finishes as before`.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run `tests/descent.test.ts tests/finalReviewFixes5.test.ts tests/descentBridge.test.ts` → PASS.
- [ ] **Step 5:** Ledger entry.

### Task 7: Docs, full verification, in-game QA

**Files:**
- Modify: `DESIGN.md` (landing section: elevator disembark, ship stays where it landed, Continue at `HLS_POS`) — in-place.

- [ ] **Step 1:** Update DESIGN.md.
- [ ] **Step 2:** `npm test -- --maxWorkers=1`; list any failures caused by other sessions' in-progress work separately. `npm run build` → PASS.
- [ ] **Step 3:** Playwright on the dev server: New Game → landing (assisted and manual) → watch ride → first step; pause mid-ride; Esc in each stage; Continue after landing. Screenshots at camera move, mid-ride, hand-over, after first step. Console free of new errors.
- [ ] **Step 4:** Whole-change review by a fresh reviewer, one fix pass, then report to the user (no commit unless asked).
