# Approved old-B braking plasma

User selected old B from the comparison and explicitly authorized integration on 2026-11-13.

- Preserve the exact old-B shader and two shells (28 m long, breadth 1.05, strengths 1.8 / 0.9); do not use the subsequent flicker revision. Latest user revision narrows both shells radially by 8%, keeping length and shader unchanged.
- Start a gentle 1.2-second reveal on the first positive engine throttle during braking at or below 13,000 m AGL (latest user revision). Maintain the effect until 1,100 m above ground, then fade over 2 real gameplay seconds. The duration is an implementation choice. Pause freezes both animation and fade. No reappearance after the threshold.
- This is a cinematic fictional effect for the lunar setting, not an atmospheric simulation.
- Camera, engine exhaust, RCS, Orion, dust, terrain and flight physics stay unchanged.
- Warm shaders during startup, allocate no assets at burn entry; attach to the existing metre-scale exhaust mount so all rig transforms agree. Dispose with the scene.
- Alternatives: A was narrower; the new flicker-B was more irregular. The user selected old B, preserving its existing motion.
- Verify timing, pause, manual throttle, frame-rate independence, scene lifecycle and WebGL compilation. No video; user performs visual QA.
