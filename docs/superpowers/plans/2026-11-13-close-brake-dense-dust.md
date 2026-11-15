# Close braking camera and denser dust plan

Spec: ../specs/2026-11-13-close-brake-dense-dust-design.md

- [x] Pin high-camera framing and near-ground density expectations in existing tests.
- [x] Update descentCamera distance and finalDescent emission multiplier only.
- [x] Run camera/burn-entry/descent/dust checks and production build; verify existing exhaust files unchanged.
- [x] Record current presentation values in DESIGN.md. User performs visual QA; no recordings.

Validation: 47 tests across 6 suites passed; the new framing and density expectations failed before the change and passed after it. Production build passed with existing large-chunk warning. Exhaust shader and renderer SHA256 hashes match their pre-edit values. No visual QA capture or recording; user will assess in-game appearance.
