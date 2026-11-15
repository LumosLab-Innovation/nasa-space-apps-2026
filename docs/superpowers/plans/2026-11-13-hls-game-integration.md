# Approved HLS production integration

User approved the enclosed landing gear preview and authorized integration on 2026-11-13.

1. Promote the approved near/far GLBs; validate manifest and cached preload.
2. Share the accepted rig motions in a production controller, with local material reflections, projected-size LOD, single shadow set, and scene disposal.
3. Connect orbit anchors, descent deployment, landed restoration and liftoff sequencing. Preserve save format, physics, Earth, terrain and Eagle.
4. Capture the new ship for menu/loading artwork, preserving static lightweight menu and ship drift.
5. Run tests/build, real game New/Continue/loading/failure/pause QA, record animation and screenshots, measure frame costs, and request a final independent review.

Acceptance: gear hidden behind closed curved doors in flight; door → leg → foot deployment; elevator stays folded until stable contact; Continue restores deployed pose immediately; liftoff waits for elevator, then retracts gear after clearance. No second GLB download or early completion of loading. Report measurement limitations honestly.

## Completion ledger

- Promoted both approved GLBs, preserved their bytes, updated manifest and real-progress preload.
- Production rig and shared motions are connected to orbit, descent, restoration and ending. Static endpoints batch into one caster/draw per active LOD; browser QA verifies actual near/far switching and equal foot poses.
- Replaced the menu/loading ship bitmap with a capture of the accepted model; kept the existing Moon/Earth bitmap and loading drift/layout.
- Final source review completed once. Its plume observation was regraded as an attachment defect after measuring a 4.51 m gap at partial throttle/tilt. Fixed with parent/pivot anchoring; `qa-hls-plume.cjs` RED→GREEN (final error about 0.00001 m).
- Root QA found downhill pad gaps up to 0.47 m. A best-fit landing plane plus per-corner support offset fixes placement without editing terrain; support regression RED→GREEN, final maximum 0.0842 m. Simple collider follows the same plane.
- Actual New/Continue, slow asset, HTTP503/retry, Pause/Settings, single-scene lifecycle, cable endpoints and ending order passed. Orbit stages are advanced with the existing DEV director during QA; final descent and mechanisms run live. Ending is test-triggered to avoid replaying the full campaign.
- Final build passed. Full suite: 69 files / 439 tests passed (`npm test -- --maxWorkers=2 --testTimeout=15000`); slower machine/import overhead required a longer test timeout, without changing assertions or production behavior.
- Earth/halo, Eagle, heritage ground and Orion protected hashes unchanged. See `docs/screens/hls-integration-report.md` for evidence, CPU timing comparison and measurement limits.
- No unresolved reviewer findings. Work remains in the existing working tree alongside earlier uncommitted project work; no remote publish/push.
