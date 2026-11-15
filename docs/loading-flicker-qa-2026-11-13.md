# Loading screen framebuffer isolation

## Reproduced cause

The initial loading scene shares an engine and canvas with the dormant mission scenes. HLS material/LOD warm-up and the final surface preparation called `scene.render()` with no camera output target. The descent compositor also warmed its fullscreen effect against the default framebuffer. These preparation frames could overwrite the loading screen between loading render-loop frames, especially near 93%.

Instrumented WebGL `clear`, `drawElements`, and `drawArrays` while `#mission-load-progress` existed, tracking the current framebuffer and scene camera. Before the fix:

| Flow | Before | After |
| --- | ---: | ---: |
| New Game | 169 | 0 |
| Continue | 63 | 0 |

These are graphics calls, not counts of visibly flashed frames. Evidence: `screens/loading-flicker-before-menu-qa.json`.

## Fix

- Scope dormant scene warm-up to a temporary render texture across asynchronous yields; restore the camera target and dispose the temporary texture even on failure.
- Warm the descent blend into a third render texture, separate from both sampled scene textures. Only gameplay renders the compositor to the canvas.
- Preserve the previous camera output target when rendering a transition scene.
- No changes to loading progress calculation, menu lazy imports, flight motion, camera composition, terrain, Earth, or model assets.

## Verification

- Regression test failed before the compositor fix because warm-up had no output target; it passes after the fix.
- Unit coverage includes asynchronous preparation, failure cleanup, camera target restoration, isolated compositor output, and normal gameplay presentation.
- `scripts/qa-loading-flicker.cjs` exercises isolated New Game and Continue contexts, blocks Orion downloading to verify the loading gate, verifies monotonic progress to 100%, moving ship/fixed progress bar, loaded Orion textures, Pause/Resume, and saved mission restoration. It asserts zero non-loading default-framebuffer calls during loading.
- Final browser evidence is recorded in `screens/loading-flicker-after-menu-qa.json` with screenshots for each flow.
- Both flows passed: zero non-loading canvas writes, progress reaches 100%, no page/network errors, Continue restores the fixture's solar module, breccia sample and communication log. Pause/Resume passed in both flows.
- Build log: `.superpowers/loading-flicker/build.log`. Existing large-chunk warning remains.
- Final full suite: `node node_modules/vitest/vitest.mjs run --maxWorkers=2` — **482 tests passed across 80 files**, exit 0. Log: `.superpowers/loading-flicker/tests-final.log`.

The first concurrent full-suite/browser/build run exhausted practical test timing limits. Subsequent validation runs limit concurrency; that interrupted attempt is not treated as passing evidence.
