# Elevator disembark after HLS landing

Status: approved by the user 2026-11-15 (built on the existing astronaut, on codex/axemu-character-rig in the main checkout).

## Intent and why

Today, after a successful touchdown the HLS elevator deploys and lowers **empty** (~12 s, `src/models/hlsRig.ts` + `src/demo/hlsElevatorMotion.ts`), a title card fades in, and `finish()` in `src/landing/finalDescent.ts` teleports the astronaut to `PLAYER_SPAWN` (~11 m from the hull) with the gameplay camera. The arrival on the Moon — the emotional peak for kids 7–12 — is skipped. The user wants the camera to move to the elevator side, show the astronaut standing on the elevator high on the ship, and lower them slowly to the surface. User decision: **the player takes the first step off the elevator themselves**; control is handed over at the bottom.

## Goals

- After touchdown, the camera eases from the landing framing to a side view of the elevator, showing the astronaut in the car near the airlock (~33 m up) and the height of the ship.
- The car lowers with the astronaut standing in it; the camera follows down smoothly.
- At the bottom the camera ends exactly at the normal gameplay framing behind the astronaut (ArcRotate alpha −π/2 relative to player, beta 1.25, radius 7 — the existing values in `src/player/astronaut.ts`), so hand-over has no jump.
- The front gate opens and a prompt invites the first step (e.g. "W — take your first step" / Vietnamese equivalent in `src/i18n/vi.ts`). Player input moves the astronaut off the car.
- The first step onto regolith leaves a boot print and a small dust puff, then the existing Act 1 title card and the "New discoveries…" toast appear (moved from before hand-over to after the first step).

## Non-goals

- No change to flight, touchdown rules, failure/explosion flow, assisted flight, HLS appearance, terrain, dust/plume, music or save schema.
- No new astronaut animation clips (the existing idle clip is used while riding). The astronaut model rework is a separate project.
- No ride back up (the ending already handles boarding).

## Anti-goals

- Camera snaps or cuts at any point between touchdown and hand-over (including the final hand-over to the gameplay camera).
- The astronaut floats, slides, clips through the car floor/guards, or pops position when control begins.
- The player can walk/jump before the car reaches the ground, or gets stuck in the car.
- Skipping or Continue forces the player to sit through the sequence again.

## Constraints

- **Coordination with Codex:** the user's Codex session is currently editing `src/landing/finalDescent.ts`, `src/scenes/landingScene.ts`, `src/scenes/surfaceScene.ts` and related landing files (assisted-flight failure, plasma removal). Implementation starts only after that work is committed; changes to those files stay minimal (a hook/call site), with the sequence living in a new module.
- Gameplay time only: pause (`gamePauseClock`) freezes camera, car and astronaut exactly; resumes without jumps.
- Babylon.js 9, existing `HlsRig` (`setTargets`, `update`, `elevatorDeployed`, per-LOD `car` node), existing `Astronaut.setRide()` (used for rover seating — body pinned to a transform, physics capsule parked) and `teleport()`.
- Respect reduced camera motion (`src/core/accessibility.ts`): shorter/gentler camera move.
- Strings through `tr()` with Vietnamese entries.

## Approaches

- **Chosen — a separate disembark sequence module** (e.g. `src/landing/disembark.ts`) started from `finalDescent` when it would currently call `finish()` after a successful landing. It owns its camera, rides the astronaut on the car and hands control back. Smallest footprint in files Codex is editing; testable as a pure timeline plus a thin Babylon adapter.
- Rejected — extend the `contact` phase inside `finalDescent.ts`: mixes with code Codex is actively changing and grows an already large function.
- Rejected — camera-only change keeping the teleport: does not show the astronaut riding down, which is the point.

## Decided design

### Sequence (gameplay seconds, tunable)
1. **Touchdown → deploy.** Existing behaviour: contact lights, `land_ok` dialogue, gear settles, `setTargets(1, 1)` at ~1 s starts the elevator. Landing HUD hides as today.
2. **Camera move (≈3–4 s, overlapping deployment).** Eased orbit/dolly from the landing camera to a side view framing the hull and elevator; no cut.
3. **Astronaut appears in the car at the top** before the car starts lowering (car still at the airlock level after supports/floor/guards deploy), standing in idle pose, facing outward (away from the hull, toward `PLAYER_SPAWN`'s direction, which is how `hlsRoot` is already oriented).
4. **Ride down.** The car lowers on the existing elevator motion; the astronaut is pinned to the car each frame via `setRide` (or an equivalent car-relative transform), so they move together exactly. The camera tracks down, converging to the gameplay framing behind the astronaut as the car nears the ground.
5. **Arrival.** Car stops (`elevatorDeployed`). The front gate (`guardFront`) opens — a new small end-stage motion in the rig, same smooth/reversible style as the existing guards. The gameplay camera takes over with identical pose; the `landing` lock is released; prompt shows.
6. **First step.** Player walks forward off the car. When the astronaut first stands on terrain outside the car footprint: boot print decal + dust puff, prompt hides, Act 1 title card fades and the discoveries toast/cards unlock (same calls as today's `finish(true)`), `landing:done` flag set as today.

### Control and state
- No movement/jump input is accepted until step 5. Camera orbit input stays disabled until hand-over.
- Esc/skip during steps 1–5: jump to today's result immediately (elevator deployed, astronaut at `PLAYER_SPAWN`, gameplay camera, card/toast) — reuse the existing skip/finish path.
- Continue/save: unchanged; a save made after landing restores on the surface at `PLAYER_SPAWN`, never replays the sequence. Quitting mid-sequence behaves as today.
- Scene teardown/main menu mid-sequence disposes the camera, prompt and observers and releases locks.
- If the HLS rig is unavailable (fallback), behave exactly as today.
- Failed landings/explosions never start the sequence.

### Small decisions (Claude's calls)
- Total time from touchdown to hand-over stays close to today's ~14–17 s (elevator duration unchanged at 12 s); retune only if it feels slow.
- No extra dialogue line at the first step — boot print and dust only (the touchdown `land_ok` line already plays). Easy to add later.
- Car collision: while riding, physics capsule parked (as in the rover); at hand-over the capsule is placed on the car floor/ground so the first steps are physical. If the car floor is not walkable geometry, hand-over places the astronaut at the car's ground-level exit edge facing outward.

### Ship position after touchdown (user decision 2026-11-15)
The HLS stays exactly where it touched down (`arrivalBase + side*offset`, often metres to tens of metres from `HLS_POS`); `finish()` no longer snaps it to `HLS_POS`. For the rest of that session a single "landed HLS position" replaces `HLS_POS` for everything that depends on the ship: hull collider, solar-storm shelter test, rover deploy point and keep-out area, the ending's boarding/liftoff, `PLAYER_SPAWN`-relative placement and the elevator facing. Flight/touchdown steering is not changed. Save schema unchanged: after Continue the ship is at `HLS_POS` as today (accepted by the user). Skip during the sequence also keeps the touchdown position.

### Builder-check rulings (Claude's calls, user may override)
- **Hand-over framing:** the car stands ~2 m from the hull wall, so a camera directly behind the astronaut at radius 7 would sit inside the hull (the ArcRotate camera has no collision). Hand-over therefore uses the gameplay camera's beta 1.25 and radius 7 but an alpha that puts the camera outside the hull (three-quarter view of the astronaut from the open side). This "Goals" item is amended accordingly: no jump at hand-over still holds, because the cinematic path ends exactly on that gameplay pose; the player can orbit freely afterwards.
- **Title card:** today's card is an opaque full-screen black rectangle. After the first step the player has control, so the Act 1 title is shown as a non-blocking translucent banner (same text, no black full-screen, no input lock) instead.
- **State commit vs. presentation:** at hand-over the game state is committed exactly as today's `finish(true)` does (`landing:done`, card unlocks, autosave becomes possible, `landing` lock released). Only the presentation (boot print, dust, title banner, discoveries toast) waits for the first step; if the player has not stepped off within 20 s, the banner and toast show anyway. Quitting after hand-over therefore never replays the landing.

## Verification

- Pure timeline tests: stage order, monotonic car/astronaut height, no camera pose discontinuity (position/target velocity bounded) at stage boundaries and at hand-over, pause freezes, skip at every stage ends in today's state, single first-step trigger.
- Existing landing/finalDescent/HLS rig tests pass; new tests for the front-gate stage.
- In-browser check: New Game → land (assisted and manual) → watch ride → first step; Esc at several points; pause mid-ride; Continue after landing. Console free of new errors. Build passes. User does final visual QA; no video required.

## Left to the builder

Exact camera path/curves and framing, gate motion details, boot print implementation (decal vs. small mesh), prompt wording, file/module names, and how the disembark module receives scene handles from `finalDescent`.
