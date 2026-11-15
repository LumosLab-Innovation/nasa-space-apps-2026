# Astronaut notebook as a photo album

Status: draft for user approval (2026-11-15).

## Intent and why

The Science Notebook (Tab) is a plain dark list of text cards. The user wants it to feel like an astronaut's journal / photo album of milestones discovered while exploring (e.g. Apollo 11's Eagle), with a much nicer UI/UX for kids 7–12. Collecting and re-reading discoveries should feel rewarding.

## Decisions made with the user

- **Photos (option c):** every card page shows a real NASA image as the main photo, plus a small polaroid the game took of the player's own moment.
- **Player photo (option 1):** taken automatically when the card unlocks, with a shutter sound, a soft flash and a polaroid flying into the corner of the screen, replacing today's "New discovery in your Science Notebook (Tab)" text toast. No HUD or dialogue box in the photo.
- **Layout (B + A):** Tab opens a polaroid grid (collection overview, locked cards as "?" frames). Clicking a photo opens a two-page paper journal spread.
- **NASA photo framing:** keep the image's native aspect ratio and fit it in the frame (no stretching, no cropping). Apollo Hasselblad frames are square.
- **Tech (approach A):** HTML/CSS overlay above the canvas, following the existing `src/ui/missionGuide.ts` + `.css` pattern.
- Approved mockup: `.superpowers/brainstorm/2597-1794712916/content/album-combined-v2.html`.

## Goals

- Grid overview: header "ASTRONAUT NOTEBOOK" with `{n} / 34 discoveries · Samples {s} · Data logs {d}` (today's counts). Unlocked cards come first **in the order the player unlocked them** (the save already keeps that order), as polaroids (NASA photo thumbnail, title); then the remaining dashed "?" frames with "???" (title hidden), so the album fills up page by page like the mockup's "Page 1 / 12". `cards.*.json` order is not changed. A "new" dot on unlocked pages not yet opened. *(My call after the builder check.)*
- Journal spread for one card:
  - Left page: NASA photo taped on, native aspect, fitted; caption line (mission, date, what, NASA id); the player's polaroid stuck at the lower corner, handwritten "Day N · HH:MM" (mission day and UTC game time of the unlock).
  - Right page: stamp REAL / FICTION / STILL DEBATED (existing tag colours/text), title, card body (unchanged text), one handwritten Pip note, clickable source link (opens in a new tab, as today), "Page i / n" over unlocked cards.
  - Navigation: ← / → and on-screen arrows move between unlocked cards; Esc or Tab returns to the grid; Tab on the grid closes the notebook. Mouse and keyboard both work; visible focus.
- Unlock moment, two stages *(my call after the builder check)*: (1) **immediately at unlock** — shutter sound, soft flash and a polaroid with the card title flies into the corner, its picture still "developing" (grey); (2) when the photo is actually taken at the next clear frame, the stored polaroid gets the picture (if the fly-in is still on screen it develops in place). So feedback is never delayed, even when the card unlocks inside the horizon view, memory puzzle, night planner or before landing dialogue ends.
- Credits: today's footer credit lines move to a final "Photo and data sources" page reachable from the grid, plus every NASA image credit.
- English and Vietnamese, following the current language.
- Works at 1440×900 (competition machine) and down to the existing narrow-layout breakpoints used by the mission guide.

## Non-goals

- No change to which cards exist, when they unlock, card body text, gameplay, resources, or whether the notebook pauses play (it does not pause today; that stays).
- No change to the save format version for game state; no cloud storage.
- No retake / manual camera in this version.

## Anti-goals

- A NASA image that is not really NASA's, not really what the caption says, or not allowed under NASA media guidelines. The FICTION card (MICA) must never show a photo implying it is real.
- Photos with HUD, dialogue box, pause menu or story panels in them.
- Keys pressed in the notebook leaking into the game (walking, interacting) or game keys firing while reading.
- A noticeable hitch or memory spike from loading 34 large photos at once.
- Breaking Continue for existing saves.

## Approaches considered

- **A. HTML/CSS overlay (chosen).** Scrapbook look, native-aspect images (`object-fit: contain`), wrapping text and a responsive grid come almost for free; precedent in `missionGuide`. Must handle keyboard focus like the guide does.
- B. Babylon GUI (as today). Rotation, aspect-fit, text wrapping and a handwriting font are clumsy; the result would be visibly rougher than the approved mockup.
- C. Canvas2D pages drawn into a DynamicTexture. Full drawing control but hand-written text layout, scrolling and hit-testing; most work, no visual gain over A.

## Design

**Content.** `src/content/cards.en.json` / `cards.vi.json` gain per card: `pipNote` (string) and `photo` (`{ file, caption, credit, nasaId, url, width, height } | null`). Captions are language-specific; file, credit, ids and size are identical in both files. Drafts come from `docs/superpowers/research/2026-11-15-notebook-photos-part{1,2}.json` and `…-pip-notes.json`, reviewed by the user before shipping. Content drafts already exist (agents, 2026-11-15) and **the user approves the photo list and Pip notes before any content is shipped**. Image rules *(my call)*: NASA-produced only, credit never names a non-NASA rights holder; NASA illustrations/concept art are allowed but the caption starts with "NASA illustration" / "Artist's concept"; non-NASA missions (Chandrayaan-3, SLIM, IM-1) use NASA LRO images of their landing sites; abstract cards may use a NASA diagram or `null`. Cards with `photo: null` (at least MICA, the fiction card) show the player's polaroid large in the photo slot, labelled as an in-game picture.

**Images.** Downloaded once by a script, resized so the long side is ≤ 1024 px, saved as WebP (~quality 80) in `public/textures/notebook/<cardId>.webp`; a 256 px thumbnail `<cardId>.thumb.webp` for the grid. Credits in `public/textures/notebook/SOURCES.md`, `public/sources.html` and DESIGN.md → Data. Images are not part of initial loading; the grid loads thumbnails when opened (`loading="lazy"`), the spread loads the full image on demand.

**Player photos.** A small `discoveryCamera` module watches `state.unlockedCards` each frame for ids it has not seen (so the ~22 `unlockCard` call sites stay as they are; the "New discovery…" text toast is suppressed centrally in `hud.toast` for that exact translated string, so the call sites — several are being edited by a parallel session — stay untouched; *my call*). New ids enter a pending queue. A pending capture fires at the first frame where the view is clear: no dialogue playing, no story panel / memory puzzle / horizon view / night planner / map / pause / notebook open, descent not active, and the player camera is the active camera. Capture uses a scene-only render (Babylon `CreateScreenshotUsingRenderTarget` on the active camera, which excludes GUI layers; DOM overlays are never captured) at 480×360 JPEG (~quality 0.75). Several pending ids in the same clear frame share one capture. Landing cards (Tranquility Base, alarm 1202, rocket equation) therefore get the first clear frame after touchdown.

**Photo storage.** Separate localStorage key `pipmica.photos`: `{ v: 1, photos: { [cardId]: { jpeg: dataUrl, clockMs } }, seen: string[], pending: string[] }` (~25 KB per photo, ≤ ~1 MB for 34). Written when a photo is taken and when a page is first opened. Lifecycle *(my call after the builder check; New Game today does not call `clearSave`)*: photos are cleared when the player starts a New Game (menu choice auto/fly), not at `clearSave`; if they quit before the first autosave, Continue shows the old save without photos (cosmetic only). Read on Continue. A card that unlocks again after an Act 5 rollback reuses its stored photo (fly-in shows it at once, no new capture). With autosave off (demo / dev jumps) photos live in memory only. If storage fails or is full, the game keeps running; the page shows an empty polaroid "No photo yet". Saves from before this feature simply have no photos.

**Input.** While open, the overlay owns ←/→/Esc/Tab/Enter (handled on the overlay, `preventDefault`, not forwarded to the game keyboard), as `missionGuide` does. The game still opens/closes it with Tab; the existing `notebook.open` gating of prompts and interactions stays.

**Style.** Paper and tape via CSS gradients (no texture files). Body text in the game font (Barlow); handwritten notes in a locally bundled OFL handwriting font that covers Vietnamese diacritics (e.g. Patrick Hand), licence text in `public/fonts/`. Respect reduced-motion (`core/accessibility`) for the flash and fly-in.

**Code shape.** `src/ui/notebook.ts` keeps its public API (`createNotebook(…)` returning `{ toggle(), open }`) so `surfaceScene.ts` changes stay minimal; its body becomes the DOM album with `notebook.css`. New: `src/ui/discoveryCamera.ts` (queue, clear-view rule, capture, fly-in), `src/save/photoStore.ts` (storage), `scripts/fetch-notebook-photos.mjs` (download/resize).

## Acceptance

- Unit tests: photo store round-trip, quota failure, clearing with New Game; discovery camera queues new ids, waits while any blocking condition holds, captures once per batch, never re-captures; notebook renders 34 tiles with locked ones hiding titles, "new" dot logic, page order over unlocked cards only, keyboard navigation; every card in both languages has `pipNote` and either a valid `photo` (file exists, credit non-empty) or `null`; i18n parity tests still pass.
- In-game check at 1440×900 (EN and VI): unlock a card → flash + polaroid fly-in, photo has no HUD; Tab grid, open Tranquility Base spread, Eagle photo square and unstretched, arrows/Esc/Tab behave, keys don't move the astronaut; Continue keeps photos; New Game clears them.
- Initial loading time and in-game frame time unchanged within noise; opening the notebook shows the grid within ~0.5 s.

## Left to the builder

Exact CSS dimensions/colours within the approved mockup; WebP quality; handwriting font choice among OFL fonts with Vietnamese support; the clear-view check's exact list wiring in `surfaceScene.ts`.
