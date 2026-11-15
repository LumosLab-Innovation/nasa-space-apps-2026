# ARTEMIS IV: COMMON GROUND

LumosEdu team project for NASA Space Apps Challenge 2026: a browser-based lunar mission game featuring PIP and MICA.

Play: https://artemis-common-ground.pages.dev/ · [Seven-slide demo](https://artemis-common-ground.pages.dev/submission/LumosEdu_Common_Ground_7_slides.pdf)

This organization release starts a new release history. Earlier development history and source provenance are retained in [ORIGIN.md](ORIGIN.md); the release date is not the project's original development date.

Built with TypeScript, Vite, Babylon.js and Babylon GUI. Static site; no backend.

## For judges and first-time players

- Use a desktop/laptop with keyboard and mouse. Start **New game → Autopilot** for the full story, or **Decision demo** for the resource trade-off. The demo stages a starting situation but uses the full game's night planner; it does not choose for you or overwrite your saved mission.
- **J** opens optional guidance and pauses play. The objective shows a bearing and distance, not a safe walking route. **E** interacts, **Q** asks PIP, **R** scans, **T** shows heat, **Tab** opens the notebook. Read the nearby prompt because E/Q change with context.
- Observe → predict → decide → see the result. The guide does not reveal photo order, sunrise direction or a preferred energy choice. You may explore freely; a recommendation is not a locked quest order.
- **Settings → Control guide → Reduced camera motion** disables landing shake and automatic rover camera turns. Menus support arrows/Tab, Enter and Escape; the J panel supports keyboard focus and Escape. Narrow panels scroll, but touch-only gameplay is not supported.
- **NASA sources and credits** opens [the data-to-gameplay explanation](public/sources.html). Notebook source labels are clickable. [LOLA](public/data/terrain/SOURCES.md) shapes terrain, [JPL](public/data/ephemeris/SOURCES.md) determines illumination, and [DONKI](public/data/donki/SOURCES.md) supplies recorded event context with a cached fallback. Energy costs and storm protection zones are teaching models, not calibrated spacecraft specifications.

Build and serve the exact production files:

```sh
npm ci
npm run build
npx vite preview --host 127.0.0.1 --port 5280
```

Open `http://127.0.0.1:5280/` (or `/?demo=1`). This is a local preview, not a public submission link. For a live presentation: explain the NASA-derived night, choose a plan, observe its energy/data consequence, then show the source page. The interactive demo is separate from the submission's 30-second video/7-slide limit supplied by the Hanoi organizer.

Before submitting, the team must confirm its public URLs, all Hanoi team members, English form, presentation artifact and complete AI/tool attribution. This repository alone does not certify those requirements.

## Development

```sh
npm install
npm run dev
npm test -- --maxWorkers=1
npm run build
```

Game design and NASA data credits: [DESIGN.md](DESIGN.md). Asset sources also live beside their respective files in `public/`.

QA: [local verification report](QA-FIX-2026-11-14.md). Report screenshots/videos are local evidence, not included in this repository.

AI assistance: Anthropic Claude and OpenAI Codex supported development, model-building scripts, dialogue/localization, review and QA. OpenAI ImageGen generated the labeled concept illustrations in the submission deck. See [AI credits](AI_CREDITS.md) and [deployment instructions](DEPLOYMENT.md).

Earlier storyboards are retained in [docs/previews/the-stowaway](docs/previews/the-stowaway/index.html). Generated QA captures stay local and are excluded from new commits.
