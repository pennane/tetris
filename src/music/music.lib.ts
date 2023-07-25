import { MIN_LEVEL, MAX_LEVEL } from '../logic/logic.constants'
import { Level } from '../logic/logic.model'
import { mapToNewRange } from '../util/fp'
import {
  A4,
  TWELTH_ROOT_OF_2,
  SLOWEST_MUSIC,
  FASTEST_MUSIC,
  NOTE_BASES
} from './music.constants'
import { overNote } from './music.lens'
import { NoteWithOctave } from './music.model'

export const createNote = (n: number) => A4 * TWELTH_ROOT_OF_2 ** n

export const levelToMusicSpeedMultiplier = (level: Level) =>
  mapToNewRange(level, MIN_LEVEL, MAX_LEVEL, SLOWEST_MUSIC, FASTEST_MUSIC)

export const increaseStepBy = (steps: number) =>
  overNote((noteWithOctave) => {
    let note: string, octave: string

    if (noteWithOctave.charAt(1) === '#') {
      note = noteWithOctave.slice(0, 2)
      octave = noteWithOctave.slice(2)
    } else {
      note = noteWithOctave.charAt(0)
      octave = noteWithOctave.charAt(1)
    }

    const baseIndex = NOTE_BASES.findIndex((n) => n === note)
    const maxIndex = NOTE_BASES.length - 1
    let stepped = 0
    let newIndex = baseIndex
    let newOctave = parseInt(octave)
    while (steps !== stepped) {
      if (steps < 0) {
        stepped--
        newIndex--
        if (newIndex < 0) {
          newIndex = maxIndex
          newOctave--
        }
      } else {
        stepped++
        newIndex++
        if (newIndex > maxIndex) {
          newIndex = 0
          newOctave++
        }
      }
    }
    return `${NOTE_BASES[newIndex]}${newOctave}` as NoteWithOctave
  })

export const createDistortionCurve = (amount = 50) => {
  const samples = 44100
  const curve = new Float32Array(samples)
  for (let i = 0; i < samples; ++i) {
    const x = (i * 2) / samples - 1
    curve[i] = Math.max(-1, Math.min(1, amount * x))
  }
  return curve
}
