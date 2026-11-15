# HLS folding elevator implementation plan

> **For agentic workers:** Use superpowers:executing-plans for this preview-only amendment.

**Goal:** Fold the elevator close to the hull in flight, with a smooth, reversible mechanical deployment after landing.
**Architecture:** Split the candidate mesh into hinged floor/guardrails, telescoping support and variable-length cables. One reversible staged timeline drives both LODs using simulation delta time.
**Tech Stack:** Blender Python export, Babylon.js, TypeScript, Vitest, Playwright.
**Spec:** ../specs/2026-11-12-starship-hls-design.md, folding amendment approved in conversation.

## Global constraints
- Candidate viewer only; production integration remains behind appearance review.
- Preserve Earth, halo, terrain, Eagle, Orion and current production models.
- Flight and descent: folded; ground: supports extend, floor opens, guards rise, then car lowers. Reverse this order for stow.
- Mechanism is a game reconstruction, not verified NASA flight hardware.

## Review focus
- Reversing mid-motion must not teleport geometry.
- Paused animation freezes every joint, support and cable.
- Folded geometry stays outside hull and has no full-height hanging cables.
- LOD swap preserves the exact pose and single shadow caster set.
- Camera changes/detail mode must not leave controls unexpectedly paused.

## Task 1: Candidate folding rig and timeline
- [x] Add regression checks for floor/guard/support/cable nodes; observe old candidate fail.
- [x] Add timeline tests for ordering, endpoints, smooth boundaries and reversible partial states.
- [x] Split Blender parts, regenerate near/far GLB, and animate from a shared eased timeline in preview.
- [x] Check runtime mesh clearance through deployment, pause/resume and reversal; capture stowed/deployed screenshots and video.
- [x] Run asset contract, focused tests, TypeScript/build, browser QA and independent review.

## Execution ledger
- User confirmed close-to-hull folding and requested smooth animation. This corrects the already approved stowed-flight requirement; no new product design gate is needed.
- Continue native execution on the existing feature branch with isolated preview files; no production integration in this amendment.
- Ruling: allow up to 16 HLS primitives in the preview instead of 10 because independently folding rails/support/cables need separate transforms. Total asset budget remains 4 MB; measure actual cost before production integration.
- Timing choice: 9 seconds in the viewer, rather than the earlier provisional 4-second vertical-only motion, to make the added mechanical stages legible. This is compressed game timing, not a real hardware speed.
- Asset regression observed RED on missing floorHinge, then GREEN after the split export. Timeline tests pass 3/3.
- Independent review found guard-to-guard crossing and unattached cable endpoints. Runtime geometric regression reproduced both; fix staggers front/side guards, shortens the side forward posts, and aligns cables/supports with actual top-rail attachment positions. Probe coordinates explicitly convert Blender Z-up to GLB Y-up.
- Final verification: asset contract PASS; timeline tests 3/3; folding QA 2002 actual-pose samples PASS, including rod clearance and cable anchoring; original viewer QA PASS with protected hashes unchanged and no page/network errors; npm run build PASS (existing large mission chunk warning remains). Both review findings RED→GREEN in one fix pass. No deferred review findings.
- Deliverables: stowed docking/detail and unfolded screenshots plus a real-time WebM in docs/screens; live preview remains /preview/hls.html. Production integration and New/Continue QA are not claimed at this appearance milestone.
