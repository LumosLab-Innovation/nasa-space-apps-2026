> Status: rolled back at user request on 2026-11-13. Retained as historical context, not the current visual specification. The independent hatch depth-precision fix remains active.

# Vacuum plume refinement implementation plan

**Goal:** Apply the user's three-layer lunar exhaust direction to existing effects.
**Architecture:** Specialize main-nozzle shader, keep bounded pools and scene transfer; adjust landing-only dust launch and shape.
**Tech stack:** Babylon.js / TypeScript / GLSL / Vite.
**Spec:** ../specs/2026-11-13-vacuum-plume-refinement.md

## Constraints and review focus
No camera/physics, RCS, Orion ignition, asset loading or save changes. Zero thrust must still turn off the plume; pause and scene handoff preserve it. Dust must survive cutoff independently, collide with local terrain, and not become hovering atmospheric smoke. Existing pool bounds stay fixed.

- [x] Update main shader/size and mild independent nozzle variation; reduce surface gas brightness.
- [x] Make landing dust flatter/faster with terrain-directed launch, modest roll and independent fade; preserve foot/rover dust.
- [x] Update dust lifetime expectations for low arcs and run relevant exhaust/dust/flight regressions.
- [x] Build and update DESIGN.md with actual outcome; user handles visual QA.

Validation: 54 tests in 8 suites passed (exhaust state/renderer/surface/nozzles, dust, ballistic, descent, finalReviewFixes); production build passed with existing chunk-size warning. Both GLSL programs compiled and linked in headless Chromium WebGL (SwiftShader). This is shader validation, not an in-game visual or hardware-performance pass. No screenshots/video captured.
