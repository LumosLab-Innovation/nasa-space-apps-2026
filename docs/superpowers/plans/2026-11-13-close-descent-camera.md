# Close Descent Camera Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Restore the preferred close low chase shot and earlier landing presentation while retaining physically correct ground clearance.
**Architecture:** Share camera parameters between the orbit approach, live bridge endpoint and playable landing camera. Keep the prepared-scene/live-render handoff and remove the rejected visual terrain extension from startup. Work in the existing isolated preview, then copy only this task's changed files into the live checkout after QA.
**Tech Stack:** Babylon.js, TypeScript, Vite, Vitest, Playwright.
**Spec:** `docs/superpowers/specs/2026-11-13-close-descent-camera-design.md`

## Global Constraints
- Selected visual reference: Gần hơn, physical ship scale, unchanged lunar/Earth/model assets.
- Low approach parameter: `0.8 × (110 + 100 × clamp(height / 1000, 0, 1))` metres; camera offsets `(-d, .45d, .3d)`, target forward `.6d`.
- No black handoff, second loading screen or frozen screenshot overlap. Preserve pause, held inputs, saves, gear performance and initial preparation.

## Review Focus
- Camera and target velocity must agree on the final handoff, including yaw other than zero.
- High approach must blend into the close camera without a sudden zoom at 1,000 m.
- Restoring the surface presentation must not reintroduce the artificial collar after skip/Continue.
- Camera must remain above terrain during manual drift and at touchdown.
- Skip/pause/resize during the live overlap must still clean up scenes and preserve input ownership.

### Task 1: Close camera and matched landing handoff
**Files:** create `src/landing/descentCamera.ts`, `tests/descentCamera.test.ts`; modify `src/scenes/landingScene.ts`, `src/landing/bridgeMotion.ts`, `src/landing/finalDescent.ts`, `tests/bridgeMotion.test.ts`.
**Interfaces:** `closeApproachDistance(heightM:number):number`, `approachCameraDistance(heightM:number):number` return metres; `landingCamera(heightM:number)` returns `{radius:number,targetHeight:number,beta:number,radiusPerMetre:number}`.
- [x] Add tests for exact approved distances at 100/300/500/1000 m; continuity at high-approach blend endpoints; bridge endpoint framing and finite-difference velocity matching at multiple yaws. Run and observe failure.
- [x] Implement shared camera parameters. Keep the approved approach up/side/target ratios. Blend to the existing wide approach above 1,500 m over 4,500 m; keep physical clearance and near clip corrections.
- [x] Restore original landing beta 1.05, radius `110+.25*max(0,h)`, target +18 m. Use the same values and derivatives for the bridge endpoint and first controlled frame. Check camera-ground clearance in browser.
- [x] Run targeted tests and build; compare preview captures at the four heights against the selected images.

### Task 2: Restore surface presentation and verify integration
**Files:** modify `src/scenes/missionStartup.ts`, `DESIGN.md`; add task-specific browser QA/evidence and update the ledger/spec status.
- [x] Add browser assertions that the incoming terrain retains its original `regolith` material and no descent collar/backdrop is created. Run against the current code and observe failure.
- [x] Remove `prepareDescentBackdrop` startup import/call/configure hook. Keep dormant surface creation, shader/rig preparation and live compositor intact.
- [x] Run all tests/build and browser QA for natural auto touchdown, targeted manual handoff/held inputs, pause/resize, skip and New Game/Continue loading. Record frame times separately from screenshot/video operations.
- [x] Obtain a fresh read-only final review of this task's delta, resolve important findings, integrate only changed files, rerun live smoke QA and capture a clip through 500 → 300 → 100 m.
- [x] Document outcomes and limitations. Preserve unrelated dirty work; do not bulk commit or push it.

## Execution ruling
The user explicitly approved implementation and the established execution method is native. Proceed without another plan-approval question. The existing preview copy preserves approved uncommitted assets that a clean worktree would omit; use its separate Vite cache. Baseline copies identify this task's delta independently of the dirty Git working tree.
