# Enclosed HLS Landing Gear Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Hide all six legs and folded pads inside real hull recesses behind flush hinged doors in the review candidate; capture verified full deployment/retraction.
**Architecture:** A dedicated Blender gear builder emits cutout hull bands, recess liners, leg/foot/door pivots and exported mechanism metadata. A small TypeScript pose function coordinates the three stages; the preview consumes the exported rig for both LODs. Browser QA measures actual exported vertices, opening boundaries and engine clearance.
**Tech Stack:** Blender Python/bmesh, Babylon.js, TypeScript, Vitest, Playwright.
**Spec:** docs/superpowers/specs/2026-11-13-hls-enclosed-landing-gear-design.md

## Global Constraints
- Candidate assets only; preserve live HLS, Earth/halo, Eagle, terrain and game flow.
- Real cavity/opening, independently hinged foot and door, rigid parts; no hiding legs or scaling them away.
- Door follows the cylindrical hull when closed. Gear must fit inside it at flight endpoint.
- Motion target 6–8 seconds each direction; pause and reversal continuous; near/far rig equivalent.
- Reconstructed game mechanism, not official HLS CAD. Measure new geometry/draw-call cost explicitly.

## Review Focus
- Mid-cycle reversal must not close a door onto a leg; task2 samples both directions.
- Folded feet and braces may fit while another vertex breaches hull; task3 measures all moving geometry.
- A fake painted recess may still leave opaque hull across the opening; task3 rays inspect open cavities.
- Landing gear can clear engines but block descending elevator; task3 reruns elevator geometry regression.
- View changes, Pause, LOD and immediate endpoints can leave stale transforms; task3 checks actual world positions in all those cases.

### Task1: Export a mechanically connected cavity/leg/foot/door rig
**Files:** create tools/blender/hls_landing_gear.py; modify tools/blender/build_hls_review.py, scripts/check-hls-review.mjs; regenerate public/models/review/hls-v2*.glb.
**Interfaces:** build_landing_gear(root, hull, lathe, materials, far) builds gear and cutout cylinder between heights2.35 and17; add_hull_seam(hull,z,material,far) respects openings. Keep legPivot_0..5; add footPivot_i, doorPivot_i, gearSocket_i, gearCavity_i and exported stow/foot/door angle metadata.
- [x] Require new pivots/cavity geometry in the GLB contract, observe missing-node failure.
- [x] Build real openings and curved doors, fixed hinge brackets, rigid connected struts and pads. Retain six azimuths and elevator corridor. Record chosen dimensions/angles in metadata.
- [x] Regenerate assets, inspect contract/budgets, commit focused rig changes.

### Task2: Coordinate three-stage motion
**Files:** create src/demo/hlsLandingGearMotion.ts, tests/hlsLandingGearMotion.test.ts; modify src/demo/hlsPreview.ts.
**Interfaces:** landingGearPose(t:number):{door:number;leg:number;foot:number}, t0=flight,t1=surface; stepLandingGear(state:{position:number;velocity:number},target:0|1,dt:number) returns same state shape. Runtime reads angles from GLB, caches rest quaternions and applies rotation without scaling.
- [x] Tests: closed/folded at0; door fully open before leg moves; leg deployed before foot flattens; same safe ordering in reverse; dt0 freezes; reversal preserves position/limits velocity. Observe RED.
- [x] Use7second staged quintic easing plus bounded reversal velocity; update preview's frame loop and immediate setters. Add gear inspection view and QA API with actual joint/geometry diagnostics.
- [x] Run motion tests and TypeScript/build; commit runtime changes.

### Task3: Verify actual geometry and record full cycle
**Files:** create scripts/qa-hls-enclosed-gear.cjs; update scripts/qa-hls-leg-clearance.cjs, scripts/qa-hls-review.cjs if contract changed; outputs docs/screens/hls-enclosed-*.
- [x] Sweep both LODs with actual transformed vertices/edges: flight radius inside4.5m; door gap only seam; no engine intrusion; moving geometry inside recess whenever crossing hull; door clear during swing; sockets connected. Probe open recesses with rays to reject uncut hull.
- [x] Pause/reverse at door, leg and foot stages; switch LOD and views; verify immediate states. Run existing elevator regression and protected-asset hashes.
- [x] Capture flight side/underside, open detail and full endpoint-verified video. Inspect screenshots; run build and asset contract.
- [x] Fresh final review per executing-plans, fix material findings, record evidence and commit only task files. No push/deployment.

## Ledger
- User explicitly approved implementation; proceed inline in the existing candidate workspace without another permission round. Existing dirty gameplay files remain outside this work.
- Initial inspection: current foot shares legMesh, hull is unbroken, previous .20rad inward fold merely avoids engines. This requires replacing that rig, not increasing the old fold angle.

- Completed in the existing approved preview workspace; model/runtime committed together because the exported pivot contract changes atomically.
- Builder choices: pivot radius3.95m at height7.1m, recess radius3.5–4.5m and heights5–15.6m, six azimuths unchanged; outward swing-up angle derived from the rigid leg axis. Foot hinge rotates independently to leave the stowed pad vertical. Curved doors open110deg. These are game geometry choices, not source CAD.
- RED evidence: GLB contract rejected missing footPivot_0; new motion tests initially failed missing module. GREEN: all new pivots and rig equivalence pass, 8 focused motion tests pass.
- Final reviewer: /root/enclosed_gear_review (fresh context). Important coverage gap fixed: actual door-local and root-space bounds now included in elevator sweep; regression failed undefined then passed all2002 poses. Coplanar seam finding promoted to a fix because prior user feedback explicitly rejects texture flicker: builder assertion reproduced radius4.5, offset seams to4.502, regenerated successfully. Corrected opposite cavity/door cap normals; builder verifies cavity normals face inward into the recess.
- Also strengthened unique-node/finite-angle contracts and added world-space foot endpoint checks under docking rotation and LOD changes. No deferred review findings. Review exclusions remain the approved scope: official engineering accuracy and unrelated gameplay changes; final regenerated geometry and screenshots were directly checked after fixes.
- Final verification: enclosed gear202 sampled poses across both LODs, maximum stowed radius4.226216m (<4.5m hull), minimum door separation.182436m, real cavity/closed-door ray probes, engine envelope clear, world docking/LOD endpoints, pause/reversal. Elevator2002 poses including new door checks pass. Basic viewer has no console/network errors; protected game file hashes unchanged. Full suite435/435 in69 files and TypeScript/Vite build pass; pre-existing large mission chunk warning remains.
- Final assets: near1695936bytes/42036triangles; far700312bytes/12964triangles;38primitives each, total2396248bytes. Captured docs/screens/hls-enclosed-{closed,doors-open,swing,open,ground,underside}.png and hls-enclosed-cycle.webm. Candidate-only; no production replacement, push or deployment.
