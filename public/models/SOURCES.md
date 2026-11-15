# Model references

Except for the NASA Apollo asset below, models in this folder are built from scratch by `tools/blender/build_*.py`.
The real-world references used for shapes and details are listed here.

## astronaut.glb: Axiom AxEMU suit (Artemis III), flight configuration

- NASA, "Spacesuit for NASA's Artemis III Moon Surface Mission Debuts" (15 March 2023):
  https://www.nasa.gov/humans-in-space/spacesuit-for-nasas-artemis-iii-moon-surface-mission-debuts/
  - Caption: "Though this prototype uses a dark gray cover material, the final version will likely be all-white
    when worn by NASA astronauts on the Moon's surface." That is why the model is white, not dark grey.
- Universe Today, "NASA and Axiom Space Do a Partial Reveal of the Spacesuit That Will be Worn on the Moon":
  https://www.universetoday.com/articles/nasa-and-axiom-space-do-a-partial-reveal-of-the-spacesuit-that-will-be-worn-on-the-moon
  - Helmet lights for shadowed areas, HD video cameras, back-entry hatch, life-support backpack on the rear,
    helmet bubble mounted on the hard upper torso, white outer layer to reflect heat.
- images.nasa.gov, AxEMU mock-up photos (search "AxEMU"): https://images.nasa.gov/search?q=AxEMU
- Checked: 2026-11-09.

Simplified or invented for the game: red ID stripes, patch layout, the chest control module's buttons, the
glove and boot shapes, and the rigid segments with metal bearings and bellows over the joints (the real suit
is soft goods with bearings).

## hls.glb: SpaceX Starship Human Landing System (Artemis III/IV)

- NASA HLS one-pager (2025): https://www.nasa.gov/wp-content/uploads/2025/04/24-2-23-hls-one-pager.pdf
- NASA, "NASA Astronauts Test SpaceX Elevator Concept for Artemis Lunar Lander" (crew elevator on the hull):
  https://www.nasa.gov/image-article/nasa-astronauts-test-spacex-elevator-concept-for-artemis-lunar-lander
- Shape and proportions (about 50 m tall, 9 m across, landing thrusters mounted high, airlock about 30 m up)
  follow NASA/SpaceX renders; the exact panel, window and solar-band layout is the game's.
- Checked: 2026-11-10.

### HLS appearance revision, approved 2026-11-13

The production `hls.glb` and `hlsFar.glb` now use the approved reconstruction documented in `docs/references/hls/README.md`. Main reference: NASA/SpaceX surface concept (file dated July 2025), published at https://www.nasa.gov/missions/artemis/nasa-partners-accelerate-lander-development-for-2028-moon-missions/ . Docking reference: https://www.nasa.gov/humans-in-space/nasa-spacex-illustrate-key-moments-of-artemis-lunar-lander-mission/ . The unchanged original image URLs and local source files are recorded in the reference directory.

Engine appearance uses the official SpaceX Starship/Raptor visual references listed there. The six-engine arrangement, hidden plumbing, enclosed leg bays, hinged doors, folding pads and elevator mechanism are game reconstructions, not released flight CAD or confirmed HLS hardware. Seven-second landing-gear and twelve-second elevator motion are compressed game timings. The same approved geometry is used in production; near/far assets total 2,396,248 bytes. Static end poses are batched at runtime, with independent joints restored during animation. No NASA/SpaceX endorsement is implied.

## orion.glb: Orion spacecraft

- ESA, European Service Module (4 m long including the main engine, solar array spanning 19 m, 7 m X-wings):
  https://www.esa.int/Science_Exploration/Human_and_Robotic_Exploration/Orion/European_Service_Module
- NASA Orion reference: https://www.nasa.gov/reference/orion-spacecraft/
- Simplified for the game: window layout, radiator panels and thruster clusters. Checked: 2026-11-10.

## pip.glb and mica.glb: original robots

- Pip and MICA are original designs. Details are inspired by NASA rover photos: VIPER's vertical solar panels,
  mast head and independently steered wheels (https://science.nasa.gov/mission/viper/) and Curiosity's
  rocker-bogie suspension and chevron-treaded wheels (https://science.nasa.gov/mission/msl-curiosity/).
- MICA's dust drifts on its horizontal wings, the dead cell and the dented guard are story props (fiction).
- Checked: 2026-11-10.

## apollo11-descent.glb: NASA Apollo Lunar Module

- Source and author: NASA / Michael D. Carbajal.
- https://science.nasa.gov/3d-resources/apollo-lunar-module/
- Original GLB: https://assets.science.nasa.gov/content/dam/science/cds/3d/resources/model/apollo-lunar-module/Apollo%20Lunar%20Module.glb
- Retrieved 2026-11-12. Original SHA-256: 379101dfcee399267addf771709107c35e826b0b9e5233272f123e4c8a585c4e.
- Adaptation: removed the ascent cabin and its equipment; retained descent body, engine, legs, pads, ladder and porch; aligned pads to ground; scaled the original by 1.46 to approximately 9.4 m landing-gear span; joined meshes and exported embedded-texture GLB without Draco. Surface roughness adjusted for the game's directional light.
- Standing US flag, bootprint routes, small rocks and local terrain are illustrative additions, not surveyed Apollo 11 geometry. The standing flag is a commemorative reconstruction, not a claim about its present condition.
- Attribution is retained in this file and DESIGN.md; the small corner overlay was removed at the user's request. No NASA endorsement is implied.

- Material treatment (2026-11-12): generated foil fold normal/albedo/roughness maps, material-local lunar bounce reflection, aluminium ladder/struts and separate brushed footpad material. This is game artwork applied to the NASA geometry; label textures are retained.

## Orion detail update — 2026-11-13

Original game mesh, generated by tools/blender/build_orion.py; not NASA CAD. References: [NASA European Service Module](https://www.nasa.gov/reference/european-service-module/), [ESA propulsion](https://www.esa.int/Science_Exploration/Human_and_Robotic_Exploration/Orion/European_Service_Module_Propulsion). The 1 main + 8 auxiliary + 24 attitude-control engine arrangement follows public descriptions; supports, radiator segmentation, seams, cell grid and insulation folds are illustrative artwork. Existing model scale and docking interface retained for scene compatibility, not a new dimensional certification. Two generated embedded PNG textures (512 solar cells, 256 insulation); no external texture request. Main nozzle has an open bell with inner wall and recessed throat.

### Orion insulation and alloy finish — 2026-11-13

Generated satin insulation colour, tangent-space normal and varying roughness maps now cover the service-module blanket and crew backshell through explicit cylindrical UVs. Radiators retain a matte pale coating; exposed alloy receives restrained directional roughness variation. These are illustrative original material textures, not additional NASA measurements. Five images are embedded in the GLB (maximum 512 pixels); geometry, docking, lighting and cameras are unchanged. This supersedes the earlier two-image material setup.
