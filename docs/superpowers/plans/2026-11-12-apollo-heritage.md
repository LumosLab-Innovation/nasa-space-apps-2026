# Apollo 11 heritage cutaway

Approved design: replace the yellow ring with a white/cyan screen-space locator; approach Eagle's descent stage and astronaut tracks; add a US flag. Preserve Earth and atmosphere exactly. Reference: approved two-panel concept, not a surveyed reconstruction.

Implementation: Babylon GUI marker with horizon/viewport culling. Metre-scale local reconstruction in a separate render layer of the same scene, revealed through a brief fade after the orbital establishing shot. Eight-second camera approach, reading hold, fade back into undocking. Existing pause/settings, dialogue and loading remain active. A stationary rippled US flag on a crossbar is explicitly labelled reconstructed. Terrain details and footprints in this local view are illustrative.

- Snapshot Earth shader and orbital Earth setup. Test timing, marker visibility and safe close-shot camera.
- Build deterministic descent-stage geometry, foil materials, regolith, footprint trails and static flag; local directional shadows use transformed existing sunlight, without changing the orbital light.
- Add responsive HUD locator and close-up location/reconstruction labels; update both dialogue languages to remove the ring reference.
- Integrate gated cinematic sequence, pause/resume, cleanup and loading readiness. Preserve orbit physics and save format.
- QA actual New Game sequence through return to orbit, Pause/Settings during close view, Continue, compact viewport and asset preparation; compare Earth snapshot, build/test, capture screenshots.

## Implementation and QA

- Replaced the procedural Eagle after the user's NASA-resource suggestion with the official NASA/Michael D. Carbajal Apollo model. Extracted descent-stage geometry offline; retained UVs/textures. Runtime GLB 1,406,556 bytes, no external Draco decoder request. Rebuild script: tools/blender/build_apollo_descent.py. Source and changes recorded in public/models/SOURCES.md and DESIGN.md.
- Implemented HUD marker, fade-separated metre-scale cutaway, eight-second camera approach, reading hold, return to undocking, flag with static folds, 69 illustrative bootprints, local shadows and scoped lights. In-game reconstruction label and NASA author credit.
- Natural browser sequence passed at 1440×810; camera Pause and Settings freeze/resume passed; compact 900×600 view inspected; return disables the diorama and restores the orbital layer. No runtime errors. Observed close-view sample ~78 FPS on this machine (not a cross-device performance guarantee).
- Chơi mới and Tiếp tục: intercepted the NASA GLB download. Both remained on loading at 90% with no game entry; after release both advanced monotonically to 100%, with valid terrain. No errors.
- Fresh review found a failed-model preparation path leaking a Scene. Reproduced with a deliberately corrupt GLB: scene count 1→2. Fixed by observing and settling all preparations inside scene cleanup before readiness; regression count stays 1→1. Rebuilt and reran the suite afterwards.
- Earth shader file unchanged; Earth radius/scale, atmosphere multiplier, position, Sun direction and slow-rotation code retained. Heritage lights use mesh inclusion lists; orbital lights exclude local meshes.
- Actual screenshots: docs/screens/apollo11-hud-marker.png, apollo11-eagle-nasa.png, apollo11-return-orbit.png. This is a lightweight illustrative cutaway; footprint routes and the standing flag are not surveyed present-day site data.
