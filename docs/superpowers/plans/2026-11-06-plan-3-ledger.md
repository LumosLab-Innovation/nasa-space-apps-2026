# SDD ledger — plan: docs/superpowers/plans/2026-11-06-plan-3-hanh-trinh.md
Spec: docs/superpowers/specs/2026-11-06-hanh-trinh-va-model-design.md (delta on docs/2026-11-06-pip-mica-thiet-ke-game.md)
Setup: Ruling: branch plan-3-journey stacked on plan-2-models-dust (user chose "keep as-is" for Plan 2) — cost: rebase later.
Pre-flight:
- T1 planMission → T3 layout test window W: consistent.
- T2 lighting → T3/T5/T10: consistent (SunlightCache used in T5).
- T3 zones (ZoneId, FLAG_SPOT, RELAY_SPOT, ICE_SPOT, BOULDER, WINCH_ANCHOR) → T4/T7/T8/T9/T10/T11: consistent.
- T5 Upg {heater,fastCharge,batteryX} ⊂ T6 Upgrades: T5 defines a structural subset; T6 Upgrades satisfies it. OK.
- T6 eds uses pipCoat (Plan 2 DustCoat in surfaceScene) — must be reachable from the EDS prompt: expose via SurfaceWorld. Noted.
- T13 demo depends on T7 winch + Mica repair: consistent.
Task 1: Horizons 2028-01-01..2029-01-01 hourly: Sun el −2.04..2.05°, Earth −7.53..6.24°. planMission → start 2028-09-10T08:00Z, minSunEl 1.58° over 72 h, earthSet 2028-09-14T00:00Z, sunSet 2028-12-23T16:00Z, dawn = end of data (2029-01-01).
Task 1: Ruling: added scripts/print-mission.ts (run via npx vite-node, fetched transiently, not a dependency) to report the window — cost: none.
Task 1: Note for Plan 4: the real sunset after the window is 3+ months later (polar summer); "Bóng Dài" will need a long time-skip or terrain-shadow framing.
Task 1: complete (commits 67ace23..f959f57, tests: npx vitest run →    Duration  56.77s (import 93%, transform 4%, tests 2%, worker 1%))
Task 2: Note: wall fixture used float x-bounds that drifted to [102,108]; switched to integer columns 200..205 (test fixture fix, code unchanged). Added sunlitFraction test (plan listed the function, not a test).
Task 2: complete (commits f959f57..20ee93b, tests: npx vitest run →    Duration  60.83s (import 93%, transform 4%, tests 2%))
Task 3: scout (20 m grid, 72×5° horizon bins, 15 s) → base (−60,−300) frac 1.0; landing (80,−240) frac 1.0, 152 m; Sunny Hill site (200,−240) frac 1.0, crate (209.6,−263.1) climb 19.3°; boulder top (−177,−270) → bottom (−200,−280); fresh crater (0,−120) frac 0.84; relay (−40,−460) Earth visible all window; ice (−180,−500) never lit in 2028; MICA (−162,−568) frac 0.28. layout.test.ts 9/9 on real data, no constraint relaxed.
Task 3: Ruling: added src/world/terrainQuery.ts (maxSlopeDeg, segmentMaxSlopeDeg) and tests/helpers/realWorld.ts — the plan's slope constraints needed shared helpers (T7 reuses slope logic) — cost: none.
Task 3: Ruling: scout first produced a cluster (ice 80 m from camp, hill crate on the ice); added 130 m stop spacing and 110 m hill/boulder spacing for a real journey — cost: walks are longer (all stops ≤ 285 m from camp).
Task 3: Ruling: TRACKS_PATH generated deterministically in zones.ts (18 segments, wobble growing toward MICA, 4-point spin loop at the midpoint); Act 1 spots and REPAIR_SPOT now offsets from landing/base in zones.ts (re-exported from their old modules); iceRegolith excluded from ScienceSystem until Task 11 — cost: none.
Task 3: Visual: plan3-layout-camp.png (camp sunlit, long shadows), plan3-layout-mica-rim.png (MICA on the light/shadow line, crater black). 192/192 tests.
Task 3: complete (commits 20ee93b..8e5b9ca, tests: npx vitest run →              at least ~1.63s faster with isolate: false — reuses workers across files instead of one per file)
Task 4: Ruling: fixed Plan 1 line tracksFound 'I roll on treads' → 'I have four wheels, not six' (spec v3 §4.1 says this line must change) — cost: none. Stop radii come from ZONES; cardIds left for Tasks 7–12.
Task 4: complete (commits 8e5b9ca..c98d400, tests: npx vitest run →              at least ~2.98s faster with isolate: false — reuses workers across files instead of one per file)
Task 5: Ruling: atCamp (O2 refill) = within 30 m of the HLS (lander has air) OR inside camp once the habitat is installed — the plan said only "atCamp"; early game has no habitat — cost: players can refill at the lander from minute one.
Task 5: Ruling: needsRescue(r, pipInSun=false): an empty Pip in sunlight just recharges, no rescue (plan wording "pip = 0 khi không có nắng"); panelFactor(yaw, sunAz) pure + test (left/right/back panels, open front) — cost: none.
Task 5: Added Astronaut.teleport(x,z) and Pip.moving. Upgrades are a stub getter until Task 6.
Task 5: Browser: O2→0 away from the lander → fade, player at camp (−56,−296), O2 100, flags kept, rescue_o2 line. Noted: Pip only charges ~6% when its open front faces the Sun (realistic, possible polish: Pip turns its back to the Sun when idle).
Task 5: complete (commits c98d400..7fc2e59, tests: npx vitest run →              at least ~2.20s faster with isolate: false — reuses workers across files instead of one per file)
Task 6: Ruling: upgrade lines play via the moduleInstalled bus (after moduleDone) with a toast from UPGRADE_TEXT; ScienceSystem.lidarRangeM set each frame from upgradesFor; EDS prompt only when Pip's coat ≥ 2% (no prompt for a clean Pip); MicaRepairSystem.burstAt(p) exposed for the Pip clean — cost: none.
Task 6: Browser: habitat install path runs (stop flags set, LIDAR 60 without relay). EDS clean not exercised in-browser (Pip coat ~0 at start); logic covered by upgrades test + code read.
Task 6: complete (commits 7fc2e59..190591a, tests: npx vitest run →              at least ~2.41s faster with isolate: false — reuses workers across files instead of one per file)
Task 7: Ruling: full slip at 18° (plan 20°) — the real Sunny Hill climb peaks at 19.3°, so 20° could never trigger; VIPER is rated ~15° — cost: none.
Task 7: Ruling: loaded rover slips 6° earlier (wheelSlip(slope, loaded)) — in-browser test showed Pip reaching the top unstuck because the slopes on its actual path stayed < 18°; with the crate it now sticks reliably (stuck at (204.9,−257.3)) — cost: carried crates other than the tower ignore slip (only WinchSystem checks).
Task 7: Ruling: WinchSystem.update runs after ModuleSystem/MicaRepairSystem (they reset pip.contextCommand each frame); winch prompt has priority. Pip.speedFactor/spinning hooks added; ModuleSystem.carryingId getter. spiritStuck card source: https://www.jpl.nasa.gov/news/nasas-spirit-rover-completes-mission-on-mars/ (verified via WebSearch: stuck at Troy April 2009, last contact 22 Mar 2010).
Task 7: Ruling: cards.test.ts "exactly 10 cards" → "keeps the 10 slice cards, ids unique" (Plan 3 adds cards) — cost: none.
Task 7: Browser: lift → stuck → (4 s later still stuck) → E anchor (rope 11.2 m) → Q reeling → done; Pip back to follow, crate still carried, card unlocked. Screenshot plan3-winch-reeling.png.
Task 7: complete (commits 190591a..59bc467, tests: npx vitest run →              at least ~4.08s faster with isolate: false — reuses workers across files instead of one per file)
Task 8: Ruling: the boulder scan hooks pip.onCommand('scan') (ScienceSystem consumes the R key and calls pip.command('scan')), solved within 15 m of the trail after boulder_seen — cost: none. Trail stamp length 1.6 m (plan 1.0) so 1.2 m spacing overlaps into a groove.
Task 8: boulderTracks source verified: https://lroc.im-ldi.com/posts/509 (LROC: Pikel'ner S boulders 7–9 m, trails "like a marble rolled down a pile of sand"). Card avoids unverified age claims.
Task 8: Note: under a 1.58° Sun flat ground is cold in the thermal view (cos≈0.028 → ≈ −114 °C); only Sun-facing walls/rocks read hot — physically right; crater_thermal line says "sunlit rocks". Boulder field is in shadow (lamp-lit), allowed by the plan.
Task 8: complete (commits 59bc467..0f688b3, tests: npx vitest run →              at least ~3.46s faster with isolate: false — reuses workers across files instead of one per file)
Task 9: apolloFlags source verified: https://sservi.nasa.gov/articles/apollo-moon-flags-still-standing/ (LROC shadows: 12/16/17 standing; Apollo 11 knocked over per Aldrin; fading not certain → card says "probably badly faded").
Task 9: Ruling: orange ring marks FLAG_SPOT until planted, and stop_landing gained a third line pointing at it (the plan had no way for the player to find the spot) — cost: none.
Task 9: Browser: E at spot → flag rises (1.5 s ease-out), flag:planted, card unlocked; screenshot plan3-flag.png.
Task 9: complete (commits 0f688b3..9ac0447, tests: npx vitest run →              at least ~2.45s faster with isolate: false — reuses workers across files instead of one per file)
Task 10: Ruling: new PipCommand 'align' (arm 'reach' pose) drives the relay's align step via Q/contextCommand; Earth visibility uses the live clock + JPL Earth az/el through earthVisible at RELAY_SPOT — cost: none.
Task 10: earthVisibility source verified: https://www.nasa.gov/goddard/esc/lcrns/ (LCRNS; Earth visible ~half of each month from the south pole, low on the horizon).
Task 10: Browser: E deploy → Q align → relay:aligned, card, LIDAR 150, M opens the hillshade map with discovered stops; screenshot plan3-map.png.
Task 10: complete (commits 9ac0447..9133365, tests: npx vitest run →              at least ~4.42s faster with isolate: false — reuses workers across files instead of one per file)
Task 11: Ruling: mica_ice is triggered by the Dark Crater system watching flag act4:micaAwake (not inside MicaRepairSystem) — one owner for the crater flow — cost: none. dark_enter vs dark_noHeater chosen by the heater upgrade on every entry.
Task 11: lcrossIce source verified: https://nssdc.gsfc.nasa.gov/planetary/ice/ice_moon.html (LCROSS 9 Oct 2009, Cabeus, ~6% water, nearly pure ice crystals in spots).
Task 11: Browser: entering the crater auto-lights Pip's lamp, suit heat 97.6→89.9 in ~5 s without heater, E samples the ice (iceRegolith, act4:ice, card). Screenshot plan3-dark-crater.png.
Task 11: complete (commits 9133365..6dc0854, tests: npx vitest run →              at least ~4.35s faster with isolate: false — reuses workers across files instead of one per file)
Task 12: viperPanels source verified: https://www.nasa.gov/podcasts/houston-we-have-a-podcast/viper/ (arrays on the sides because the Sun sits low). NASA gives ~10° max Sun at VIPER's area vs ~2° at this near-pole site — card states both; plan text's "1–1.5°" corrected to the real data.
Task 12: Ruling: longShadows card (Plan 1) said "never more than about 1.5°"; real 2028 data peaks at 2.05° here → updated the body — cost: none.
Task 12: complete (commits 6dc0854..e0a4485, tests: npx vitest run →              at least ~3.46s faster with isolate: false — reuses workers across files instead of one per file)
Task 13: Ruling: added demo event 'metPip' (fires on flag dialogue:meetPip:done) for the meetPip→jump transition the plan left unnamed; demo marks stop:landing at start to skip the landing intro (~15 s) — cost: judges miss the flag hint line.
Task 13: Ruling: demo hooks added: ModuleSystem.forceCarry/forceInstall, MicaRepairSystem.fastForwardWake, Pip.setPose made public, Hud.setHint; controller in src/demo/demoController.ts — cost: debug-ish public methods.
Task 13: Timed run (scripted teleports standing in for walking): metPip 43 s (before the skip fix), jump 47, stuck 50, winch done 81, tracks seen ~91, MICA found ~100, awake ~170, end ~190 s ≈ 3:10 (target ≤ 3:30). Screenshot plan3-demo-end.png.
Task 13: complete (commits e0a4485..842e066, tests: npx vitest run →    Duration  54.54s (import 98%, transform 1%, tests 1%))
Task 14: 225/225 tests, build OK. FPS [min, median]: camp with 4 modules [39, 47]; Sunny Hill while reeling [46, 50]; Dark Crater [38, 44] — all ≥ 30.
Task 14: Playthrough coverage (scripted, teleports for walking): flag (T9), Act 1 unchanged, all 8 stops discovered (T4/T11), winch + tower (T7), boulder (T8), thermal beads (T8), relay + map (T10), tracks → MICA found (flag after identify dialogue) → Q tow (needs ≤3.2 m) → MICA at camp (−50,−284), stage cleaning; repair steps unchanged since Plan 1; Dark Crater + ice (T11); deliberate O2 rescue (T5). No blocking bugs found; two script mistakes (waiting on dialogue.busy gaps, standing 3.9 m from MICA) were test-side.
Task 14: complete (commits 842e066..a96e5ba, tests: npx vitest run →    Duration  179.98s (import 98%, transform 1%, tests 1%))
Final review: fresh reviewer (opus) on 67ace23..a96e5ba — verdict "with fixes": 1 Critical, 7 Important; re-graded by player effect, all kept.
Final: fixed Critical 1 (stuck Pip freed by Q wait/come or MicaSystem.found) — WinchSystem re-asserts pip.mode='task' each frame and pins Pip at the stuck spot; resolveQ ignores wait/come in task mode; tests "the winch holds Pip…", "Q does not toggle wait/come while Pip is busy" RED→GREEN, suite 234/234. Browser: Q×2 + walk 80 m → still stuck at (206.8,−257.9).
Final: fixed Important 2 (anchored winch prompt/Q map-wide) — winchPromptActive (≤15 m of anchor or Pip); test "prompt is active only within 15 m…" RED→GREEN, suite 234/234. Browser: far → contextCommand null.
Final: fixed Important 3 (shared 'pull' for winch and tow) — each handler acts only if it offered its Q this frame (pullOffered); covered by the 15 m gate test + code read, suite 234/234.
Final: fixed Important 4 (rescue mid-winch/tow) — SurvivalSystem.onRescue hooks: Winch.reset + crate dropped back (ModuleSystem.dropCarry), tow released where MICA is; test "reset returns a stuck or reeling winch to idle…" RED→GREEN, suite 234/234. Browser: rescue while anchored → winch idle, crate dropped, Pip follow.
Final: fixed Important 5 (tracks crossing the Dark Crater edge) — darkCrater radius 50→30 (floor), entry line only on first entry or heater change, lamp turned off on exit if the crater turned it on; test "every track point stays at least 5 m outside the crater edge" RED→GREEN, suite 234/234 (layout tests still pass).
Final: fixed Important 6 (contradictory ice dialogue) — iceLines() picks ice_found / ice_found_alone / mica_ice / mica_ice_done; test RED→GREEN, suite 234/234.
Final: fixed Important 7 (relay when Earth is down; Earth window shorter than a playthrough) — persistent relayPrompt explanation without consuming E, Earth check cached per sim hour; TIME_SCALE 60→20 so the real 88 h Earth window ≈ 4.4 h of play; tests "relay prompt explains…", "the real Earth window covers at least 3 hours of real play" RED→GREEN, suite 234/234.
Final: Ruling: TIME_SCALE 60→20 (Plan 3 Global Constraint said 60) — the review showed Earth would set ~88 real minutes into play; spec §10.2 requires Earth up through Acts 1–4 — cost: the Sun circles 3× slower (shadows still visibly turn).
Final: fixed Important 8 (demo N during winch freezes Pip) — WinchSystem.forceFinish when entering the tracks beat; test "finishNow completes the winch from any state" RED→GREEN, suite 234/234.
Final: minor (deferred): E is consumed silently 2.5–6 m from the anchor and the anchor spot has no marker before planting.
Final: minor (deferred): demo 'jumped' can be set during meetPip, skipping the jump beat instantly.
Final: minor (deferred): stop_earthPeak says "Up here we can always talk to Houston" — false after Earth sets.
Final: minor (deferred): survival computes playerInSun every frame but never uses it.
Final: minor (deferred): input and systems keep running during the 1.5 s rescue fade.
Final: minor (deferred): longShadows card says "Right at the pole … about 2°" — 2.05° is this site's value; at the exact pole the max is ~1.54°.
Final: minor (deferred): viperPanels "about 10° at VIPER's landing area" (NASA ops page says "may reach only as high as 10 degrees"; reviewer estimates 6–7° geometrically) — worth a re-check.
Final: Ruling (declined-to-judge): ice can be taken without the heater in a ~62 s dash — plan's rates; a quick dash is a fair player choice — cost: heater upgrade feels optional.
Final: Ruling (declined-to-judge): a gentler route up Sunny Hill may avoid getting stuck — spec allows "chọn đường thoải" — cost: some players skip the winch.
Final: Ruling (declined-to-judge): dropLoad has no input; rescue now uses the drop path — cost: no voluntary drop.
Final: Ruling (declined-to-judge): Pip battery 0% only matters via rescue in shadow — spec silent — cost: low battery has little bite.
