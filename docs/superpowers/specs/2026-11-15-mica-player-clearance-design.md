# MICA player clearance

Approved scope: user wants the astronaut always outside MICA, including its panels, with E/Q available and current camera preserved. Implement now; user performs visual QA, no video.

Root cause: MICA is a visual hierarchy without a player collision/exclusion volume. Opening memory simply preserves the already-overlapping player position.

Approaches: a physical chassis collider would still allow jumping onto solar panels; repositioning only when memory opens would leave normal walking broken. Selected: a swept horizontal exclusion footprint around the loaded model, applied only to the on-foot astronaut. It follows towing/rotation, blocks walking/running/jumping into the footprint, and lets motion slide along the edge.

Cache bounds from the actual loaded geometry (placeholder supported). Project through the current world transform to a yaw-oriented footprint, with small geometry clearance and 0.5 m player clearance for arms/backpack. Do not add a solid ceiling or robot physics body. PIP towing and hatch animation remain unmodified. Keep the existing 3.2 m interaction radius; verify E/Q can be reached outside the volume.

Apply the constraint to the Havok character position/velocity before visual gait and before interactions. Remove only inward horizontal velocity; preserve vertical jump/fall velocity. Correct old saves or moved MICA overlaps to the nearest boundary; recheck immediately after tow/demo movement and before opening memory. Preserve camera angles, distance and follow behavior. Mounted rover behavior is outside this on-foot fix.

Acceptance: walk/run/jump from every side and rotated corners cannot enter; high-speed segments cannot tunnel; tangent/outward movement stays free; existing overlap resolves; tilted/towed MICA has a matching footprint; E/Q remains accessible; repair, towing, hatch and memory still work. Tests/build, user visual QA.
