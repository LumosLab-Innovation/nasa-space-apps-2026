# Terrain skirt: hide the 1.5 km map edge

Status: approach A chosen and design approved by the user ("duyệt", 2026-11-15).

> **Abandoned 2026-11-15 (user decision):** the implemented skirt rendered as floating walls/overhangs during the descent (user screenshot at 178 m). All code was removed and the game restored to the previous visible 1.5 km boundary. Kept only as a record.

## Intent and why

QA report `NASA-QA-Hinh-anh-gui-team.docx`, item 2 (P2): during the final descent (clearest around 300–150 m; captured at 208 m) the ground appears as a rectangle with straight edges and square corners, with black space beyond it. Kids lose the feeling of landing on a continuous planet. The same edge is visible from elevated points while exploring.

Cause: the playable terrain (`src/world/terrain.ts`) is a single 1,500 m square built from the 513×513 NASA heightmap. After the 300 m handoff only the surface scene renders, and nothing exists beyond that square. The earlier visual collar (`src/landing/descentBackdrop.ts`, mesh `descentTerrainCollar`) was removed on 2026-11-13 (`docs/close-descent-qa-2026-11-13.md`). It used the orbital shader material on both the collar and the core terrain, so the landing ground changed look. The restored presentation explicitly accepted a visible edge at the time. This design revisits that acceptance, keeping the restored look intact.

## Goals

- From the approved descent camera (360 m → touchdown, auto and manual, including retry) no straight map edge, square corner, black gap or ground popping into existence is visible.
- The same holds for exploration views from high ground (e.g. the tower/winch hill) and for the ending camera.
- The core 1.5 km terrain keeps its exact geometry, material, lighting and shadows.

## Non-goals

- No new NASA dataset, no resculpting or enlarging the playable area.
- No change to the approved descent camera, flight physics, HUD or handoff timing.
- No change to the lighting/visibility science (sunlight, Earth line-of-sight, night length), which keeps using the heightmap only.

## Anti-goals (failure even if the edge is gone)

- The landing ground or core terrain looks different from today (the reason the old collar was dropped).
- A visible seam, crack, brightness step or normal discontinuity along the 1.5 km boundary.
- Distant skirt hills that visibly contradict the game's sunlight science, e.g. the Sun disc hidden behind a skirt hill while the HUD/story says the camp is sunlit.
- Frame-rate regression the team would notice on the competition machine (1440×900).

## Approaches considered

- **A. Terrain skirt with the core's own material (chosen).** A ring of visual terrain around the core, shaped from the mirrored NASA heightmap, sinking with lunar curvature, rendered with the same `regolith` material and lights. Fixes the cause, also covers exploration. Risks: seam quality, far-plane distance, extra triangles.
- B. Darken terrain towards the edge. Cheapest, but with no lunar atmosphere it reads as an artificial dark ring, not a horizon.
- C. Reframe the camera so the edge stays out of view. At ~200 m it would need a much steeper downward view, breaking the approved "Gần hơn" close chase framing.

## Design

**Module.** New `src/world/terrainSkirt.ts`, created in `createSurfaceScene` right after `createTerrain`. Pure height function exported separately for tests. `descentBackdrop.ts` stays unused and is not revived.

**Geometry.** Concentric square rings from the core edge (half-extent 750 m) out to a half-extent of about 12 km, ring spacing growing with distance (quadratic, as in the old collar). The inner ring has exactly the core's 512 edge segments per side and reuses the core edge vertex positions, so the boundary is watertight with no T-junctions. Outer resolution may be reduced if the vertex budget requires it (builder's call), as long as there are no cracks between rings.

**Heights.** For a point outside the core:
- Mirror its coordinates back into the core (reflect about each edge, repeating), and sample the heightmap there. Exactly at the edge this equals the core height, so the join is continuous.
- Fade relief with distance from the edge: height = base + (mirrored − base) × fade(distance), where base is a smooth local mean and fade goes from 1 at the edge to a small fraction by a few km. This keeps far terrain from rising into the sky line and contradicting the sunlight science, and hides obvious mirror symmetry.
- Avoid recognisable copies of named landmarks (Dark Crater ~250 m from the south edge, MICA rim ~180 m): mirroring is used only in a narrow band at the edge for continuity, then blends to a different, non-mirrored sample of the heightmap (e.g. rotated/offset). *(My call, after the builder check.)*
- Subtract lunar curvature in game units. The game world is the real 3 km site squeezed ×0.5 in both distance and height (`public/data/terrain/SOURCES.md`), so the consistent drop is d² / (2 × 868,700 m), i.e. half the Moon's radius: about 72 m at 11 km. All distances in this document are game metres. *(My call.)*

**Normals.** Inner-ring normals copied from the core's edge normals; all other normals computed from skirt geometry. No lighting step across the boundary.

**Rendering.** Same `regolith` material instance as the core. `receiveShadows = true`, not a shadow caster, `isPickable = false`, no physics body, world matrix frozen, mesh name `terrainSkirt` (never `terrain`, which other code looks up by name). Always enabled: descent, exploration and ending. Cascaded shadows still end at 900 m, as they already do for the far parts of the core, so near and far ground stay consistent.

**Far plane.** The exploration camera's `maxZ` (6,000 m) is raised enough to reach the skirt rim from anywhere in the playable area. The ending camera (8,000 m) gets the same treatment. The descent camera already reaches 900 km. If raising `maxZ` causes distant z-fighting, the builder may raise `minZ` slightly or enable reverse depth, checked visually.

**Sky objects.** The Sun disc, Earth and stars are drawn as meshes 4,000–4,400 m away (`SKY_DIST`, `src/world/sky.ts`). Once the skirt extends past that, they must still draw behind all terrain (e.g. render them first / without depth so terrain covers them only where it is truly in front in screen space). Sunlight and Earth calculations are not touched. *(Raised by the builder check.)*

**Edge feedback (user decision, 2026-11-15).** The astronaut and rover are still stopped 10 m inside the edge by `clampToWorld` (`src/player/movement.ts`, `src/rover/roverSystem.ts`); the skirt has no physics. Because the edge no longer looks like an edge, the first time the clamp actually stops the player (on foot or in the rover), PIP says one short line explaining it in resource terms, e.g. "That's too far: our battery and O2 won't get us back!". It plays once per play session (not saved), through the existing dialogue system, with an English line and its Vietnamese translation. It never interrupts the descent, cutscenes or a dialogue already playing.

**Science untouched.** `horizonElevationDeg`, `SunlightCache`, Earth visibility and night calculations keep reading the heightmap only. The skirt is decoration, documented as such.

**Docs and credit.** DESIGN.md: replace the sentence accepting the visible 1.5 km boundary with a short description of the skirt, stating it is an illustrative extension mirrored from the NASA heightmap, not surveyed terrain. Same NASA credit as the core heightmap; no new dataset.

## Acceptance

- Unit tests: skirt height equals `sampleHeight` along all four edges and corners; values finite everywhere; curvature drop monotonic with distance; inner-ring vertices match core edge vertices exactly; horizon rule, checked over all azimuths from the camp, landing site, Sunny Hill (solar tower), MICA rim and relay spot: skirt horizon ≤ max(heightmap horizon, −0.27°). Below −0.27° `sky.ts` already hides the Sun, so the skirt can never cover a Sun the game says is up. At the relay spot, Earth uses the same rule with its own −1° cut-off. The ridge points sit ~55 m high, so the skirt is allowed to show below level; Sunny Hill is the hardest case, and the builder tunes fade, base and any extra near-edge drop-off until it passes. *(My call, after the builder check found the first wording impossible to satisfy.)*
- Existing tests and the QA script check that the core keeps material `regolith` and no `descentTerrainCollar`/`descentMoonBackdrop` exists still pass.
- In-game screenshots, before and after, at the same positions: descent at 300, 208 and 150 m (Autopilot and Manual), the tower hill and the ending camera. No visible edge, corner, gap, seam or brightness step. Liftoff camera checked too.
- FPS measured before/after at 1440×900, reported with numbers, not asserted.
- Edge line: a unit test shows it triggers on the first real clamp (on foot and in the rover), never again in the same session, and not while another dialogue plays; the Vietnamese line exists (`src/content/lines.vi.ts`, i18n parity test passes).

## Left to the builder

Ring count and segment reduction within budget; exact fade curve and base smoothing radius; `maxZ`/`minZ` values; whether to merge the skirt's draw with the core. Each choice is checked against the acceptance list above.
