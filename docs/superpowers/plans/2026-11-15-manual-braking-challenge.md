# Manual Braking Challenge Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Direct Space throttle with genuine challenge and recoverable mistakes.
**Architecture:** Retain the shared flight integrator. Replace only assisted-manual orbital throttle and its horizontal attitude feedback. Keep the existing failure monitor and playback schedule.
**Tech Stack:** TypeScript, Babylon GUI, Vitest, Vite.
**Spec:** docs/superpowers/specs/2026-11-15-manual-braking-challenge-design.md

## Global Constraints
- +12/-10 percentage points per unpaused gameplay second initially; tune only as allowed by spec.
- No speed rescue; x4 manual/x10 auto, x1 by 1200 m; green +/-18%, minimum 3 m/s; severe 6 s, 2 s entry grace.
- Preserve camera/effects, full auto and final descent. No video. Preserve all unrelated working changes.

## Review Focus
- Entering manual at existing thrust must not snap; retry clears state.
- Pitch must not become a hidden speed controller after throttle feedback removal.
- Frame rate/warp/pause must not alter the input ramp or failure grace.
- Low-altitude overbraking must remain recoverable before safe handoff.
- Constant input must not silently complete the challenge; dynamic input must be able to.

### Task 1: Direct input and independent attitude
Files: src/landing/guidedFlight.ts, tests/manualBrakingChallenge.test.ts, tests/assistedFlight.test.ts.
Interface: stepFlight(FlightState, FlightCommand, dt) remains unchanged; lightAssist selects direct player ramp, assist still selects autopilot.
- [x] Add failing tests: 0.5 s hold adds .06, release subtracts .05 from .5; same results at 30/60/120 and x1/x4; paused dt=0 unchanged; dry tank zero. Perturb vx only and assert identical manual pitch/throttle, different auto output.
- [x] Run focused tests, verify expected failures.
- [x] Implement manual ramp, nominal horizontal attitude with bounded vertical stabilization. Preserve raw throttle API and autopilot.
- [x] Update old ramp test to new contract; run focused tests.

### Task 2: Challenge and recoverability
Files: tests/manualBrakingRecovery.test.ts, tests/manualBrakingChallenge.test.ts, src/landing/guidedFlight.ts if rate tuning required.
Interface: existing flightWarp, flightReference, BrakingFailureMonitor; real terrain samples for integrated simulation.
- [x] Simulate 10 km/3 km/800 m departures and delayed recovery from either side, measure time and errors.
- [x] Simulate player reacting every .8-1 s over full phase at 30/60/120; require safe 300 m handoff. Constant inputs must fail.
- [x] Add real LOLA terrain-route integration and retry/auto coverage; retain failure countdown tests.
- [x] Tune within spec; record measured outcomes, run relevant flight regressions.

### Task 3: HUD, documentation, final validation
Files: src/ui/descentHud.ts, src/i18n/vi.ts, DESIGN.md, approved spec and this plan.
- [x] Label orbital manual attitude assistance clearly, leave final-descent label unchanged.
- [x] Record actual tuning/results in DESIGN.md and spec implementation notes.
- [x] Run focused regression suite, TypeScript/build, inspect incremental diff against saved pre-task copies.
- [x] Fresh final review limited to this change; fix substantive findings and rerun affected checks. Leave working changes for user QA; no merge/push.

Validation: 92 focused tests passed; TypeScript/Vite build passed; fresh review found no substantive issues. Reviewer additionally simulated x1 manual at30/60/120 with .8/1s decisions, all six safe handoffs. One final integration correction feeds actual Space state rather than current applied throttle into the existing 300 m prediction; no camera framing/effects changes. Final validation rerun after this correction.
