# Module Install Reach Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Holding E anywhere the "Hold E — align and lock" prompt shows (≤ 2.5 m) walks the astronaut to the module connector and installs.

**Architecture:** Only `Astronaut.beginInteraction` / its approach step change for `kind: 'install'`; reach rules become a small pure helper so they can be unit-tested. Sample collection keeps today's numbers.

**Tech Stack:** TypeScript, Babylon.js 9, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-15-module-install-reach-design.md`

## Global Constraints
- Install start distance ≤ **2.5 m** from the target; stance **0.40 m**; approach speed up to `WALK_SPEED_MS` (1.8) with the existing `min(speed, distance * 3)` easing; timeout `1 + distance / WALK_SPEED_MS` s; ground check stance-vs-connector ≤ **0.22 m**.
- Sample: unchanged (stance 0.48 m, |distance − stance| ≤ 0.45 m, approach ≤ 0.45 m/s, 2.5 s timeout, stance-vs-player ground check).
- Unchanged: 1.5 s hold, release-E and WASD/Space cancel, Pip ≤ 6 m.
- Shared checkout: in-place edits only; commit only own paths with `git commit -- <paths>`.

## Review Focus
- Player holding E while still walking toward the connector: install should start as soon as E is held inside 2.5 m (movement input cancels only after the approach began — existing rule) → covered by `install starts from 2 m`.
- Connector on a slope with the player standing uphill: allowed when stance and connector ground differ ≤ 0.22 m → test `install ground check uses the connector height`.

---

### Task 1: Install reach and approach

**Files:**
- Modify: `src/player/astronaut.ts` (`beginInteraction` ~line 270, approach step ~line 300-310)
- Test: `tests/astronautInteraction.test.ts` (append)

**Interfaces:**
- Produces: `export function interactionReach(kind: 'install' | 'sample'): { stance: number; maxStart: number; minStart: number; speed: number; timeout(distance: number): number }` in `src/player/astronaut.ts` — install: `{ stance: .40, minStart: .05, maxStart: 2.5, speed: WALK_SPEED_MS, timeout: d => 1 + d / WALK_SPEED_MS }`; sample: `{ stance: .48, minStart: max(.05, .48 - .45), maxStart: .48 + .45, speed: .45, timeout: () => 2.5 }`.

- [ ] **Step 1: Failing tests** (append to `tests/astronautInteraction.test.ts`):
  - `interactionReach install accepts starts up to 2.5 m` — `interactionReach('install').maxStart === 2.5`, `.stance === .4`, `.speed === WALK_SPEED_MS`.
  - `install approach from 2.5 m fits its timeout` — `(2.5 - .4) / WALK_SPEED_MS < interactionReach('install').timeout(2.5)`.
  - `sample reach is unchanged` — sample `stance .48`, `maxStart .93`, `speed .45`, `timeout(x) === 2.5`.
  - `install starts from 2 m but not from 3 m` and `install ground check uses the connector height` — through `beginInteraction` if the existing test file already constructs an Astronaut with a heightmap (follow its harness); otherwise via an exported pure `canStartInteraction(kind, player, target, groundAt)` helper used by `beginInteraction`.
- [ ] **Step 2:** `npx vitest run tests/astronautInteraction.test.ts --maxWorkers=1` → FAIL (missing exports).
- [ ] **Step 3:** Implement the helper(s) and use them in `beginInteraction` and the approach step (speed, timeout, ground check per kind).
- [ ] **Step 4:** `npx vitest run tests/astronautInteraction.test.ts tests/astronautAction.test.ts tests/astronautRig.test.ts tests/gait.test.ts --maxWorkers=1` → PASS; `npx tsc --noEmit` clean for these files.
- [ ] **Step 5:** `git commit -m "fix: hold E within the prompt radius walks to the module connector" -- src/player/astronaut.ts tests/astronautInteraction.test.ts docs/superpowers/specs/2026-11-15-module-install-reach-design.md docs/superpowers/plans/2026-11-15-module-install-reach.md`
