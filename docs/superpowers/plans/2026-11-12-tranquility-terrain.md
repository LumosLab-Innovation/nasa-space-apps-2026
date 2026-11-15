# Tranquility relief implementation plan

> Execute inline with superpowers:executing-plans; preserve the existing uncommitted UI work.

**Goal:** Approved option B: real NASA elevation geometry, terrain-following Apollo 11 marker and safe low-flight shots, with realistic shadows and browser QA.

**Architecture:** Offline crop NASA SVS LOLA 64 pixels/degree elevation, retain a coarse global field, and ship compressed numerical data. Build a static mesh denser around the orbital route. Bake terrain sun occlusion and detailed normals from the same DEM for the staged orbital Sun; use a small dynamic shadow map for the ships. No invented relief and no per-frame terrain rebuilding.

**Tech stack:** Babylon.js 9, TypeScript, GeoTIFF build tool, Vitest, Playwright.

**Constraints:** Kilometres in orbit; elevation reference 1737.4 km; NASA unsigned samples decode as sample / 2000 - 10 km. Preserve loading progress and menu behavior. This orbital region does not replace the existing south-pole exploration map.

**Review focus:** Correct NASA offset and north/east orientation; watertight joins; marker follows the full circumference; camera and ship clearance at end of braking; loading failure and disposal; avoid false hardware FPS claims from software rendering.

- [x] Add tests for decode, bilinear sampling, boundaries, geometry and clearance. Verify initial failure.
- [x] Reproducibly crop official elevation data; generate compressed height field and normal/occlusion map; record source and limits.
- [x] Build static coarse/fine terrain, share sampler with marker and flight camera; add terrain and ship shadows.
- [x] Run tests/build, inspect actual wide/cutaway/low-flight screenshots, compare shadow on/off, and exercise New Game/Continue loading. Record measured rendering mode and results.
