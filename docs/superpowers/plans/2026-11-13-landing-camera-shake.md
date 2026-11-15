# Landing camera shake implementation plan

**Goal:** Implement approved A while preserving framing and HUD.
**Architecture:** A small deterministic visual envelope produces screen-plane offsets; final descent adds them to its freshly calculated base target each frame.
**Tech stack:** TypeScript, Babylon.js, Vitest.

- [x] Test bounded near-ground shake, pause, reset and exact shutdown after contact.
- [x] Integrate target-only offset after landing physics, with retry/bridge reset.
- [x] Run camera/descent tests and production build. User handles visual QA.

Result: 27 tests / 4 files passed; production build passed with the existing large-chunk warning. No clip or screenshot generated; visual intensity is left for user QA.
