# Assisted Flight Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement task by task.

**Goal:** Ship assisted manual braking/landing, a bounded explosion and smoke effect, and first-failure retry/auto choices.
**Architecture:** Pure control/failure functions feed the existing physics. A reusable GUI and pooled failure effect serve both scenes; each scene owns its checkpoint. Autopilot selection travels in DescentHandoff.
**Tech Stack:** TypeScript, Babylon.js/GUI, Vite, Vitest.
**Spec:** docs/superpowers/specs/2026-11-14-assisted-flight-failure-design.md

## Global Constraints
- Preserve gameplay camera framing and existing success effects. No video.
- Pause freezes flight, failure timers and effects. No asset loading on failure/retry.
- Keep current uncommitted AxEMU/plasma changes intact.
- User approved implementation. Execute inline in the existing feature branch and verify with a fresh final review.

## Review Focus
- Failure during live handoff retains the correct scene owner.
- A held key or repeated click cannot trigger a second attempt or skip failure.
- Automatic choice survives the 300 m handoff.
- Fuel exhaustion never produces assistance thrust.
- Retry restores positions, all visuals and one active attempt without resource growth.

## Task 1 — Controls and failure rules
- [x] Add tests/assistedFlight.test.ts covering slew at 30/60/120 Hz, manual authority, neutral tilt recovery, dry tanks, grace/recovery timers and handoff limits.
- [x] Create src/landing/assistedFlight.ts for throttle/tilt helpers, manual touchdown, braking band and BrakingFailureMonitor.
- [x] Integrate guidedFlight.ts/introDirector.ts and finalDescent.ts. Keep existing automatic targets.
- [x] Run focused tests and fix regressions.

## Task 2 — Failure presentation
- [x] Create src/fx/flightExplosion.ts with fixed fragment/puff pools, warm/start/update/reset/dispose and deterministic bounded lifetimes.
- [x] Create src/ui/flightFailure.ts using menu gradient controls, two actions, first-failure focus, pause/input suppression and disposal.
- [x] Add localized labels and sound through existing muted/volume-controlled audio engine.
- [x] Verify pool reuse, reset, end of effect, choice locking and Babylon shader preparation.

## Task 3 — Scene ownership and retries
- [x] Add braking checkpoint/retry, monitor failure before bridge, freeze normal flight during effect/dialog.
- [x] Replace final-descent timed retry with effect/dialog, reset all attempt state and inherited inputs.
- [x] Add optional assist to DescentHandoff and use it on final-descent activation.
- [x] Verify invalid handoff, repeated retry, auto continuation, pause and skip guards with tests and browser checks.

## Task 4 — Validation
- [x] Update DESIGN.md with approved gameplay rules.
- [x] Build, run affected flight/control/bridge/GUI tests and inspect real gameplay camera failure/choices in browser.
- [x] Fresh review of this change, fix important findings and record results here.

## Execution notes
Implementation stays in the current feature branch so the user's existing development server and approved uncommitted model changes are included. Product changes will remain reviewable in the working tree; no unsolicited merge/push.


## Verification record
- Pure flight/control, handoff, input, localization, pause/dialogue and pooled-effect suites: initial 11 files / 72 tests passed. Added the failure-camera test for the user's visual refinement; final aggregate recorded below after its run.
- Production build passed. Vite retains its existing large gameplay chunk warning.
- Browser: first hard-contact failure hides hull, stops all nozzle/wisp visuals, presents both buttons. Enter retries at 300 m with full fuel; repeated attempt keeps mesh count constant. Pause freezes the smoke positions; resume retains the failure and choice.
- Browser: induced failure during the live 335–300 m bridge, confirmed destination hull hidden/exhaust cleared; automatic retry restores destination to 300 m and full fuel. Auto choice survives the subsequent real handoff and achieves safe touchdown (~0.80 m/s vertical).
- Browser: dry fuel in automatic final descent produces zero exhaust power and no main jets. No WebGL console errors in these checks.
- Final review by assisted_flight_code_review found stale destination presentation, residual exhaust visuals and dry-fuel throttle fade. Fixed resetPreparation/clearExhaust, immediate renderer reset (regression observed failing, then passing), and dry-fuel override. Browser checks cover destination reset and actual zero-thrust output.
- User's 2026-11-15 feedback explicitly adds explosion-only camera shake and denser smoke. Inspected official SpaceX Flight 2 video at 41:09–41:15. Baked four soft volumetric density projections, 38 smoke puffs / 8 hot lobes / 26 curved fragments; short 1.25 s camera impulse returns to framing, respects reduced motion and pause. Updated spec and DESIGN.md. No gameplay camera zoom change, recording, merge or push.
- The active game source/server is C:/Users/ADMIN/Downloads/NASA_Hackathon, branch codex/axemu-character-rig. The D:/Documents/... checkout contains an earlier React prototype, not this running Babylon game; left it untouched.


Final validation: 73 relevant checks passed across runs on the final source: 71 passing in the shared-process aggregate plus the 2 exhaust renderer checks rerun successfully in their required isolated process. The shared-process run reported these same 2 as failed because an earlier import bypassed their vi.mock texture provider; isolated execution confirms both pass. The earlier fully isolated 72-test baseline passed; the later aggregate was stopped after slow repeated Babylon imports, then run with shared imports. Final build passes (existing large-chunk warning only); diff --check passes. Latest density texture has zero density at its boundary to avoid visible rectangular sprite edges. Browser inspected the denser breakup from the gameplay camera; no clip recorded. Visual style and control feel remain for the user's QA.
