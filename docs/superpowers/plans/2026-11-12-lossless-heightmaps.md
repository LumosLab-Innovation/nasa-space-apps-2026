# Lossless heightmap packaging

Approved scope: lossless compression for both heightmaps, unchanged imagery, QA New Game/Continue/loading.

- Record original decoded SHA-256 hashes and texture hashes before editing.
- Test exact orbital uint16 reconstruction, row reset/wraparound, and surface Float32 byte preservation.
- Encode orbital rows with modulo-65536 deltas then gzip; gzip surface Float32 bytes directly. Use versioned `.bin` URLs to avoid old cache formats and automatic HTTP gzip decoding.
- Update both data builders, runtime loaders, asset manifest and offline consumers. Remove obsolete public height files after confirming reconstruction.
- Verify unit tests, build, texture hashes, actual browser loading progress and both play flows. No save format changes.

## Completed verification

- Orbital height asset: 1,488,405 → 1,189,871 bytes. Surface height asset: 1,052,676 → 944,338 bytes. All actively loaded lunar imagery + heights + height metadata: 7,190,075 → 6,783,203 bytes (406,872 bytes saved).
- Decoded orbital SHA-256 remains `02f2572efc0a25970b91d04dbebc19e96697c2963c890ab348f6f54d098505c3`. Decoded surface SHA-256 remains `11b08c0f9861422cdde7c441af77517d7d36d0733362e044f39a7de4adb74934`. Regression tests verify both full datasets, not only selected heights.
- All three lunar image textures have unchanged SHA-256 hashes. No resolution, colour, normal, shadow or height-value changes.
- Full suite: 65 files, 421 tests passed. TypeScript + Vite production build passed; existing large gameplay chunk warning remains. Production output contains only the new height formats.
- Browser QA, separate clean contexts: New Game reached orbital scene; Continue restored `landing:done` with `hm.source === 'lola'`, no procedural fallback. Both new binary URLs returned HTTP 200 with no automatic Content-Encoding.
- Held orbital request in New Game and surface request in Continue: loading stayed at 89%, canvas busy, no gameplay started. Releasing each request produced monotonic progress through 93/96 to 100 before ready. Zero browser errors. Inspected ready screenshots for both flows.
- Logs: `.superpowers/compression-tests.log`, `compression-build.log`, `lossless-browser-qa.json`. Screenshots: `.superpowers/screenshots/lossless-{new,continue}-{loading,ready}.png`.
