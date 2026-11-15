# Twenty-second approach implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** About 20 seconds from 1 km to 300 m, readable descent below 600 m, and continuous Orion-to-burn motion.
**Architecture:** Retune the existing bounded flight integrator's reference, then compose the physical ship centre before the entry camera blend. Add restrained low-altitude framing to the existing close camera. Keep the prepared live scene handoff.
**Tech Stack:** Babylon.js, TypeScript, Vite, Vitest, Playwright.
**Spec:** `docs/superpowers/specs/2026-11-13-twenty-second-approach-design.md` (approved).

## Global constraints
- Nominal 1,000 → 300 m in 18–22 real seconds at ×1; actual integrated position, thrust/fuel limits and manual inputs remain authoritative.
- Preserve approximately −12 m/s vertical and 4 m/s horizontal at 300 m, close viewpoint, original assets and live handoff.
- Low-altitude framing targets 3–5% viewport-height downward travel; no fake craft/terrain movement or large zoom-out.
- No black fade, repeated loading or frozen overlap.

## Review focus
- Terrain variation and 30/60/120 FPS: measured timing, actual AGL and fuel/force limits (Task 1).
- Ignition frame at zero/variable dt: camera and hull continuity, no duplicate base correction (Task 2).
- Low-altitude target motion and camera handoff: screen-space readability, no upward endpoint kick (Task 2/3).
- Manual throttle, pause/resume and held keys through joins (Task 3).
- Cold first burn versus warm replay: separate frame stall from transform kick; profile without media capture (Task 3).

### Task 1 — Shorter integrated descent
Files: `src/landing/guidedFlight.ts`, `tests/guidedFlight.test.ts`, `tests/brakingTerrainGuidance.test.ts`, `DESIGN.md`.
Interfaces: retain `nominalApproach(h)`, `flightReference(h)`, `stepFlight(state,command,dt)` and FlightState.
- [x] Update regression expectations to 18–22 seconds at 30/60/120 Hz and NASA terrain replay; watch them fail.
- [x] Replace the time-polynomial reference with a height-based acceleration profile: smooth vertical braking toward zero near 300 m, derive speed from its height integral; pair horizontal velocity with vertical braking and blend into the higher trajectory before 1 km. Tune the scalar braking acceleration to about 20 seconds without exceeding available thrust.
- [x] Verify no-thrust/freefall, fuel consumption, continuous derivatives at 1 km, upright arrival and all targeted tests.

### Task 2 — Entry continuity and readable framing
Files: `src/landing/burnEntry.ts`, `src/landing/descentCamera.ts`, `src/scenes/landingScene.ts`, `tests/burnEntry.test.ts`, `tests/descentCamera.test.ts`.
Interfaces: add `blendBurnCamera(incoming,velocity,goal,elapsed): Vector3` and `descentFraming(height): {distance:number; screenDrop:number}`; units documented in code.
- [x] Reproduce entry camera correction at elapsed zero with a regression; prove incoming camera position/velocity survive translation of the physical base.
- [x] Compose hull physical centre and chase goal before blending with the captured world-space camera. Remove the post-blend translation that also moves the incoming camera snapshot.
- [x] Add continuous close-camera distance easing (toward a stable ~130 m parameter below 600 m) and a small screen-space target bias; test endpoints/derivatives. Preserve the existing live landing-camera endpoint and inspect transition below 360 m.
- [x] Run targeted continuity/framing tests and capture actual screen-space motion before judging readability.

### Task 3 — Integrated QA and evidence
Files: task-specific QA script and report under `scripts/` and `docs/`; update spec, DESIGN and plan status.
- [x] Run automatic and manual browser flights through ordinary menu inputs; record ignition and low approach, measure projected hull position and frame intervals, pause/resume and held keys, and successful touchdown.
- [x] Run an unrecorded timing trace separately; identify any remaining first-frame heavy task and move verified preparation to initial loading if needed.
- [x] Full tests, production build, protected asset hashes, fresh read-only final review; address actionable findings and rerun affected checks.
- [x] Publish local clips/screenshots and a concise QA report with measured results and limitations.

Execution ruling: user approval authorizes continuous native implementation. Use per-file snapshots in this already active feature checkout because it contains approved uncommitted assets absent from HEAD; no bulk commits, reset, merge or push. A further plan-approval round is unnecessary.

