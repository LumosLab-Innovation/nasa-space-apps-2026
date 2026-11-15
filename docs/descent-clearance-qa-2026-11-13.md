# Low-altitude transition QA — 2026-11-13

Integrated into the live checkout at `C:/Users/ADMIN/Downloads/NASA_Hackathon`, served on localhost:5173. Source backups are retained in `.superpowers/sdd/2026-11-13-continuous-south-pole-descent/before-final-integration`.

## Geometry and continuity

- At HUD 500 m, the conservative visible hull bounding corners are at least 498.69 m above the rendered orbital terrain; root clearance is 511.50 m. Orbital model scale is 0.001 (kilometres), with the earlier low-altitude model exaggeration removed.
- Natural automatic flight hands off with root clearance 299.80 m over local terrain; the folded footpads remain about 314.15 m above it. The reference is the deployed landing plane, not the folded pads.
- The automatic journey reaches contact. No page errors or HTTP errors were captured.
- Targeted manual handoff preserves held thrust/tilt keys. Bridge pause, overlap pause, landing pause, viewport resize and old-scene retirement pass. This latest manual run tests handoff, then enables automatic assistance; it is not evidence of an entirely manual touchdown.
- One canvas and one active render loop remain after handoff. The black transition GUI is absent throughout the bridge. Both scene views remain live during the blend.

## Startup and assets

- New Game and Continue pass on localhost:5173. Holding the Orion asset response keeps loading at 3% and prevents gameplay; releasing it allows real progress to finish at 100%. Continue restores the fixture save.
- Eight protected asset hashes match the pre-integration baseline, including lunar height/texture and spacecraft model assets. Earth/atmosphere source is unchanged.
- A shared Vite dependency cache caused transient outdated shader-chunk responses when preview and live servers ran together. Preview now has its own cache directory and is stopped; live was restarted with forced dependency optimization. The repeated startup checks have zero request errors.

## Automated checks and timing

- 454 tests pass across 75 test files; production TypeScript/build succeeds. The existing large JavaScript chunk warning remains.
- Development build on Chrome/ANGLE, GTX 1660 Ti: dedicated post-handoff render samples peak at 37.9 ms, with p95 27.7 ms after static hull batching and moving-rig preparation. The video/capture run peaks at 52 ms for this render scope and 125 ms RAF interval during the bridge. Interactive resize/pause capture adds further overhead. These are not a 60 FPS guarantee or proof of zero hitches.

## Visual limits

The original orbital NASA terrain and the original playable south-pole core are preserved, joined with an authored visual extension. This is cinematic registration rather than a newly surveyed continuous NASA route. At low altitude the distant extension remains soft and its boundary can still be discerned in shading. It is not yet a photorealistic seamless terrain solution. No new geographic dataset is claimed.

## Evidence

- `docs/screens/low-altitude-after.json` and `.png`: fixed 500 m diagnostic pose.
- `docs/screens/descent-final-auto.json`: natural automatic journey and contact.
- `docs/screens/descent-final-fly.json`: manual inputs, pause and resize checks.
- `docs/screens/descent-startup-menu-qa.json`: New Game / Continue / loading checks.
- `docs/screens/descent-final-auto-300m.png`: live 293.5 m frame immediately after handoff.
- `docs/screens/descent-500-to-300m.webm`: 15-second extract from the natural automatic run; start/end frames inspected.
