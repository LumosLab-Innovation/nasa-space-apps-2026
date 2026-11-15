# Tranquility terrain QA — 2026-11-12

Implementation tested at localhost:5173 in the active C:/Users/ADMIN/Downloads/NASA_Hackathon checkout.

- Full Vitest suite: 64 files, 418 tests passed. Terrain regression suite: 6 tests (initially failed before implementation).
- TypeScript and production Vite build passed. Existing large gameplay chunk warning remains; terrain assets are fetched after choosing to play, not by the main menu.
- New Game: real progress recorded from 0 through intermediate completed-asset counts to 100. All three Moon textures ready before entering orbit. Continue restored a surface save. No browser JavaScript errors.
- Inspected actual opening orbit, Apollo 11 cutaway, undocking and low flight. Moon: 165,616 vertices, 328,816 triangles, one static terrain mesh. Displacement scale 1×; NASA regional elevation averages to about −1.925 km at Apollo 11 relative to the 1737.4 km reference radius.
- Ring tube's lowest vertex had 67.9 m sampled terrain clearance. Tested spacecraft bounding-box corners and camera near-plane clearance at 5 km, 2 km and 680 m; all stayed above terrain.
- Hardware rendering: Chrome WebGL2 / ANGLE Direct3D11, NVIDIA GTX 1660 Ti, 1440×810. Short 45-frame samples per altitude: median 6.4–6.9 ms; p95 11.1–13.1 ms. These are local short-run results, not promises for mobile or all hardware.
- Shadows: static DEM ray-traced terrain sunlight occlusion; moving ships use a 1024² PCF shadow map with 36 casters. Fixed-camera shadow on/off comparison changed 20,370 pixels above a 6-point RGB difference threshold.
- New compressed height field: 1,488,405 bytes; lossless normal/occlusion map: 1,682,558 bytes. Source TIFFs remain development-only. Numerical gzip is served as `.bin` to avoid Vite auto-decompressing `.gz` response bodies before application decompression.
- Independent terrain code review found no actionable issues.

## Scientific and visual limits

LOLA source spacing is approximately 474 m and rendered regional geometry approximately 948 m. This supports orbital-scale crater relief, not rocks or metre-scale landing hazards. The existing south-pole exploration terrain is unchanged. The orbital Sun angle is staged (about 20° elevation, west of Apollo 11); baked terrain shadows are valid for that fixed direction, not a changing ephemeris. The Apollo ring and enlarged spacecraft remain cinematic overlays/scales.

Screenshots and detailed frame/clearance metrics: `docs/screens/tranquility-terrain-orbit.png`, `tranquility-terrain-apollo11.png`, and `tranquility-terrain-qa.json`.
