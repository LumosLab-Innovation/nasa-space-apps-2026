# Notebook Photo Album Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the Tab Science Notebook into a polaroid-grid photo album with paper journal pages (real NASA photo + the player's auto-taken polaroid + Pip note), and replace the "New discovery" text toast with a shutter/polaroid fly-in.

**Architecture:** Content (NASA photo metadata + Pip notes) lives in the card JSON. A `photoStore` persists player photos in its own localStorage key. A pure `discoveryQueue` decides when to announce and when to capture; a thin Babylon adapter takes a scene-only screenshot; a DOM fly-in shows the polaroid. The notebook becomes an HTML/CSS overlay (pattern: `src/ui/missionGuide.ts`) driven by a pure `notebookModel`. Tasks 1–4 own disjoint files and run in parallel; Task 5 wires them; Task 6 verifies in the browser.

**Tech Stack:** TypeScript, Babylon.js 9.34, DOM/CSS overlay, Vitest (node environment, no jsdom), Python 3 + Pillow for the one-off image script.

**Spec:** `docs/superpowers/specs/2026-11-15-notebook-photo-album-design.md` (approved 2026-11-15). Approved content: `docs/superpowers/research/2026-11-15-notebook-photos.json`, `docs/superpowers/research/2026-11-15-pip-notes.json`. Approved mockup: `.superpowers/brainstorm/2597-1794712916/content/album-combined-v2.html`.

## Global Constraints

- The checkout is shared with other live sessions (a Codex session and Claude session `nasa-hackathon-84`). Edit shared files only with small in-place replacements; never rewrite whole existing files; never revert changes you did not make. Do not commit (user has not authorised commits).
- Tests: `npm test -- --maxWorkers=1 <files>`; the full suite takes ~20 min.
- Every new `tr('…')` string needs a Vietnamese entry in `src/i18n/vi.ts` (enforced by `tests/i18n.test.ts`); append entries, do not reorder.
- Card ids, tags, bodies and sources are unchanged. `cards.en.json` / `cards.vi.json` keep the same ids, order, 2-space JSON formatting and LF line endings.
- NASA images only; credit line shown wherever the image is shown. MICA (`micaFiction`) has `photo: null`.
- Player photo: 480×360 JPEG data URL, scene only (no GUI layer, no DOM). Storage key `pipmica.photos`, shape `{ v: 1, photos: { [cardId]: { jpeg, clockMs } }, seen: string[], pending: string[] }`.
- Album order: unlocked cards in `state.unlockedCards` insertion order (= unlock order), then locked "?" tiles. Locked tiles never reveal titles.
- NASA photo frame: native aspect ratio, `object-fit: contain`, never stretched or cropped.
- Respect `reducedCameraMotion()` (`src/core/accessibility.ts`): no flash, fly-in becomes a fade.
- Day label: `Day N · HH:MM` where N = floor((clockMs − mission.start) / 86 400 000) + 1, HH:MM in UTC (Vietnamese: `Ngày N · HH:MM`).

## Review Focus

1. Continue / restore must not announce or re-capture every already-unlocked card (`discoveryQueue.sync`, Task 3 test).
2. localStorage full, disabled or corrupt must never throw into the game loop (Task 2 tests).
3. Keys while the notebook is open (WASD, E, Q, Space, arrows) must not reach the game; Tab/Esc must still close it (Task 4 `keyAction` tests + Task 6 browser check).
4. A card unlocked while a blocking view is open (horizon view, memory puzzle, night planner, landing) gets its fly-in immediately and its photo only when the view is clear (Task 3 test).
5. Switching language while the notebook is closed or open shows the right language next time it renders, including captions and Pip notes (Task 4 test on `albumView` with VI cards).

---

### Task 1: Card content and NASA images

**Files:**
- Create: `scripts/fetch-notebook-photos.py`, `public/textures/notebook/*.webp`, `public/textures/notebook/SOURCES.md`, `tests/notebookContent.test.ts`
- Modify: `src/content/cards.en.json`, `src/content/cards.vi.json`, `src/content/content.ts:8`, `public/sources.html`, `DESIGN.md` (Data / credits section only)

**Interfaces:**
- Produces in `src/content/content.ts`:
  - `export interface CardPhoto { file: string; thumb: string; caption: string; credit: string; nasaId: string; url: string; width: number; height: number }` (`file`/`thumb` relative to `public/`, e.g. `textures/notebook/apollo11Site.webp`; `url` = NASA page URL; width/height of the full WebP)
  - `CardText` gains `pipNote: string; photo: CardPhoto | null`.

- [ ] **Step 1: Write failing test** `tests/notebookContent.test.ts`: for `cardsFor('en')` and `cardsFor('vi')` — 34 cards; every `pipNote` non-empty; `micaFiction.photo === null`; `apollo11Site.photo.nasaId === 'as11-40-5927'`; `tracksLast.photo.nasaId === 'as11-40-5878'`; exactly 23 non-null photos; for each photo `existsSync('public/' + file)` and `existsSync('public/' + thumb)`, `credit`, `caption` non-empty, `width > 0 && height > 0`, `Math.max(width, height) <= 1024`; EN and VI have identical `photo` fields except `caption`; total bytes of `public/textures/notebook` ≤ 4 000 000.
- [ ] **Step 2: Run** `npm test -- --maxWorkers=1 tests/notebookContent.test.ts` → FAIL.
- [ ] **Step 3: Write `scripts/fetch-notebook-photos.py`** (run with `python -I scripts/fetch-notebook-photos.py`): reads the two research JSON files; downloads each `downloadUrl` (spaces → `%20`); with Pillow saves `<id>.webp` (long side ≤ 1024, quality 80) and `<id>.thumb.webp` (long side 256, quality 75); writes `pipNote` (en/vi) and `photo` (en caption = `captionEn`, vi = `captionVi`; credit, nasaId, url = `pageUrl`, width/height of the saved WebP) into both card JSON files with `json.dump(..., ensure_ascii=False, indent=2)` + trailing newline, LF. Writes `public/textures/notebook/SOURCES.md` (table: card id, NASA id, page URL, credit, licence "NASA media guidelines"). Idempotent.
- [ ] **Step 4: Run the script**, then add the 23 credits to `public/sources.html` (follow its existing list style) and one paragraph to DESIGN.md's data/credits area: notebook photos are NASA images listed in `public/textures/notebook/SOURCES.md`, used under NASA media guidelines; 11 cards without a verified NASA image show the player's in-game photo.
- [ ] **Step 5: Run** the new test + `tests/i18n.test.ts` → PASS. `git diff --stat -- src/content` shows only the two JSON files and `content.ts`.

### Task 2: Photo store

**Files:**
- Create: `src/save/photoStore.ts`, `tests/photoStore.test.ts`

**Interfaces:**
- Produces:
  - `export const PHOTO_KEY = 'pipmica.photos'`
  - `export interface StoredPhoto { jpeg: string; clockMs: number }`
  - `export interface PhotoKV { getItem(k: string): string | null; setItem(k: string, v: string): void; removeItem(k: string): void }`
  - `export interface PhotoStore { get(id: string): StoredPhoto | null; put(id: string, p: StoredPhoto): void; isSeen(id: string): boolean; markSeen(id: string): void; pending(): string[]; addPending(id: string): void; removePending(id: string): void; clear(): void }`
  - `export function createPhotoStore(storage: PhotoKV | null | undefined, persist: boolean): PhotoStore`

- [ ] **Step 1: Failing tests** with an in-memory KV fake: round-trip across two store instances on the same KV (photos, seen, pending survive); `persist=false` never calls `setItem`; `setItem` throwing (quota) → no throw, data still readable from the same instance; corrupt JSON / wrong `v` → empty store, no throw; `storage = null` works in memory; `clear()` empties memory and calls `removeItem(PHOTO_KEY)`; `addPending` is idempotent; `pending()` preserves insertion order.
- [ ] **Step 2: Run** → FAIL. **Step 3:** implement (load once in the factory; write the whole object after each mutation when `persist`). **Step 4: Run** → PASS.

### Task 3: Discovery queue, capture and fly-in

**Files:**
- Create: `src/ui/discoveryCamera.ts`, `src/ui/discoveryFlyIn.ts`, `src/ui/discoveryFlyIn.css`, `tests/discoveryCamera.test.ts`

**Interfaces:**
- Consumes: `PhotoStore` (Task 2).
- Produces:
  - `export interface DiscoveryStep { announce: string[]; capture: string[] }`
  - `export function createDiscoveryQueue(store: PhotoStore): { sync(unlocked: Iterable<string>): void; update(unlocked: ReadonlySet<string>, viewClear: boolean): DiscoveryStep }` — `sync` marks ids as known without announcing (used at creation and after restore). `update`: each newly seen id is returned in `announce` once; if `store.get(id)` is null it is `store.addPending(id)`. When `viewClear` and `store.pending()` is non-empty, `capture` = all pending ids (the caller takes ONE screenshot for them). `capture` is empty while `!viewClear`. The queue never returns an id in `capture` twice unless the caller failed to `store.put` it.
  - `export function captureScene(scene: Scene, camera: Camera): Promise<string>` — `CreateScreenshotUsingRenderTargetAsync(scene.getEngine(), camera, { width: 480, height: 360 }, 'image/jpeg', …, quality 0.75)`; rejects are caught by the caller.
  - `export function createDiscoveryFlyIn(): { show(id: string, title: string, photo: string | null): void; develop(id: string, jpeg: string): void; dispose(): void }` — DOM polaroid bottom-right, white flash (skipped when `reducedCameraMotion()`), grey "developing" picture until `develop`, auto-hide after ~2.5 s; queued shows play one after another.
- [ ] **Step 1: Failing tests (queue only):** sync'ed ids never announce; a new id announces once and becomes pending; while `viewClear=false` capture stays empty for 100 updates, then one `viewClear=true` update returns all pending ids together; after `store.put` + `removePending` nothing is captured again; an id with an existing stored photo announces but is not pending (Act 5 rollback); `sync` after restore with 10 ids announces nothing.
- [ ] **Step 2: Run** → FAIL. **Step 3:** implement all three exports (fly-in and capture are verified in Task 6). **Step 4: Run** → PASS.

### Task 4: Notebook album overlay

**Files:**
- Create: `src/ui/notebookModel.ts`, `src/ui/notebook.css`, `public/fonts/PatrickHand-Regular.ttf`, `public/fonts/OFL-PatrickHand.txt`, `tests/notebookModel.test.ts`
- Modify: `src/ui/notebook.ts` (body rewritten; this file is owned by this task), `src/i18n/vi.ts` (append keys)

**Interfaces:**
- Consumes: `CardText`/`CardPhoto` (Task 1 — until Task 1 lands, code against the interface above), `PhotoStore` (Task 2).
- Produces:
  - `notebookModel.ts`: `export function albumView(cards: CardText[], unlockedInOrder: Iterable<string>): { pages: CardText[]; locked: number }`; `export type NotebookKey = 'ArrowLeft' | 'ArrowRight' | 'Escape' | 'Tab' | 'Enter'`; `export function keyAction(mode: 'grid' | 'page' | 'credits', key: string, index: number, count: number): { mode: 'grid' | 'page' | 'credits' | 'closed'; index: number; consumed: boolean }`; `export function dayLabel(clockMs: number, missionStartMs: number, lang: 'en' | 'vi'): string`.
  - `notebook.ts`: `export function createNotebook(opts: { state: GameState; cards: () => CardText[]; store: PhotoStore; missionStartMs: number }): { toggle(): void; readonly open: boolean; refresh(): void; dispose(): void }` (`cards` is a getter so language switches apply on next render).
- [ ] **Step 1: Failing tests** `tests/notebookModel.test.ts`: `albumView` orders pages by the iterable's order, skips unknown ids, `locked = 34 − pages.length`; `keyAction`: grid+Tab → closed, grid+Escape → closed, page+Escape/Tab → grid, page+ArrowRight at last index stays, wraps never, page+ArrowLeft at 0 stays, any other key in page/grid → `consumed: true` with mode unchanged (so the overlay swallows it), credits+Escape → grid; `dayLabel(start + 26.5 h, start, 'en') === 'Day 2 · ' + UTC HH:MM`, `'vi'` → `'Ngày 2 · …'`; `albumView` with `cardsFor('vi')` returns Vietnamese titles.
- [ ] **Step 2: Run** → FAIL. **Step 3:** implement `notebookModel.ts`; rewrite `notebook.ts` as a `document.body` overlay following `missionGuide.ts` (capture-phase `keydown` listener using `keyAction`, `preventDefault` + `stopImmediatePropagation` for consumed keys, focus restore to `#game` on close): grid header `tr('ASTRONAUT NOTEBOOK')` + existing counts string; polaroid tiles (thumb `<img loading="lazy">`, or the player's photo when `photo` is null, or a grey frame), "?" tiles, "new" dot from `store.isSeen`; page spread per the mockup (taped NASA photo `object-fit: contain` with caption + credit + NASA id, player polaroid with `dayLabel`, stamp from existing `TAG_TEXT`/`TAG_COLOR`, title, body, Pip note in Patrick Hand, source link `target=_blank rel=noopener`, `Page i / n`, on-screen ◀ ▶); opening a page calls `store.markSeen`; a "Photo and data sources" credits page holds the existing four credit lines (keep their `tr` keys) plus each shown photo credit. Download Patrick Hand (OFL, Vietnamese subset) from the google/fonts GitHub repo into `public/fonts/`, `@font-face` in `notebook.css`. Keep `TAG_TEXT` exported.
- [ ] **Step 4: Run** model tests + `tests/i18n.test.ts` → PASS; `npx tsc --noEmit` may fail only at the `surfaceScene.ts` call site (fixed in Task 5).

### Task 5: Wiring

**Files:**
- Modify: `src/scenes/surfaceScene.ts` (near `createNotebook` ~L212, the Tab toggle ~L532, the discovery stinger ~L615, `restore` ~L637), `src/ui/hud.ts:124`, `src/scenes/missionStartup.ts` (New Game branch ~L114), `src/audio/musicEngine.ts` (add one-shot), create `src/audio/shutterSound.ts`, `tests/shutterSound.test.ts`

**Interfaces:**
- Consumes: everything above. `Music.shutter?(): void` added next to `touchdownImpact` (same guard pattern), samples from `export function shutterSamples(sampleRate: number): Float32Array` (~0.12 s two-click noise burst, peak ≤ 0.2).

- [ ] **Step 1: Failing test** `tests/shutterSound.test.ts`: length ≈ 0.12 × sampleRate, all finite, max |v| ≤ 0.2, non-silent. **Step 2:** run → FAIL. **Step 3:** implement and wire:
  - `surfaceScene.ts`: `const photos = createPhotoStore(safeStorage(), !!opts.autosave && !opts.demo)`; `createNotebook({ state, cards: () => cardList, store: photos, missionStartMs: mission.start })`; `const discoveries = createDiscoveryQueue(photos); discoveries.sync(state.unlockedCards)`; in `restore`, after cards are applied: `discoveries.sync(state.unlockedCards)`; each frame (not during `dormant`): `viewClear = !dialogue.busy && !panel.open && !notebook.open && !map.open && !pauseMenu.isOpen && !guide.open && !descent?.active && !(horizon?.active) && scene.activeCamera === player.camera`; for `announce` ids → `flyIn.show(id, title, photos.get(id)?.jpeg ?? null)` and `music?.shutter?.()`; for a non-empty `capture` → one `captureScene(scene, player.camera)`, then for each id `photos.put(id, { jpeg, clockMs: clock.nowMs })`, `photos.removePending(id)`, `flyIn.develop(id, jpeg)`; guard so only one capture is in flight; dispose notebook and fly-in on scene dispose.
  - `hud.ts` `toast`: return early when `text` equals `tr('New discovery in your Science Notebook (Tab)')` or `tr('New discoveries in your Science Notebook (Tab)')`.
  - `missionStartup.ts`: when `choice === 'auto' || choice === 'fly'` (a New Game), call `createPhotoStore(safeStorage(), true).clear()` before preparing the surface.
- [ ] **Step 4:** run new tests + `tests/i18n.test.ts` + `npx tsc --noEmit` → PASS / clean.

### Task 6: Browser verification and full suite

- [ ] **Step 1:** `npm run dev`; Chrome 1440×900, English then Vietnamese: New Game (Autopilot) → after touchdown the landing cards fly in once, each photo develops with no HUD/dialogue in it; press Tab → grid shows unlocked polaroids first then "?"; open Tranquility Base → Eagle photo square, unstretched, caption/credit visible, player polaroid with `Day 1 · HH:MM`; ←/→/Esc/Tab behave; WASD/E while open do not move or interact; credits page lists photo credits. Reload → Continue keeps photos and no re-announce. New Game clears photos. Save screenshots to `docs/screens/notebook-album/`.
- [ ] **Step 2:** `npm test -- --maxWorkers=1` (full) and `npm run build` → record results; failures in files this plan did not touch are reported, not fixed.

## Addendum (user play-test, 2026-11-15)

### Task 7: Image preloading in the notebook

**Files:** Modify `src/ui/notebook.ts`, `src/ui/notebook.css`; create `src/ui/imagePreload.ts`, `tests/imagePreload.test.ts`.

**Interfaces:** `export function createImagePreloader(load: (url: string) => Promise<void>, maxConcurrent = 3): { want(urls: string[]): void; has(url: string): boolean }` — de-duplicates, keeps FIFO order, at most `maxConcurrent` in flight, failures are forgotten (may be retried by a later `want`). The DOM loader passed in production uses `new Image()` + `img.decode()`. Notebook exposes `preload(): void` (wants thumbs of all unlocked cards) and calls `want` for prev/next full images when a page opens. Tiles/pages render `<img decoding="async">` (no `loading="lazy"` on thumbs) inside a placeholder box with `aspect-ratio: width/height`, fading in on load.

- [ ] Failing tests: duplicates loaded once; never more than 3 concurrent; order preserved; a rejected load does not block the queue and can be wanted again; `has` true after success.
- [ ] Implement; run `tests/imagePreload.test.ts tests/notebookModel.test.ts tests/i18n.test.ts` and `npx tsc --noEmit`.

### Task 8: One photo moment per batch + Eagle photo from the heritage shot

**Files:** Modify `src/ui/discoveryFlyIn.ts`, `src/ui/discoveryFlyIn.css`, `src/ui/discoveryCamera.ts`, `src/scenes/surfaceScene.ts` (expose `photos` on `SurfaceWorld`, call `notebook.preload()` after start and on announce), `src/scenes/landingScene.ts` (heritage capture); tests `tests/discoveryCamera.test.ts`.

**Interfaces:** `createDiscoveryQueue` gains batching: `update` returns `announce` grouped so that ids announced within `BATCH_WINDOW_MS = 1500` (real time, passed in as `nowMs`) are delivered as ONE batch: `update(unlocked, viewClear, nowMs): { announce: string[][]; capture: string[] }` (each inner array is one photo moment). `createDiscoveryFlyIn().show(batch: { id: string; title: string; photo: string | null }[])` — one flash, one polaroid stack (+N badge), one shutter call by the caller per batch. `SurfaceWorld.photos: PhotoStore`. Landing scene: in stage `tranquility` with local view, once `stageT >= 11` and the fade alpha is 0, call `captureScene(scene, cam)` once (guarded, wrapped by the Task 5 timeout), then `opts.destination?.photos.put('apollo11Site', { jpeg, clockMs: <opening UTC + stage time> })`.

- [ ] Failing tests: two ids announced 200 ms apart form one batch; an id 2 s later forms a new batch; an id whose photo already exists (Eagle) is in `announce` but never in `capture`; batch capture still single.
- [ ] Implement; run discovery/photoStore/notebook tests and `npx tsc --noEmit`. `landingScene.ts` is concurrently edited by other sessions: in-place edits only, re-read before each edit.

### Task 9: Smaller WebP files and thumbnail preload during loading

**Files:** Modify `scripts/fetch-notebook-photos.py` (add `--force`; encode with `method=6`), regenerate `public/textures/notebook/*.webp` and the width/height in `src/content/cards.en.json` / `cards.vi.json` via the script; modify `tests/notebookContent.test.ts` (tighten budget); modify `src/scenes/missionStartup.ts` (preload thumbs during loading); optionally `src/ui/imagePreload.ts` (reuse `domImageLoader`).

**Interfaces:** `export function notebookThumbUrls(cards: CardText[]): string[]` (in `src/content/content.ts`, base-URL-prefixed paths of all non-null `photo.thumb`). During loading in `missionStartup.ts`, all thumbs are fetched + decoded (`new Image()` + `decode()`), adding their count to the existing progress total; a failed thumb never blocks or fails loading.

- [ ] Measure candidates (e.g. full 1024/q72/m6, 960/q70/m6; thumb 256/q65/m6) on 3 representative photos (apollo11Site, viperPanels portrait, hammerFeather); pick the smallest setting without visible blocking/banding at the page size (~460 px tall at 2× DPR). Record the table in the report.
- [ ] Failing test first: total `public/textures/notebook` ≤ 1 300 000 bytes (adjust to the measured result, but at least 35% smaller than today's 2.33 MB), thumbs ≤ 256 px long side and same aspect as the full image within 1%.
- [ ] Regenerate with `--force` from the original NASA downloads (not by re-encoding the existing WebPs); run notebookContent + i18n tests; `npx tsc --noEmit`.

