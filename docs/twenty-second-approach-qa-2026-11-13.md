# Twenty-second approach and ignition continuity — QA

Approved design: `superpowers/specs/2026-11-13-twenty-second-approach-design.md`.

## Result

The nominal 1,000 → 300 m descent now runs at ×1 in about 20 seconds. Position still integrates actual thrust, gravity and velocity; manual input can depart from the reference. Earlier braking is redistributed between 4 km and 1 km, and the low reference eases its acceleration before the final thruster budget takes over.

The ignition kick was a camera composition error: after blending toward the captured outgoing camera, the scene translated that entire blend by the new physical-base/visual-centre correction. The before trace showed a roughly 2.5 km camera translation and a 94 pixel screen jump. The correction now applies only to the chase goal, before the camera blend.

Below 600 m, the camera stops continually moving closer and holds its close distance parameter at 136 m. A restrained aiming bias gives the craft visible downward framing travel. The final camera retains its prior angle/radius but carries this composition through the 300 m join, then eases its target back to the earlier position by 150 m. This avoids the old upward reframing at the join. No craft/ground motion is faked and no asset was regenerated.

## Measured automatic flight

Chrome, 1440×810, ordinary New Game flow, video capture enabled:

- 1,000 → 300 m: **20.250 seconds**.
- Checkpoints after 1 km: 600 m at 7.03 s, 450 m at 11.18 s, 360 m at 15.48 s, 301 m at 20.18 s.
- Incoming velocity about **−12.00 m/s vertical, 3.99 m/s horizontal**; successful CONTACT.
- Ignition screen displacement: **0.305 pixels** across the first burn frame (previously about 94 pixels). The base's travel matches continuous orbital motion.
- Handoff position error **0 m**, quaternion angle error **2.98×10⁻⁸ rad**. No black GUI overlay, failed asset request or runtime error; one active render loop after handoff.
- Craft reference moves downward about **40 pixels / 5% of screen height** from 600 to 360 m. The final composition carries that motion through the camera join rather than pulling the craft back to the centre.
- Around ignition: frame interval p95 **14.1 ms**, maximum **27.5 ms**. During the low approach with video/screenshots: p95 **20.8 ms**, maximum **48.7 ms**. Recording/readback spikes are included; these are measurements on this machine, not a universal performance guarantee.

## Regression and review

Final full suite: **479 tests passed in 79 files**. TypeScript and Vite production build passed. The existing large mission-bundle warning remains; no new dependency or downloaded asset was added.

Final manual-key benchmark after the camera update: **20.277 seconds**, ignition displacement **0.290 pixels**, ignition frame interval p95 **13.8 ms / maximum 27.7 ms**, no recording/tracing during this run. Pause at ignition/approach/join, viewport resize and held Space/D across transfer passed. Position/orientation transfer errors were 0 m / 2.98×10⁻⁸ rad. No runtime errors or failed requests. This final benchmark ends after the held-input check; the final automatic run and earlier manual run reached CONTACT.

All protected HLS/Orion models, lunar texture/heightmaps and Earth asset hashes match the previous approved baseline (`screens/twenty-final-assets.json`).

The 18–22 second tests first failed against the old 30 second trajectory. The new reference passes the full-flight tests at 30/60/120 FPS on flat ground and on the actual compressed NASA terrain. Tests cover no thrust, empty fuel, integrated displacement, bounded thrust/fuel use, matching reference derivatives and stable high-altitude guidance.

Camera regression tests cover the outgoing world position/velocity, restrained framing endpoints, and the derivative-matched final camera target. A fresh read-only reviewer found no actionable issue in this task's source delta, including the reference integral and camera join.

First manual-key run (before the final target-centre adjustment): **19.903 seconds**, then successful automatic touchdown. Pause at ignition/approach/join, resize, and Space/D held through transfer passed. A trace without recording showed ignition p95 7.2 ms / maximum 20.9 ms; largest renderer main-thread task was 20.8 ms. No new unmeasured preloading or shader change was introduced on speculation.

## Evidence

- `screens/twenty-before-auto.json`: before-fix projected craft and camera trace.
- `screens/twenty-final-auto.json`, `screens/twenty-final-summary.json`: final automatic measurements.
- `screens/twenty-final-auto-ignition.webm`: separation and ignition at normal speed.
- `screens/twenty-final-ignition-slow.mp4`: the ignition window at half speed.
- `screens/twenty-final-auto.webm`: low approach and final camera handoff.
- `screens/twenty-final-auto-600m.png`, `screens/twenty-final-auto-450m.png`, `screens/twenty-final-auto-300m.png`: scale and composition checks.
- `scripts/qa-twenty-second.cjs`: repeatable browser QA, using keyboard throttle corrections for manual mode rather than state overrides.

Existing limitations remain: orbital and playable terrain are separate cinematic representations, the playable map has a finite visible edge, and final descent uses its existing separate fuel allocation. This task preserves those systems and all Moon/Earth/model assets.
