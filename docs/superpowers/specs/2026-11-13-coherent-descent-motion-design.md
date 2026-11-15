# Coherent descent motion: Orion separation to 300 m

Status: approved by the user (DUYỆT), 2026-11-13; implemented and QA recorded in docs/coherent-descent-qa-2026-11-13.md.

## Intent and decisions

The user selected a 25–35 second approach from 1,000 m to 300 m, preserving the approved **Gần hơn** camera. They want visible descent and a smooth change from Orion separation to the braking burn. Nominal duration is **30 seconds of unpaused play**. This is an educational game trajectory, not an official Artemis/SpaceX flight profile.

Preserve the low camera angle, close framing, spacecraft/gear models, original NASA terrain assets, Earth and atmosphere, UI style, save data and controls. Do not add a new terrain collar, fake surface motion, atmospheric drag, airborne dust at high altitude, camera shake or another sweeping cinematic shot.

## Approaches considered

1. Keep the approximately 13-second segment and change only camera animation. Cheaper, but it retains competing movement schedules and gives the player little time to perceive descent. The user selected the slower alternative.
2. **Selected direction:** approximately 30 seconds, with actual movement, HUD, thrust and camera derived from the same flight state. Retain flight-computer guidance appropriate for the existing controls. This fixes movement inconsistencies while keeping the game accessible.
3. Full orbital/landing flight simulator with new controls and mission-accurate spacecraft systems. Outside this revision; it would change the game rather than refine this sequence.

The user selected the duration and camera. Controller details and timing below are engineering proposals for approval.

## What the player sees

### Orion separation and ignition

- Release and drift apart without a position jump. Separation starts gently, then coasts; avoid the current independent `0.6` scene-unit-per-second offset and hard six-kilometre cap.
- Aim the lander for braking while both spacecraft keep moving. Retain the existing roughly 2.4-second settling beat, but do not use its end as a switch that abruptly starts a different movement model.
- Ramp commanded engine thrust over about **1.5–2 seconds**. Plume length/brightness follow the actual applied throttle, not a separate on/off effect. The ship retains its velocity when ignition starts and then decelerates continuously.
- Any high-altitude time acceleration changes gradually and applies to both ships and the flight state consistently. Return to **×1 by 1,200 m** and keep ×1 below it. HUD reports physical velocity, with the time multiplier identified separately where applicable.

### Nominal 1,000 → 300 m approach

| Elapsed since crossing 1,000 m | Approximate clearance | Intended perception |
| --- | --- | --- |
| 0 s | 1,000 m | Noticeable forward travel; lander descending, engine already braking. |
| 10 s | 690 m | Ground landmarks move through the view; vertical closure remains visible. |
| 20 s | 450 m | Horizontal motion slows; lander increasingly aligns for vertical descent. |
| 30 s | 300 m | Smooth entry to the existing final-descent controls, near −12 m/s vertical and 4 m/s horizontal. |

These are reference checkpoints, not teleports or independent altitude animations. They may move slightly when following real terrain. The 25–35 second acceptance window applies to nominal automatic flight and reasonable manual braking; a pilot who releases thrust or over-brakes is not secretly forced to match it.

- No separate five-second movement override starts at 500 m. The final 500 → 300 m is part of this same flight and timing, rather than an additional segment.
- The transition into the existing close landing camera is the final approximately **3–4 seconds within** the 30-second approach. Both scenes keep rendering live; no black frame, frozen screenshot or second loading screen.
- Rotation follows guidance/required braking direction with a bounded turn rate. The craft progressively becomes upright; it must not suddenly rotate independently of its thrust or accelerate its fall just to reach 300 m on time.

## Authoritative flight and guidance

- Maintain one physical state in metres/seconds: position, horizontal and vertical velocity, applied thrust/throttle, orientation and remaining fuel. Scene units are a rendering conversion; the orbit renderer uses kilometres and the surface renderer uses metres.
- Actual position is integrated from actual velocity. HUD altitude is clearance above the rendered terrain directly below the landing reference; horizontal speed and descent rate come from that same state. Do not advance longitude from the target band while reporting a different measured speed.
- Guidance defines a smooth nominal reference trajectory. Its position, velocity and acceleration agree with one another; guidance drives the craft toward it rather than overwriting position each frame. Use the current lunar gravity and vehicle thrust/mass limits. Do not add air resistance or increase available thrust to make the timing work.
- Before 1,000 m, shape the guided approach to reach a feasible entry velocity and descent rate. Preserve the actual entry state; never clamp velocity instantaneously at the 1,000 m gate. Reference checkpoints are design targets and must be validated against available thrust, fuel and terrain before implementation is considered complete.
- A useful nominal vertical reference is a smooth 30-second segment from 1,000 m at roughly −32 m/s to 300 m at −12 m/s, with zero reference acceleration at the endpoints. Fit or adjust the reference before entry using the real incoming state. Ground variation and finite thrust take precedence over an exact timestamp.
- Above 300 m, retain the existing control split: the flight computer manages attitude/vertical guidance; Space commands braking in manual mode and automatic mode tracks the nominal profile. There is one available thrust budget: manual and vertical guidance cannot each spend the full engine thrust. With insufficient thrust, report and simulate the resulting deviation; do not secretly move the ship along the nominal track.
- At 300 m transfer the actual position-relative-to-ground, velocities, orientation, engine state and held keys. Do not reset to fabricated `−12 / 4` velocities to conceal an error. Preserve existing fuel budget/control rules, including the separate final-descent fuel allocation; do not add or refill fuel during this change. These remain game abstractions rather than a full spacecraft mass/fuel-system simulation.
- An unsafe manual arrival keeps its actual motion and existing warning/failure/retry behavior. Nominal duration is not a guarantee for intentionally unsafe input.

## Camera and motion cues

- Retain the selected nominal distance `0.8 × (110 + 100 × clamp(h/1000,0,1))` m, backward/up/side ratios `1/.45/.3`, forward target `.6d`, existing FOV and physical ship scale.
- Replace frame-perfect camera locking with a critically damped follow using velocity feed-forward. Proposed response time: **0.35–0.5 s**, settled offset error capped around **8 m**; no shake, overshoot or repeated catch-up. Pause freezes its state; resume does not integrate elapsed paused wall time.
- Add a small altitude-dependent aim bias so the ship moves downward about **4% of viewport height** from the 1,000 m reference to the 300 m reference, instead of remaining pinned to one pixel. Keep the approved low angle and horizon; do not zoom farther out. This is an explicit, small framing refinement, to be judged in the preview recording.
- Ground and fixed landmarks remain stationary in world space. Their apparent movement must be caused by the real flight/camera motion. Terrain texture must not scroll to manufacture speed. Do not add fabricated rocks/craters to NASA height data for this revision.
- Use recorded motion to judge whether closure is visible: still images alone cannot approve this change. If the existing terrain lacks enough visual detail, show that limitation rather than quietly changing its assets or the approved camera.

## Transition and input continuity

- Position, velocity and camera motion remain continuous at separation → ignition, ×1 entry, 1,000 m, scene handoff and 300 m. Avoid a new velocity kink at the end of a camera easing curve. Guidance/throttle acceleration changes are bounded rather than switched instantly.
- Preserve destination preparation during initial loading, scene retirement, held inputs, Pause/Settings, resize behavior and Continue. The short image blend may remain for the two existing terrain representations; it is not allowed to become a separate flight integrator.
- Camera coordinates and actual craft state are converted together at scene handoff, preserving clearance over the destination ground. The two existing maps remain cinematic representations, not a newly surveyed continuous geographic route. Their existing finite-edge limitation is outside this change.

## Validation and deliverables

- Plot/log actual height, horizontal/vertical speed, applied throttle and time multiplier from before separation through 300 m. Compare finite-difference position changes with reported velocity and check continuity at every phase boundary.
- Nominal automatic flight crosses 1,000 → 300 m in 25–35 unpaused seconds with monotonic descending clearance; no stationary hold introduced at 1,000, 500 or 300 m. No terrain penetration or camera collision.
- Test manual adequate/no/excess thrust, frame rates 30/60/120, a brief long frame, pause/resume during ignition/approach/blend, resize, held keys, skip, New Game and Continue. Unsafe input need not meet nominal duration but must not be hidden by a reset.
- Check camera against the selected framing with the stated 4% screen-space allowance. Capture a preview of separation/ignition and a continuous 1,000 → 300 m clip with HUD; also collect a performance run without recording overhead.
- Preserve asset hashes and NASA attribution. Upon implementation approval, record any revised game balance/timing constants and the distinction between real data and guided reconstruction in DESIGN.md.

## Left to the builder

Choose controller gains, interpolation representation, fixed-step accumulator policy and internal module boundaries. Tune within the specified duration, thrust constraints, camera bounds and existing controls; do not change scope or conceal physically infeasible guidance. If meeting the reference requires a different camera, engine budget or control scheme, return that specific tradeoff for review.
