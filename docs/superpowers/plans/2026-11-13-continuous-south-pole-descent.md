# Continuous South Pole Descent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** A continuous south-pole approach with no frozen frame at Orion separation or the 300 m landing handoff.

**Architecture:** Keep the prepared orbital and surface scenes. Share a local south-pole terrain definition and a presentation snapshot; render both moving worlds through a GPU compositor only during overlap. Retire the outgoing scene incrementally.

**Tech Stack:** Babylon.js 9.34, TypeScript, Vite, Vitest, local NASA LOLA/LROC assets.

**Spec:** ../specs/2026-11-13-continuous-south-pole-descent-design.md (user approved).

## Global Constraints

- Preserve the 513×513 heightmap bytes, 1,500 m core, existing saved positions, 4K texture and approved models/Earth material.
- No canvas readback, frozen image, black fade or second loading at the mission handoffs.
- End at 300 m, vy −12 m/s, vx 4 m/s; retain fuel/thrust/control constants.
- Historical Apollo remains a separate reconstruction.
- Do not commit unrelated existing changes in this dirty live checkout.

## Review Focus

- A no-thrust manual burn must not teleport geographically: authored presentation path independent of exercise velocity (task 2).
- AGL/contact on a slope must not move world Y without velocity (task 3).
- Dormant rendering must not advance gameplay or save (task 4).
- Pause/resize during overlap must preserve the exact transition time and ownership (task 4).
- Repeated new/menu/continue must not leave scenes, RTs or input listeners alive (task 5).

### Task 1: Shared south-pole terrain

Files: new `src/world/southPoleTerrain.ts`, tests `tests/southPoleTerrain.test.ts`; modify `src/world/terrain.ts`, `src/scenes/missionStartup.ts`, `src/scenes/surfaceScene.ts`.

Interfaces: `createSouthPoleField(hm: Heightmap, elevation: Elevation): SouthPoleField` with `height(x,z): number`, `geo(x,z): {lat,lon}` and immutable core; `createSouthPoleTerrain(scene, field, textureBytes, scale=1)` returns surrounding meshes and shared material for the core. Both scenes consume identical field and texture bytes.

- [ ] Write/run failing tests for exact core samples, finite far coverage, seam continuity, cardinal orientation and no-data rejection.
- [ ] Build registered concentric terrain rings beyond the unchanged core using the packaged global LOLA grid; use common geographic UVs/material and compatible border vertices. Recover datum by registration at the core collar, document coarser surrounding data.
- [ ] Run terrain tests and protect original asset hashes; update NASA source credit.

### Task 2: Continuous authored approach

Files: new `src/landing/approachPath.ts`, tests `tests/approachPath.test.ts`; modify `introDirector.ts`, `landingScene.ts`, `burnEntry.ts` and VI translations.

Interfaces: `approachSample(height:number)` returns local path offset and slope; `burnWarp(elapsed:number,height:number):number` gives a smooth bounded 1…10 factor; `stepBrake(dt,throttle,warp=10)` substeps simulation.

- [ ] Write/run failing tests for monotonic path, finite difference endpoint derivatives, warp limits, manual zero-thrust path independence and substep equivalence.
- [ ] Render orbital approach in the same local axes (km adapter), retain separate historical reconstruction, common ephemeris time and fixed authored site. Blend camera using a moving incoming continuation, not a static frozen start pose. Decelerate warp before 500 m.
- [ ] Run tests; verify no dialogue gate holds the ship at 500 m.

### Task 3: Shared moving bridge and terrain-aware descent

Files: `descentBridge.ts`, `finalDescent.ts`, `landingScene.ts`; new tests `tests/continuousDescent.test.ts`.

Interfaces: `FlightPresentation` carries absolute local-metre ship/camera pose, rotation, scale, fov, state, throttle and rig motion; `FinalDescent.present(pose)` renders a dormant snapshot, `beginBridge(handoff)` releases at the endpoint without reset. Shared bridge sampler produces the same snapshot for both scene adapters.

- [ ] Write/run failing tests for bridge endpoint (300,−12,4), terrain-relative radar versus world vy, contact on slopes and continuous numerical camera velocity.
- [ ] Remove HTMLCanvasElement/DOM overlap. Use common pose through the entire 5 s bridge; converge visual HLS scale before overlap; restore rig snapshot without stepping twice. Keep first playable camera aligned with the cinematic chase.
- [ ] Integrate world Y, use sampled ground/feet for radar/contact/autopilot, preserve balance constants and all retry behavior.
- [ ] Run targeted descent/rig/input tests.

### Task 4: Live composition and startup ownership

Files: new `src/landing/liveTransition.ts`; `missionStartup.ts`, `landingScene.ts`, `surfaceScene.ts`; runtime QA harness.

Interfaces: compositor owns preallocated outgoing/incoming render targets and `render(outgoingScene,incomingScene,blend,uiLayer)`, plus `dispose()`. One intro loop presents both scenes; incoming remains dormant until endpoint, then it owns the ordinary render loop. No physics in render-target callbacks.

- [ ] Add executable QA assertions for single-step/dormant state, pause/resume, resize, held SPACE and no DOM snapshot.
- [ ] Prewarm targets/shader, animate both scene poses during 0.45 s overlap, GUI once. Transfer input once at completion; use common light/terrain/camera and preserve star/Earth presentation during overlap.
- [ ] Execute QA for auto/manual/skip/continue; make startup progress include actual preparation readiness.

### Task 5: Cleanup and complete verification

Files: new `src/landing/retireScene.ts`, tests for bounded queue; QA scripts and report under `docs/screens/`.

- [ ] Test retirement batches and cancellation; disconnect outgoing owners immediately, dispose resources in bounded batches after handoff, then finalize empty scene. Ensure menu/new drains prior cleanup.
- [ ] Run full tests and build. Compare protected assets and check no unrelated files were reverted.
- [ ] Measure production frames without capture, 5 cold and 5 warm runs per mode at 1440×810; record p50/p95/p99/max around both boundaries. Run visual capture separately; verify terrain landmark alignment and active controls after 300 m.
- [ ] Capture auto/manual videos and three approach altitudes. Test repeated lifecycle and loading error/retry.
- [ ] Obtain final independent review, fix relevant findings, document remaining limitations honestly; commit only task-owned changes where safely separable.

Execution: native in this session; implementation is already authorized by the user's approval. No additional approval gate is introduced.
