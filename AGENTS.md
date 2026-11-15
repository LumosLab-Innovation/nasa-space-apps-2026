# AGENTS.md

## Project
Browser game for kids 7–12: manage a lunar/Martian outpost, balancing resources with real NASA data.
Challenge: https://www.spaceappschallenge.org/2026/challenges/junior-astronaut-mission-trainer/
Game design: [DESIGN.md](DESIGN.md)

## Stack
Vite + TypeScript + Babylon.js and Babylon GUI. Static site, no backend.

## Commands
| Task | Command |
|---|---|
| Install | `npm install` |
| Dev | `npm run dev` |
| Test | `npm test -- --maxWorkers=1` |
| Build | `npm run build` |

## Structure
```
src/
  main.ts    entry
  scenes/    menu, orbit, landing and surface scenes
  fx/        visual effects
public/      static assets
```

## Conventions
- Game rules and balance numbers live in DESIGN.md; code follows it.
- Each NASA dataset used is credited in-game and in DESIGN.md → Data.
