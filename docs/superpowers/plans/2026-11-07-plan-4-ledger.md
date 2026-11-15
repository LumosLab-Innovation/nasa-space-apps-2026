# SDD ledger — plan: docs/superpowers/plans/2026-11-07-plan-4-cao-trao-va-ket.md
Branch: plan-4-ending (stacked on plan-3-journey @ 2780e86). Spec: docs/superpowers/specs/2026-11-06-hanh-trinh-va-model-design.md (+ v2.0 docs/2026-11-06-pip-mica-thiet-ke-game.md).
Pre-flight:
- T1→T5/T6/T8/T9: CampNight {sunsetMs,dawnMs,dawnAzDeg,sunsetAzDeg,earthSetMs,hours}; jumpTo/fastForwardTo — consistent.
- T2→T3: loadStormEvent/stormBlurb — consistent.
- T3→T7: SHELTER_POS — consistent. T3 adds survival.rescue('storm'); T4 adds survival.paused — no clash.
- T4→T5/T6/T8/T9: InputLock, StoryPanel, readDigit — consistent.
- T5 act5System stubs notch/planner panels; T6/T8 fill them — consistent.
- T7→T8: leaksFixed(flags) — consistent (shared test file tests/nightBudget.test.ts).
- T8→T9: pip.sleep(on) — consistent.
- T5 moves darkCrater beacon trigger to act4:memory; demo (fastForwardWake) no longer shows beacon — acceptable, demo ends at wake.
Task 1: complete (commits 2780e86..6484af5, tests: npx vitest run → 239/239 pass)
Task 2: Ruling: pickStorm returns the latest MEASURED event (instrument not "MODEL: ..."), falling back to any event — DONKI also stores REleASE model forecasts (70 of 179 cached), and the blurb says "recorded"; a forecast is not a recording — cost if wrong: the storm cites a slightly older event.
Task 2: note: DONKI reachable at new host; cached 179 events 2024-01-01..2025-12-31 (13 requests); latest measured 2025-11-15T09:34Z STEREO A IMPACT.
Task 2: complete (commits 6484af5..a77fcb4, tests: npx vitest run → 244/244 pass)
Task 3: Ruling: shelter is walk-in (no collider) and "sheltered" means inside the 6 m dome (radius 3 m), not the plan's 8 m — a solid dome could not be entered, and standing beside a dome gives no regolith overhead — cost if wrong: players must step fully inside.
Task 3: Ruling: storm rescue lands the player inside the shelter (survival.rescue(kind, to?) gained an optional destination) — the plan said base teleport "is already in the shelter", it was 22 m away — cost if wrong: none.
Task 3: Ruling: v2.0 scene 4.2 "hide in boulder shadows" replaced by regolith shelter or lander (plan Global Constraint; SEP protons are near-isotropic) — cost if wrong: a deviation from the original script, explained in-game.
Task 3: browser: tow start → warning 2:23 after 15 s; inside dome → "stay here" + storm_shelter; second run outside at (-150,-500) → rescued to (-58,-318), tow reset, MICA left at (-150.9,-505.7), storm continued; cards verified: PMC7518862 (1369 µSv/day; GCR ×2.6 ISS), NTRS 19890004839.
Task 3: complete (commits a77fcb4..c358654, tests: npx vitest run → 257/257 pass)
Task 4: Ruling: pure lock helpers live in src/ui/inputLock.ts (InputLock, sceneInputGate, readDigit, shouldStepSurvival), the GUI panel in src/ui/storyPanel.ts — keeps the tests free of @babylonjs/gui — cost if wrong: one extra file. StoryPanel also has setOptions/setFooter.
Task 4: browser: panel open + W held 2 s → moved 0.000 m, O2 drain 0; after hide → moved 2.16 m.
Task 4: complete (commits c358654..7a0f380, tests: npx vitest run → 257/257 pass)
Task 5: Ruling: drawMemoryPhoto lives in src/ui/memoryPuzzleView.ts (canvas code next to the panel), not memoryPuzzle.ts — keeps the pure module canvas-free — cost if wrong: none.
Task 5: Ruling: act5System exposes `hooks` (openHorizon / openPlanner / updateLate / prepExtras) that Tasks 6–9 replace; stub notch just sets act5:notchChosen — cost if wrong: none (replaced in T6).
Task 5: Ruling: "Enter — begin the long night" only fires while no dialogue is playing (Enter also skips dialogue lines) — cost if wrong: one extra Enter.
Task 5: Ruling: memory view exposes `solution` getter (for dev playtests and ?jump in T10) — cost if wrong: a cheat for console users only.
Task 5: browser: E on awake MICA → intro → panel; wrong pick feedback; solved → act4:memory, beacon visible; Act 5 started in camp → title → clock 2028-11-29T13:27Z; night sunset 19:20Z, dawn 2028-12-03T09:40Z.
Task 5: complete (commits 7a0f380..d3b3dcc, tests: npx vitest run → 260/260 pass)
Task 6: Ruling: story updates (memory, horizon, act5) now run BEFORE world interactions each frame and the story prompt wins — E at the shelter was being eaten by the EDS-clean prompt — cost if wrong: a world prompt hidden while a story prompt shows.
Task 6: Ruling: story panel is top-anchored (top 64 px, 97% opaque) and the prep checklist hint hides while a panel is open — the subtitle box and hint overlapped it — cost if wrong: none.
Task 6: Ruling: horizon options read "A: aim at 160°" (not "the notch at") since two candidates are not notches; Esc closes without choosing — cost if wrong: wording only.
Task 6: browser: horizon panel at camp with real silhouette (peak 134°, dip 97°), candidates 160/134/117/97; pick 3 → act5:notchCorrect, Pip heading 26.9° (=117−90), MICA 27°; blocker list shrank to the ice. Card peaksOfLight verified at lroc.im-ldi.com/images/271.
Task 6: complete (commits d3b3dcc..051839f, tests: npx vitest run → 265/265 pass)
Task 7: Ruling: leak hot spots are meshes tagged metadata.hotSpot that the thermal view leaves un-repainted (canThermalize skips them), so the existing post-process shows them hot; no thermalView.ts change needed — cost if wrong: none.
Task 7: Ruling: heat leaks update after the world block (world systems reset Pip's context command each frame) and act5 shows their prompt one frame later; next to a leak only the leak prompt shows; nightBlockers strings shortened to fit one line — cost if wrong: one-frame prompt lag.
Task 7: browser: prep → near door leak "T — thermal view…"; T → glow + IR particles + leak_found line + Q prompt; Q → act5:leak:door, berm mesh, glow off.
Task 7: complete (commits 051839f..b7e8b23, tests: npx vitest run → 268/268 pass)
Task 8: Ruling: lunarNight card cites SpacePolicyOnline (SLIM woke after a third 14-day night, 2024) — JAXA's SLIM page does not mention night survival; plan asked for an official source — cost if wrong: a reputable news source instead of an agency page.
Task 8: Ruling: sunset fast-forward now ends 2 h after the real sunset (not 20 min) — at +20 min the Sun is only 0.02° below the hill and the camp still rendered lit — cost if wrong: 2 extra sim hours skipped.
Task 8: Ruling: mica_kept line no longer claims the freezer went off; a toast reports the lost data log only when it happens — cost if wrong: none.
Task 8: browser: planner at sunset+20 min showed 132% NOT ENOUGH (0 leaks); Enter → MICA offer; 1 → keptMica, commsOff, lightsOff, dataLost (data log removed); 4 turns with clock jumps through the night, Pip asleep, lunarNight card; stage → dawn at 2028-12-02T22:55Z.
Task 8: complete (commits b7e8b23..9cb1933, tests: npx vitest run → 274/274 pass)
Task 9: Ruling: earthPhase lives in src/world/skyMath.ts (pure, testable), and the Babylon ending flow in src/story/endingSystem.ts; the Mission Record panel reuses StoryPanel instead of a separate src/ui/missionRecord.ts — cost if wrong: file layout only.
Task 9: Ruling: liftoff dust uses a new plumeVelocities() (2–15°, 0.5–1 × 25 m/s, no drag) + DustSystem.plume() with 8–28 cm clods — burstVelocities clamps speed to 4 m/s and 1–3 cm grains are invisible from 120 m — cost if wrong: clods larger than real plume dust.
Task 9: Ruling: the merged HLS body is re-parented to hlsRoot (setParent keeps its pose) — mergeStatic bakes world space, so the ship could not rise — cost if wrong: none.
Task 9: Ruling: liftoff camera tilts up slowly (target capped 40 m above the pad) instead of chasing the ship — cost if wrong: framing only.
Task 9: Ruling: earthshine intensity = 0.04 × phase (1% of the Sun's 4; real ratio ~1e-4) — exaggerated for dark-adapted eyes; during the real camp night phase < 0.15 so it stays dim — cost if wrong: slightly brighter night than reality.
Task 9: Ruling: the storm wrapper now records storm:sheltered / storm:rescued for the Mission Record — cost if wrong: none.
Task 9: Ruling: Artemis story card follows NASA's current plan (Artemis IV, early 2028, two crew ~1 week near the south pole, nasa.gov/mission/artemis-iv) and flags the game's 11-week stay as fiction — cost if wrong: none.
Task 9: browser: full run prep → night (enough, no offer) → dawn at 2028-12-03T10:00Z → "E — send MICA's data (Earth sets in 21 h)" → dataSent → farewell at HLS → liftoff (ship rises, ~1400 plume grains) → Mission Record with all decisions. Cards verified: apod ap250403, isro LIBSResults, JAXA 20240125-1_e, NASA CLPS IM-1 article, NASA EDS image-article, nasa.gov/mission/artemis-iv.
Task 9: complete (commits 9cb1933..5ecb39f, tests: npx vitest run → 280/280 pass)
Task 10: Ruling: DONKI retry skipped — Task 2 cached 179 real events, so no empty cache to retry — cost if wrong: none.
Task 10: Ruling: ?jump=act4 places the player south of MICA (facing it); the first run started behind MICA so Q did nothing — harness/jump issue, not game logic — cost if wrong: none.
Task 10: Ruling: pressing Enter at the shelter with blockers now toasts what is missing (next to a heat leak the blocker text was hidden behind the leak prompt) — cost if wrong: none.
Task 10: build OK (npm run build; chunk-size warning pre-existing). FPS (dev server, Playwright Chromium): camp prep thermal on min 45 / median 60; sunset fast-forward min 39 / median 56; liftoff plume min 46 / median 60.
Task 10: playthrough A (?jump=act4): tow → sheltered → repair → memory → Act 5 at 2028-11-29T13:24Z → notch 117° correct → leaks 3/3 → ice → enough energy (no offer) → dawn → data sent → liftoff → record (sheltered, right notch, 3/3, kept MICA, comms on, nothing lost).
Task 10: playthrough B: caught outside → rescued to shelter, tow reset, MICA left at (-132,-509) → re-tow → memory with two wrong picks (counter-clockwise hint shown) → early Enter blocked → wrong notch (160°) → no leaks → offer → keep MICA → commsOff/lightsOff/dataLost → late dawn line → two-step comms+send → liftoff → record (rescued, different notch, 0/3, kept, comms off, one data log lost). Both runs reached the Mission Record.
Task 10: complete (commits 5ecb39f..19d5c76, tests: npx vitest run → 283/283 pass)
Final review: fresh reviewer (opus) on 2780e86..19d5c76 — With fixes; 0 Critical, 4 Important, 14 Minor.
Final: fixed Act 5 could start during the radiation storm — 'Important 1: Act 5 never starts while the radiation storm is still running' RED→GREEN, suite 287/287
Final: fixed Enter that skips the last dialogue line could also begin the night / confirm the planner (async race) — 'Important 2: an Enter that skips the last dialogue line cannot also confirm a story step' (enterAllowed, 250 ms idle) RED→GREEN, suite 287/287
Final: fixed K.5 real-story cards unreadable from the locked Mission Record — 'Important 3: the five real stories are readable from the Mission Record' (1–5 read, 0 back) RED→GREEN, suite 287/287
Final: fixed "wait for Pip" prompts while Pip is parked far away — 'Important 4: a parked, far-away Pip is called with Q' (pipComeHint in Dark Crater and heat leaks) RED→GREEN, suite 287/287
Final: minor (deferred): storm exposure only checked at onset; leaving the shelter mid-storm has no effect though HUD says "dose meter: HIGH".
Final: minor (deferred): within 30 m of the lander counts as sheltered while the dome needs 3 m — inconsistent radii.
Final: minor (deferred): storm_clear "where did we leave our sleepy friend?" reads oddly if MICA already reached camp.
Final: minor (deferred): act5_news says "the hill north of your camp" but the sunset azimuth (~135–160°) is south-east in the game's north-up frame.
Final: minor (deferred): title card / dawn toast / Houston lines hard-code "29 November", "3 December", "six hours", "three and a half days" instead of formatting from the computed night.
Final: minor (deferred): Earth-set countdown clamps at 0 h and sending still works, so MICA's "before the Earth set" line can become false.
Final: minor (deferred): MICA's ice-beacon lines queue between mica_logs and mica_mission.
Final: minor (deferred): Artemis card's "early 2028" vs the game's Sep–Dec 2028 mission is not called out as fiction.
Final: minor (deferred): with no data logs collected, the toast/record still say a data log was lost.
Final: minor (deferred): live DONKI response with only MODEL forecasts is labelled "recorded" (cache fallback not tried).
Final: minor (deferred): player is not moved into the shelter for the night; can walk off during the 12 s fast-forward.
Final: minor (deferred): thermalColor.ts / demoDirector.ts / demo.test.ts line-ending churn makes whole-file diffs.
Final: minor (deferred): docs/screens/plan4-dawn.png missing.
Final: minor (deferred): `locked` is read at frame start, so a panel opened by a story update lets the world block run once that frame.
Final: Ruling: old camera inputs stay attached during the liftoff shot — cosmetic; the player is locked and the shot lasts 10 s — cost if wrong: the mouse can nudge the cinematic camera.
Final: Ruling: live DONKI CORS not verified in a browser — curl showed Access-Control-Allow-Origin: * and the cache covers failure — cost if wrong: always cache.
Final: Ruling: plume clod size and earthshine boost stand (Task 9 rulings) — cost if wrong: stylised visuals.
Final: Ruling: night budget balance stands as planned (1–2 leaks absorbed by lights/comms off; only 0 leaks loses a log) — cost if wrong: an easier choice than intended.
Final: Ruling: walk-in dome without collider stands (Task 3) — immersion only — cost if wrong: player can walk through the wall.
Final: Ruling: card wording was verified at write time (ledger URLs) though the reviewer could not re-fetch — cost if wrong: a wording nit.
Final: Ruling: dawn wake uses base dawnMs rather than sunlight at Pip's own spot — identical on real data, outcome only depends on the notch flag — cost if wrong: Pip wakes minutes early/late.
