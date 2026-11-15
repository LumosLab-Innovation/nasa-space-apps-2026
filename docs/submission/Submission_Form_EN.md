# LumosEdu submission form

## Project Name

ARTEMIS IV: COMMON GROUND

## High-Level Project Summary

ARTEMIS IV: COMMON GROUND is a 3D browser game for children ages 7–12. In a fictional lunar mission, players build an outpost with PIP, a solar-powered robot, and encounter MICA, a stranded robot. When a ridge blocks the Sun, one battery must support the shelter, robots, communications and science. Players decide what to keep running and experience the consequences. NASA LRO/LOLA terrain and JPL Horizons positions shape the environment and the camp’s long shadow; DONKI records provide real solar-particle-event context. The goal is to help young players explain why protecting one need can require giving up another.

## Link to Project Demo

https://artemis-common-ground.pages.dev/submission/LumosEdu_Common_Ground_7_slides.pdf

## Link to Final Project

https://artemis-common-ground.pages.dev/

## Detailed Project Description

What the player does
Players land near the lunar south pole, work with PIP to assemble a habitat, solar tower, radiator and antenna, collect samples, and help the stranded robot MICA. Oxygen, warmth and robot power limit exploration. Optional guidance gives the next objective without revealing puzzle answers. English and Vietnamese are supported. The prototype is designed for a desktop or laptop with a keyboard and mouse.

The central decision
A terrain-derived shadow leaves the camp dependent on stored energy. The night planner lets players manage lights and communications and decide whether to keep MICA warm or put it to sleep. In an unsealed four-turn scenario, running every load needs 132% of a 100% reserve. Keeping MICA warm requires turning off lights, communications and the sample freezer; one science data log is lost if a log is present. Letting MICA sleep can preserve communications and the freezer with the lights off. Sealing heat leaks reduces the heater’s demand, creating another way to improve the outcome. These percentages are simplified game-balance values, not NASA spacecraft specifications.

How NASA data changes the game
LOLA elevation data defines the terrain and local horizon. JPL Horizons supplies Sun and Earth directions; the terrain and Sun positions together determine shadow conditions and the night scenario. DONKI solar energetic particle records connect the radiation warning to an observed event. A stored DONKI snapshot supports use when the live service is unavailable. Archived records are not presented as a forecast for the fictional mission date.

Learning and replay
The player observes conditions, predicts a resource shortfall, chooses a plan and sees its cost. PIP’s rescue mechanic lets players continue learning after resource exhaustion. The Science Notebook and Sources page connect gameplay to the underlying science. A short Decision demo stages the resource decision using the game’s night planner, so judges can inspect the central mechanic without playing the entire story.

Implementation and limits
The game uses TypeScript, Babylon.js, Havok and Vite and is hosted as a static website. PIP, MICA, the mission chronology and resource rules are fictional or simplified. Radiation countdowns and protection zones are teaching models, not calibrated exposure or survival predictions. Touch-only gameplay is not supported. Learning outcomes have not yet been validated in a study with children. Next steps are first-time-player testing, clearer visual readability and classroom evaluation.

## Use of Super Intelligence (SI)

We used Anthropic Claude and OpenAI Codex as development assistants. Claude-assisted work includes gameplay implementation, dialogue and Vietnamese localization, procedural model-building scripts, animation, review and debugging. Codex assisted implementation and revisions, NASA-source review, gameplay QA, tests, performance work, deployment preparation and submission writing. OpenAI ImageGen generated the concept illustrations in the seven-slide submission deck; these are visibly labeled AI-generated and are not gameplay screenshots. Actual gameplay captures are separately labeled. AI assistance does not make our simulated resource values NASA measurements. The team is responsible for the submitted work and its scientific claims.

## NASA Data

NASA LRO LOLA terrain
https://pgda.gsfc.nasa.gov/products/78
High-resolution lunar south pole topography, Site01 Connecting Ridge, 5 m/pixel surface-height product. A 3 km crop is resampled to 513 × 513 and scaled to a 1.5 km game area; heights are scaled by the same factor to preserve slopes. It determines terrain geometry and sunlight obstruction. Citation: Barker et al. (2021), Planetary and Space Science 203, 105119. DOI: 10.1016/j.pss.2020.105119.

NASA JPL Horizons
https://ssd.jpl.nasa.gov/horizons/
Hourly apparent azimuth and elevation for the Sun and Earth for a lunar observer at 89.45° S, 222.7° E, covering 2028. Combined with terrain, these data inform illumination, the selected approximately 86-hour shadow interval, and Earth direction. The game compresses the interval into four night turns. Detailed queries and processing are linked from Sources.

NASA CCMC DONKI
https://ccmc.gsfc.nasa.gov/tools/DONKI/
Solar Energetic Particle event records provide the scientific context for the storm warning. The bundled archive contains 179 unique SEP records from 2024–2025. The application can fall back to that snapshot if a live request fails. Event context is real; storm timing, dose messages and shelter mechanics are simplified.

## Space Agency Partner Data and Other References

Data processing and game credits: https://artemis-common-ground.pages.dev/sources.html
Terrain provenance: https://artemis-common-ground.pages.dev/data/terrain/SOURCES.md
Horizons query provenance: https://artemis-common-ground.pages.dev/data/ephemeris/SOURCES.md
DONKI snapshot provenance: https://artemis-common-ground.pages.dev/data/donki/SOURCES.md
Model sources and adaptations: https://artemis-common-ground.pages.dev/models/SOURCES.md
Moon texture sources: https://artemis-common-ground.pages.dev/textures/moon/SOURCES.md
Earth texture sources: https://artemis-common-ground.pages.dev/textures/earth/SOURCES.md
Exhaust artistic references: https://artemis-common-ground.pages.dev/textures/exhaust/SOURCES.md
Apollo Lunar Module — NASA / Michael D. Carbajal: https://science.nasa.gov/3d-resources/apollo-lunar-module/
ESA European Service Module: https://www.esa.int/Science_Exploration/Human_and_Robotic_Exploration/Orion/European_Service_Module
NASA VIPER reference: https://science.nasa.gov/mission/viper/
NASA Curiosity reference: https://science.nasa.gov/mission/msl-curiosity/
Babylon.js and Havok integration: https://github.com/BabylonJS/Babylon.js
TypeScript: https://github.com/microsoft/TypeScript
Vite: https://github.com/vitejs/vite
Vitest: https://github.com/vitest-dev/vitest
Blender: https://www.blender.org/
Anthropic Claude: https://claude.ai/
OpenAI Codex and ImageGen: https://openai.com/
Source repository: https://github.com/LumosLab-Innovation/nasa-space-apps-2026
Project license: Apache-2.0; third-party assets retain their applicable terms.