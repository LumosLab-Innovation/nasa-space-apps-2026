# Assisted manual flight and first-failure recovery

Status: proposed for user approval, 2026-11-14.

## Intent and approved direction

Make manual braking and landing approachable for the game's 7–12 audience while preserving deliberate player control. The user selected approach A: continuous light speed and attitude assistance. A failed attempt shows the spacecraft breaking apart with explosion smoke, then offers Chơi lại and Lái tự động on the first failure.

The user requested a design before implementation. Numerical values below are proposed game-balance starting values, not spacecraft engineering limits. They require simulation checks and user visual QA. Product code is outside this design step.

## Approaches

- A, selected: bounded continuous assistance, smooth thrust response, gentle attitude recovery. This reduces repeated key tapping and sideways drift while allowing sustained incorrect input to cause failure.
- B, considered: manual controls with emergency intervention near danger limits. This preserves more raw control but leaves the initial learning curve steep and makes intervention less predictable. The user selected A for easier control throughout the flight.

## Scope and constraints

Apply to orbital braking after Orion separation and final descent from approximately 300 m. Use Babylon.js/Babylon GUI and existing flight dynamics, camera, pause, effects and mission lifecycle. Preserve terrain, Earth, spacecraft models, successful landing effects, existing camera framing and the recent removal of the atmospheric plasma shell. Explosion is a distinct failure effect. No recording requested; user performs visual acceptance.

The work includes failure detection, a reusable explosion effect, a first-failure dialog, stage checkpoints and control guidance. It excludes a new flight model, new camera direction and changes to exploration mechanics. Gameplay state must never advance to exploration on a failed attempt.

## Manual control feel

### Braking

Space remains the main input. Holding it adds braking thrust; releasing it reduces thrust smoothly toward a lightly assisted baseline. Attitude continues using the current guided orientation.

Compute nominal throttle from the existing reference trajectory and current mass. Add 35% of autopilot feedback near the centre, smoothly increasing to 100% as speed error moves from one quarter of the green half-width to its edge. Player input adds +0.08 while Space is held and -0.08 when released. Clamp to 0-1 and respect fuel availability. Manual orbital playback peaks at x4 (automatic remains x10), returning to x1 by 1,200 m. These revised tuning values address unrecoverable overspeed/overbraking reported on 2026-11-15.

Apply demand changes at no more than 0.35 throttle per wall-clock gameplay second, independent of orbital time acceleration. Use the current applied throttle when entering manual mode or crossing phases. The dynamics still integrate the actual applied thrust, fuel and velocity.

Widen the displayed target band from ±12% to ±18%, with a minimum half-width of 3 m/s as the reference speed becomes small. All HUD and warning calculations use the same band. Show Tăng hãm for excessive speed, Giảm hãm for insufficient speed, and Giữ nhịp while in the band. HUD mode reads Lái tay · Trợ lực nhẹ.

Retain the nominal roughly 20-second 1 km → 300 m trajectory as a reference. Actual manual completion time depends on player input. Do not force altitude or velocity onto that reference to hide errors.

### Final descent

Space adds +0.18 throttle while held and −0.12 when released around the current tilt-compensated hover throttle. Add 25% of the vertical-speed correction from the existing descent controller, capped to ±0.10 throttle. Smooth applied throttle at the same 0.35 per gameplay second rate. This makes releasing Space a controlled reduction in thrust. Fuel exhaustion overrides every assistance term.

A/D rotate at an initial 5 degrees/s with a ±12-degree limit. While either key is held, player steering takes priority. On release, guide tilt toward a small drift-cancelling angle, capped at ±4 degrees, with at most 3 degrees/s recovery. Ease that target toward upright below 12 m. Opposite keys cancel to neutral. Inputs remain responsive during assistance, and assistance never directly changes position or velocity.

Proposed forgiving manual touchdown limits are vertical speed ≤2 m/s, lateral speed ≤1.5 m/s and tilt ≤8 degrees, measured at real foot-to-terrain contact. Existing automatic descent retains its gentler target. Successful manual contact still requires all three limits simultaneously.

## Warnings and failure conditions

Use explicit attempt states: flying, exploding, awaitingChoice, restarting, completed. Only the first transition from flying may trigger failure. Failure takes precedence over the 300 m handoff and successful-contact transitions in the same frame.

Braking warnings start after 1 second outside the target band. A severe deviation is horizontal-speed error larger than max(45% of reference speed, 15 m/s), for 6 accumulated wall-clock gameplay seconds after a 2-second burn-entry grace period. Severe deviation may be either overspeed or excessive braking. Show a clear correction cue throughout. Decrease accumulated time at 2 seconds per second while normalized speed error improves faster than 0.015 per second. Reset this timer when the severe condition clears. Pause freezes all timers. Short deviations do not fail.

At 300 m, permit handoff only with actual downward speed ≤25 m/s and absolute lateral speed ≤12 m/s. Otherwise trigger an unsafe-approach failure before transferring scene ownership. Actual hull/foot terrain impact during braking is an immediate failure. Reuse rig bounds/contact samples consistently rather than testing the craft's center only.

During final descent, contact outside the manual touchdown limits fails. Existing out-of-playable-area detection also fails through the same presentation. Fuel exhaustion alone provides a warning and zero thrust; the subsequent impact or sustained unsafe approach determines failure. Do not explode a safely landed craft merely because its tank is empty.

The explosion on an unsuccessful braking attempt is a cinematic game-over representation of mission loss. A speed-band violation is not a real physical cause of spontaneous spacecraft explosion. Keep its in-game reason about the failed approach, without teaching otherwise. Suggested text: Hãm chưa đủ: tốc độ còn quá cao; Hãm quá mức: lệch tốc độ tiếp cận; Tiếp cận quá nhanh; Tiếp đất quá mạnh; Tàu nghiêng quá nhiều; Ra ngoài vùng hạ cánh. One dominant reason is selected per attempt.

## Explosion and smoke sequence

- 0–0.12 s: a small warm flash at the failed craft, followed by an expanding irregular burst. No full-screen white flash or repetitive strobe.
- 0.08–0.8 s: hide the intact hull as roughly 12–20 pooled hull-like fragments separate with different directions, speeds and spins. Stop engine and RCS emission and prevent interaction with the failed hull.
- 0.15–2.2 s: roughly 8–14 overlapping gray smoke puffs expand at different rates, forming a clearly visible volume around the former hull. Use darker interiors, soft edges and independent fading. Readable from the existing gameplay camera. At altitude, carry debris with the craft's velocity and expand the burst around its drifting center. Near terrain, move debris outward and prevent ground penetration. This stylized short smoke cloud serves the requested game feedback.
- Approximately 2 s after failure: show the choice dialog. Smoke and debris can keep fading behind it, ending within about 5 seconds. The effect reaches its end once; it never loops while awaiting input.

Keep the camera at the failure's last valid composition, following the burst center only if the existing tracking would otherwise lose it. Preserve orbit/final-descent camera angles, zoom and FOV. Reduced-motion settings suppress any optional impact shake; no new camera move is required. Use a brief game explosion sound at the configured effects volume, respecting mute.

Prepare textures, materials and bounded fragment/particle pools during initial loading. Prefer existing compatible assets; a new transparent soft-puff texture may be created if needed. Never load assets or compile a new effect at the moment of failure. Retry clears the pool and resets its clocks. Smoke opacity, fragment scale and palette are left to implementation tuning against the gameplay camera.

## First-failure dialog

Centered Babylon GUI panel matching the current dark gradient HUD, with a short title Thử lại chuyến đáp, the failure reason and two equally clear buttons:

- Chơi lại: restart the failed phase in assisted manual control.
- Lái tự động: restart the failed phase with full autopilot, carried into the next phase and through touchdown.

Show both buttons from failure number one and every subsequent failure. Keep the dialog visible until a choice is made. Remove the current timed automatic retry and second-attempt-only suggestion. Both buttons act on a new attempt, rather than continuing a destroyed craft.

Reset held flight inputs on failure and when choosing. Support pointer, Tab/arrow focus and Enter activation, with Chơi lại initially focused after opening. Opening the dialog cannot inherit a held Enter/Space activation. Escape may use the existing pause/menu route but cannot skip the failed attempt into exploration. Closing pause returns to the same dialog. Pause freezes the explosion and smoke as well as flight timers. Flight controls are inactive behind the dialog.

## Checkpoints and restart

Store in-memory checkpoints per phase. No save-format change is needed.

- Braking retry: start at the existing 15 km braking entry with full 90,000 kg braking fuel. Restore the already-separated spacecraft arrangement, terrain coordinates, guided attitude, camera smoothing state, exhaust/RCS state and handoff preparation state. Use the existing smooth burn-entry ramp. Replay only the short control instruction, not the full opening, Apollo visit or separation dialogue.
- Final-descent retry: start at 300 m above the safe landing area's actual terrain with the existing nominal −12 m/s vertical and 4 m/s lateral speed, upright initial pose and full 10,000 kg landing fuel. Use the existing landing camera and a short control-ready settle before physics resumes.

Choose restores state exactly once, disables repeated clicks and resets timers, warning history, debris, dust emission, failed hull visibility, gear state and transient camera tracking. Cancel stale failure/flight dialogue so it cannot play over the new attempt. Shared scene assets remain loaded, and no second loading screen is needed. A brief concealed reposition behind the dialog is acceptable; no full-screen blackout is required.

For failure during the live 360–300 m bridge, the orbital attempt retains ownership until the validated handoff. Reset the dormant surface presentation and compositor on retry. Full autopilot selected by the popup must propagate through the handoff instead of using the immutable initial menu choice. H retains its existing final-descent toggle, with smooth transfer of applied throttle when switching control modes.

## Implementation boundaries and builder decisions

Reuse guidedFlight, IntroDirector, finalDescent, the existing scene bridge, GUI panel/button styling and pause clock. Keep visual-effect logic separate from failure criteria so each attempt's state is authoritative. Store approved balance constants and rules in DESIGN.md when implemented. Update translated labels through the existing i18n mechanism.

The builder may choose the effect representation, pooling layout and internal checkpoint types. Gains and visual counts can be adjusted inside the proposed ranges to meet the simulation checks. Material changes to controls, failure thresholds or checkpoint behavior return to the user with a concrete explanation.

## Verification and acceptance

- Simulate short/long Space inputs, neutral recovery, A/D release, low fuel and manual/auto toggles. Compare 30/60/120 FPS and time-warp values. No throttle snap, automatic rescue after fuel depletion or artificial altitude jump.
- Verify a recoverable warning, sustained severe braking error, unsafe 300 m handoff, hard/tilted touchdown and map exit. Failures trigger once and never award successful-landing progress.
- Verify first-failure popup, both choices, repeated failures, double-click protection and input reset. Both retry checkpoints restore fuel, controls, craft visibility and effect resources.
- Exercise failures before and during the scene bridge, pause during explosion/dialog, and menu exit/disposal. Autopilot choice persists into final descent.
- Build and relevant existing/regression tests. Inspect one gameplay-camera explosion and dialog for legibility and resource reuse. No video deliverable. Final control feel and visual acceptance are the user's QA.


## User-directed visual refinement (2026-11-15)
The user explicitly requested denser, more convincing explosion smoke and camera shake after trying the initial implementation. This supersedes the earlier no-new-shake constraint for failure only. Keep the underlying flight/retry design. Use 38 irregular density-textured puffs, 8 short hot lobes and 26 curved hull/rib fragments, all prepared/reused. The cloud expands outward with inherited velocity; it has no upward buoyant smoke column. Individual puffs clear by 6.5 seconds, independently of the 2-second popup. A 1.25-second damped camera-plane impulse returns to the original composition, respects reduced-motion and freezes with pause. No zoom/FOV change or video deliverable.

Reference inspected: SpaceX official Flight 2 webcast, https://www.spacex.com/content/starship-flight-tests/flight-2, approximately 41:09–41:15 (flight clock T+03:19–03:24). Played and compared breakup onset, expanding nonuniform gas cloud and separating fragments. This booster event at about 90 km is a high-altitude reference, not footage of a lunar accident. NASA https://www.nasa.gov/image-article/cygnus-breaks-up-earths-atmosphere/ explicitly shows atmospheric reentry, so it is not used as a vacuum smoke model. Camera vibration and smoke visibility remain deliberate game presentation, not a pressure wave travelling through vacuum. No external footage/assets are embedded in the game.
