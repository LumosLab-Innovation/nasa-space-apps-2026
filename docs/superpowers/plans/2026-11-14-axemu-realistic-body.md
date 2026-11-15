# AxEMU Realistic Body Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the code-primitive astronaut mesh with an anatomically proportioned wearer in a detailed AxEMU suit (high-poly detail baked to a game mesh), keeping the skeleton, sockets, clips and runtime contract.

**Architecture:** A one-time MPFB/MakeHuman CC0 wearer mesh is committed as a source asset, posed to the current bind. `build_axemu.py` (Blender background) fits a welded skinned coverall over it, layers rigid suit parts on bones, builds a high-poly detail copy, bakes normal/AO onto the game mesh, reuses the existing clip code unchanged and exports `public/models/astronaut.glb`.

**Tech Stack:** Blender 5.2 (`D:\Desktop\Apps\Blender 5.2\blender.exe`, background CLI) + MPFB extension, Python/bpy/numpy, Babylon.js 9, TypeScript, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-14-axemu-realistic-body-design.md`

## Global Constraints

- Do NOT edit or commit files the user's Codex session is changing: `src/landing/*`, `src/scenes/landingScene.ts`, `src/scenes/surfaceScene.ts`, `src/ui/descentHud.ts`, `src/ui/dialogueBox.ts`, `src/i18n/vi.ts`, `src/fx/flightExplosion.ts`, `src/landing/assistedFlight.ts`, `src/ui/flightFailure.ts`, `tests/assistedFlight.test.ts`, `docs/superpowers/plans/2026-11-14-assisted-flight-failure.md`.
- `DESIGN.md` contains Codex hunks too: edit only the "AxEMU body and cooperative work" paragraph; stage only that hunk (`git diff DESIGN.md` → keep the AxEMU hunk → `git apply --cached`), never `git add DESIGN.md`.
- Motion frozen: clips `idle`, `walk`, `collectSample`, `installModule` keep the existing `pose_keys(...)` data verbatim; no gait redesign.
- Skeleton names/hierarchy unchanged; ≤4 influences/vertex; bind joints: shoulder x ±0.325, wrist x ±0.38, hip y 0.94 / x ±0.13, thigh 0.41 m, shin 0.40 m, ankle height 0.13 m (glTF Y-up) — other joints within 1 cm of today's.
- Suited height 1.85–1.95 m. Game mesh 30k–45k triangles. Textures ≤ 2048 px. GLB < 5 MB (existing `tests/models.test.ts` cap; use JPEG/WebP colour maps). If 5 MB proves impossible without visible loss, stop and ask before raising it (spec allows ~8 MB).
- Licences: CC0 / own work only. No logos (NASA/Axiom/Prada) and no invented "official" patch. Credit references in `public/models/SOURCES.md` and DESIGN.md → Data.
- Build reproducible from repo: `"/d/Desktop/Apps/Blender 5.2/blender.exe" --background --python tools/blender/build_axemu.py`.
- Test command: `npx vitest run <files> --maxWorkers=1`; full: `npm test -- --maxWorkers=1`; `npm run build`.

## Review Focus

- Crouched sample pose (hip .95, knee 1.85 rad): thigh/belly fabric must not collapse or let the hard torso intersect the thighs → Task 3 adds a posed-mesh self-intersection check in the build script.
- Arm swing at walk extremes: sleeves vs. hard torso/PLSS clipping → Task 3 build-time posed clearance check at walk frames 0 and 0.35 s.
- Gloves and tool socket: the tongs/scoop must still sit in the right hand after glove remodel → Task 5 test on `toolSocket_R` position vs. glove palm.
- Helmet re-parent: helmet must not drift from the torso ring during walk (spine-parented) → Task 1 hierarchy test.
- Babylon handedness: left/right and forward stay correct (`front: 'lamp_L'`, `left: 'glove_L'` manifest checks) → covered by existing `tests/models.test.ts`; rerun in Task 5.

---

### Task 0: Baseline and tooling

**Files:** none created (commits existing astronaut-only work).

- [ ] **Step 1:** Commit the uncommitted joint-refinement baseline, astronaut files only:
```bash
git add tools/blender/build_axemu.py public/models/astronaut.glb public/models/SOURCES.md src/models/manifest.ts src/player/astronautRig.ts src/player/gait.ts tests/astronautRig.test.ts tests/astronautRigAsset.test.ts tests/gait.test.ts docs/superpowers/plans/2026-11-14-axemu-joint-refinement.md docs/superpowers/specs/2026-11-14-axemu-realistic-body-design.md docs/superpowers/plans/2026-11-14-axemu-realistic-body.md
git commit -m "feat: AxEMU joint refinement baseline and realistic-body design"
```
Stage the AxEMU paragraph hunk of DESIGN.md only (see Global Constraints).
- [ ] **Step 2:** Record baseline: `npx vitest run tests/astronautRig.test.ts tests/astronautRigAsset.test.ts tests/gait.test.ts tests/models.test.ts --maxWorkers=1` → all PASS; note GLB size, triangle count (from build log), bone count in the ledger.
- [ ] **Step 3:** Ask the user to open Blender and click *Start MCP Server*; confirm with `get_addon_status` (expect addon matches server 2.2.9).
- [ ] **Step 4:** Install MPFB in Blender 5.2 from extensions.blender.org (via Blender MCP `execute_blender_code` using `bpy.ops.extensions.package_install` or the user's UI). Verify `import bl_ext.blender_org.mpfb` succeeds.

### Task 1: Asset contract tests (fail first)

**Files:**
- Create: `tests/astronautRealismAsset.test.ts`
- Modify: `tests/astronautRigAsset.test.ts` (only if the welded shell is renamed; keep name `AxEMU_cover` to avoid this)

**Interfaces:** Produces node names later tasks must export: `hutShell`, `rearHatch`, `shoulderBearing_L/R`, `waistBearing`, `ankleBearing_L/R`, plus existing `helmet`, `visor`, `lamp_L/R`, `plss`, `glove_L/R`, `boot_L/R`, `torso`, `toolSocket_L/R`, `samplePouch`, `chestController`, `waistConnectors`. Material `Suit_Coverall` gets `normalTexture` and `occlusionTexture`.

- [ ] **Step 1: Write failing tests** (reuse `parseGlbJson` and the binary readers pattern from `tests/astronautRigAsset.test.ts`):
  - `triangle budget`: sum of index counts / 3 over all primitives ∈ [30000, 45000].
  - `baked detail maps`: material `Suit_Coverall` has `normalTexture` and `occlusionTexture`; every image's width/height ≤ 2048 (read from embedded PNG/JPEG/WebP header).
  - `rigid helmet on hard torso`: walking parents from `helmet`, `visor`, `lamp_L` reaches `spine` without passing through `neck`.
  - `suit parts present`: node names listed in Interfaces all exist.
  - `bind joints unchanged`: world bind positions (from skin inverseBindMatrices) of `upperArm_L` x = 0.325±0.01, `wrist_L` x = 0.38±0.01, `thigh_L` y = 0.94±0.01, `shin_L` y = 0.53±0.01, `ankle_L` y = 0.13±0.01 (and mirrored R).
- [ ] **Step 2:** `npx vitest run tests/astronautRealismAsset.test.ts --maxWorkers=1` → FAIL on triangle budget / maps / helmet parent / missing parts; `bind joints unchanged` PASSES (guards baseline).
- [ ] **Step 3:** Commit `tests/astronautRealismAsset.test.ts` with message `test: AxEMU realism asset contract (red)`.

### Task 2: Wearer base mesh

**Files:**
- Create: `tools/blender/make_wearer.py` (one-time, needs MPFB), `tools/blender/assets/axemu_wearer.glb`, `tools/blender/assets/README.md` (source, CC0 licence, MPFB version, parameters)

- [ ] **Step 1:** Implement `make_wearer.py`: create MPFB human (neutral adult, ~1.77 m, average build, no hair/clothes/eyebrows, low-poly proxy or base mesh with helper geometry deleted), apply a pose matching today's bind: arms splayed so shoulder joint centre is at x ±0.325 and wrist at x ±0.38 (z 1.50→0.93), legs straight with hip at 0.94 and ankle at 0.13; scale/translate so these joint centres match within 1 cm. Apply pose and modifiers, drop the MPFB rig, export mesh only to `assets/axemu_wearer.glb` (Z-up source not required; script documents axis).
- [ ] **Step 2:** Run `"/d/Desktop/Apps/Blender 5.2/blender.exe" --background --python tools/blender/make_wearer.py`; script prints joint-centre errors and asserts each ≤ 0.01 m.
- [ ] **Step 3:** Blender MCP `look` front/side render of the wearer with today's armature overlaid; check proportions visually.
- [ ] **Step 4:** Commit the script, GLB and README (`feat: CC0 wearer base for AxEMU fitting`).

### Task 3: Suit construction over the wearer

**Files:**
- Create: `tools/blender/axemu_suit.py` (suit geometry functions, exec'd like `common.py`)
- Modify: `tools/blender/build_axemu.py` (replace lathe/voxel body section and rigid-part section; keep materials helper usage, armature creation, `pose_keys` clip block verbatim, export call)

**Interfaces:**
- Consumes: `assets/axemu_wearer.glb`; armature `AxEMU_Rig` with existing bone names.
- Produces: `build_coverall(wearer, rig) -> bpy.types.Object` named `AxEMU_cover`; `build_rigid_parts(rig) -> dict[str, Object]` creating the Task 1 node names, each `parent_type='BONE'`.

- [ ] **Step 1:** `build_coverall`: offset shell from the wearer (solidify/shrinkwrap outward 3–6 cm, more at thighs/upper arms for pressurised bulk), close at neck ring/wrists/ankles, voxel-weld into one component, decimate/retopo to ~18–24k tris, keep armpit and wrist-to-hip gaps (≥12 mm, the existing cross-section test). Weights: armature auto-weights on the wearer, `DATA_TRANSFER` to the coverall, then smooth, limit to 4, normalise; rigid-ring zones fully weighted to their bone.
- [ ] **Step 2:** `build_rigid_parts`: hard upper torso shell with rear hatch outline and neck ring (spine), helmet bubble + gold visor + lamps/cameras (spine — moved from neck), PLSS with service panels/vents (spine), shoulder bearings (upperArm), wrist bearings (wrist), waist bearing (pelvis), ankle cuffs (ankle), gloves with palm, four fingers and thumb (finger bones), boots with sole tread, toe cap (ankle/toe), chest controller, sample pouch, waist connectors, `toolSocket_L/R` at today's offsets relative to wrist.
- [ ] **Step 3:** Build-time posed checks in `build_axemu.py` (print + `assert`): evaluate mesh at `collectSample` t=0.95 s and `walk` t=0 and 0.35 s; BVH overlap between `AxEMU_cover` and `hutShell`/`plss` limited to the skinned zone under the torso shell (no overlap of sleeves/thighs with rigid parts); height 1.85–1.95.
- [ ] **Step 4:** Run the build; then `npx vitest run tests/astronautRigAsset.test.ts tests/astronautRealismAsset.test.ts --maxWorkers=1` → cross-section, shell, skeleton, weights, helmet-parent, parts, joints PASS; maps/triangle tests may still FAIL until Task 4.
- [ ] **Step 5:** Blender MCP `look` renders: front/side/back/three-quarter at rest and the three posed frames; fix pinching/clipping in mesh or weights (never in clips).
- [ ] **Step 6:** Commit build scripts and GLB (`feat: AxEMU suit fitted over anatomical wearer`).

### Task 4: High-poly detail, bake and materials

**Files:**
- Create: `tools/blender/axemu_bake.py`
- Modify: `tools/blender/build_axemu.py` (call bake before export; replace the procedural woven/panel atlas)

**Interfaces:** Produces images `AxEMU_suit_color` (sRGB, ≤2048), `AxEMU_suit_normal`, `AxEMU_suit_orm` and a small equipment set; material `Suit_Coverall` (coverall) plus `Suit_White`, `Suit_Boots`, `Visor_Gold`, `PLSS` kept for manifest compatibility.

- [ ] **Step 1:** High-poly copy of coverall and rigid parts: subdivision, fold displacement concentrated inside elbows/knees/waist/behind knees, seam grooves and stitch rows along panel lines, raised knee/elbow reinforcement patches, straps and pocket flaps, bevelled edges on rigid parts.
- [ ] **Step 2:** Clean UVs on game meshes (seams along garment panels, ≥8 px margin at 2K); Cycles CPU bake in background: normal (tangent, cage/extrusion ~1 cm) and AO from high-poly to game mesh; paint base colour: off-white outer layer, grey accent panels per the 2024 flight design, restrained red identification band, subtle wear at knees/boots/gloves.
- [ ] **Step 3:** Export colour maps as JPEG/WebP (glTF exporter image format option) and keep normal maps PNG or high-quality WebP; confirm GLB < 5 MB.
- [ ] **Step 4:** Run the build and `npx vitest run tests/astronautRealismAsset.test.ts tests/astronautRigAsset.test.ts tests/models.test.ts --maxWorkers=1` → all PASS.
- [ ] **Step 5:** Blender MCP `look` close-ups (3 m equivalent) of chest, knee, glove, boot, helmet; iterate.
- [ ] **Step 6:** Commit (`feat: baked AxEMU suit detail`).

### Task 5: Runtime fit and documentation

**Files:**
- Modify: `src/models/manifest.ts` (astronaut `materials` list if changed; nodes unchanged), `src/player/gait.ts` (`BODY` only if measured lengths changed >1 cm), `src/player/astronautRig.ts` (tool prop offsets only if glove palm moved), `tests/astronautRig.test.ts` (new socket test), `public/models/SOURCES.md`, `DESIGN.md` (AxEMU paragraph + Data credit only)

- [ ] **Step 1: Failing test** in `tests/astronautRig.test.ts`: `tool socket sits in the right glove palm` — from the GLB, `toolSocket_R` world bind position lies within 0.04 m of the `glove_R` palm centre and below the wrist bearing.
- [ ] **Step 2:** Run → FAIL if offsets drifted; adjust socket in `axemu_suit.py` or tool offsets in `astronautRig.ts`; run → PASS.
- [ ] **Step 3:** Measure bone lengths from the GLB; if any differs >1 cm from `BODY`, update `BODY` and the affected `gait.test.ts` expectations with the measured values.
- [ ] **Step 4:** Update SOURCES.md (wearer CC0 source, 2024 Axiom/Prada flight-design references: https://www.nasa.gov/image-detail/axemu-prada-spacesuit-mockup-20241007-085/ and https://axiomspace.com/news/axiom-prada-suit ; illustrative choices: red band, details, 1.90 m height; not official Artemis IV hardware) and the DESIGN.md AxEMU paragraph (wearer-based body, baked detail, helmet fixed to torso so its small nod is no longer visible).
- [ ] **Step 5:** `npm test -- --maxWorkers=1` → note any failures unrelated to astronaut (Codex's in-progress work) separately; `npm run build` → PASS.
- [ ] **Step 6:** Commit astronaut files; stage DESIGN.md AxEMU hunk only (`feat: fit runtime to realistic AxEMU body`).

### Task 6: In-game visual QA and performance

- [ ] **Step 1:** `npm run dev`; in the surface scene check idle, walk, turn, jump/land, sample crouch, module install, rover seat at camera radius 3 m and 7 m (Playwright/Chrome MCP screenshots if connected, else user). No clipping, pinching, floating tools, wrong-side gloves.
- [ ] **Step 2:** Frame-time comparison old vs. new GLB, same scene and camera (`engine.getFps()` average over 10 s, or a performance trace); record numbers.
- [ ] **Step 3:** Whole-branch review (fresh reviewer), then hand to the user for artistic QA with screenshots; record limitations in the ledger.
