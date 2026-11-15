# HLS mechanical detail and continuous suspension plan

> Execute natively with superpowers:executing-plans; approved user request corrects previous preview defects.

**Goal:** Close the engine bay, add realistic Raptor-inspired detail and maintain an unbroken mechanical connection between hull, elevator and cables throughout every pose.
**Architecture:** Blender creates rigid carriage, hinged platform, fixed winch and sliding pulley arms. Endpoint anchors on those parts drive two continuous cable spans at runtime. Meshes use shared atlas; both LODs share the rig.
**Spec:** ../specs/2026-11-12-starship-hls-design.md (mechanical-detail amendment).
**Tech stack:** Blender, Babylon.js, TypeScript, Vitest, Playwright.

## Constraints / review focus
- Isolated review assets only. Preserve all production assets, Earth/halo/terrain/Eagle/Orion.
- Closed aft bulkhead and engine mouths with inner/outer wall and recessed throat, not open lathed tubes exposing the fuselage.
- Engine visuals inspired by official SpaceX Raptor/Starship imagery; inferred HLS engine layout explicitly identified.
- Cable ends follow real model anchor nodes in all poses; never hide during unfold; use rigid carrier instead of folding guardrail as anchor.
- Floor hinge attached to carrier; stationary and moving arm sections overlap; no independent floating platform.
- Guards clear frame/cables; reversal and pause hold all joints. Show complete deployment and retraction, not only the beginning.
- Budget: <4MB, near <40k/far <10k triangles; permit up to20 meshes for additional mechanical pieces. Record actual measurements.

## Tasks
1. Research primary references, record observed/inferred engine features; add regression for hidden cables and missing anchor/bulkhead nodes, run RED.
2. Rebuild engine bay with three compact and three larger vacuum-inspired bells, inner liners, support/gimbal fittings, restrained pipework and a closed bulkhead. Retain existing 50m scale; exact engine sizes/positions are game reconstruction.
3. Rebuild elevator carrier, hinges, linear sliding arms, winch/pulleys and anchor nodes; derive cable paths from actual anchor transforms. Remove nested easing, coordinate stages with direct smooth timelines, avoid abrupt motion reversal.
4. QA actual exported geometry and runtime anchors, every pose/LOD, ground, pause/reversal, bottom and oblique closeups. Capture full near-angle and full-travel motion in real time; build and independent review.

## Ledger
- User explicitly approved technical-realistic direction and requested implementation/QA/clip. Existing preview-review scope retained; no additional approval question.
- Main Starship and HLS are not interchangeable. Six-engine layout is a reconstruction inspired by current upper-stage Starship, not a certified HLS configuration. No booster33-engine cluster.
- Previous QA verified conditional endpoint contacts only after deployment and excluded cable visibility earlier. New checks require continuous suspension through all phases.
- Reference found: official SpaceX /vehicles/starship has RAPTOR_SEA.mp4 and RAPTOR_VACUUM.mp4; both inspected and credited. Vacuum lower extension changed to bright metal with restrained channel lines, as seen in the source, rather than uniformly dark bells.
- Regression RED observed: suspension hidden at phase0. Replaced conditional cables with four geometry spans derived from exported anchor nodes; added rigid carrier and translating arms.
- Ruling: housing overlap uses connected-component bounds, not one aggregate AABB enclosing empty space between housing and outboard winches. The aggregate check produced a false positive even though the carrier is below the winch and outside the housing. Component bounds still conservatively reject overlaps.
- Independent review found unmodeled guardrail mounting brackets and incomplete old capture. Added physical brackets/sockets and full endpoint-verified travel capture. Existing guard rotation axes and clearances preserved.
- Timing refined to about12s per complete direction; direct easing per guard rather than nested easing, with bounded acceleration when reversing. Preview-only inspection fill light makes underside detail visible without altering game lighting.
- Final video inspection exposed a landing leg through the elevator's surface position. Regression reproduced at the actual deployed pose. Rotated the inferred six-leg arrangement30 degrees to place two legs on either side of the forward access corridor, and added deployed-gear checks for all2002 poses. This is a necessary clearance correction, not a claim about precise NASA leg azimuths.
- Tasks1–4 complete. Final asset contract passed: near37956 triangles/1414440bytes, far9340 triangles/468968bytes,20 primitives each. Browser QA passed2002 poses including permanent cable visibility, real endpoint/socket contacts, guardrail/leg/hull clearance, pause/reversal and LOD equivalence.221 underside rays perLOD all hit a closed engine bay; six bells detected. Full-cycle video verifies surfaceY=.22 and stowedY≈33.1. Timeline tests5/5, TypeScript/Vite build passed; existing large mission chunk warning unchanged.
- Both housing and landing-gear clearance probes use bounds of actual connected mesh components, excluding empty space inside an aggregate AABB. Visual endpoint inspection confirms the forward landing corridor is clear.
- Candidate-only milestone complete. Live game asset integration and New/Continue gameplay QA remain outside this amendment; no deployment or push performed.

## Landing gear / engine clearance correction
- User closeup exposed a missing constraint: previous elevator QA checked gear against the elevator, but did not check folded gear against the engine bay.
- New regression reproduced engine-envelope penetration at the stowed pose. Reduced fold angle from .43 to .20 radians and raised the inner brace attachment from local (.04,0,-3.6) to (.18,0,-1.2), retaining its connection to the main strut. Runtime now reads the exported pivot angle rather than duplicating a hardcoded value.
- Actual transformed triangle edges are clipped to engine-bay height and checked against the entire bay radius plus an 8cm safety margin. All202 samples across near/far LODs pass; minimum clearance beyond that margin is .0946m. Both endpoint screenshots inspected; asset contract and TypeScript/Vite build pass. Existing large-chunk warning unchanged.
- This correction updates only the review candidate, not the live game's Earth, halo, terrain or production HLS asset.
- Full elevator regression also passed2002 sampled poses, pause/resume/reversal, continuous cable contacts and LOD equivalence; refreshed the endpoint-verified full-cycle video and underside screenshots.
