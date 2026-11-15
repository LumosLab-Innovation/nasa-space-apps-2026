# Braking pitch oscillation — diagnosis and QA

The reported up/down jerking around 10 km was reproducible in the flight state, not merely a low-frame-rate artifact. The previous browser recording contained repeated pitch swings between near-horizontal and near-upright attitudes while frame intervals remained short.

## Cause and correction

The controller sampled rendered terrain slope over 10 metres, multiplied it by orbital horizontal speed, then added that directly to desired radial velocity. At about 1,200 m/s, crater triangle boundaries produced large vertical commands. Both thrust and attitude chased those commands, amplified visually by ×10 time acceleration and the existing cinematic model scale. Raw local terrain height also perturbed the high-altitude speed reference.

The high burn now follows the fixed flight datum. Guidance blends smoothly into actual above-ground height between 4,000 and 1,800 m; it no longer adds local slope times horizontal speed to radial velocity. Actual clearance still drives the HUD, thrust availability and 300 m handoff. Integration, thrust/fuel limits and manual throttle remain active. No camera, model, terrain texture, Earth or atmosphere change was needed.

## Verification

- Final full suite: **473 tests passed in 79 files**. TypeScript and Vite production build passed. The pre-existing large mission bundle warning remains; this correction does not add assets or dependencies.

- Added a regression replay using the actual compressed NASA LOLA data and captured ignition seed, at both 30 and 120 FPS. Before the fix, high-burn pitch ranges exceeded 20° and 24° even without the slope feed-forward. Both tests failed as expected, then passed with the correction. They also check continuous radial descent, arrival at 300 m, remaining fuel and the approved 25–35 second low approach.
- Automatic browser flight: high-burn pitch ranged from 76.006° to 76.221° across 12 → 8 km, with only 0.214° accumulated angular variation. The low approach took 30.479 seconds and reached CONTACT.
- No runtime errors, failed asset requests or black overlay frames in the automatic flight. Incoming position/orientation were preserved at the control handoff.
- Manual-key browser flight: 30.229 seconds below 1 km, then automatic final landing reached CONTACT. Pause at ignition, low approach and bridge froze the flight state; resize and Space/D held through transfer passed. No runtime errors or failed asset requests. The scripted on/off throttle pilot produced small attitude corrections (74.66–77.48° over 12 → 8 km), unlike the former near-horizontal/near-upright swings.
- Protected model, Moon texture/heightmap and Earth asset hashes match the prior approved baseline (`screens/braking-stable-assets.json`).

## Evidence

- `screens/braking-stable-auto-high-burn.webm`: the reported high-altitude segment after the fix.
- `screens/braking-stable-auto.webm`: low approach and handoff after the fix.
- `screens/braking-stable-auto.json`: measured flight state, frame intervals and transfer data.
- `scripts/qa-braking-stability.cjs`: repeatable browser QA through actual New Game controls; manual mode uses keyboard throttle corrections, not state overrides.

The videos and measurements are from Chrome on this machine. Screenshot/video capture can add frame-time spikes; this fix addresses the repeated guidance-driven attitude oscillation, not a claim that every frame on every device has identical timing. Existing cinematic terrain remapping and final-descent fuel allocation remain unchanged.
