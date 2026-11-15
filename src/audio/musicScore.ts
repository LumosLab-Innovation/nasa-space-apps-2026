/**
 * The game's original score (Plan 5, user request): a minimal organ piece in D minor / D Dorian. It borrows
 * only the *mood* of big space-film organ scores — long chords, a building pulse — and none of their
 * melodies, chord sequences or ticking motif. Notes are MIDI numbers (60 = middle C, 69 = A4 = 440 Hz).
 */

export const midiToHz = (m: number): number => 440 * 2 ** ((m - 69) / 12);

/** Chords, two bars each, low to high. */
export const CHORDS = {
  /** Dm(add9) → B♭maj7 → Gm9 → Asus4 */
  calm: [
    [50, 57, 64, 65],
    [46, 53, 57, 62],
    [43, 50, 58, 69],
    [45, 52, 57, 62],
  ],
  /** B♭maj7 → C(add9) → Dsus4 → D major: the Sun comes back through the notch. */
  dawn: [
    [46, 53, 57, 62],
    [48, 55, 62, 64],
    [50, 57, 62, 67],
    [50, 57, 62, 66, 69],
  ],
} as const;

/** Main theme: eight notes, one per beat over the two-bar chord cycle (original). */
export const THEME = [69, 74, 76, 77, 76, 74, 72, 69];

/** Pip: bright and bouncy, four notes. */
export const PIP_MOTIF = [67, 72, 76, 74];
/** MICA: two sparse machine bells. */
export const MICA_BELLS = [88, 83];

/** Organ drawbars: partial number → gain. */
export const ORGAN_PARTIALS: [number, number][] = [[1, 1], [2, 0.5], [3, 0.25], [4, 0.18], [8, 0.08]];

/** The low pedal note (D2). */
export const PEDAL = 38;

/** The touchdown chord: a wide D major. */
export const TOUCHDOWN_CHORD = [38, 45, 50, 54, 57, 62, 66];
