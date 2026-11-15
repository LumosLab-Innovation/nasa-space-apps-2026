# Building the GLB models

The models are built by Python scripts that run inside the user's live Blender (5.2) through Blender MCP.

## Safe mode limits

Blender MCP runs in safe mode, which forbids `exec`/`open`/`runpy`, local imports and `class` definitions.

Each build is therefore sent as **one inline script** made of two parts:

1. the full text of `common.py`;
2. the full text of `build_<id>.py`.

Pass that combined text to `execute_blender_code`. The scripts use only `bpy`, `bmesh`, `mathutils` and `math`.

## Steps per model

1. **Build and export.** Run `common.py` + `build_<id>.py`. This does three things:
   - it creates a scene `build_<id>` and makes it the window's scene;
   - it tags every object, mesh and material it creates with the custom property `pm_build = <id>`;
   - it exports `public/models/<id>.glb` from that scene only (`use_selection` + `use_active_scene`).
2. **Inspect.** Use `look` with `mode='angles'` and `shading='material'`.
3. **Clean up.** Run `end_build('<id>')` (a short inline script with that function). It removes every datablock tagged with this id, deletes the build scene and switches the window back to the user's scene.
4. **Check the contract.** Run `npx vitest run tests/models.test.ts`.

Never call `read_homefile`, never save the user's `.blend`, and never touch datablocks without the `pm_build` tag.

## Axes

| Blender axis | Meaning | In Babylon |
|---|---|---|
| −Y | front | +Z |
| +Z | up | up |
| +X | the model's left side (`_L` suffix) | — |

Every object keeps identity rotation. Primitive rotations are baked into the mesh, so game code can rotate pivots directly.
