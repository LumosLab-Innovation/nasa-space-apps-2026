# Orbital Menu Lighting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to carry out the steps below.

**Goal:** Relight the menu and loading backgrounds with cold, low-angle sunlight in the approved frame.

**Architecture:** Capture artwork from the existing Babylon orbital scene with render-only light settings and the existing camera framing. Composite the static menu from the same Moon and transparent ship pass that the loading screen uses.

**Tech Stack:** Babylon.js, Chrome and Playwright, Pillow and WebP.

**Spec:** `docs/superpowers/specs/2026-11-15-orbital-menu-lighting-design.md`

## Global Constraints

- Use the 1470 × 720 frame and existing ship crop at (752, 299), size 515 × 211.
- Preserve the composition and keep the Moon shader’s Sun azimuth consistent with the baked LOLA visibility map.
- Export over the existing asset paths so the UI layout, drift and loading behavior reuse their existing code.
- Commit the background changes separately from the previously approved branding.

## Review Focus

- Check ship and horizon alignment over the original frame.
- Check the ship layer over a brighter region of the Moon for edge halos.
- Check perceived depth, blue tint and text contrast in the real desktop and portrait layout.
- Check drift and reduced motion while mission loading is held.
- Check WebP dimensions and file sizes before integration.

---

### Task 1 — Restore the approved branding in this checkout

- [ ] Compare the source checkout’s branding diff with this branch and verify the approved WebPs exist.
- [ ] Apply only the previously approved logo changes and two WebPs as their own baseline commit.
- [ ] Run the browser smoke check for the established layout and record captures that can be compared after relighting.

### Task 2 — Relight, export and verify

- [ ] Capture the current orbital scene once to verify the camera, lunar terrain and ship bounds against the existing artwork.
- [ ] Set capture-only grazing illumination with cool shadow fill. Use the existing lunar light vector and relief data together for the terrain pass.
- [ ] Package the aligned render as `src/assets/menu-orbit.webp`, `src/assets/loading-moon.webp`, and `src/assets/loading-ship.png`. Verify that the first two are 1470 × 720 and that the ship is RGBA at 515 × 211.
- [ ] Compare the integrated scenes on desktop and portrait and verify ship movement with both reduced-motion settings. Run `npm run build` and `npm test -- --maxWorkers=1`.
- [ ] Review the exact asset diff and commit the background change separately on `codex/orbital-menu-lighting`.
