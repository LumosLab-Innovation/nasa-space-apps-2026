# SDD ledger — plan: docs/superpowers/plans/2026-11-06-plan-1-nen-tang-va-lat-cat-be-mat.md
Spec: docs/2026-11-06-pip-mica-thiet-ke-game.md (v2.0)
Branch: plan-1-surface-slice, merge base 7483b3c (main)

## Pre-flight (shared interfaces)
- T2→T4: lightDelayOneWayS used by houstonDelayMs: 2*1.28224s=2564.48ms → round 2564. OK.
- T3→T4/T10/T11/T12: GameState, setFlag, ModuleId, tracksUnlocked. Names consistent. OK.
- T4→T9: PipFace union consumed by Pip.setFace. OK.
- T5→T7/T12: Ephemeris, sampleAt, findMissionStart; T12 uses sampleAt(earth).el. OK.
- T6→T8/T9/T12: Heightmap, sampleHeight. OK.
- T8→T9: Pip.update(dt, player: Astronaut) uses Astronaut.position/yaw. OK.
- T10→T12: TRACKS_PATH[0] is tracksStart, MICA_POS. OK.
- T2/T7→T13: surfaceTempC + sky sun direction. OK.
- T9/T12→T14: Pip.command('pull'), Mica.dust/setAwake. OK.
- Risk noted: T2 kineticEnergy(0.001,20000) toBe(200000) may differ by float epsilon.
Task 1: complete (commits 7483b3c..52d9e0c, tests: npx vitest run →    Duration  231ms (transform 40%, import 30%, worker 21%, tests 8%, environment 1%))
Task 1: manual check — box drop 7.5 m measured 2.97 s vs expected 3.04 s; gravity -1.62
Task 2: Ruling: kineticEnergy assertion uses toBeCloseTo(200000, 6) instead of toBe — 0.001 is not exact in binary floating point — cost if wrong: none
Task 2: complete (commits 52d9e0c..220f9b0, tests: npx vitest run →    Duration  238ms (import 36%, transform 36%, worker 17%, tests 10%))
Task 3: complete (commits 220f9b0..7d12666, tests: npx vitest run →    Duration  250ms (import 38%, transform 30%, worker 19%, tests 12%, environment 1%))
Task 4: Ruling: added extra dialogue id micaIdentifyEarthDown — Task 12 needs a Pip line when Earth is below horizon — cost if wrong: one unused script entry
Task 4: complete (commits 7d12666..1b9d4b1, tests: npx vitest run →    Duration  288ms (import 42%, transform 34%, worker 13%, tests 10%))
Task 5: real data — sun el -1.07..0.63 deg, az step -0.51 deg/h; Earth el -7.53..6.24; findMissionStart = 2028-01-01T00:00Z (sun 0.63, Earth 2.03); sun-down runs 162 h and 765 h (real 'long shadow').
Task 5: Ruling (applies to Task 11): shadow quiz must compute shadow length from the live sun elevation (real max 0.63 deg → ~90 m per 1 m rock) instead of the fixed '38 m' line — spec demands real data; 38 m assumed 1.5 deg — cost if wrong: one dialogue line.
Task 5: complete (commits 1b9d4b1..25ea3f1, tests: npx vitest run →    Duration  312ms (import 36%, transform 31%, worker 17%, tests 15%, environment 1%))
Task 6: data — PGDA LOLA Site01 (Connecting Ridge) 5 m/pix GeoTIFF, 3200x3200, bbox x -19..-3 km, y -20..-4 km; site stereo (-11310,-12257) m inside; relief -159.9..61.0 m at game scale. Fixed inverted triangle winding (normals were -y) found visually.
Task 6: Ruling: heights scaled by the same 0.5 factor as the horizontal squeeze (3 km → 1.5 km) — keeps real slopes walkable and 'realistic' per spec; raw scale would double all slopes — cost if wrong: one constant in build-heightmap.mjs
Task 6: Ruling: heightmap is rotated into local ENU (+z north, +x east) using the site meridian — so Horizons az/el lights the real terrain from the correct side — cost if wrong: sun from wrong direction
Task 6: complete (commits 25ea3f1..5c0ff04, tests: npx vitest run →    Duration  504ms (import 32%, transform 30%, tests 25%, worker 12%))
Task 7: Ruling: azElToDirection lives in src/world/skyMath.ts (pure) instead of sky.ts — keeps the unit test free of Babylon/WebGL — cost if wrong: none
Task 7: visual check — sun dir (1.000,-0.011,-0.009) i.e. sun due west-ish at ~0.6 deg, 1 m rock shadow spans far across terrain, black sky; shadow bias tuned 0.004/0.12 (acne vs peter-panning). Screenshot docs/screens/task7.png
Task 7: complete (commits 5c0ff04..e6aaa85, tests: npx vitest run →    Duration  1.08s (transform 31%, import 31%, tests 25%, worker 13%, environment 1%))
Task 8: in-browser check — walk 4.80 m in 3 s; jump apex 0.75 m (expected 0.79), air time 1.91 s (expected 1.98).
Task 8: Ruling: added src/player/keyboard.ts (Keyboard with moveInput/consume) not named in plan — Astronaut.update takes MoveInput, something must produce it; consume() also serves later E/Q/T/Tab keys — cost if wrong: none
Task 8: complete (commits e6aaa85..5280fee, tests: npx vitest run →    Duration  1.32s (transform 33%, import 33%, tests 20%, worker 14%))
Task 9: in-browser — follow distance 3-4 m walking, settles ~3 m; dust emitRate 88 while moving; Q→wait leaves Pip behind (9.5 m); teleport 38.9 m → 2.7 m after ~3 s.
Task 9: Ruling: added always-on helmet SpotLight (intensity 25, range 30) to Astronaut — real sun at 0.6 deg leaves most terrain in pitch-black shadow, unplayable without it; spec mentions headlamps; realistic (Artemis suits have lights) — cost if wrong: one light to tune/remove
Task 9: Ruling: dust sprite is drawn into a DynamicTexture instead of loading assets.babylonjs.com/flare.png — spec requires offline play — cost if wrong: none
Task 9: Ruling: Q = Pip's context command when one is set, else toggles wait/come — plan step 6 said 'Q opens minimal ring (wait/come)'; a toggle is the minimal ring — cost if wrong: UI change in Plan 4
Task 9: complete (commits 5280fee..fdd8085, tests: npx vitest run →    Duration  1.44s (transform 38%, import 27%, worker 20%, tests 15%, environment 1%))
Task 10: in-browser — solarTower flow crate→needsLift→lifted→installed; radiator flow same; rescue from y=0 to 61.8 at hill top; HUD prompt/toast/status visible.
Task 10: Ruling: Pip CARRIES the lifted crate to the install site (orange ring) and the player aligns there — plan had the module simply appear at camp after aligning at the crate; carrying is physically sensible and shows co-op (spec §5.3) — cost if wrong: simpler flow is a small change in moduleSystem.ts
Task 10: Ruling: zones packed within ~400 m and Shift lope 2.8 m/s added — spec says crossing takes ~3 min but 1.5 km at 1.8 m/s is ~14 min — cost if wrong: zone coordinates in zones.ts
Task 10: Ruling: solarTower install site is Solar Hill (23,167), not the camp — spec §6 2A puts the tower on the hill — cost if wrong: one coordinate
Task 10: Ruling: added isBelowGround rescue (respawn on surface if >3 m under terrain) — Review Focus #1 (never fall out of the world); found when a teleport put the capsule under the hill — cost if wrong: none
Task 10: Ruling: scene composition moved from main.ts into src/scenes/surfaceScene.ts (as the plan's file map intended); window.__world exposed in DEV for scripted play-tests — cost if wrong: none
Task 10: Note for Plan 4: camp (90,10) sits in terrain shadow at the real 0.63 deg sun — consider moving camp to a lit spot.
Task 10: complete (commits fdd8085..8ee2bb2, tests: npx vitest run →    Duration  2.27s (transform 32%, import 29%, worker 21%, tests 18%, environment 1%))
Task 11: in-browser — intro dialogue plays when Pip arrives (noSound card); hammer & feather both land at 1.34 s (expected 1.36); shadow quiz uses live sun; R scan glows nearest sample; anorthosite collected; Houston reply after 2.56 s radio delay; 5 cards + 2 data logs unlocked; notebook text wraps (fixed width).
Task 11: Ruling: createDialogueBox/createNotebook take the HUD's AdvancedDynamicTexture as first arg (plan said scene) — one fullscreen GUI shared by all UI — cost if wrong: signature change
Task 11: Ruling: dialogue lines auto-advance by reading time, Enter skips — plan didn't fix an advance key; E/Space are taken by interact/jump — cost if wrong: input tweak
Task 11: Ruling: Pip scan is key R (plan named the 'scan' command but no key) — cost if wrong: key binding
Task 11: Ruling: added Keyboard.endFrame() clearing unused presses, and both modules+science update every frame (prompt = modules ?? science) — a stray E press would otherwise fire later at a different object; short-circuit would freeze science updates — cost if wrong: none
Task 11: Ruling: science glue lives in new src/science/scienceSystem.ts (experiment/shadow/antenna/sample spots near the landing zone) — plan put wiring in surfaceScene; separate file keeps surfaceScene small — cost if wrong: none
Task 11: complete (commits 8ee2bb2..38641af, tests: npx vitest run →    Duration  1.92s (transform 41%, import 28%, tests 15%, worker 15%, environment 1%))
Task 12: in-browser path (a) — tracksSeen at 15 m (after 2 modules + 3 samples), following at track start, found at 4.5 m; silent beat face 'dots' with HUD prompt hidden, then 'sad'; flags act3:micaFoundViaTracks + act3:micaFound; cards tracksLast, apollo17Dust, micaFiction. Path (b) covered by unit test 'finds Mica even if the tracks were never noticed'.
Task 12: Ruling: scene glue in new src/mica/micaSystem.ts (plan wired it into surfaceScene) — keeps surfaceScene small — cost if wrong: none
Task 12: Note for Plan 4: Mica at (360,-232) sits fully in shadow under the real 0.63 deg sun; spec wants half sun / half shadow — pick a terminator spot once lighting is final.
Task 12: complete (commits 38641af..fd238f5, tests: npx vitest run →    Duration  2.84s (transform 39%, import 28%, tests 16%, worker 16%, environment 1%))
Task 13: in-browser — T on: post-process active, sun intensity 1, astronaut sun side orange/yellow, shadow side blue, terrain violet/blue; UI layer excluded from post-process; T off restores materials (terrain 'regolith'), helmet lamp 25, sun 4.0, post-processes 0. Card sunFacingHeat unlocks on first use.
Task 13: Ruling: tempToColor lives in src/ui/thermalColor.ts (pure) and thermalView.ts generates its GLSL palette from the same anchors — testable without WebGL, single source of truth — cost if wrong: none
Task 13: Ruling: thermal view uses 'white matte + sun-only + luminance→temperature post-process' instead of a per-mesh ShaderMaterial reading the shadow map — same physics (cos incidence x shadow → Stefan-Boltzmann), far less shader plumbing — cost if wrong: thermal look differs slightly
Task 13: Ruling: createThermalView takes the HUD ui for its label (plan: (scene, sky)) — cost if wrong: none
Task 13: complete (commits fd238f5..43a7c31, tests: npx vitest run →              at least ~290ms faster with isolate: false — reuses workers across files instead of one per file)
Task 14: in-browser full chain — found (direct path) → Q tow → arrives at camp → 4x EDS (dust 0, energy 20) → Q open → E swap → long hold warns tooFast (battery -36.3) → gentle holds to 0.0 C → awake, eye glows, micaWake dialogue, flag act4:micaAwake. tsc + vite build OK.
Task 14: Ruling: tow uses kinematic follow + drawn tether line instead of a Havok joint — Mica has no physics body; a joint adds tuning risk for no visible gain — cost if wrong: towing looks less physical on slopes
Task 14: Ruling: tow arrival radius 25 m from camp centre (first tried 14 m: Mica stalled 18 m out behind Pip when the player stood at the camp edge — found in play-test) — cost if wrong: one constant
Task 14: Ruling: added Pip command 'open' (hatch) and repair glue in new src/mica/repairSystem.ts — plan listed no hatch command — cost if wrong: none
Task 14: Note — end-to-end play time (target 10-15 min) not measured with a real player; scripted run used teleports.
Task 14: complete (commits 43a7c31..6a659e7, tests: npx vitest run →              at least ~436ms faster with isolate: false — reuses workers across files instead of one per file)
Final review: opus reviewer — 81/81 tests, tsc clean; verdict "ready with fixes": 1 Critical, 3 Important, 7 Minor.
Final: fixed Critical 1 hatch open no-op when Pip out of reach — tests 'asks Pip to approach when too far, then fires once it arrives' RED→GREEN; browser: Pip 20.8 m away, opened in 10.3 s; suite 86/86
Final: fixed Important 2 thermal view corrupting via LinesMesh — test 'skips LinesMesh, sky bodies and meshes without material' RED→GREEN; browser: thermalWhite fillMode 0, tow line keeps ShaderMaterial; suite 86/86
Final: fixed Important 3 hammer-feather result spoken before the drop — test 'splits the dialogue so the result comes after the drop' RED→GREEN; suite 86/86
Final: fixed Important 4 lift picked first needsLift crate / silent no-op while carrying — test 'reads the module id from the lift interactable id' RED→GREEN; lift prompt disabled while carrying; suite 86/86
Final: minor (deferred): no single owner of Pip.mode — pending goto can be cancelled by Q / Mica silence beat; pull prompt hidden while pending
Final: minor (deferred): DialogueBox queue has no catch — one rejected play() would block all later dialogue
Final: minor (deferred): single toast slot — later toast overwrites earlier in the same frame
Final: minor (deferred): Pip goto always walks 1.6 m/s, never teleports
Final: minor (deferred): deploying antenna while Earth is down permanently forfeits Houston dialogue/card
Final: minor (deferred): heightmap.json size/worldSizeM not validated; clampToWorld uses constant not hm.worldSizeM
Final: minor (deferred): thermal view misses meshes created while it is on; Pip face stays 'worried' after warm warning
