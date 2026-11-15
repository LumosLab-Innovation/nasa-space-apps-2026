> Status: rolled back at user request on 2026-11-13. Retained as historical context, not the current visual specification. The independent hatch depth-precision fix remains active.

# Lunar vacuum exhaust refinement

User-supplied direction: a short white-blue core, a broad dilute exhaust envelope, and grey low ballistic dust. This supersedes the earlier tall, smoke-like landing cloud direction. Camera, flight dynamics, RCS visibility and Orion auxiliary ignition stay unchanged.

## Approach
Atmospheric plasma around the lunar hull is excluded: the lunar exosphere cannot produce that reentry effect. Enhance the existing pooled shader renderer rather than adding a separate hull effect or new assets. Preserve RCS/auxiliary shaders, and specialize main engines only.

Main flow broadens downstream with soft Gaussian edges, a short luminous core and fast axial texture motion. Independent length variation is restrained to a few percent. Ground gas is faint; terrain-sampled, uneven grey dust dominates contact. Fine dust moves rapidly sideways in low ballistic arcs with no drag or buoyancy, and fades independently before terrain collision/lifetime expiry. No altitude-triggered cutoff at 1.1 km; thrust drives the effect continuously through that point.

References: NASA Apollo post-shutdown imagery and analysis https://history.nasa.gov/wp-content/uploads/static/history/alsj/WOTM/WOTM-A17DustObscur.html ; NASA plume simulation https://www.nasa.gov/general/rocket-exhaust-on-the-moon-nasa-supercomputers-reveal-surface-effects/ . These inform artistic parameters, not a calibrated CFD simulation or measured HLS plume color.

Verification: existing exhaust transfer/pause/reset, dust collision/lifetime and flight tests; production build. Visual QA by user, no recordings or screenshots.
