# Coherent descent motion implementation plan

> **For agentic workers:** Use superpowers:executing-plans, task by task.

**Goal:** Implement approved 25–35 second low approach and continuous ignition/landing motion.
**Architecture:** Pure guided flight integration supplies position, velocities, orientation and applied thrust. Scene adapters convert that state into km/metres; camera blending never moves the spacecraft independently. Existing final descent receives the actual incoming state.
**Tech Stack:** TypeScript, Babylon.js, Vitest, browser QA with Playwright.
**Spec:** ../specs/2026-11-13-coherent-descent-motion-design.md (approved by user).

## Global constraints
- Nominal 1,000 → 300 m: 25–35 unpaused seconds, approximately 30.
- Preserve Gần hơn framing, models, terrain assets, Earth and glow.
- One thrust budget, actual integrated velocities, no forced velocity reset or separate 500 m movement animation.
- No second loading screen, black frame or frozen-frame blend.
- Keep existing controls, pause/settings, final descent fuel allocation and retry.

## Review focus
- Zero fuel or no manual thrust must depart from nominal guidance honestly.
- Held keys and pause at either transition must survive without time catch-up.
- Frame rate and long-frame differences must not change approach duration substantially.
- Unsafe arrival must not teleport horizontally at the old 30 m offset clamp.
- Terrain and camera continuity must be checked in a recording, beyond unit tests.

### Task 1: Shared flight dynamics
Files: create src/landing/guidedFlight.ts, tests/guidedFlight.test.ts; modify introDirector.ts, descentGeometry.ts.
Interface: FlightState {x,y,vx,vy,fuelKg,throttle,pitch,t}; stepFlight(state, command, dt); nominalApproach(height) returns target velocity/acceleration. Director exposes flight plus existing brake HUD compatibility.
- [x] Write failing tests for nominal 25–35 seconds, continuous integrated movement, thrust/fuel limits, no-thrust freefall, 30/60/120 Hz and paused dt=0.
- [x] Run targeted Vitest and observe failure.
- [x] Implement bounded attitude/throttle dynamics, guidance and fixed substeps; ignition ramp uses physical thrust, time warp reaches ×1 by 1,200 m.
- [x] Run tests and record results.

### Task 2: Scene/camera and final descent continuity
Files: landingScene.ts, descentCamera.ts, finalDescent.ts, descentBridge.ts; tests/coherentHandoff.test.ts and camera tests.
Interface: pure handoff conversion retains x/y/vx/vy/tilt and existing final fuel allocation; camera follower accepts position/velocity/dt, camera handoff blends relative offsets over final 3–4 s.
- [x] Add failing tests for actual state transfer, unsafe tilt, camera stationary/constant velocity/frame-rate/pause behavior; verify removal of offset clamp in integration review.
- [x] Replace target-band longitude travel and 500 m Hermite flight with actual flight motion; separation settles smoothly, both ships use the same clock.
- [x] Blend camera only, transfer actual state at 300 m and preserve held inputs.
- [x] Run targeted and full tests; build.

### Task 3: Browser QA, documentation and review
Files: scripts/qa-coherent-descent.cjs, docs/coherent-descent-qa-2026-11-13.md, DESIGN.md.
- [x] Run full nominal automatic flight and manual controlled case in browser; unsafe/no-thrust cases in unit tests; sample actual state/frame timing, pause/resize near transitions.
- [x] QA New Game and Continue/loading; capture continuous clips and stills without changing game cameras.
- [x] Compare protected asset hashes; record measured duration and limitations; obtain independent final review.
- [x] Fix important review findings with regression tests, rerun suite/build; present clip and measured results.

Work is in the user's active feature branch with substantial pre-existing uncommitted work. Preserve a file baseline; do not bulk commit unrelated files. Approval covers execution without another planning approval gate.
