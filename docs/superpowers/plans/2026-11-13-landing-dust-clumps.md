# Low landing dust clumps implementation plan

**Goal:** Implement the approved low, irregular landing dust using the current fixed pools.
**Architecture:** A two-cell procedural opacity atlas preserves ordinary dust and adds a clumped landing-only profile. Existing ballistic updates and contact emission continue to own motion and shutdown.
**Tech stack:** TypeScript, Babylon.js, Vitest.

- [x] Add focused lifetime/terrain-spawn/rate regressions and observe failure.
- [x] Adjust landing-only puff texture, dimensions, emission and fade; sample terrain under each launch point.
- [x] Run relevant dust/descent tests and build. Record results; user does visual QA.

Validation: 36 tests across dust, ballistic motion, descent and prior rendering regressions passed. Production build passed (existing large mission-chunk warning remains). No browser recording or screenshot. Visual strength at the gameplay camera remains for user QA.
