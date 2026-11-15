# NASA Mission HUD Implementation Plan

> Use superpowers:executing-plans. Verify the running game against the approved preview.

**Goal:** Display the approved minimal HUD in orbit, final descent and surface exploration.

**Architecture:** Shared Babylon GUI labels and slanted indicators feed two flight layouts and one surface layout. The toolbar is created by the existing pause system. Phase changes show the relevant readouts.

**Tech stack:** TypeScript and Babylon GUI.

**Spec:** [Minimal mission HUD](../specs/2026-11-11-nasa-mission-hud-design.md)

- [x] Create the common HUD controls in `src/ui/hudWidgets.ts`. Draw the 24° bar ends and a straight gauge needle with Babylon GUI. Verify fill and readouts at different values in flight.
- [x] Update `descentHud.ts`, `hud.ts`, `resourceHud.ts` and the scene callers. Show live flight metrics, resources and progress in their respective phases. Check that landing and exploration readouts never overlap, and warnings and dialogue are legible.
- [x] Replace the mission toolbar in `pauseMenu.ts` with 44 × 44 px icon buttons and localized tooltips. Verify mouse and keyboard interaction without changing the notebook shortcut.
- [x] Run build and tests. Open the game, exercise the three mission phases and inspect the rendered HUD at desktop and narrow widths.
