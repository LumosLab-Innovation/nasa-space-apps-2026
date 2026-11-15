# HLS reference review — 2026-11-12

Primary: NASA article https://www.nasa.gov/missions/artemis/nasa-partners-accelerate-lander-development-for-2028-moon-missions/ (23 Oct 2026).
Original SpaceX concept file https://www.nasa.gov/wp-content/uploads/2026/10/07-24-25-hls-on-surface-elevator-down.jpg — downloaded unchanged as nasa-spacex-surface-2025.jpg. File name indicates July 2025; publication is not design certification.

Secondary docking image: https://www.nasa.gov/wp-content/uploads/2024/11/11-03-24-orion-transfer.jpg — NASA/SpaceX, published 20 Nov 2024 at https://www.nasa.gov/humans-in-space/nasa-spacex-illustrate-key-moments-of-artemis-lunar-lander-mission/. Downloaded unchanged. Only corroborates docking orientation and common visible shape; mission assignments in the older article are not treated as current.

| Detail | Evidence / treatment |
|---|---|
| White cylindrical shell and long ogive | Visible in primary image; rebuild replaces all-metal gray tiled hull |
| Upper rounded window row | Visible; exact count and wrap are inferred, eleven used for preview |
| Dark belt with oval openings | Visible thruster region; not the previous blue solar belt |
| Front hoist housing, long guides/cables, open basket | Visible; mechanism details and speed are illustrative |
| Slender outward legs with flat pads | Visible; sixfold arrangement and folding joints inferred |
| Top docking adapter | Supported by 2024 docking view; hidden interface simplified |
| Aft bulkhead and six-engine cluster | Reconstructed from current Starship/Raptor visual language; not certified HLS CAD or a confirmed HLS engine arrangement |
| Branding/decals | Not yet applied in this geometry/material preview |
| Size 50 m × 9 m | Retained game/reference convention; not measured CAD from perspective image |

The preview is a locally running Babylon scene, not a generated concept image. It uses a flat neutral stage, not the game terrain. Raw originals stay in docs and are not added to mission downloads. No endorsement is implied.

Candidate outputs are under public/models/review; production hls.glb is unchanged. Builder: tools/blender/build_hls_review.py (headless separate Blender process). Rebuild candidates only. Verification: node scripts/check-hls-review.mjs; node scripts/qa-hls-review.cjs.

## Preview validation

Actual asset contract now checks world-space height/volume, nose anchor, moving descendants, stow metadata, matching near/far pivots, embedded PNG dimensions, triangle and primitive budgets. A regression assertion reproduced the initial basket/hull collision and passed after moving the basket outboard and adding a cantilever hoist. Housing is a separate measurable mesh; basket and housing world bounds do not overlap.

Browser checks demonstrate real joint quaternions and elevator positions moving, freezing during pause, and resuming; LOD checks verify enabled roots, matching poses and a single caster set. The current mechanical-detail amendment uses twenty HLS primitives for the engine bay, carrier and independently anchored cable spans. These are viewer measurements, not production performance claims. Source file hashes listed in protected-baseline.json remain unchanged.

## Folding amendment

Flight stows the platform against the hull. A roughly twelve-second preview sequence extends supports, unfolds the deck, raises the front guard before the sides, and then lowers the car; each stage eases to rest, with velocity-limited reversal. Four cable spans stay visible and connected from winch to pulley and from pulley to rigid suspension frame in EVERY pose. The floor and guardrails have physical hinge brackets. This timing and folding mechanism are artistic reconstruction, not NASA specifications. The viewer and generated candidates are still isolated from the live game. Additional verification: `node scripts/qa-hls-folding.cjs` samples actual transforms, checks endpoint/socket contacts and clearances, ray-tests the closed engine bay, and records the complete deployment and retraction.

## Current engine references (accessed 2026-11-12)

- Official SpaceX vehicle page: https://www.spacex.com/vehicles/starship — its Raptor sea-level and vacuum visualizations were inspected and frame-captured locally for modeling reference.
- Original video assets discovered on that page: https://content.spacex.com/cms-assets/assets/RAPTOR_SEA.mp4 and https://content.spacex.com/cms-assets/assets/RAPTOR_VACUUM.mp4. Frames: spacex-raptor-sea.png / spacex-raptor-vacuum.png. Credit SpaceX. Not loaded into production game assets.
- https://www.spacex.com/launches/starship-flight-12/ identifies Raptor3 flight hardware and six engines on the upper-stage Starship. This does not certify the detailed layout of HLS.
- NASA historical engine-test article: https://www.nasa.gov/blogs/missions/2023/09/14/spacex-completes-engine-tests-for-nasas-artemis-iii-moon-lander/ supports use of both Raptor variants in HLS development; its 2023 mission schedule is not treated as current.
- Observed visual cues: compact dark bell and integrated pump/feed assemblies; vacuum variant's enlarged bright metallic lower extension, cooling-channel pattern and dark upper chamber. Reconstructed elements: exact dimensions, six-engine HLS mounting geometry, bulkhead/fastener routing, gimbal representation and hidden plumbing.
- Engine inspection views use a viewer-only underside fill light so material detail can be judged; this is not a change to game lighting or lunar sunlight.

Remaining appearance limitations: branding decals are omitted, hidden engine layout and leg stow path are reconstructed, ground is a neutral test stage. Final production gameplay/loading integration and its QA are intentionally pending appearance review.

## Enclosed landing gear amendment (2026-11-13)

User-approved game reconstruction: six rigid legs swing outward/up into real recesses behind flush curved doors. Each pad has a separate hinge; the seven-second sequence opens doors, swings legs, then levels pads (reversed for stow). This is not a claim that SpaceX uses this exact HLS mechanism. Door panels stay open with legs deployed. Retraction preview is airborne, with ground hidden during motion.

The new near candidate is 42,036 triangles / 1.70 MB, far 12,964 / 0.70 MB, with 38 mesh primitives each (six additional pads, doors and cavity liners). Budgets are 45k/15k triangles, 38 primitives, combined4 MB. The extra joints and real cavity topology account for the increase; no new textures or runtime dependencies.

## Production approval and integration

User approved this appearance on 2026-11-13. The candidate geometry is promoted unchanged to `public/models/hls.glb` and `hlsFar.glb`; earlier notes about preview-only scope describe the preceding review stage. Both assets pass through the real-progress preload/cache. `src/models/hlsRig.ts` applies the approved joint/cable motions in orbit, descent, surface restoration and liftoff. Near/far selection uses projected size with hysteresis and one shadow-caster set. Settled poses batch the same vertices into one draw; animation restores the original independent joints. HLS reflection is material-local. Earth, its halo, terrain and Eagle are outside the change.
