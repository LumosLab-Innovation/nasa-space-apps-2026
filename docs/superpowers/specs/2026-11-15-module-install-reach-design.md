# Module install: hold E within the prompt radius

Status: approved by the user 2026-11-15 (small change).

## Why
Players hold E at a module site and nothing happens. The "Hold E — align and lock" prompt appears within 2.5 m of the service connector (`pickInteractable` radius), but `Astronaut.beginInteraction` only starts when the player already stands within ~0.85 m of it (stance 0.40 m ± 0.45 m) on near-flat ground; otherwise the prompt silently changes to "Move closer to the connector and stand still". Kids 7–12 can't line up that precisely.

## Decision (user picked A)
Holding E anywhere the prompt shows makes the astronaut walk to the connector and install.

## Design (install only; sample collection unchanged)
- `beginInteraction` for `kind: 'install'`: accept a start distance up to **2.5 m** from the target (same as the prompt radius); stance stays **0.40 m**.
- Approach walk for install at up to **WALK_SPEED_MS (1.8 m/s)**, easing down near the stance point (keep the existing `min(speed, distance * 3)` shape), no teleport.
- Approach timeout for install scales with distance: `1 + distance / WALK_SPEED_MS` seconds plus the existing settle time, instead of a fixed 2.5 s.
- Ground check for install compares the stance point's height with the connector's ground height (≤ 0.22 m), not with the player's current position.
- Unchanged: 1.5 s hold to lock, releasing E cancels, WASD/Space cancels, Pip within 6 m of the site, sample-action reach rules.

## Approaches considered
A (chosen) auto-walk within the prompt radius; B show "Hold E" only when already close — kids still have to line up; C widen reach to ~1.5 m — half-measure.

## Verification
Unit tests: install starts from 2 m, not from 3 m; approach from 2.5 m completes within its timeout; sample reach unchanged. Existing astronaut/action tests pass.

## Follow-up (user approved 2026-11-15): holding E while walking
Movement keys already held when the interaction starts are ignored until released; a new direction, a re-press of a released key, or a jump still cancels (approach and install phases alike). Kids can hold E while walking toward the connector.
