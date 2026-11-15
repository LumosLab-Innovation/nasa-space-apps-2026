# Seamless descent implementation plan
> **For agentic workers:** Use superpowers:executing-plans to implement task-by-task.

**Goal:** Preload the surface, create a five-second camera bridge, hand off without black/loading, verify manual/auto and record video.
**Architecture:** Mission owns prepared dormant surface and orbital scene. Pure bridge trajectory ends at existing landStart. Intro stages camera/ship for 3.5 s, then transfers canonical ship-relative camera/rig/throttle/input to the surface; a short image overlap blends the matched views before final control handoff.
**Tech Stack:** Existing Babylon/TypeScript/Vite, Vitest, Playwright.
**Spec:** ../specs/2026-11-13-seamless-descent-design.md (approved).

## Constraints
- No second loading or black fade between orbit and final descent.
- Preserve approved assets, Earth and existing stable cameras; only transition trajectory changes.
- Dormant surface cannot advance game time, physics, input, resources or saves.
- End bridge at 300 m, vy=-12, vx=4, tilt=0 and existing landing reserve.

## Review focus
- Pause/Settings, held Space and single input ownership at scene boundary.
- No duplicate clocks/rig steps, no preload side effects, cleanup when leaving menu.
- Rendered ship alignment includes orbital model offset and scale.
- Manual and auto handoff preserve throttle and rig motion.
- Loading error/skip/continue and isolated intro debug remain usable.

### Task 1: Trajectory and handoff contract
- [x] Write tests for monotonic height and endpoint derivatives/offset; observe failure.
- [x] Add landing/descentBridge.ts pure trajectory and typed handoff; implement analytic endpoint continuity.
- [x] Add Keyboard enable/held-state transfer and HLS rig motion snapshot/restore.

### Task 2: Prepared scenes and cinematic
- [x] Surface dormant mode guards physics, keyboard, camera controls and gameplay observers.
- [x] Prepare both scenes under initial loading; create local landing view before prewarm, without dialogue.
- [x] Intro enters bridge at 500 m, moves ship/camera, maintains one HUD; outputs canonical handoff without fade.
- [x] FinalDescent starts at transferred pose, blends visual background, completes bridge, then releases control with same camera/throttle/gear.
- [x] Add VI/EN HUD copy and cleanup hooks; preserve Continue and skip.

### Task 3: Verification
- [x] Run targeted unit tests, i18n coverage and production build.
- [x] Browser QA normal startup, manual/auto handoff, pause/settings, held Space, skip and Continue. Capture screen-space alignment and frame timing.
- [x] Record actual bridge + manual control and assisted landing clips.
- [x] Independent final review, fix substantive findings, report artifacts.

## Ledger
Ruling: continue in existing live feature checkout; preserve previous dirty work and keep baseline copies, no bulk commits.
Ruling: use a single outgoing-frame overlap (0.45 s) instead of rendering two complete worlds concurrently. Incoming pose is held identical during overlap; background blend never goes through black. Total cinematic ~5.45 s, within approved 4–6 s. Lower render/memory overhead; validate visually for frozen-frame or ghost artifacts.

Task 1: trajectory tests RED (missing module) → GREEN; keyboard transfer test passed.
Task 2: prepared scenes/cinematic/HUD implemented; protected asset hashes unchanged.
Task 3: full suite 443/443, build passed, manual/auto full landing QA, delayed loading/Continue and corrupt-model Retry/skip passed; two browser video excerpts exported.
Final: fixed detached exploration camera, skipped-bridge physics, and obscured pause overlay — qa-descent-lifecycle.cjs RED→GREEN; full suite 443/443.
Final review: no minor findings deferred. Report: docs/screens/descent-bridge-report.md.
Ruling: retain existing dirty work and task baselines locally rather than committing unrelated edits or deleting the audit workspace. Cost: task-specific rollback must use the captured baseline carefully.
