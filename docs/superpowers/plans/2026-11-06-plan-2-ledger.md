# SDD ledger — plan: docs/superpowers/plans/2026-11-06-plan-2-model-va-bui.md
Spec: docs/superpowers/specs/2026-11-06-hanh-trinh-va-model-design.md (delta on docs/2026-11-06-pip-mica-thiet-ke-game.md)
Setup: Ruling: branch plan-2-models-dust stacked on plan-1-surface-slice (Plan 1 not merged; user never chose finish option) — cost if wrong: rebase onto main later.
Pre-flight:
- T1 MODELS → T2/T7/T8/T9 node lists: T1 fills every list from those tasks; T9 lists exclude `<id>_root` → Ruling: include `<id>_root` in each props spec (pip_root/mica_root/astro_root already listed) — cost: none.
- T1 loadModel → T6/T7/T8/T9: consistent (LoadedModel.node/material).
- T3 astronaut.onStep (0.7 m rule) → T8 replaces with gait phase when model loaded: consistent, T8 says so.
- T3 Pip trickle in pip.ts → T6 rewrites pip.ts: must keep trickle + T4 wheel stamping. Noted.
- T5 DustCoat → T6/T8 material names (Pip_Rubber/Pip_White, Suit_Boots/Suit_Legs): match T2/T8 material lists. OK.
Task 1: Ruling: added pip/mica/astronaut root+every listed node into MODELS now and props get '<id>_root' — matches pre-flight ruling — cost: none
Task 1: complete (commits 2e60c20..56eb0ab, tests: npx vitest run →    Duration  3.73s (import 80%, transform 12%, tests 4%, worker 4%))
Task 2: Ruling: Blender MCP safe mode forbids exec/open/runpy/classes → scripts are pasted inline (common.py + build_<id>.py), Part class rewritten as functions; run.md documents it — cost: duplicated paste per model, no behavioural change.
Task 2: Ruling: after export each build is cleaned up with end_build(id) (user's .blend left untouched; plan only said "own scene") — cost: re-run needed to re-inspect.
Task 2: Ruling: exporter picked up the user's selected papaya objects; export_glb now selects in the build view layer and passes use_active_scene=True — cost: none (verified clean export log).
Task 2: Note: models.test.ts written after pip.glb existed (order slip); RED verified by removing pip.glb → 3 failures, restored → 3 pass.
Task 2: Note: pip.glb 13,370 tris, height 1.424 m (budget ≤25k, 1.2–1.5).
Task 2: Step 8 approval gate — render docs/screens/plan2-pip-angles.png sent to user; Tasks 6–9 blocked until approved.
Task 2: complete (commits 56eb0ab..5199eb9, tests: npx vitest run →    Duration  3.62s (import 81%, transform 11%, tests 4%, worker 4%))
Task 3: Ruling: tsc includes tests/, models.test.ts needs node:fs → added devDependency @types/node@24 and "node" to tsconfig types (dev-only, Global Constraint is about runtime deps) — cost: node globals type-check in src too.
Task 3: Ruling: Havok CC zeroes vertical velocity on the contact frame, so onLand read 0.002 m/s → extracted LandingDetector (last airborne vy) with tests/landing.test.ts RED→GREEN; measured landing 1.56 m/s (theory 1.6) — cost: none.
Task 3: Ruling: onJump bursts at 0.6× jump speed (push-off sprays less than touchdown); onStep uses trickle(1.2 m/s, 0.25 s) — tuning, not spec values — cost: look only.
Task 3: Note: test 'grains fall back' fixed to start 0.5 m above the procedural ground (−59.6 m at origin), not y=20.
Task 3: Visual: docs/screens/plan2-dust-landing.png (shadow: dark grains), plan2-dust-sunlit.png (sunlit faces bright). 20 jumps min FPS 48; running → 61 live grains (boots+wheels).
Task 3: complete (commits 5199eb9..afdcea7, tests: npx vitest run →              at least ~1.79s faster with isolate: false — reuses workers across files instead of one per file)
Task 4: Visual: docs/screens/plan2-trails.png — 31 bootprints after ~23 m walk, 381 wheel prints; no z-fighting; FPS 55. Added Pip.heading getter (consumed by tracks).
Task 4: complete (commits afdcea7..ff2d3fb, tests: npx vitest run →    Duration  39.08s (import 88%, transform 10%, tests 2%, worker 1%))
Task 5: Ruling: coat targets resolved by material name and include both placeholder (suit/pipDark/pipWhite) and GLB names (Suit_Boots/Suit_Legs/Pip_Rubber/Pip_White) so Tasks 6/8 need no rewiring — cost: none. Note: suite run slow (>120 s) under low memory; 116/116 pass.
Task 5: complete (commits ff2d3fb..8fbb1e5, tests: npx vitest run →              at least ~953ms faster with isolate: false — reuses workers across files instead of one per file)
Gate: Tasks 6–9 waiting for user approval of Pip render (plan Task 2 Step 8).
Gate feedback (user, 06/11): 'pip tôi muốn có gương mặt trên màn hình trông vui nhộn hơn, có biểu cảm' → Ruling: new src/pip/faceArt.ts (12 expressions: 6 spec + excited/laugh/proud/scared/love/dizzy; auto-blink, gaze, talking mouth) previewed at /face-preview.html, screenshot docs/screens/plan2-pip-faces.png; Task 6 will extend PipFace to PipExpression and animate the DynamicTexture; screen on the model to be enlarged — cost if wrong: art iteration only.
Gate feedback (user): 'gương mặt kiểu chibi, tối giản mà dễ thương thôi' → Ruling: faceArt.ts restyled chibi-minimal (solid eyes + one highlight, no brows, tiny mouth, blush), features scaled 1.3×; screenshot docs/screens/plan2-pip-faces-chibi.png — cost: art only.
Gate: user approved ('duyệt bản chibi này') → Tasks 6–9 unblocked. Pip head enlarged in build_pip.py (screen 0.40×0.20, head 0.52 wide); rebuild pending — Blender MCP disconnected.
Task 6: Ruling: PipFace widened to PipExpression (12 chibi moods from faceArt.ts, user-approved) instead of the plan's 6 — cost: none (superset).
Task 6: Ruling: crate carried at pip.carryOffset (0,0.95,1.45) in front of Pip held by the 'hold'/'lift' arm pose, not parented to grip nodes (1.2 m crate vs 0.4 m gripper; parenting under the mirrored glTF root is fragile) — cost: crate floats slightly ahead of the gripper.
Task 6: Ruling: face DynamicTexture needs vScale=-1 (seen upside down in-game), no U flip; rotation signs for Y-axis pivots kept in SIGN {steer,pan,armBase} = -1 for Babylon's glTF X-mirror — cost: retune if the root conversion changes.
Task 6: Added Pip.talking (dialogueBox sets it during Pip lines → mouth moves), Pip.wave() on first meeting, scan tilts head down 2.5 s, face redrawn at 30 Hz.
Task 6: Visual: plan2-pip-ingame-1.png (Pip following, happy face), plan2-pip-ingame-2.png (close-up: face upright, waving, head tracks player). Fallback verified by hiding pip.glb (placeholder, 1 warning). Thermal T on/off restores face material. 123/123 tests, build OK.
Task 6: Pending: rebuild pip.glb with the 0.40×0.20 screen (build_pip.py updated) when Blender MCP reconnects.
Task 6: complete (commits 64c889a..51b18b6, tests: npx vitest run →    Duration  93.61s (import 92%, transform 6%, tests 2%, worker 1%))
Task 6: pip.glb rebuilt with 0.40×0.20 screen (height 1.474 m, 13,354 tris); build scene cleaned (user file has only 'Scene').
Task 7: mica.glb 6,568 tris, height 1.512 m (≤20k, 1.2–1.6); RED (3 fails) before build, GREEN after. Visual: plan2-mica-angles.png (Blender), plan2-mica-ingame-dusty.png (grey, in rim shadow, test light), plan2-mica-ingame-awake.png (clean blue cells, eye glows, hatch open).
Task 7: Ruling: MicaSystem takes an optional prebuilt Mica (surfaceScene awaits Mica.create); hatch eases open via scene observer (−1.6 rad about X) — cost: none.
Task 7: Note: screenshots needed a temporary test spot light — Mica's rim is in full shadow under the real 0.63° Sun (known Plan 3 relighting item).
Task 7: complete (commits 707714d..d767f88, tests: npx vitest run →              at least ~1.43s faster with isolate: false — reuses workers across files instead of one per file)
Task 8: astronaut.glb 5,304 tris, height 1.890 m. Ruling: manifest front marker = lamp_L (visor pivots at helmet centre, z=0 by design) — cost: weaker mirror check (lamp z≈+0.02).
Task 8: Ruling: stride 1.3 m walk / 1.8 m lope; footfalls fire at gait phase 0 (L) and ½ (R) when the GLB loads; placeholder keeps the 0.7 m rule — cost: tuning only.
Task 8: Visual: plan2-astronaut-angles.png (Blender), plan2-astronaut-walk.png (backlit walk, legs split), plan2-astronaut-lope.png (sunlit lope beside Pip). 135/135 tests, build OK.
Task 8: complete (commits d767f88..d86e16b, tests: npx vitest run →              at least ~1.61s faster with isolate: false — reuses workers across files instead of one per file)
Task 9: 10 prop GLBs (solarTower 8.02 m/1,068 tris, radiator 2.40, habitat 4.46, antenna 3.63, crate 0.92, flag 2.40, hls 50.50/1,608, relay 3.15, hammer 0.39, feather 0.28); RED 30 fails → GREEN 39/39.
Task 9: Ruling: Blender safe mode also forbids calling a function held in a variable → explicit build_one() dispatcher — cost: none.
Task 9: Ruling: crates are TransformNode pivots at the crate centre with the GLB child at y −0.45 (Entry.crate type Mesh→TransformNode); module GLBs load asynchronously under the module root, placeholder primitives kept as fallback; solar panel aimed via aimPanel(yaw) = rotY(−yaw) on panel_pivot (glTF X-mirror) — cost: a frame or two before bodies appear.
Task 9: Ruling: HLS placed at HLS_POS facing the player spawn, plus an invisible static Havok cylinder (Ø9 × 50 m) so the player cannot walk through it — cost: legs are not collidable.
Task 9: Ruling: hammer/feather GLBs dress the existing Havok boxes (box hidden, model laid along X); masses 1.32/0.03 kg unchanged. Flag only loaded-ready (placement is Plan 3) — not yet placed.
Task 9: Visual: plan2-props-hls.png (HLS 50 m with player and Pip at its feet), plan2-props-base.png (habitat, radiator, antenna in camp shadow, test light). 165/165 tests, build OK.
Task 9: complete (commits d86e16b..73196d6, tests: npx vitest run →              at least ~876ms faster with isolate: false — reuses workers across files instead of one per file)
Task 10: Measured with all models: min 15 / median 30 FPS; shadows off → 60 (bottleneck = 178 casters × 4 CSM cascades). Ruling: merge static props (crate, modules except solarTower, HLS) into one mesh each + register only shadow-worthy casters (bounding radius ≥ 0.15 m) via optimize.ts (tests/optimize.test.ts RED→GREEN) → 101 casters, min 30 / p10 32 / median 34 FPS — cost: small parts cast no shadow.
Task 10: Ruling: kept CSM 4 cascades / shadowMaxZ 900 even though 3/400 gave ~40 FPS — at a 0.6° Sun, terrain beyond 400 m would wrongly render lit — cost: ~6 FPS.
Task 10: Scripted playthrough of new-model paths: crate open (E) → Pip lift (Q) → crate parented to Pip → hold E at ring → habitat installed with merged body. Mica tow/hatch/wake verified in Task 7. Note: this machine is memory-starved with Blender open; FPS is a lower bound. 168/168 tests, build OK.
Task 10: complete (commits 73196d6..f8ce989, tests: npx vitest run →              at least ~1.45s faster with isolate: false — reuses workers across files instead of one per file)
Final review: fresh reviewer (opus) on 2e60c20..f8ce989 — verdict "With fixes", no Critical; all 5 Review Focus points met.
Final: fixed Important 1 (empty thin-instance source drawn at origin: ~2.8 m dust rock / 1 m print quads) — tests/finalReviewFixes.test.ts "dust mesh is hidden…", "print quad is hidden…" RED→GREEN, suite 172/172.
Final: fixed Important 2 (full-buffer GPU upload per stamp, ~768 KB once ring full; idle dust re-upload each frame) — thinInstancePartialBufferUpdate per stamp + skip idle dust upload; tests "a stamp uploads only its own 16 floats…", "idle dust does not re-upload…" RED→GREEN, suite 172/172. Browser: prints/tracks still render (24 boots, 309 wheel prints).
Final: Ruling: TrailRenderer gained an injectable texture factory (default printTexture) so it can be tested under NullEngine without OffscreenCanvas — cost: none.
Final: minor (deferred): a GLB that loads but breaks the node contract throws in Pip/Mica/Astronaut constructors and blocks boot (wrap rig setup in try/catch → placeholder).
Final: minor (deferred): a pose timer (wave/open) during a carry returns the arm to 'stowed', not 'hold'; 'hold' pose unused.
Final: minor (deferred): per-frame allocations (wheelWorldPositions ×2, Quaternion.RotationAxis ×~14, new Color3 per coat material, Mica wheel q.clone, feet/blendPose/blendGait).
Final: minor (deferred): astronaut, Pip and Mica GLBs load sequentially at startup (could Promise.all).
Final: minor (deferred): thermal view (T) misses props that finish loading while it is on.
Final: minor (deferred): 7 source files rewritten CRLF→LF, hiding real diffs; add .gitattributes eol=lf.
Final: minor (deferred): astronaut front marker lamp_L is a weak mirror check (z≈0.02); a back/PLSS marker would be stronger.
