# Mission startup implementation plan

**Spec:** [Mission startup](../specs/2026-11-12-mission-startup-design.md)

- [ ] Add gradient style and a single hover sweep to the three actions in the Babylon main menu.
- [ ] Add a loading scene and an on-demand mission module. Download every packaged gameplay asset with counted progress. Feed the downloaded bytes to the model, texture, physics and data loaders.
- [ ] Await the first scene before releasing the loading screen. Preserve save restore, landing choices and retry. Prepare the surface from the same downloaded data after orbit.
- [ ] Verify both entry paths on a cold browser load, loading counts, errors and retry, hover and reduced motion. Run build and tests.
