# Manual braking: challenge with recoverable mistakes

Status: approved by user, 2026-11-15; implemented; automated validation passed, player feel awaiting user QA.

## Intent and scope

The user selected manual control that requires deliberate Space input, with enough time to recognize and correct mistakes. The recent 35–100% speed-feedback assistance makes the computer do too much. The previous highly sensitive control failed even when the player followed the cues. Avoid both outcomes.

This is a small orbital-braking control/balance correction, from the existing burn-entry handoff to 300 m. Preserve the current camera, terrain, spacecraft, exhaust, RCS, dust, explosion, camera shake and first-failure popup. Final-descent controls below 300 m and full autopilot remain unchanged. The user will perform visual/play-feel QA; no video.

## Approaches

- A — direct gradual thrust control with attitude stabilization and recovery time: selected by the user. Holding/releasing Space determines thrust; the computer cannot pull speed back into the band. Requires deliberate correction without rapid tapping.
- B — the same control with emergency speed correction near danger: considered, but weakens the requested challenge by rescuing sustained incorrect input.
- The current adaptive 35–100% speed feedback is rejected because the player reports that it feels mostly automatic.

## Space and flight dynamics

In manual orbital braking, holding Space increases applied throttle continuously; releasing decreases it continuously. Use proposed initial rates of +12 and -10 percentage points per real gameplay second, clamped to 0–100%. A half-second press adds about 6 points; it does not jump straight to full thrust. Releasing Space eventually reaches zero, rather than an automatically maintained nominal burn.

These numbers are builder-proposed starting values, not measured results or official spacecraft limits. Tune against the acceptance cases below before calling the change complete. Do not bring back automatic speed rescue to make tests pass.

Remove both the nominal-plus-offset manual thrust demand and its adaptive speed-feedback contribution. Retain smooth guided attitude for a legible, stable braking orientation. In manual mode, actual horizontal speed error must not silently control either throttle or pitch: use the nominal trajectory direction for horizontal guidance, retaining bounded vertical attitude stabilization and existing angular slew limits. Full autopilot continues using its own existing feedback controller.

Integrate actual thrust, fuel consumption and lunar gravity. Do not reset velocity, snap altitude or refill fuel during recovery. Empty fuel overrides input with zero thrust. On entering manual control, inherit current applied throttle and attitude; preserve the existing separation/burn-entry transition. Retry uses the existing checkpoint and clears input/timers.

Keep manual playback at a maximum of x4, easing to x1 by 1,200 m. Input rates and failure timers use unpaused real gameplay seconds, independent of playback warp and frame rate. The nominal 1 km to 300 m trajectory stays a reference, not a forced completion time.

## Warning and recovery window

Keep the green speed band at +/-18% of reference speed, with a minimum half-width of 3 m/s. Outside green, show the existing Increase braking / Reduce braking cue. Keep the existing 1-second warning debounce. Do not fail merely for leaving green.

A severe deviation is an error greater than max(45% of reference speed, 15 m/s). Keep the 2-second burn-entry grace period, then accumulate a failure timer only during severe deviation that is not improving. Fail at 6 accumulated gameplay seconds.

While normalized speed error improves faster than 0.015 per second, reduce accumulated failure time by 2 seconds per second. Crossing back below the severe threshold resets the timer. This grants time only for actual recovery, not merely for pressing the correct key. Pause freezes everything. Repeated wrong input after improvement starts accumulating time again.

Ground impact and the existing unsafe-approach limits at 300 m remain immediate safety failures; the six-second allowance applies to speed-band error, not guaranteed survival immediately before impact. Successful handoff still requires absolute lateral speed <=12 m/s and downward speed <=25 m/s. Failure retains the current explosion/smoke and Choi lai / Lai tu dong popup.

## HUD

Reuse the existing speed band, thrust percentage, cues and framing. Manual mode should describe attitude assistance rather than imply automatic speed holding. No new overlays, layout changes or camera changes are proposed.

## Acceptance and tuning

- Test at 30/60/120 FPS, x1 and the real x4-to-x1 schedule, including real terrain-clearance guidance.
- At representative 10 km, 3 km and 800 m checkpoints, sustained incorrect hold/release must move speed visibly out of green and must not self-correct into green while the same wrong input continues. Aim for a noticeable departure over roughly 3–5 seconds from a settled in-band state; this is a tuning target, not an implemented promise.
- From both Too fast and Too slow, a player reacting after about 2 seconds and following the correction cue must be able to return to green before failure at those checkpoints. Measure recovery time and peak error, rather than checking only that the ship survives.
- A simulated player deciding at 0.8–1 second intervals must complete the whole manual braking phase within the existing safe handoff limits. Holding Space forever or never pressing it must not pass the full phase as though autopilot were enabled.
- Verify six-second severe-error timing, countdown reduction during real improvement, pause, empty fuel, retry and automatic selection. Check no pitch/throttle snap on manual entry or 300 m handoff.
- Regression-check autopilot and final descent. Build and relevant tests must pass. Record measured outcomes and final tuning in DESIGN.md during implementation.

## Approval boundary

Approve this control behavior and proposed starting values before implementation. If the acceptance cases cannot be met without changing the speed band, trajectory, playback rate or adding speed assistance, bring that tradeoff back to the user. Camera and visual effects are fixed constraints.

## Implementation findings

The initial +12/-10 percentage-point rates are retained. Recovery detection compares the change in absolute speed mismatch using the same current reference scale for both samples; differentiating two separately normalized errors incorrectly penalized correction while the reference fell rapidly. This clarification does not add thrust assistance or change the six-second severe-error allowance. Measured departures are 2.7–4.1 s at 3 km/800 m and 8.2–10.0 s at 10 km, where the speed band is wider. This high-altitude result is slower than the initial 3–5 s tuning target; preserving the approved band, trajectory and gentle ramps is preferable to increasing sensitivity there. Delayed +/-25% checkpoint recovery takes 8.3–25.4 s; the player must anticipate gauge motion to prevent overshooting during the final approach.
