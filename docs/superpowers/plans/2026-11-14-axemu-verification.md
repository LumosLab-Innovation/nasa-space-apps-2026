# AxEMU implementation verification

Implementation branch: `codex/axemu-character-rig`, based on `c3071fd`.

## Delivered

- Reproducible AxEMU-inspired GLB: 39 joints, weighted soft surfaces, rigid equipment, four authored clips, named tool/pouch sockets. File is 2,175,736 bytes (2.08 MiB), within the existing 5 MiB asset contract. Body UV maps are 1K; ten small material definitions preserve legacy names and separate fabric/metal/visor details. No additional runtime package.
- Terrain-driven gait remains authoritative; action clips blend into bounded hand/foot IK. Existing camera constructor, target offsets and movement balance are unchanged.
- Sample acquisition/commit/cancellation covers the five science rocks plus icy regolith. Module entry, 1.5 s held alignment, commit and recovery cover all four module types. Visible connectors remain outside the finished module.
- All model bytes use the existing initial loading pipeline. Hidden sampler material variants and skinned materials are warmed before the character is returned.

## Automated evidence

- Initial focused legacy gait/model baseline: 74 passed.
- Action transaction tests: 7 passed after a missing-module RED run.
- Legacy GLB failed the new skin/clip contract; rebuilt asset and existing model contracts passed.
- Intermediate model/gait/action/IK suite: 90 passed.
- Final targeted run: **7 files, 34 tests passed**, including six sample types, four module types, release/cancel/commit/pause input, mirrored/yawed IK, source-loader autoplay and asset skin/clip contract. The previously timed-out braking guidance test also passed in this run with `--testTimeout=30000`.
- `npm run build`: passed after final runtime changes. Existing large-bundle warning remains; no claim that this change resolves that separate concern.
- `git -c core.whitespace=cr-at-eol diff --check`: clean (tracked source files use CRLF).
- Full-suite attempt with normal isolation hit one 5-second timeout in unchanged `brakingTerrainGuidance.test.ts`; that test passed the targeted rerun above. The broad run was stopped after prolonged per-file import overhead. **The whole suite is not claimed to have passed.** An earlier no-isolation experiment was discarded because unrelated mock-based tests require isolation.

## Browser evidence

- Both imported skin and actual Havok-driven Astronaut rendered without console errors. Closed shoulder caps and corrected cloth normals; sampler tip measured within the sample mesh at acquisition.
- Actual surface startup completed through the real loading pipeline (`?jump=qa`, autosave disabled). The real E interaction collected anorthosite once, hid its world rock and returned to idle.
- Runtime harness verified pause freezing, cancellation without reward, installation release, and teleport cleanup. Held-E across Pause is additionally covered by the keyboard regression; no claim is made that all four modules were manually completed in the full world.
- Installation hand target error below 0.001 m at yaw 0, +90, 180 and -90 degrees in the fixed runtime fixture.
- Cached source animations: 0 running. A second instance retained identity rest rotation while the first performed an action; skeletons and targeted animation nodes were distinct.
- Same-camera static fixture comparison: old body 20,612 triangles / 57 meshes; new body plus sampler 27,620 triangles / 61 meshes. Median CPU frame submission was approximately 1.8 ms for both over 120 renders. This is a small fixture measurement, **not full-game FPS or GPU performance**.
- Scene disposal completed without errors. Temporary fixture pages and legacy comparison asset removed. No video recorded; final artistic/motion QA belongs to the user as requested.

## Review

A fresh reviewer identified source clip autoplay, held-E loss across Pause, and world-space arm offsets. All three were fixed and verified above. No changes to Orion/HLS, Earth/glow, terrain, flight effects, save schema or camera framing were made.
