# AxEMU joint and walking refinement

User feedback: visible disconnected shoulders/neck/hips, overly simple equipment,
vertical walking pops and slightly insufficient arm swing. Keep gameplay camera;
user performs final visual QA. No video.

## Changes

- Weld torso/sleeves/trousers into one connected cloth mesh before export;
  relax and normalize skin influences across the welds. Build asserts one
  connected component. Keep rigid helmet, bearings and life-support pack.
- Lower/round the shoulder silhouette, soften pouch and bake equipment bevels.
  Slightly enlarge helmet/visor. Add waist connectors and UV-baked seams,
  identification bands and knee/elbow reinforcement. Reference attribution in
  public/models/SOURCES.md. This remains an illustrative reconstruction.
- Compensate Havok contact clearance for the whole stride, retaining it during
  airborne frames. A continuous walking support envelope drives pelvis and leg
  IK together. Preserve the lope's airborne float and physics/camera settings.
- Increase procedural arm swing coefficient from 0.5 to 0.7; ease the authored
  idle/walk overlay over a 0.16 s time constant rather than switching instantly.

## Evidence

- Regression reproduced the original ~0.15 m pelvis pop in one frame at
  30/60/120 FPS and during a brief loss of ground contact. New tests pass.
- Authored arm start/stop regression reproduced a 0.24 rad overlay snap;
  the first-frame change is now below 0.04 rad in both directions.
- 108 targeted tests pass across gait, rig, asset, model contracts and sample/
  module action controllers. TypeScript and production build pass. Existing
  large mission-chunk warning remains; no full-suite claim.
- Babylon/WebGL fixture checked idle, walk, sample and installation poses.
  Latest fixture console has no errors. Actual surface QA ran 249 frames of
  movement: maximum adjacent pelvis-offset change 0.0193 m; camera remained
  alpha -PI/2, beta 1.25, radius 7. Surface console only reports missing favicon.
- Final embedded model: 3,956,056 bytes, 39 bones. No new dependencies or video.

Visual acceptance of the joints and garment finish remains with the user.

## Follow-up: sleeves welded to torso/hips

User spotted an unintended cloth web between arms and torso. Original source
sleeves intersected the ribcage; the voxel union fused them along their length.
After opening the armpits, inspection also caught a second weld at wrist/hip
height. The corrected bind pose places shoulders at ±0.325 m and wrists at
±0.38 m, with interpolated elbow positions and a matching slightly splayed sleeve.
The torso profile leaves clearance below the shoulder; gloves, fingers and
tool sockets share the new wrist position. Arm lengths and existing animation
channels/camera controls are preserved apart from the small lateral bind offset.

Export regression now intersects the mesh at 22 heights from 0.94 to 1.36 m:
each must have three independent cross-sections (two arms and torso), with
at least 12 mm clearance on each side. All 89 model/asset checks pass. A Babylon
fixture visually checked idle, enlarged arm swing and the sample pose without
the wrist-to-hip web. This supersedes the earlier assumption that one connected
cloth shell alone was sufficient to validate the weld.
