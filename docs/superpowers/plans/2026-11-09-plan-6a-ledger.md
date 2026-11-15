# SDD ledger — plan: docs/superpowers/plans/2026-11-09-plan-6a-tam-dung-luu-tieng-viet.md
Executor: native. Branch plan-6a-polish from plan-5-gameplay @ ed32583. Spec: design in the plan header (user-approved in chat 2026-11-09; no separate spec file — rulings provisional).
Pre-flight: T2 restore must stay silent before T3/T4 wrap texts; T3 tr() keys = English strings used by T4 tests; T1 menu text goes through tr() in T3 (menu built with tr from the start).
Task 1: Ruling: i18n core (tr/setLang/loadLang, VI table) created in Task 1 because the menu is built with tr() from the start — cost if wrong: none.
Task 1: Ruling: menu is a DOM overlay that captures keys on window (capture phase + stopImmediatePropagation) so the game never sees them; Esc opens it only when the final descent and horizon view are not active (checked before consuming Esc); physics time step set to 0 while open; music ducked; dialogue timers keep running (lines may advance while paused) — cost if wrong: a line can finish during a pause.
Task 1: browser: Esc opens; clock, O2 and Pip frozen for 3 s; L switches menu to Tiếng Việt; −/+ volume 90%↔100% remembered; Esc closes without reopening; clock runs again. Screenshot docs/screens/plan6a-pause.jpg.
Task 1: complete (commits bcb7e10..8a19eeb, tests: npx vitest run → 340/340 pass)
Task 2: Ruling: restore is checkpoint-like — MICA found but not repaired goes back to the rim (tow again); a passed storm stays passed; Act 5 restarts from its title card with the clock left at mission start (Act 5 jumps to its real night) — cost if wrong: some replay after a reload.
Task 2: Ruling: skipping the landing (Esc in orbit or in the final descent) now also sets landing:done so autosave starts; cards still need a real landing — cost if wrong: none.
Task 2: Ruling: language picker and the Continue option were added to the start screen in this task (main.ts rewritten once); start-screen strings go through tr() and get Vietnamese in Task 3 — cost if wrong: none.
Task 2: Ruling: browser checks deferred to Task 5 — the dev server was stopped by Claude Code for low memory and is not restarted without the user — cost if wrong: Task 2 untested in the browser until Task 5.
Task 2: complete (commits 8a19eeb..b68e400, tests: npx vitest run → 346/346 pass)
Task 3: Ruling: gettext-style tr(englishText, vars) with {name} placeholders; name tables (modules, samples, zones, upgrades, card tags, demo hints, vitals) are translated at the call site with tr(name) and checked by a separate test (non-literal keys); the completeness test scans src for literal tr() keys (186+) — cost if wrong: a string built outside tr() stays English (sweep found none left in UI paths).
Task 3: Ruling: labels built once (resource bars, map zone labels, notebook title) take the language at creation; they switch on the next reload/open rather than live — cost if wrong: a few static labels lag a language switch until reopened.
Task 3: TDD note: the name-table test passed on its first run because the VI entries were added in the same batch — cost if wrong: weaker evidence that test can fail.
Task 3: complete (commits b68e400..45a9d00, tests: npx vitest run → 351/351 pass)
Task 4: Ruling: the 189 lines and 32 cards were translated by a subagent (style guide: Pip mình/bạn, MICA tôi + 'Phân tích:', Houston radio procedure; facts, numbers, ids, tags, sources unchanged); repo tests check structure (ids, counts, speakers/faces/flags, non-empty, sources) — translation wording is for the user to review — cost if wrong: some phrasing to adjust.
Task 4: Ruling: language switch replaces the surface dialogue script and the card list in place (onLangChange) and re-applies the computed Act 5 lines; the orbital intro picks its language when it starts — cost if wrong: an intro already running stays in the old language.
Task 4: complete (commits 45a9d00..402e870, tests: npx vitest run → 354/354 pass)
Task 5: browser (Vietnamese first visit): language screen → 1 → start screen in Vietnamese → Esc → Act 1 in Vietnamese (dialogue, status line, vitals after fix d31f57a), autosave written; reload shows 'C — Chơi tiếp'.
Task 5: continue from an Act 2 save (2 modules, flag, relay): modules installed quietly, winch done, player at camp, clock restored to 12 Sep, no dialogue replay, lock free. Screenshot docs/screens/plan6a-continue.jpg.
Task 5: continue from a mid-Act 5 save: act5:* progress dropped, MICA awake at camp, Act 5 title card '11 tuần sau… 29 tháng 11 năm 2028' → prep.
Task 5: Esc → L → Esc mid-game switches to English: new dialogue (incl. computed Act 5 line), status line and checklist in English; an old toast and the map title stay Vietnamese until reopened (ruling Task 3).
Task 5: pause over the night-planner panel: menu opens, closes, panel still open and keys 1/2 still work; lock count unchanged.
Task 5: dev server started for the checks and stopped afterwards (memory).
Task 5: complete (commits d31f57a..2033436, tests: npx vitest run → 354/354 pass)
Final review: opus reviewer, 'With fixes' — 0 Critical, 8 Important; re-graded up from Minor: unknown-id save → black screen, R shown without a save (progress loss), physics not paused.
Final: fixed stuck held keys / Esc repeat — menuKeyAction (keyup passes, repeat swallowed) — RED→GREEN, suite 360/360.
Final: fixed dialogue running during pause — PauseClock (gamePauseClock) drives the dialogue box timers — RED→GREEN, suite 360/360.
Final: fixed continue replays (MICA wake, ice beacon radio, shadow quiz, Houston welcome) and missing flag/antenna/cargo — restoreSteps + silent fastForwardWake, darkCrater micaToldUs, science shadowDone/antennaDone, flag dress, cargo restore — RED→GREEN, suite 360/360; browser: only the Act 5 Houston line plays, flag up, marker gone, cargo visible.
Final: fixed lost data log saved during Act 5 — shouldAutosave off between act5:started and ending:dataSent — RED→GREEN, suite 360/360.
Final: fixed start screen wiping the save — no clearSave on the start screen (new game's first autosave replaces it); restore wrapped in try/catch — (no unit test: wiring) suite 360/360.
Final: fixed unknown ids in a save — prepareRestore filters ids — RED→GREEN, suite 360/360.
Final: fixed R without a save — menu shows/accepts R only when loadSave() returns a save — (wiring) suite 360/360.
Final: fixed physics during pause — scene.physicsEnabled toggled (Havok ignores time step 0) — (wiring) suite 360/360.
Final: fixed remaining English strings (restore MICA's memory, Aligning…, Source:, thermal feed label, Sun ≈12°/day, N, DONKI date) + literal-scan test — RED→GREEN, suite 360/360.
Final: minor (deferred): language switch while the shadow quiz is queued can lose the computed answer; Mission Record real stories keep the starting language; nested tr() in ending.ts; plan text vs prepareRestore (always drops Act 5 progress); whitespace churn in 5 files.
