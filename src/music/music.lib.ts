import { MAX_LEVEL, MIN_LEVEL } from '../logic/logic.constants'
import type { Level } from '../logic/logic.model'
import { clamp, mapToNewRange } from '../util/fp'
import { A4_HZ, FASTEST_MUSIC, SLOWEST_MUSIC } from './music.constants'
import { noteAt } from './music.lens'
import { NOTE_NAMES, OCTAVES } from './music.model'
import type { Pitch } from './music.model'

/** Every representable pitch, ascending by semitone. */
export const PITCHES: readonly Pitch[] = OCTAVES.flatMap((octave) =>
  NOTE_NAMES.map((name) => `${name}${octave}` as const)
)

const A4_INDEX = PITCHES.indexOf('A4')

export const semitoneOf = (pitch: Pitch): number => PITCHES.indexOf(pitch)

export const hz = (pitch: Pitch): number =>
  A4_HZ * 2 ** ((semitoneOf(pitch) - A4_INDEX) / 12)

/** Shifts by `steps` semitones, clamped to the representable range. */
export const transposePitch =
  (steps: number) =>
  (pitch: Pitch): Pitch =>
    PITCHES[clamp(0, PITCHES.length - 1, semitoneOf(pitch) + steps)] ?? pitch

export const transpose = (steps: number) =>
  noteAt.pitch.over(transposePitch(steps))

export const levelToMusicSpeedMultiplier = (level: Level) =>
  mapToNewRange(level, MIN_LEVEL, MAX_LEVEL, SLOWEST_MUSIC, FASTEST_MUSIC)

export const createDistortionCurve = (amount = 50) => {
  const samples = 44100
  const curve = new Float32Array(samples)
  for (let i = 0; i < samples; ++i) {
    const x = (i * 2) / samples - 1
    curve[i] = Math.max(-1, Math.min(1, amount * x))
  }
  return curve
}
