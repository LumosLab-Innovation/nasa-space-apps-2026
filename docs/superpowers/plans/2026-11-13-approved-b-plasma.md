# Old-B Braking Plasma Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Integrate approved old B during braking without modifying existing presentation.
**Architecture:** A standalone Babylon effect attached to HLS exhaustMount plus a pure timing state. The orbital scene owns preparation and frame updates.
**Tech Stack:** Babylon.js, TypeScript, Vitest, Vite.
**Spec:** docs/superpowers/specs/2026-11-13-approved-b-plasma-design.md

## Global Constraints
Old B only; camera, plume, RCS, dust and physics unchanged. Fade begins at 1,100 m and lasts 2 gameplay seconds. No clips.

## Review Focus
- No effect while docked or before manual ignition.
- Pause freezes shader time and envelope.
- No warp-speed dependent fade or reappearance on altitude rebound.
- Correct attachment and disposal under kilometre-scale parent transforms.
- Warm shader before gameplay, invisible in later landing scene.

## Task 1: Effect and scene integration
**Files:** src/fx/brakingPlasma.ts, src/fx/brakingPlasmaState.ts, src/scenes/landingScene.ts, tests/brakingPlasma.test.ts, DESIGN.md.
**Interfaces:** BrakingPlasma.update(dt, braking, altitudeM, throttle); warm(): Promise<void>; diagnostics getter; dispose().
- [x] Write timing and lifecycle tests; run and observe missing-module failure.
- [x] Extract approved shader unchanged, implement state and renderer, attach/warm/update in orbital scene.
- [x] Run targeted tests, full suite, build and WebGL smoke check without recording.
- [x] Compare protected-file hashes, inspect exact changed scene lines, document completion.

Validation: 23 focused regression tests passed across 5 suites; build passed; orbital WebGL smoke passed with no runtime/shader errors. Full-suite runs did not complete (workers stopped yielding results), so no full-suite success is claimed. Independent review found no actionable issues.
