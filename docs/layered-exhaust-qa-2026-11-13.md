# Layered exhaust: implementation and QA

## Scope and comparison

The approved v9 companion (v8 contact timing) remains the reference for soft white/cool exhaust, different nozzle lengths, paired attitude pulses and delayed contact cutoff. Subsequent user corrections take precedence over its original amplitudes:

| Area | Runtime result / correction |
| --- | --- |
| Main engines | Six actual bell-exit anchors; soft crossed ribbons and bounded free-moving wisps. Width increased 50%, length roughly 24% at mid-throttle after the user's visibility feedback. |
| RCS | Two torque-matched jets at a time; angular acceleration starts the pair and slowing reverses it. Wider 2–3 m readable tails; quiet at rest and contact. Artistic port layout, not certified HLS geometry. |
| Orion | Eight small aft auxiliaries only. Ignition pulses followed by a short 2.7–5.25 s departure burn; central engine remains off. Existing orbital motion/camera preserved. |
| Ground flow | Rejected eight repeated wedges replaced with one closed 360-degree terrain-draped mesh. Radially advected turbulent opacity, soft irregular edge. Angular noise frequency stays fixed over time, avoiding increasingly fine radial spokes late in descent. |
| Dust | Engine dust billboards flattened to 0.12 vertical aspect and reduced opacity; smaller ballistic grains. Foot and rover dust retain their existing appearance. |
| Shutdown | Main visual power holds 0.4 s after contact then fades over 0.8 s. No extra thrust/fuel. RCS stops immediately; pre-existing ballistic dust continues. |

The 2D companion is a motion/style reference, not exact 3D geometry or physical plume calibration. White/blue visibility, port placement and pulse timing are illustrative. NASA/ESA/SpaceX references and distinctions are in `public/textures/exhaust/SOURCES.md` and the science notebook.

## Verification evidence

- Full suite after visibility/departure/continuous-sheet changes: **497 tests, 84 files passed** (`.superpowers/exhaust-v2-suite.log`).
- Final production build passed after the shader advection correction (`.superpowers/exhaust-final-build.log`, exit 0). The final targeted exhaust suite also passed: **15 tests / 4 files** (`.superpowers/exhaust-final-tests.log`). Vite still reports the pre-existing large lazy mission chunk warning.
- Surface seam regression was observed failing against the old wedge geometry, then passed. Timing regression was observed failing for the old Orion three-pulse-only sequence, then passed.
- Renderer lifecycle tests cover kilometre/metre snapshot transfer, live tail preservation, exact pause, reset and idempotent disposal without deleting scene textures.
- Torque tests cover force-cancelling pairs and torque sign on all three axes. Stable attitude/quaternion sign changes do not create pulses.
- Ground vertices follow terrain samples; local slope planes clip downward jets. Heightmap, Earth, atmosphere, gameplay camera and flight controller were not changed by this feature.
- Four original RGBA WebPs: exactly 300 × 300; **35,750 bytes total**. All are preloaded through the mission manifest.

## Browser evidence and boundaries

`qa-exhaust-contact.cjs` is an explicitly focused **50 m entry fixture**, using the actual terrain, camera, renderer and landing controller. It is not a full flight pass. Its second case applies real Space/D input then enables assistance for touchdown. Menu actions in this fixture are invoked programmatically; real menu clicks are tested separately in `qa-exhaust-loading.cjs`.

- The final shader fixture passed both cases: contact fan visible during hold, exact zero main/RCS/fan after decay, bounded particles, no page errors (`.superpowers/exhaust-v3-contact.log`). The final actual-game contact image was inspected after the advection correction; the fine radial spokes are gone.
- `qa-orion-exhaust.cjs` passed the real orbital scene via its development intro-only route. Eight auxiliary jets are visible during departure; only auxiliary types fire and firing ends at braking. Evidence: `docs/screens/exhaust-orion-departure.png`, `.webm`, `.json`.
- Final New/Continue loading regression **passed** with SwiftShader (exit 0): monotonic real progress through 100%, no foreign default-framebuffer writes while loading, menu keeps model loading lazy, saved modules/samples restored, pause/resume works, errors and failed responses empty. Evidence: `docs/screens/exhaust-loading-menu-qa.json`, `.superpowers/exhaust-final-loading-swiftshader.log`. Two D3D software-render attempts timed out on an unpainted menu before clicking New and are not counted as passes; the functional rerun used SwiftShader without modifying game code.
- Diagnostic close images in `docs/screens/exhaust-review-*.png` use a **separate QA camera**; the gameplay camera is unchanged. Contact clips are explicitly fixture captures, not full successful manual flights.

## Performance limitation / failures not counted as passes

The automated browser reports **Microsoft Basic Render Driver / ANGLE D3D11**, not the machine's discrete GPU. Full-flight timing runs on this renderer failed the existing 18–22 s wall-clock gate (approximately 35–48 s in sampled runs); the existing capped timestep slows simulated time at low frame rate. The manual key-pulse harness also failed to complete an unassisted landing at those frame rates. These are **not marked as full-flight or performance passes**. Position/orientation transfer, held-input transfer and no-black-frame checks did pass before those failures.

A same-browser stationary diagnostic on/off comparison is in `docs/screens/exhaust-benchmark.json`: 1440 × 810, CPU submission plus `gl.finish`, alternating 25-sample blocks after warm-up. Results vary (on p95 8.3/4.9 ms; off 7.8/1.5 ms); they do not establish a <2 ms hardware overhead guarantee. Hardware-GPU real-time flight verification remains outstanding. The cosmetic effect does not alter guidance equations to hide this limitation.

Some mouse-driven QA attempts stopped waiting for measured menu controls; those attempts are not loading passes. A run invalidated by page reload during editing is also excluded. Final captures must be made with source editing stopped.

## Review findings addressed

The required fresh whole-change review found two important issues: undefined GLSL negative-base `pow` / reversed `smoothstep`, and four-corner fans intersecting uneven terrain. Both were fixed (defined arithmetic/ranges and densely sampled terrain mesh). RCS port hardware was moved into the persistent rig so it remains after exhaust disposal/Continue. Orion exhaust meshes are excluded from shadow casters. Later visual review caught oversized smoke-like dust and the repeated fan silhouette; both received the corrections above.

No unrelated working-tree edits were reset, staged or committed. Live implementation workspace: `C:/Users/ADMIN/Downloads/NASA_Hackathon`.
