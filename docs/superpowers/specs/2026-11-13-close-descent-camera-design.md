# Close descent camera and restored landing presentation

Status: approved by the user ("duyeejt"); implementation authorized.

## Intent

Restore the earlier low chase-camera and landing presentation that the user preferred. Correct the craft's ground-relative altitude without making it tiny in the frame or introducing another cinematic terrain/transition redesign.

The user's chat acceptance follows the browser selection `camera-close-near` (recorded in `.superpowers/brainstorm/915-1794544520/state/events`). The selected reference is therefore **Gần hơn**, not the preview's initial **Vừa** setting.

## Approaches

- Earlier A: original camera direction with a distant camera and corrected physical ship scale. Rejected: too far from the ship.
- Earlier B: raised camera looking further down. Rejected in favour of the earlier low camera angle.
- Selected: the low camera direction, moved close to the correctly scaled ship. Only a modest pullback with increasing altitude. The browser offered Gần hơn / Vừa / Lùi nhẹ; Gần hơn was selected.

## Approved visual reference and proposed integration

- Use the **Gần hơn** renders at 1,000 / 500 / 300 / 100 m. Source images: `.superpowers/brainstorm/915-1794544520/content/near-*.png`.
- Preview camera distance parameter in metres: `0.8 × (110 + 100 × clamp(height / 1000, 0, 1))`. At 300 m this parameter is 112 m; it is not the ship's altitude or the full slant distance to the camera.
- Camera offset from the craft: backward `d`, upward `0.45d`, sideways `0.3d`; target forward `0.6d`. Retain the preview's field of view and the craft's real scale. Smooth camera motion in gameplay rather than snapping between the four reference heights.
- Keep the corrected metre/kilometre conversion and measure clearance against the actual rendered ground below the craft. Do not fake altitude by enlarging the ship or lowering the terrain.
- Restore the earlier landing shot and ship rotation presentation around 300 m, with a close framing compatible with this approach. Remove the newly introduced wide/downward composition and visible artificial terrain extension from that presentation. Do not blindly revert loading, input, pause or model-performance fixes.
- Do not introduce a black screen or second loading screen. Reuse prepared scenes and retain live rendering where it supports the restored presentation; avoid the old frozen screenshot overlap. The exact short handoff timing is an implementation choice to be checked in motion.

## Preserve

Original NASA lunar heightmap/texture assets, Earth and halo, approved spacecraft/gear/elevator models, HUD/settings, saves, gameplay balance and landing controls. No new terrain dataset or resculpting. No changes to menu/loading artwork.

## Acceptance

Compare actual game captures with the selected close-camera references at the four heights, then inspect the full 500 → 300 → 100 m sequence. Verify clearance numerically, check that the camera does not intersect terrain, and exercise manual/automatic handoff, held inputs, pause and Continue. Measure frame time separately from recording overhead. Report remaining visual or performance issues rather than asserting perfect smoothness.

The still preview approves composition only; it does not establish that the transition animation is smooth. If a geometric constraint requires a materially different framing, show the difference before replacing the approved view.
