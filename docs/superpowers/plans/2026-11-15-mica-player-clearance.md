# MICA Player Clearance Implementation Plan

> Use superpowers:executing-plans for this bounded correction in the current workspace.

**Goal:** Prevent on-foot astronaut/MICA overlap, retain E/Q and camera.
**Architecture:** Pure swept oriented-footprint resolver; MICA supplies live bounds, astronaut applies position/velocity constraint, surface scene registers and rechecks after moving MICA.
**Tech Stack:** TypeScript, existing Babylon character controller, Vitest.
**Spec:** docs/superpowers/specs/2026-11-15-mica-player-clearance-design.md

## Constraints and review focus
Preserve camera/effects and all unrelated dirty changes. No PIP collisions. Always outside even in air; save overlap, high-speed crossing, rotated tow movement, interaction reach and terrain grounding are critical. No video.

### Task 1: Footprint resolver
Create src/player/footprintCollision.ts and tests/micaClearance.test.ts. Export Footprint, resolveFootprint(from,to,footprint,padding), returning corrected x/z and contact normals. Sweep an expanded OBB in local XZ; depenetrate old overlap, slide on faces, clip inward velocity at caller.
- [x] Tests RED for missing resolver: all directions, corners, yaw, long segments, old overlap, free tangent/away movement, E/Q reach.
- [x] Implement and pass pure tests.

### Task 2: Runtime integration
Modify src/mica/mica.ts to cache local model bounds and expose live projected footprint. Modify src/player/astronaut.ts to accept a footprint provider and enforce position/velocity before gait, plus public overlap reconciliation. Wire provider in surfaceScene; reconcile after demo/tow updates and before memory callback. Tests exercise MICA transforms and real astronaut constraint with a minimal physics-controller adapter.
- [x] Add failing integration tests, implement, run relevant movement/repair/action regressions.

### Task 3: Verify and hand back
- [x] Update DESIGN.md; build, relevant tests, inspect incremental diff.
- [x] Fresh focused review and fix substantive findings; retain changes for user QA, no merge/push.
