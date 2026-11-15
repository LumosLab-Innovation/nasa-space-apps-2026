# Starship HLS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Build a reference-based HLS asset, obtain appearance review using real Babylon renders, then integrate without changing Earth, terrain or Eagle.

**Architecture:** Standalone Blender build exports candidate near/far GLBs under a review directory. An isolated Vite/Babylon viewer renders these assets beside NASA reference images; no production entry imports the viewer. After appearance approval, a shared rig binds named nodes and is consumed by both mission scenes.

**Tech Stack:** Existing Blender 5.2, Babylon.js 9, TypeScript, Vite, Vitest. No new runtime dependencies.

**Spec:** ../specs/2026-11-12-starship-hls-design.md

## Global Constraints

- Work in the active game at C:/Users/ADMIN/Downloads/NASA_Hackathon, existing codex branch; preserve unrelated dirty changes.
- Keep Earth, halo, terrain, Eagle, Orion geometry, gameplay balance and save schema unchanged.
- Proposed limits: near 40000 triangles, far 10000, candidate GLBs combined 4 MB; approximately 10 draw calls is an optimization target to verify, not silently claim.
- Reference primary NASA image published October 2026, dated July 2025 in filename. Unknown geometry and deployment are game reconstruction, not NASA CAD.
- Pause stops mechanism animations; saved surface starts deployed without replay.
- Spec explicitly requires appearance review before production integration. Finish tasks 1–2 and present screenshots first; tasks 3–5 remain pending that gate.

## Review Focus

1. Reflections and lighting that make a white-coated hull dark: review real Babylon output from both lit and unlit sides in task 2.
2. Animation nodes accidentally merged or missing in lower LOD: validate GLB hierarchy and both poses in tasks 1–2.
3. Viewer accidentally loaded from menu or overwrites live asset: compare hashes and production build entries in task 2.
4. Resume at touchdown or mid-animation: deterministic phase/pose tests and Continue checks in task 3.
5. New downloads finishing before actual model readiness: delayed/failed file QA and load barriers in task 4.

### Task 1: Reference audit and candidate assets

**Files:** tools/blender/build_hls_review.py; docs/references/hls/README.md; public/models/review/hls-v2.glb; public/models/review/hls-v2-far.glb; docs/screens/hls-v2-metrics.json.
**Interfaces:** export metre-scale Y-up GLBs with hls_root, hull, legs, thrusters, elevator, elevatorCar, legPivot_0..5, dockingAnchor and engineAnchor. GLB defaults to deployed legs, elevator at upper door; per-pivot extras carry stowed rotation. Geometry/data can be shared by viewer and future rig.

- [ ] Read original NASA images and record observed versus inferred proportions and hidden details.
- [ ] Implement independent headless Blender builder (no live Blender session mutation); output only candidate paths, never public/models/hls.glb.
- [ ] Generate a smooth white hull, long ogive, high window row, dark thruster recesses, six inferred articulated legs and separate hoist/car. Source does not show a solar belt; do not invent one on visible hull.
- [ ] Export near/far candidates and inspect GLB hierarchy, bounds, triangle counts, materials, bytes and embedded texture sizes using a reusable Node script scripts/check-hls-review.mjs. Assert no external textures, positive bounds, docking anchor at nose, contract nodes in both files, and geometry budgets.
- [ ] Record actual measurements and reference uncertainties. Commit only task files.

### Task 2: Real-time comparison viewer and appearance evidence

**Files:** preview/hls.html; src/demo/hlsPreview.ts; src/demo/hlsPreview.css; scripts/qa-hls-review.cjs; docs/screens/hls-v2-*.png; docs/screens/hls-v2-qa.json.
**Interfaces:** viewer exposes window.__hlsReview {ready, setView(name), setPose(name), setLod(name), metrics()} for reproducible QA; names side/three-quarter/surface/docking, flight/surface, near/far. Viewer pose lerps use engine dt and stop when paused. UI labels reference dates and inferred parts.

- [ ] Build independent viewer with NASA image next to the GLB, orbit controls, angle and state selectors, pause, near/far toggle, source links and reconstruction label.
- [ ] For docking view load existing Orion unchanged; align nose anchors. Other views retain a flat neutral stand-in surface, explicitly not gameplay terrain.
- [ ] Run viewer in Chrome with hardware WebGL, capture the four prescribed views and near detail. Inspect lighting, silhouettes, footsteps absent by design, all mechanisms and shadows.
- [ ] Test all pose/LOD buttons, pause mid-transition, resize, no console/network failures. Hash protected source/assets before and after; production menu must not import preview or candidate GLB.
- [ ] Run npm run build. Present screenshots and reference comparison to user; do not claim production Chơi mới/Tiếp tục QA yet.

### Task 3: Runtime rig after appearance approval

**Files:** src/models/hlsRig.ts; src/models/manifest.ts; src/scenes/landingScene.ts; src/scenes/surfaceScene.ts; src/landing/finalDescent.ts; tests/hlsRig.test.ts; existing liftoff owner discovered via rg.
**Interfaces:** createHlsRig(model:LoadedModel): {setPhase(phase:HlsPhase, immediate?:boolean):void; update(dt:number, paused:boolean):void; dispose():void}; HlsPhase = flight | landing | surface | ascent. Getter anchors allow docking and engine alignment. Phase transitions use two-second leg/four-second elevator easing, with safe immediate surface restoration.

- [ ] Test paused update preserves transform, zero dt is stable, instant surface deploys, reversing/repeating phase is idempotent, lower-LOD binding has same nodes; watch expected failures before implementation.
- [ ] Implement named pivots, state transition clamps and safe fallback for insufficient descent time; refactor only HLS merge/material handling.
- [ ] Align docking by anchors; keep Orion material override untouched and HLS local material handling isolated. Synchronize descent-ready/load restoration/liftoff ordering without new save fields.
- [ ] Test and inspect full phase sequence with input lock and pause/settings; commit focused files only.

### Task 4: Asset readiness, LOD and artwork

**Files:** src/scenes/missionAssets.ts; src/scenes/missionStartup.ts; public/models/hls.glb and far asset; model loader only if needed; existing menu artwork paths; tests/missionAssets.test.ts.
**Interfaces:** existing MissionFiles buffers and ready promises remain authoritative; LOD uses projected size with hysteresis and one enabled caster set.

- [ ] Add regression tests for rejected/delayed candidates and active scene disposal; verify failure before implementation.
- [ ] Promote approved candidate, connect any extra GLB to preloader, await actual HLS binding and material readiness before startup resolves.
- [ ] Capture new menu/loading artwork from actual scene; retain layout/drift and avoid any 3D dependency on menu.
- [ ] Verify cold/warm loading and LOD switching, counters, no duplicate requests or double shadows.

### Task 5: Production validation and credits

**Files:** public/models/SOURCES.md; DESIGN.md Data; existing in-game sources view; docs/screens/hls-production-qa.json and screenshots.

- [ ] Run targeted tests, npm run build, Chơi mới confirmation, Continue orbital and surface saves, failed load/retry, return-to-menu/reenter, liftoff.
- [ ] Measure import time, frame median/p95, draw calls, geometry and bytes on same machine/shots before-after; report all budget exceptions.
- [ ] Compare protected Earth/halo/terrain/Eagle screenshots at same camera/time; verify no corresponding code/asset change.
- [ ] Update credit/date/inference notes without restoring removed corner overlay. Fresh scoped review, fix material issues, final screenshots/report.

## Execution ledger

- Native execution selected as routine implementation choice; approval already authorizes concrete preview work. No extra plan approval round. Existing dirty project contains essential approved scene changes, so isolate new candidates/viewer by paths instead of making a stale checkout. Risk: accidental writes to live assets; mitigated by hash baseline and explicit-only commits.
- 2026-11-12: design approved; no production integration until appearance review.
- Task 1 complete: candidate assets exported independently; contract validation passed after reproducing and correcting upper basket/hull collision. No production model overwritten.
- Task 2 complete: actual Babylon screenshots for 3/4, front, surface, docking, detail, far flight and compact layouts; errors/failures empty; actual transforms pause/resume, LOD roots/casters, protected hashes checked. Build passed. Screenshot appearance approval remains the next gate.
- Fresh review: hls_preview_review found basket collision and weak geometry/pause checks. All three addressed: outboard hoist; world-space geometry/texture/metadata contract; actual transform/caster assertions. Inspector proved the collision RED before rebuild and GREEN after. Build-only tagging differs between LODs and is intentionally excluded from rig equivalence; functional metadata remains checked.
- Native path-isolation ruling retained: old model and scenes stay unchanged; candidate assets/viewer are separate. Cost if wrong would be unintended live-scene changes, mitigated by seven protected-file hashes and absence of preview imports from production entry.
- Draw-call interpretation: the 10-call target is HLS main pass, not shadows plus floor. Actual full viewer is 21 draws in the full surface view. Production performance benchmark remains task 5; not claimed here.
- Tasks 3–5 pending appearance approval under the approved spec, not marked complete. No final game/new-game/continue QA claimed for this preview milestone.
