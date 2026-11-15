# Coherent descent motion — QA

Implementation is in the active game served at localhost:5173. Scope: approved close camera, visible 1,000 → 300 m descent in 25–35 seconds, smooth Orion separation/ignition, live camera-only handoff.

## Changes

- One integrated flight state supplies actual position, velocity, applied throttle, attitude and fuel. Lunar gravity and the existing thrust budgets remain in effect; zero thrust no longer follows an artificial altitude schedule.
- Nominal low descent is about 30 seconds; horizontal braking remains continuous through 1 km and the vehicle becomes progressively upright.
- Time acceleration returns to ×1 by 1,200 m. The HUD formats the multiplier without an overflowing decimal string.
- Retained the approved close camera, added damped following and a small vertical aim bias. Removed the separate five-second spacecraft animation at 500 m.
- Live camera move at 360 → 300 m preserves actual flight motion. Incoming position, velocity, full orientation and held keys carry into final descent.
- Opening translation matches the existing exaggerated model scale and settles before ignition. Initial state is seeded from the previous transformed landing base, fixing the visual-centre/base jump.
- A bounded roll adjustment within the low camera move resolves the orbital/control-frame difference before transfer. Regression tests cover full quaternion continuity, not just pitch.

## Verification

- Full suite: **471 tests passed, 78 files**. TypeScript/Vite production build passed. The existing large mission chunk warning remains.
- Final automatic browser flight: **29.9507 seconds** from 1,000 to 300 m, then successful CONTACT. Arrival approximately −12.04 m/s vertical and 4.00 m/s horizontal.
- Transfer: position error **0 m**, full orientation error **2.98 × 10⁻⁸ rad**, first destination-camera displacement **0 m**.
- Ignition first frame: base travelled **10.67 m over 6.9 ms**, consistent with orbital motion; no multi-kilometre reference-point jump.
- Automatic low-approach frame intervals while recording: p95 **14 ms**, maximum **27.8 ms**, 3,604 samples. These are measured on the current machine in Chrome at 1440×810, not a universal frame-rate guarantee.
- Minimum measured orbital camera clearance during low approach: **408.9 m**.
- No runtime errors, failed asset requests, extra loading screen or black GUI frame during braking/handoff. One active render loop after handoff.
- Final manual-key flight: **29.9717 seconds** excluding pauses. Pause froze the entire flight state during ignition, low approach and bridge; resize passed. Space/D held across handoff continued consuming fuel and changing tilt. Position/orientation transfer errors were 0 m / 2.98 × 10⁻⁸ rad; no runtime errors. This pilot used scripted keyboard corrections, not manual-mode state overrides. Earlier manual approach plus automatic final descent reached CONTACT; the final automatic full flight also reached CONTACT.
- Standalone manual benchmark without recording: p95 **13.9 ms**, max **34.7 ms** across 3,915 unpaused low-approach samples, including resize/resume. No extra loading or black GUI frame. Skip retains existing unit coverage; a separate new browser Skip run was not performed.
- New Game and Continue: loading held below 100 while the Orion asset was deliberately blocked; gameplay did not start early. After release, progress remained monotonic and reached 100. Continue restored modules, samples and data logs. Pause/Resume worked in both flows.
- Protected HLS/Orion models, Moon texture, both heightmaps, Earth texture and attribution hashes match the baseline. No model or terrain asset was regenerated.

## Evidence

- `screens/coherent-auto.webm`: continuous low approach and control handoff.
- `screens/coherent-auto-ignition.webm`: separation and ignition.
- `screens/coherent-auto.json`: frame/state/continuity data.
- `screens/coherent-fly-bench.json`: final manual controls, pause/resize and performance data.
- `screens/coherent-startup-menu-qa.json`: New Game/Continue/loading checks.
- `screens/coherent-assets-check.json`: protected asset hashes.
- `../.superpowers/sdd/2026-11-13-coherent-descent-motion/`: baseline, tests/build logs and review ledger.

## Review and decisions

A fresh read-only reviewer found two important transform discontinuities: the ignition reference point and the final hull roll. Both were reproduced by regression tests, fixed, and verified with the full suite and browser transfer measurements. No critical or minor findings remained from that review.

Work stayed in the active feature checkout with a file baseline because the user's approved scene/assets include pre-existing uncommitted changes. No bulk reset, merge, push or unrelated staging was performed. User approval authorized implementation without another planning approval gate.

Unsafe no-thrust arrival is not guaranteed ten seconds of radio dialogue: real freefall may reach the ground sooner. Nominal warning timing remains tested. The six-second opening separation is an illustrative RCS-style movement at the existing cinematic model scale, not official spacecraft engineering.

The first automated ignition-pause check incorrectly kept sending fresh Space presses into the focused Resume button. The QA pilot now stops sending flight keys while paused and waits for confirmed pause state before measuring. The corrected browser checks passed without a game-side pause change.

The approved original terrain remains: orbital and playable maps are separate cinematic representations, and the 1.5 km playable map has a visible finite edge from elevated angles. Its geographic handoff and the existing separate final-descent fuel allocation remain game abstractions. This revision does not resculpt the map or alter Earth/atmosphere assets.
