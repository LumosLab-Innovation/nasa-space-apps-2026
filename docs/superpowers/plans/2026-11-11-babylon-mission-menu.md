# Babylon Mission Menu Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan.

**Goal:** Add the approved NASA-inspired Babylon GUI to the title screen, orbit, descent and lunar surface.

**Architecture:** One reusable Babylon GUI dialog and keyboard navigator, attached to each active scene's fullscreen texture. The title scene owns starting a run, and mission scenes own freezing and resuming their simulation while the dialog remains interactive.

**Tech Stack:** TypeScript, Vite, Babylon.js GUI, Havok and Vitest.

**Spec:** [Approved design](../specs/2026-11-11-menu-pause-settings-design.md)

## Global Constraints

- Use the existing `@babylonjs/gui` dependency, saved language, music preferences and checkpoint schema.
- Use NASA blue `#0032A0`, red `#E4002B`, white `#FFFFFF`, and dark navy `#060D1D`.
- Allow both mouse and keyboard operation. Keep input and time progression confined to the active scene.

## Review Focus

- Settings nested under Pause keeps the mission paused until the last dialog closes.
- A key held before pausing cannot move the astronaut or throttle after resume until pressed again.
- Escape pauses during descent and still closes the horizon view when it owns Escape.
- The last checkpoint survives opening Settings and canceling a new mission.
- Narrow layouts keep all three Settings groups and Back reachable.

## Tasks

- [x] Add `MenuHistory<T>` and keyboard reset coverage in `tests/pause.test.ts`. Verify failing nested navigation, descent Escape and held-key cases, then implement in `src/core/pause.ts` and `src/player/keyboard.ts`.
- [x] Implement the shared GUI primitives, modal keyboard navigation and Settings groups in `src/ui/menuControls.ts` and `src/ui/menuSettings.ts`. Build `showMainMenu(engine, music, hasSave)` in `src/scenes/mainMenuScene.ts`. Verify that title settings, canceled new-game confirmation and both languages work in the browser.
- [x] Replace `createPauseMenu` with the Babylon implementation. Hook orbit and surface render updates, dialogue, Havok and final descent into its pause boundary. Wire the title screen and existing save/restart paths in `src/main.ts`. Verify each playable phase on the normal route and compare simulation values before and after holding a pause. Run `npm test` and `npm run build`.
