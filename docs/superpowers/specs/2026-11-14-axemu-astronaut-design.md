# AxEMU astronaut: proportions, skeletal rig and interactions

Status: approved by the user, including the revised linked-joint motion preview. Implementation authorized on 2026-11-14.

## Intent and agreed scope

Replace the visibly segmented astronaut with an adult-proportioned person wearing an AxEMU-inspired lunar EVA suit. Add a deforming skeleton and natural movement inside the suit. Include bending to collect samples and operating module connectors. Preserve the existing gameplay camera. The user selected authored animation plus environment-aware hand/foot placement (A), and requested a browser sketch before implementation. No QA video is required; the user will inspect gameplay.

## Evidence and current implementation

- `tools/blender/build_astronaut.py` generates `public/models/astronaut.glb` from separate rigid sections, with transform pivots rather than a skinned armature.
- `src/player/astronaut.ts` rotates those pivots, owns the Havok character capsule and the exploration camera. Capsule height is 1.9 m, radius 0.35 m. Rover seating is also applied here.
- `src/player/gait.ts` already implements travel-driven gait, planted-foot IK, turning, air poses and landing response. Its BODY constants are tied to current mesh dimensions.
- `src/models/loadModel.ts` instantiates model containers but exposes no skeleton/animation handles. `manifest.ts` validates legacy node names and a 1.85–1.95 m height range.
- `src/science/scienceSystem.ts` currently consumes E and immediately hides/adds a sample. Six existing sample IDs must remain valid.
- `src/interact/moduleSystem.ts` opens crates, asks PIP to lift, and installs modules after 1.5 s of holding E. Module geometry is created at completion, not before it. Four existing module types remain supported.
- `surfaceScene.ts` updates player movement before interaction systems, has shared story locks and pause handling, and saves completed milestones. These interfaces need explicit action ownership; simply playing a visual clip after the existing state mutation is insufficient.

## Approaches

A — Authored skeletal animations plus bounded procedural IK, selected by the user. Predictable poses and timing, with foot placement and interaction targets adapting to terrain. Requires authored clips, skin weights and module target metadata.

B — Primarily procedural whole-body animation. More flexible on arbitrary terrain, but harder to produce convincing weight transfer and stable suit motion. Not selected.

## Visual direction (proposed art decisions)

- Target total suited height around 1.90 m to preserve world scale and existing clearance; use an underlying adult approximately 1.75–1.80 m tall as an artistic proportion guide, not an asserted AxEMU engineering dimension.
- Proportion the underlying adult first, then add pressurised suit bulk. Shoulder, elbow, hip, knee and ankle locations follow anatomy; the exterior helmet is larger than the wearer's head. Avoid thin stick limbs, oversized hands, elongated shins and a box-shaped torso.
- Off-white textile cover with broad restrained folds, grey abrasion areas, restrained red identification trim, gold-coated sun visor, articulated gloves, boots and a proportionate life-support backpack. Metal bearings are subdued, fabric remains matte.
- The hard torso, helmet assembly, backpack and joint rings stay rigid. Soft shoulder, elbow, waist, hip and knee regions deform with blended weights. No cloth simulation or simulated breathing expansion of a rigid pressure shell.
- Build from public AxEMU imagery, not fictional mechanical internals. Model is an illustrative game reconstruction, not flight-certified Artemis IV hardware. Do not present an invented patch as NASA's official Artemis IV patch.
- Browser companion is a schematic for proportions, pose sequence and attachment points; it is not a render or quality claim about the eventual 3D asset.

References: https://www.axiomspace.com/axiom-suit ; https://www.nasa.gov/suits-and-rovers/spacesuits/ ; https://www.nasa.gov/image-article/axiom-space-tests-lunar-spacesuit-at-nasas-johnson-space-center/ . Record specific images used and credit them in `public/models/SOURCES.md` and DESIGN.md during implementation.

## Rig and model contract

- Export a skinned GLB with root, pelvis, torso chain, neck/head, clavicles, upper/lower arms, wrists, thighs, shins, ankles/toes and simple finger groups. Target about 40–55 deform bones, at most four influences per vertex.
- Preserve useful legacy names through named attachment transforms or a deliberate manifest migration. Expose skeletons and animation groups from loaded instances; avoid animating shared cached skeletons or disposing resources used by another instance.
- Helmet lamps, visor, backpack, tools and sample pouch have explicit sockets. Equipment follows its body segment, without doubled parent transforms.
- Use the character controller as the authoritative world mover. Clips are in-place: exported animation must not translate the world root and fight Havok. Align footstep audio/dust to the actual planted-foot phase.
- Measure bone rest lengths from the new asset and update IK constants. Treat Babylon/glTF handedness and joint local axes explicitly; verify left/right, forward and elbow/knee bend direction.

## Motion

Idle, start/stop, walk, faster lunar lope, turn, jump/air, landing recovery and rover seating are covered. Preserve current movement speeds, jump impulse, lunar gravity, collision rules and camera settings. Animate from achieved travel rather than key press alone to avoid walking against a wall. Clavicle/arm counter-motion and moderate torso lean express backpack inertia; helmet/pack never wobble like rubber.

Blend ordinary states over roughly 0.18–0.30 s (builder-tunable). Start and stopping poses settle feet without sliding. Existing terrain-aware IK is retained/adapted with bounded pelvis correction and stable knee direction. Airborne states release foot plants. Large drops and invalid terrain targets disable IK gracefully rather than stretching limbs. On lunar traversal, communicate float and careful placement without importing Earth running literally.

User feedback on the first 2D companion: joint transitions felt disconnected and unnatural. The revised movement design explicitly requires linked hierarchical joints, constant limb lengths, pelvis-led weight transfer, smoothly eased reach/retract phases, and no positional or angular-velocity snap at clip boundaries. Do not independently interpolate each joint's world position. Solve planted feet and interaction targets through bounded joint chains; blend poses/targets before final IK. The revised 2D sketch illustrates this structure only; final naturalness must be assessed on the skinned 3D character at the gameplay camera. `axemu-proportions-motion-v2.html` in the local brainstorming session is the revised visual companion.

## Sample action (proposed timing and rules)

E starts one action only when grounded, on foot, within existing interaction eligibility and with a reachable target. Auto-alignment is a short visible foot adjustment, never a teleport: at most about 0.45 m and with collision/ground checks. Otherwise prompt the user to move closer. World camera settings and zoom do not change.

Nominal 3.6 s after alignment: settle feet 0–0.4; flex hips/knees and reach 0.4–1.4; acquire with tongs/scoop 1.4–2.1; transfer to waist pouch 2.1–2.8; recover 2.8–3.6. Tongs for rock samples, scoop variant for granular/ice samples; same action contract for all six existing IDs.

Visual target attachment at acquisition is provisional. Commit inventory, science notes, HUD/dialogue and removal from world once at the pouch marker (~2.8 s), not at the initial key press. A tiny held sample prop can stand in for the terrain sample mesh. The off-hand supports on the suit/thigh, not on empty space. IK solves to the tool tip, not through the fingers.

Before commit, movement/jump input requests cancellation and a short recovery; restore any provisionally hidden sample. After commit, recovery can shorten but cannot grant a second sample or undo collection. Pause freezes exactly; rescue/teleport/scene disposal cancels transient action safely. No new save schema: only committed existing sample state is saved.

## Module action (proposed timing and rules)

Keep E/Q, PIP carrying and the cooperative install sequence. PIP handles the mass; the astronaut secures an accessible connector/lock. Do not animate a person lifting an entire habitat.

Each of the four sites has a collision-free stance and hand/connector targets at a practical working height, assigned per module in metadata. Because the built module currently appears only on completion, show a lightweight installation bracket/connector at the site beforehand. It remains stable during the action and joins/aligns with the finished prop after commit; hands never reach into an object that does not yet exist.

Start with short settle/reach (~0.5–0.8 s), then retain the existing 1.5 s held-E alignment phase, ending at an explicit lock marker. Progress only advances while in reach, grounded, PIP present and E held. Release E before completion resets progress as today and blends to idle. At completion call the existing finish/install/event path once; ~0.5 s hand release and check follows. Thus extra entry/exit movement is visible but the alignment balance requirement stays 1.5 s. Reflect these timings in DESIGN.md before code changes.

Opening a crate remains existing gameplay; new detailed animations for other repair/minigame tasks are outside this scope. Force-install/restore/demo paths remain immediate and do not play interactive actions or duplicate rewards.

## Input, cancellation and state ownership

One astronaut action controller owns a current target ID, stage, clip time and once-only commit. It gates locomotion and other world E/Q/R interactions during an action without freezing its own update. It must not acquire a story lock that prevents the action system from progressing. Pause/Settings and camera orbit input keep current behaviour; do not introduce scripted camera repositioning. Existing rover-specific camera behaviour is retained.

Update ordering must allow action pose, final IK and transform propagation once per frame after target positions are current. Do not have legacy procedural limb writes override animated bones. Story/rescue locks take priority, with cancellation cleanup. Revalidate target and character support before acquisition/commit. Scene teardown releases locks and disposes tool props/listeners. Completed inventory/module state remains authoritative on Continue; unfinished animations restart as idle.

## Asset and runtime budget (initial engineering targets)

One hero body, roughly 25–40k triangles including equipment, up to four main material groups, one 2K body texture set plus a small visor/equipment set. Target embedded model+textures+clips under 8 MB; profile and report actual size rather than sacrificing appearance silently to meet a guess. No per-frame mesh creation, cloth solver or large runtime animation library.

Load the new GLB and tool assets through the current initial loading pipeline; include actual downloaded bytes/work in progress accounting. Prewarm skinning/material variants before surface play. Main menu should not import a second rendering engine. Keep the existing fallback astronaut functional on asset failure, with action completion still correct.

## Non-goals and protected work

No changes to gameplay camera/framing, Orion/HLS, Earth/glow, lunar terrain, landing transition, engine/RCS/plasma/dust effects, mission story, save format or movement balance. No facial animation, multiplayer, procedural cloth, character customiser or new interaction minigame.

## Acceptance and QA

- Asset checks: skeleton/skin present; expected sockets and clips; height and orientation; no missing texture; weights and joint limits; loads without legacy manifest fallback.
- Inspect standing, crouch, reach, walk, turn and seated silhouettes from the existing camera plus separate asset-preview views. No visible joint separation, excessive collapse, suit/pack clipping or tool detachment. Preview views must not alter saved/in-game camera settings.
- Walk/stop/turn on flat terrain and slopes, jump/land, board/exit rover. Check actual planted feet against terrain, footstep effects, and continuous transitions at different frame rates.
- All six samples and four modules: one completion only; pause/resume mid-action; repeated E; release held E; cancel; unreachable target; missing PIP; movement obstruction; rescue/teardown; Continue before and after commit.
- Focused meaningful state/asset integration tests, existing affected regressions, build, loading and one performance comparison using the same scene/camera. Report results and remaining visual limitations; user does final artistic QA. No clip recording.

## Decisions left to implementer

Exact topology, weights, number of finger bones, tool geometry, UV layout, texture compression, easing curves, clip naming and bounded IK solver details. Proposed durations and dimensions above may be tuned within their intent after approval; meaningful changes to scope, camera or input semantics need discussion. Implementation begins only after design approval and a writing-plans pass.
