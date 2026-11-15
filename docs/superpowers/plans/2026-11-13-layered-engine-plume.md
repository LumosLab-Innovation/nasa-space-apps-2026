# Layered engine exhaust and attitude jets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Replace the placeholder exhaust with layered animated HLS exhaust, ground deflection/shutdown, Orion auxiliary pulses and motion-informed HLS RCS.
**Architecture:** A pure envelope/attitude module drives a scene-owned pooled renderer. Scene adapters resolve real nozzle transforms and transfer a reusable visual snapshot at the existing descent join. Texture preparation is cached per scene and participates in mission loading/offscreen warm-up.
**Tech Stack:** Existing TypeScript, Babylon.js, Vite, Vitest; offline procedural alpha-field bake to 300x300 WebP.
**Spec:** docs/superpowers/specs/2026-11-13-layered-engine-plume-design.md (approved).

## Global Constraints
- Preserve camera, motion/timings, terrain and Earth/glow. No new forces/fuel consumption from effects.
- Main CONTACT envelope: 0.4 s hold, 0.8 s eased fade; no reignition of an off engine.
- Four transparent 300x300 WebPs preloaded and decoded; no new visible-frame warm-up.
- Orion fires eight small aft auxiliaries only. HLS RCS is a separate inferred game layout.
- Real visual seconds, pause-aware; bounded particles; no new allocation/asset work at ignition or 300 m.

## Review Focus
- Quaternion sign changes must not trigger attitude impulses (task 1).
- Main engine already off at contact must remain off (task 1).
- Meter/kilometer scene transforms and model offsets must keep every nozzle attached (tasks 2/3).
- Pause, overlap, retry must not duplicate pulses or reset tails (tasks 1/3).
- Loading New/Continue must not draw dormant scenes onto the visible canvas (task 4).

### Task 1: Pure visual timing and attitude control
**Files:** src/fx/exhaustState.ts; tests/exhaustState.test.ts.
**Interfaces:** `ExhaustState.step(dt, throttle, quaternion, active, contact)`; `snapshot()/restore()`; outputs time, power, local attitude demand and pulse levels. `auxiliaryPulse(seconds)` and `nozzleLength(time,index)` deterministic functions.
- [x] Write tests for unequal continuous lengths, exact contact cutoff, dark contact, paused dt=0, quaternion hemisphere equivalence, stable/coasting attitude, opposite acceleration/braking demand and snapshot continuity.
- [x] Run targeted tests and observe failure; implement bounded pause-aware state and confirm pass.

### Task 2: Pooled rendering and resources
**Files:** src/fx/exhaustAssets.ts; src/fx/spacecraftExhaust.ts; src/fx/exhaustShaders.ts; scripts/build-exhaust-textures.py; public/textures/exhaust/*.webp; src/models/hlsRig.ts.
**Interfaces:** async `prepareExhaustAssets(scene,files)`; `SpacecraftExhaust(scene,parent,nozzles,assets,ground?)` exposes update/present/snapshot/warm/dispose. Nozzles have local position/direction/type. HLS rig exposes actual bell-exit transforms before batching.
- [x] Inspect model builder/bell bounds and verify coordinate mapping; test nozzle positions/directions and pair torque signs.
- [x] Bake four original alpha fields (glow, wisp, dust, grain) into exact 300x300 WebP, validate alpha/dimensions/size.
- [x] Implement soft animated cross-ribbon core shader, bounded world-space wisps, compact RCS/aux jets and slope-aware irregular radial ground fans; compile variants offscreen.
- [x] Check rendering/disposal through NullEngine tests where meaningful and browser visual inspection.

### Task 3: Integrate flight and ground adapters
**Files:** src/scenes/landingScene.ts; src/landing/finalDescent.ts; src/landing/descentBridge.ts; src/scenes/surfaceScene.ts; src/scenes/missionAssets.ts; src/scenes/missionStartup.ts; src/fx/dustSystem.ts.
**Interfaces:** optional exhaust snapshot on FlightPresentation; surface present restores it during overlap, then advances locally. World-relative particle state is converted through craft-local coordinates at transfer. Shared scene texture cache owned by scene.
- [x] Replace both legacy cones, attach real nozzle arrays and Orion auxiliary anchors; drive RCS from continuous attitude changes after separation.
- [x] Drive contact capture before throttle is zeroed; separate short RCS cutoff from main tail. Replace flat dust disc with sprites and preserve ballistic dust.
- [x] Add assets to counted preload, prepare scene textures before scene creation and warm render variants before entering play.
- [x] Test handoff, pause, failure/retry and disposal; confirm camera/physics tests unchanged.

### Task 4: QA, references and final review
**Files:** scripts/qa-layered-exhaust.cjs; docs/layered-exhaust-qa-2026-11-13.md; DESIGN.md.
- [x] Run targeted tests, full suite and production build; inspect failures rather than suppressing them.
- [ ] Complete full auto/unassisted manual flight on hardware GPU. Focused contact (auto + manual-input/assisted-touchdown), Orion separation and close RCS captures passed; particle bounds passed. Software-render timing and full manual runs failed, documented in QA report.
- [x] Reuse loading-flicker QA for New/Continue, progress100 and framebuffer isolation. Restore save fixture.
- [x] Compare frame times with baseline on same browser/scene, document limitations and actual sizes, add source credits and inferred-layout caveat.
- [x] Fresh whole-change review; fix material findings and rerun affected checks. Keep unrelated working tree edits untouched.

Execution ruling: proceed natively in the existing live feature branch (many user-approved uncommitted assets); do not isolate away from the user's running game or stage unrelated files. User has approved implementation; no additional execution-method permission is needed. Commit only new standalone files/docs when safe; report existing dirty-file edits without bundling historical work.
