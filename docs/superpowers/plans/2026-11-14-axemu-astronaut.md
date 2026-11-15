# AxEMU Astronaut Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement task-by-task. Steps use checkboxes.

**Goal:** Ship the approved AxEMU proportions, deforming rig and natural sample/module actions with unchanged gameplay camera.
**Architecture:** A reproducible Blender GLB contains a deforming armature and authored action clips. A pure timed action controller owns cancellation/commit, while the existing Havok mover and terrain IK remain authoritative. Interaction systems request actions and commit existing game-state mutations at animation markers.
**Tech Stack:** Babylon.js 9, TypeScript, Blender 5.2, Vitest; no added runtime dependencies.
**Spec:** docs/superpowers/specs/2026-11-14-axemu-astronaut-design.md (approved, including motion revision).

## Global Constraints
- Keep existing camera settings, movement speeds, lunar gravity, save format and all landing/spacecraft effects.
- Preserve 1.5 s held-E module alignment; sample commit at 2.8 s, total ~3.6 s excluding safe approach.
- One active action, no duplicate rewards; pause freezes, rescue/disposal cancels.
- Actual skeleton/skin weights; rigid helmet/pack; constrained limb lengths; continuous transitions.
- No clip recording. User performs final visual QA.

## Review Focus
1. Releasing E or moving during installation resets the interaction without installing remotely.
2. Pause/rescue/load at the sample commit boundary cannot duplicate or lose a sample.
3. Skeleton rest axes and transforms must work in Babylon, not only Blender.
4. Missing/unreachable targets must not stretch limbs or leave controls locked.
5. Scene preloading and cloned model instances must not share mutable animation state.

### Task 1: Action state and pose contract
Files: create src/player/astronautAction.ts, tests/astronautAction.test.ts.
Interfaces: `AstronautAction.start(request): boolean`, `update(dt, {held, valid, cancel}): void`, `cancel(): void`, `snapshot`, `busy`. Request kind sample/install, target key, onCommit/onCancel; fixed-duration and held-stage rules. Pose sampler exports smooth action envelope/progress for the rig adapter.
- [ ] Write tests: sample no commit before 2.8 s, exactly once afterwards, end at 3.6 s; dt=0 freezes; cancellation before/after commit; duplicate start; install entry 0.6 + 1.5 held + exit 0.5; invalid target cancels; release resets.
- [ ] Run `npx vitest run tests/astronautAction.test.ts --maxWorkers=1`, expect RED.
- [ ] Implement pure action lifecycle and repeat-safe callbacks with smooth recovery.
- [ ] Repeat command, expect PASS; commit action controller/tests.

### Task 2: AxEMU skinned GLB
Files: tools/blender/build_astronaut.py; public/models/astronaut.glb; tests/astronautRigAsset.test.ts; src/models/loadModel.ts.
Interfaces: preserve existing named joints/sockets; add armature, collectSample/installModule animation groups and tool/pouch attachment points. LoadedModel exposes instance skeletons/animationGroups without changing existing node/material access.
- [ ] Write asset tests requiring skins, normalized 1–4 weights, nontrivial blended elbow/knee vertices, required clip names, dimensions and socket/contract names. Run to show legacy asset fails.
- [ ] Rebuild adult-proportioned matte suit, continuous weighted limb shells, rigid equipment and authored clips with Blender background CLI. Export reproducibly with embedded maps and no user-scene mutation.
- [ ] Run asset/model/loadModel tests and inspect rendered asset; expect actual skinned meshes, proper forward/left axes and <5 MB (existing contract stricter than proposed 8 MB).
- [ ] Commit model, builder, loader and contract tests.

### Task 3: Runtime rig and interactions
Files: src/player/astronaut.ts; create src/player/astronautRig.ts; src/player/gait.ts if measured lengths require; src/science/scienceSystem.ts; src/interact/moduleSystem.ts; src/scenes/surfaceScene.ts; tests/astronautInteraction.test.ts.
Interfaces: `player.beginInteraction({kind,id,target,valid,onCommit,onCancel}): boolean`, `interactionBusy`, `updateInteraction(dt,held,blocked)`, `cancelInteraction()`. Rig consumes loaded clips, gait pose and action snapshot, blends torso/arms and adds bounded final leg/hand IK. All actions tick separately from world interaction selection.
- [ ] Add tests for queued collection, cancellation/restore, module held release, exact once events and unavailable targets. Observe failure before integration.
- [ ] Adapt rig rest transforms and clips; use in-place action movement; clamp reachable stance and use collision-aware short alignment. Include tool prop/pouch and per-site installation connector visible before finished module spawn.
- [ ] Gate conflicting world interactions while action advances; pause, rescue, teleport and disposal cleanup; keep force/restore paths immediate.
- [ ] Run focused action, integration, gait, model, module, save and input tests. Confirm camera constructor and target offsets unchanged.
- [ ] Commit runtime integration.

### Task 4: Verification, credits and user QA readiness
Files: DESIGN.md; public/models/SOURCES.md; plan ledger.
- [ ] Update credits, dimensions, motion and interaction timing in design.
- [ ] Build and full test suite; browser inspect skinned asset and surface flow, no runtime errors. Exercise sample + installation and cancellation/pause, existing Continue load.
- [ ] Compare fixed-scene draw calls/model size and check loading still includes model bytes/prewarm; no separate asset loading inside action.
- [ ] Fresh reviewer audits whole branch against design and Review Focus; fix important issues and verify.
- [ ] Commit completed work; leave game running for self-QA, no merge/push or recording needed.

## Execution decisions
User has explicitly approved implementation; execute inline without another plan approval. Work in the existing checkout on codex/axemu-character-rig so localhost remains connected; preserve main. Blender MCP unavailable: use installed Blender background process. Ledger records task evidence and any adjustments. Self-review: all spec sections mapped to tasks; interface ownership and exact-once mutation are shared by Tasks 1/3.
