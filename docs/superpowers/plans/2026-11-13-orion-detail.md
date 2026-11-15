# Orion Detail Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Upgrade Orion's model, especially the aft propulsion assembly, at the approved unchanged camera.
**Architecture:** Existing Blender generator exports a self-contained GLB; Babylon preserves its authored material distinctions. Embedded textures keep the existing preload contract.
**Tech Stack:** Blender Python, glTF, Babylon.js, TypeScript, Vite, Playwright.
**Spec:** ../specs/2026-11-13-orion-detail-design.md (approved).

## Global Constraints
- Preserve camera, timing, docking point, model root and required nodes/materials.
- Do not change HLS, Moon terrain, Eagle, Earth, halo or scene lights.
- Target <=25k triangles and <=2 MB; texture at most 2K.
- Keep existing root/path and real loading progress.

## Review Focus
- Correctly open nozzle facing aft, no cap across the mouth.
- Material distinctions remain visible without changing global lighting.
- Cell grids do not flicker at the existing camera distance.
- Embedded textures ready before new/continue enters gameplay.
- Docked configuration and menu art preserve existing framing.

### Task 1: Detailed Orion asset
Files: tools/blender/build_orion.py, public/models/orion.glb, scripts/check-orion.cjs.
Interface: same GLB path, root and manifest nodes; embedded textures only.
- [x] Save baseline asset and source hashes, fixed-camera image.
- [x] Add asset validation for geometry budget, embedded images and an aft-facing hollow main nozzle; observe old asset failure.
- [x] Build hollow main/aux/RCS nozzles, integrated bulkhead, radiators, crew details and framed textured arrays.
- [x] Export in a separate background Blender process and run contract/asset checks.

### Task 2: Integration and visual QA
Files: src/scenes/landingScene.ts (only Orion material handling), public/models/SOURCES.md, DESIGN.md, scripts/qa-orion.cjs, existing menu/loading art.
Interface: same preload, cameras, docking, scene entry.
- [x] Remove Orion-only metallic flattening; keep authored roughness, modest fill.
- [x] Capture fixed-camera before/after and separate model inspection image; inspect open nozzle, intersections and array detail.
- [x] QA new game gated on Orion GLB, monotonic loading, continue, no console errors; regenerate art with same capture framing.
- [x] Run model-related tests and production build. Verify protected asset hashes.
- [x] Independent final review and address material findings; report screenshots and limits.

## Execution ledger
Ruling: execute inline under the user's approval instead of asking for another workflow approval; existing feature checkout is the live served project and contains prior approved uncommitted work. Preserve that work and do not bulk commit it.
Ruling: geometry changes are verified by actual GLB geometry checks and visual QA, not tests that mirror generator source.

Task 1: complete. Asset check initially failed the closed/reversed mouth; after rebuild passes with 21,084 triangles and two embedded textures. Explicit outer-normal test failed then passed after preserving analytic face winding.
Task 2: integration and browser flows complete; final build/test results recorded in docs/screens/orion-report.md. Independent review found no blocking issue; its outer-normal cleanup was also fixed and checked.
Ruling: reviewer excluded unrelated dirty changes and exact CAD fidelity, consistent with approved scope. Pending workflow verification was resolved by browser QA passing both flows.
Ruling: existing i18n coverage caught a plain credit string; replaced with tr() and a Vietnamese translation.

Final: all scoped deliverables complete; no pending review findings. Keep changes in the current feature checkout; no merge or push requested. Verification is recorded in docs/screens/orion-report.md.
