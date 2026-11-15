# Slight braking pullback and denser touchdown dust

User approved a slight pullback to reveal terrain while keeping the ship/exhaust readable, and denser near-ground dust. Retain current flame shader and core boost exactly; user performs visual QA without recording.

Approach: replace altitude-proportional high camera distance with a smooth distance tied to displayed ship length. Keep current camera direction, FOV, burn-entry blend and framing below 1.5 km. A fixed distance was rejected because ship presentation scale changes; an altitude-proportional pullback is the current too-distant behavior. High shot distance is close distance plus 2.6 times the exaggerated portion of ship length, eased across 1.5–6 km.

Dust: retain the restored rising, asymmetric grey clumps and independent lifetimes. Multiply emission by 1–1.5 smoothly from 10 to 3 m, holding the maximum below 3 m. Existing thrust cutoff, terrain collision and pool limits remain. No new assets or flight-physics changes.

Checks: camera distance/slope continuity and readable high framing, dust thrust/height/cutoff, scene handoff and production build. Verify flame source hashes unchanged.
