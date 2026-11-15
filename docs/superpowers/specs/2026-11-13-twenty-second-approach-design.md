# Twenty-second approach and visible low descent

Status: approved and implemented. Approach A selected. Final QA: docs/twenty-second-approach-qa-2026-11-13.md.

## Intent and scope

Refine the existing Babylon.js flight sequence in three places: eliminate the small upward kick at Orion separation/ignition, shorten the nominal 1,000 → 300 m approach to about 20 real seconds, and make descent visibly readable between 600 and 300 m. This is a focused revision of existing guidance and camera behavior, not a new flight system or scene.

## Evidence from the current build

- Automatic QA recorded 600 → 300 m in 16.77 seconds: radial altitude decreased 301 m and the craft travelled 359 m horizontally. Vertical speed changed from about −26.1 to −12.0 m/s. The craft is moving in the simulation.
- The close camera follows the craft's position and target together. Its distance parameter also decreases from 136 m at 600 m to 112 m at 300 m. This keeps the craft strongly stabilized in the frame and can weaken the visual cue of descent. Readability must be checked in motion, not inferred solely from the altitude HUD.
- At ignition, the current code blends camera position/target, hull orientation and scale, then applies a physical-base-to-visual-centre correction. This is a suspected source of framing discontinuity, not yet a proven cause. A prior automatic trace also recorded a 41.6 ms frame at ignition. Profile the frame-time stall and transform continuity separately.

## Approaches

- **A — selected:** recalculate the integrated trajectory, redistribute braking before 1 km, and preserve real position/velocity continuity into landing. Target about 20 seconds at ×1 in the last kilometre. More tuning and verification, but manual input and displayed velocities remain coherent.
- **B — rejected:** accelerate simulation time through the existing 30-second trajectory. Less trajectory work, but also accelerates manual reactions and can feel like fast-forwarding.

## Proposed behavior

1. **Separation → ignition:** carry the final position, velocity, hull orientation, scale and camera motion into one continuous transition. Ramp thrust and attitude smoothly. Calculate the physical base and visual centre consistently before composing the camera blend, if measurements confirm the current correction order is the cause. Remove measured synchronous work from the first burn frame where possible. No extra pause or extended waiting shot is added.
2. **1,000 → 300 m:** target 20 seconds, with an acceptance range of 18–22 seconds for the nominal automatic flight. Plan horizontal deceleration early enough that the existing thrust and fuel limits can satisfy the faster descent. Solve the height, velocity and acceleration profile together; do not just change a duration divisor or animate position independently. Preserve a safe, continuous entry to the existing final descent, nominally around −12 m/s vertical and 4 m/s horizontal. Manual deviations remain possible.
3. **600 → 300 m readability:** retain the approved close, low chase viewpoint. Ease out the continuous camera push-in in this band, and introduce a small, smooth framing change so the craft is not locked to precisely the same screen position. Initial proposed screen travel is roughly 3–5% of viewport height, downward as the craft descends; this is a visual tuning target, not an extra force or position offset on the craft. Show actual terrain perspective/feature motion. Do not scroll the texture, inflate the ship, add camera shake, or fake ground movement.
4. **360 → 300 m handoff:** join the revised framing to the existing final camera with continuous camera position and velocity, and transfer actual flight state and held controls. No frozen frame, black fade, second loading screen, or physics reset.

## Constraints and builder decisions

Keep the close-camera character and similar ship size; no wide zoom-out, dramatic orbit or overhead shot. Preserve the approved lunar heightmaps/materials, Earth/glow, models, HUD and landing mechanics. This proposal allows only the small composition adjustment above. Exact trajectory coefficients, smooth framing curves and preparation strategy are implementation decisions to be verified against thrust limits and capture evidence. These are educational game timings, not an official Artemis flight profile.

## Acceptance and review evidence

- Measure nominal 1,000 → 300 m timing at 30, 60 and 120 FPS; check throttle, fuel and attitude limits, integrated position/velocity and continuous 300 m transfer.
- Capture ignition at ordinary speed and slow playback. Measure screen-space craft motion, camera motion and frame times without screenshot/video capture in a separate run. Confirm no instantaneous upward framing step or velocity reset; report any remaining stalls rather than promising a universal frame-time ceiling.
- Record a continuous 700 → 300 m clip with visible terrain landmarks and HUD. Confirm that descent is perceptible through terrain perspective and restrained framing motion, in addition to falling altitude numbers. Capture 600/450/300 m stills for scale/clearance checks.
- QA automatic and manual controls, pause/resume and held keys through both joins; verify no repeat loading or black overlay and successful nominal touchdown.
- Run regression tests and production build. Supply a short ignition clip plus the revised low-approach clip for user review.

Implementation ruling: the existing final-camera angle and radius are retained. To avoid its old centre target pulling the ship upward during the join, carry the downward composition with a shared target height of 74 m at 300 m, easing to the former 18 m by 150 m. This resolves the conflict between exact old centring and the approved continuous low-altitude framing. DESIGN.md records the updated balance values.


