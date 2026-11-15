# ARTEMIS IV: COMMON GROUND — current scene additions

## Non-visual QA corrections (2026-11-15)

Night choices preview the resolved loads and actual data cost before commitment, then immediately show the committed plan. The freezer sacrifice removes the most recent science data log if one exists; collected sample entries are preserved. Night dialogue respects MICA shutdown and the radio switch. PIP's radiator upgrade only helps within 6 m with battery power. Repair overheating pauses the heater through a safety cutoff, without destroying the battery. These remain teaching abstractions, not spacecraft engineering specifications.

Pending identical dialogue requests share one playback, and queued dialogue counts as busy immediately. Rover restrictions state their reason. PIP's existing contextual help distinguishes parked from approaching. Terrain rendering is unchanged: its collision uses the same full-resolution LOLA heights through Havok's native heightfield instead of cooking a triangle mesh. A real-Havok regression compares 1,000 points against the previous mesh within 1 cm. The four visual issues assigned in the DOCX remain outside this change.

## QA corrections and optional guidance (2026-11-14)

The current objective explains the next goal; J reveals optional process hints and pauses play. A bearing is a destination direction, not pathfinding. Puzzle answers, sunrise direction and energy choices remain the player's responsibility. Guidance does not gate exploration. The judge demo now stages the long night and runs the actual planner and consequence sequence, without autosaving over a mission.

Night balance keeps the original total demand: split the old 15% daily shelter load into 14% heater plus 1% sample freezer. Three sealed leaks still save 3% each per day. PIP warmth costs 6%, MICA 5%, lights 3%, comms 4%. Four days with no leaks and lights/comms off need 104%; sacrificing the freezer saves 4% and one data log, making demand exactly 100%. Letting MICA sleep is the other choice. These are teaching values, not spacecraft measurements.

The walk-in shelter is now tall enough to cover the astronaut. Protection is limited to its central 2 m radius and checks the head against the actual dome roof, so jumping above/standing on the roof does not qualify. The displayed shell and protection geometry share a 4.2 m height. The simplified lander-hull cover rule remains a teaching abstraction.

Notebook/story panels fit narrow viewports and scroll; the map uses numbered markers with a separate legend. Sources are accessible from the menu and notebook. The existing fictional braking glow is retained with an explicit on-screen label. Reduced camera motion removes landing shake and automatic rover camera turns. Exploration chatter stops during farewell/liftoff/record.

Installation steps the astronaut clear on the camera side of the new module. A parked PIP gets the existing Q-to-come hint at the installation site. DONKI's optional cached event file is no longer a mandatory boot asset: live failure uses the snapshot, and failure of both sources leaves a generic explanation without a fabricated event.

This addendum records the approved Apollo 11 heritage cutaway; existing gameplay specifications remain in docs/superpowers/specs.

## Apollo 11 heritage cutaway

The orbit sequence marks Tranquility Base with a white/cyan Babylon GUI locator. A short black transition leads into a metre-scale illustrative scene. The camera approaches Eagle over eight seconds, holds for reading and returns to undocking. Pause and Settings remain available. Earth, its atmosphere and orbital lighting remain unchanged.

The view shows the descent stage left on the Moon, an illustrative footprint route and a stationary US flag with a support crossbar. The view is explicitly labelled reconstructed; the flag does not flutter in wind. It does not represent a surveyed current-condition reconstruction.

## Data

### Layered exhaust and attitude jets

Post-rollback core-only adjustment: main engines gain up to 18% core intensity and 14% core width immediately at the nozzle, fading along the existing plume. Original ribbon dimensions, length modulation, flow, halo, ground fan and dust remain unchanged. RCS/Orion profiles, camera and the retained hatch depth fix are unchanged.

Rollback requested 2026-11-13: restore plume shaders, independent nozzle lengths, original 4.2-radius main ribbons and larger rising dust clumps to their state before the three-layer vacuum refinement. The subsequent core-brightness/width changes are also reverted. Retain the separate adaptive near-plane fix for hatch depth artifacts during braking; camera position, target and FOV remain unchanged.



Approved reference: layered-plume-a-v9-rcs-attitude.html, with v8 contact timing. Six HLS nozzle-aligned soft white/blue plumes vary smoothly and independently in length. Small paired RCS jets illustrate angular acceleration and counter-torque during slowing; they do not add forces, change the camera, flight timing or fuel. The symmetric two-ring RCS layout is an inferred game design, not certified HLS hardware. Orion fires only its eight small aft auxiliary nozzles during the authored separation pulses; its central engine stays unlit.

Surface interaction uses local terrain height/normal, an irregular radial gas sheet and existing ballistic dust. At contact the visual main plume holds 0.4 seconds then fades over 0.8 seconds; RCS stops. These are pause-aware presentation timings, not continued landed propulsion. The four original 300 × 300 lossless alpha WebPs total 35,750 bytes and are counted in real loading progress, decoded and warmed offscreen before gameplay. Sources and distinctions between flight footage, animations and artistic inference are in [exhaust credits](public/textures/exhaust/SOURCES.md).

User-requested runtime refinement: the ground sheet is continuous across 360 degrees, with outward-moving turbulent opacity and a broken soft edge, replacing eight repeated spokes. Engine-ejected dust uses thin transparent billboards and smaller grains; foot/rover dust is unchanged. Main/RCS plumes are wider for visibility at the unchanged camera. Orion's ignition pulses now lead into a brief auxiliary departure burn (2.7–5.25 s), then extinguish; this follows the existing orbital motion and does not activate its central engine.

HLS visual reference: the NASA/SpaceX surface concept and docking image recorded in [the HLS source ledger](docs/references/hls/README.md). The 2026-11-13 approved model replaces the former placeholder in orbit, descent and exploration. Its enclosed landing gear, six-engine detail and elevator kinematics are illustrative reconstructions, not confirmed flight engineering. Gear opens over about seven seconds; elevator unfolds/lowers over about twelve seconds after stable contact. Continue restores the landed pose immediately. Liftoff waits for the elevator to stow and only retracts legs after ground clearance. These visual timings do not change the descent physics or save format. See [model credits](public/models/SOURCES.md).

Eagle uses NASA / Michael D. Carbajal's Apollo Lunar Module: https://science.nasa.gov/3d-resources/apollo-lunar-module/ . Adaptations and original-file hash are recorded in public/models/SOURCES.md. Model attribution remains in public/models/SOURCES.md; the corner attribution overlay was removed at the user's request. Local footprint paths and microterrain are artistic additions; existing orbital NASA LOLA/LROC terrain and credits are unchanged. The model is part of the real-progress mission asset manifest and loaded before scene readiness.

### Eagle ground detail update

The heritage cutaway uses a continuous 321×321 ground mesh, concentrating vertices into a 64 m neighbourhood. Irregular eroded crater bowls, low rims and small depressions provide actual silhouette and shading changes; the four footpad contacts stay supported. Crater shape is lit from its geometric normals; terrain receives Eagle, flag and rock shadows. The large ground mesh is excluded from the shadow-caster list to avoid self-shadow striping.

The diffuse texture is a unique, low-contrast 2048² dust map covering the mesh once, replacing the earlier repeating mottled pattern. A separate UV channel carries a 512² fine-grain normal map, so only sub-centimetre grain detail repeats. No additional downloaded asset is required. The 69 footprint patches sample the rendered ground triangles instead of the analytic height field, retaining clear tread while following crater slopes.

These details are illustrative, not surveyed NASA elevation measurements. Visual/reference context: NASA Apollo 11 image gallery (AS11-40-5880 bootprint; AS11-40-5954 small crater): https://www.nasa.gov/wp-content/uploads/static/history/ap11ann/kippsphotos/apollo.html . Earth, atmosphere and the orbit-scene source are unchanged.

### Eagle material finish

The NASA geometry now has generated crumpled thermal-foil albedo, normal and roughness maps on a separate UV channel. Aluminium struts/ladder and brushed landing pads use distinct metallic/roughness settings. Reflection is assigned only to Eagle materials, never the scene environment. A separate deterministic generator preserves the terrain/rock random sequence. Original label textures remain intact. Terrain, footprint placement, orbital camera, Earth and atmosphere are unchanged. The lower-corner source line is removed from the scene overlay.


### Orion visual reference update

Orion uses public NASA European Service Module and ESA propulsion references linked in [model sources](public/models/SOURCES.md). Propulsion layout: one main engine, eight auxiliaries and 24 attitude-control nozzles. Surface seams, supports and texture patterns are illustrative, not engineering CAD. Embedded solar-cell and insulation textures load with the existing GLB. Gameplay camera, movement, scale and docking interface remain unchanged. Attribution is also included in the science notebook.

Orion material refinement: cylindrical blanket UVs, generated satin fold normal/albedo/roughness and brushed-alloy roughness maps add surface detail without changing mesh geometry, lighting, camera or gameplay. Maps are embedded in the model and use the existing asset-loading progress.

### Continuous low-altitude approach (2026-11-13)

Current high-braking camera refinement: a restrained pullback replaces the altitude-proportional distance. Distance parameter = selected close distance + 2.6 × the extra displayed ship length above its physical 50 m length, eased from 1.5 to 6 km altitude. This keeps the high-braking shot within approximately three displayed ship lengths while preserving camera direction/FOV, the existing 2.4 s burn-entry blend and all low-approach/300 m handoff framing.

Braking guidance correction: above 4,000 m clearance, the high burn follows its fixed local flight datum rather than reacting to each crater slope. A quintic blend between 4,000 and 1,800 m transitions the guidance reference to actual height above ground. Vertical reference velocity is radial; local terrain slope times horizontal speed is not added to it. This prevents rapid pitch/throttle reversals at ×10. The HUD, thrust transition and 300 m handoff still use the actual rendered terrain clearance throughout. The close camera, terrain assets and Earth rendering are unchanged.

The orbital presentation uses kilometres; the landing scene uses metres. Below 1,500 m the HLS is rendered at its physical model scale. Clearance follows the rendered NASA terrain triangles beneath the craft, including triangle chord sag, and the landing HUD uses the landing reference above the local ground. The user-selected close low chase camera uses distance parameter `0.8 * (110 + 100 * clamp(heightM/1000,0,1))` metres, with backward/up/side ratios `1/.45/.3` and target forward `.6`. Higher approach shots ease into this composition rather than exaggerating the ship's size at low altitude. In the approved 20-second revision, the distance eases toward a steady 136 m parameter between 800 and 600 m, then holds it. A restrained downward screen-framing bias develops from 600 to 360 m so terrain perspective and craft motion remain readable.

The approved 20-second revision targets about 20 seconds (18–22 nominal) from 1,000 m to 300 m at ×1. Vertical reference speed reduces from about −70.8 to −12 m/s; horizontal guidance reduces about 92.2 to 4 m/s. The height-based vertical braking acceleration is 3.8 m/s² above 420 m and eases to zero by 300 m; its height integral determines speed, and horizontal deceleration is 1.5 times vertical braking. A derivative-matched reference between 4 km and 1 km distributes braking early enough to fit existing thrust limits. These are educational game balance values, not an official Artemis flight profile. Guidance commands a single bounded thrust vector; position integrates actual velocity under lunar gravity 1.62 m/s². No throttle/empty fuel produces real departure from the reference, not a fixed altitude animation. Manual Space controls available throttle, with computer-guided attitude. Applied throttle slews at 0.5 per second; attitude at at most 0.65 radians/s. Main thrust availability blends from the existing 2 MN to 400 kN between 380 and 300 m. Final descent retains its separate 10 t fuel allocation. Time acceleration ramps smoothly and returns to ×1 by 1,200 m.

Opening separation keeps the pre-existing x100 cinematic model scale: an illustrative 30 m docking clearance is rendered as 3 km over six seconds with zero endpoint relative velocity. Dialogue and translation overlap, and ignition waits for both to finish. Physical flight is seeded from the previous transformed landing base and measured velocity, avoiding either a position jump or inheriting the exaggerated separation speed. The corrected physical centre is composed before blending to the outgoing world-space camera, so the captured camera never receives the new chase-origin correction. The frame's longitudinal roll settles during the existing low camera move, preserving the thrust axis and avoiding a roll reset at 300 m.

No separate movement override starts at 500 m. During approximately the last 5 seconds, 360 → 300 m, only the camera blends into the close landing shot: radius `110 + .25 * heightM`, beta 1.05. To carry the downward framing through this join, the shared target is 74 m above the landing base at 300 m, easing back to the earlier 18 m target by 150 m with zero endpoint derivative. Ship position, actual incoming velocities, attitude and held keys transfer without a nominal velocity reset. The approach camera retains the close low angle, uses damped following and a small vertical aim bias. Both scenes render live during a short GPU blend; initial loading prepares the destination. Exploration physics, story and resource time remain dormant during flight. Pause and held flight inputs survive the handoff. Camera angles are reapplied after moving its target to prevent progressive pitch drift. Unsafe lateral arrival is no longer artificially clamped at ±30 m; leaving the existing playable bounds triggers the existing failed-landing/retry flow.

Original lunar texture/heightmap files and Earth/atmosphere assets are retained. The later close-camera revision restores the original surface regolith material and lighting and no longer creates the rejected visual terrain collar/backdrop. Orbital and playable terrain remain separate representations; their handoff is cinematic, not a surveyed continuous NASA route. The existing 1.5 km playable terrain has a finite visible boundary from some elevated angles; this revision does not resculpt or expand it.

Static HLS hull/engine geometry is batched while gear and elevator joints animate. Settled poses and moving-joint rendering are prepared during initial loading; no source GLB geometry or texture is modified.

### Braking attitude and RCS readability refinement (2026-11-13)

Above 5 km, attitude now slews at up to 6 degrees per playback second, with a 0.5-second exponential response. High-burn vertical-velocity feedback uses gain 0.4 per playback second to avoid overshooting while attitude settles; both blend back to the existing low-approach controller between 5 and 4 km. The same integrated pitch drives thrust and the model. Negligible high-burn thrust requests retain the current attitude instead of pointing a near-zero vector upward. Camera paths, separation duration and the approximately 20-second low approach remain unchanged.

RCS core intensity is increased locally by up to 25%, with 0.11–0.29-second pulses on a 0.36-second cycle (only while attitude correction is demanded). Orion's eight small aft auxiliaries now begin their ignition/departure sequence at brake entry, after separation, and finish within 4.53 playback seconds; the central main engine stays off. These timing/visibility choices are game presentation, not an official spacecraft control sequence. No clips or screenshots are automatically produced; the user performs visual QA.

### Low landing dust clumps (2026-11-13, selected option A)

Latest density-only refinement: the existing emission curve is multiplied smoothly from 1 at 10 m to 1.5 at 3 m, remaining at 1.5 below 3 m. Throttle and the existing contact engine fade still control emission, with no emission at zero power. Restored rising clump shape, uneven patches, independent fading, terrain collision and fixed pools stay intact. Current flame shaders/core boost are unchanged. Visual QA is performed by the user, without recordings.

Current separation refinement: emit unequal overlapping dust pairs with divergent ballistic launch vectors and independent gentle sprite roll. Smaller secondary wisps peel away as clouds spread; reduced size growth keeps visible gaps instead of merging into one blanket. This stylized rotation does not add atmospheric wind forces. Emission count, pool limits, 5.2-second lifetime cap and camera remain unchanged.

Current refinement: each dust patch has independent drift, speed and vertical lift held for 0.7–1.2 seconds, increasing asymmetry and slightly raising clouds. Fine-dust lifetime now caps at 5.2 seconds, with density held for the first 18% before gradual fade. The cloud atlas adds subtle light-core/dark-edge relief; this is baked artistic shading, not a change to scene lighting. Existing terrain collision, fixed particle budgets and camera remain unchanged.

Cloud-shape clarification: fuller grey volumes may veil the feet, using aspect 0.65–0.85 and initial width 6–10 m before density scaling, opacity up to 0.54. The dust billboard camera follows the active scene camera; keeping Babylon's cached exploration camera during landing previously made the cloud quads appear as narrow streaks. Motion remains ballistic and the camera path itself is unchanged.

Latest visual direction supersedes the earlier clear-feet constraint: larger rising grey clouds may partially veil the lower hull and landing feet. Emission uses uneven patches held for 0.45–0.85 seconds with varied radius and drift, so sequential emissions form coherent clumps instead of a uniform ring. Near-ground vertical launch is about 2.9–3.6 m/s, with varied cloud aspect/size and maximum individual opacity 0.44. Clumps fade within 4.4 seconds after emission (or die earlier on terrain impact). Existing pool limits, lunar gravity, camera and engine cutoff remain unchanged. These visible clouds are a stylized dust treatment rather than simulated atmospheric smoke.

Subsequent user adjustment: stronger cinematic clumps inspired by B, still translucent around the feet. Near-ground clump size increases by up to 20%, emission count by about 20%, maximum opacity to 0.30, and upward launch speed to 1.9–2.35 m/s at full density. The current camera and 2.8-second maximum clump lifetime are retained.

Landing dust starts below 20 m with a smooth thrust-weighted emission curve and strengthens in the final 5 m. Irregular grey clumps launch from terrain samples 4–7 m around the ship, with varied size and low ballistic arcs. Fine clumps fade in briefly, expand modestly and dissipate within 2.8 seconds of emission; emission itself follows the existing post-contact engine shutdown. Small grains retain ballistic motion. A generated 128×64 two-cell opacity atlas preserves ordinary foot/rover puffs and adds a separate irregular landing profile, without external assets or larger particle pools. Camera, terrain and flight controls are unchanged. This is an illustrative visibility treatment, not measured plume-density data.

### Gentle landing camera shake (2026-11-13, selected option A)

Add bounded camera-plane vibration below 20 m, weighted by thrust (maximum 0.14 m per axis). Successful contact adds a softly introduced accent up to 0.50 m (increased from 0.44 m after user visual QA) and settles fully within 1.1 seconds. Rebuild offsets around the unshaken chase target every frame, retaining the existing alpha/beta, radius, FOV and independent HUD. Pause freezes the envelope; retry resets it. This is cinematic feedback only, with no changes to flight physics. The user performs visual QA; no automatic recording.

Successful contact also triggers one quiet, dry, 0.55-second landing-gear thud on the same update as the camera impulse. Original procedural audio combines a 95-to-55 Hz body with a restrained overtone and low-pass noise; it is prepared when audio unlocks, without downloading a sound file. The effect follows the existing audio master volume/mute and dialogue ducking, bypasses reverb, and is not queued if the audio context is locked. The existing musical touchdown chord two seconds later is retained.



### Approved old-B braking overlay (2026-11-13)
A fictional cinematic plasma layer uses the approved old-B preview, not the later flicker variation. The shell is 8% narrower than the original B preview. It fades in over 1.2 gameplay seconds once braking has ignited and altitude reaches 13,000 m AGL or lower, remains through 1,100 m AGL, then fades out over 2 gameplay seconds; Pause freezes the effect. This is not a lunar atmosphere simulation. Camera, engine plume, RCS and dust are unchanged. No additional texture downloads.
