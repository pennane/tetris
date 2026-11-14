import { MAX_LEVEL, MIN_LEVEL } from '../logic/logic.constants'
import type { Level } from '../logic/logic.model'
import { clamp, mapToNewRange } from '../util/fp'
import * as R from 'ramda'
import {
  A4_HZ,
  BASE_STEP_SECONDS,
  DURATION_MULTIPLIER_AT_MAX_LEVEL,
  DURATION_MULTIPLIER_AT_MIN_LEVEL
} from './audio.constants'
import { noteAt } from './audio.lens'
import { NOTE_NAMES, OCTAVES } from './audio.model'
import type {
  LevelCurve,
  Note,
  NoteOrRest,
  Pitch,
  Song,
  Steps,
  Track
} from './audio.model'

export const PITCHES_ASCENDING: readonly Pitch[] = OCTAVES.flatMap((octave) =>
  NOTE_NAMES.map((name) => `${name}${octave}` as const)
)

const A4_INDEX = PITCHES_ASCENDING.indexOf('A4')

export const semitoneOf = (pitch: Pitch) =>
  PITCHES_ASCENDING.indexOf(pitch)

export const hz = (pitch: Pitch) =>
  A4_HZ * 2 ** ((semitoneOf(pitch) - A4_INDEX) / 12)

export const transposePitch =
  (steps: number) =>
  (pitch: Pitch) =>
    PITCHES_ASCENDING[
      clamp(0, PITCHES_ASCENDING.length - 1, semitoneOf(pitch) + steps)
    ] ?? pitch

export const transpose = (steps: number) =>
  noteAt.pitch.over(transposePitch(steps))

export const levelToDurationMultiplier = (level: Level) =>
  mapToNewRange(
    level,
    MIN_LEVEL,
    MAX_LEVEL,
    DURATION_MULTIPLIER_AT_MIN_LEVEL,
    DURATION_MULTIPLIER_AT_MAX_LEVEL
  )

export const stepSecondsFor = R.pipe(
  levelToDurationMultiplier,
  R.multiply(BASE_STEP_SECONDS)
)

export const stepsOf = (n: NoteOrRest) => n?.length ?? 1

export const addLength = (total: Steps, n: NoteOrRest) => total + stepsOf(n)

const trackLength = (track: Track) => track.notes.reduce(addLength, 0)

export const songLength = (song: Song) =>
  R.reduce(R.max<Steps>, 0, song.map(trackLength))

const joinedBy = (level: Level) => (track: Track) => level >= track.joinsAt

export const activeTracks = (song: Song, level: Level) =>
  song.filter(joinedBy(level))

const indexByStart = (notes: readonly NoteOrRest[]) => {
  const starts = new Map<Steps, Note>()
  notes.reduce((step: Steps, n) => {
    if (n) starts.set(step, n)
    return step + stepsOf(n)
  }, 0)
  return starts
}

const startsByTrack = new WeakMap<Track, ReadonlyMap<Steps, Note>>()

const startsOf = (track: Track) => {
  const known = startsByTrack.get(track)
  if (known) return known
  const starts = indexByStart(track.notes)
  startsByTrack.set(track, starts)
  return starts
}

const noteStartingAt = (level: Level, step: Steps) => (track: Track) => {
  const n = startsOf(track).get(step)
  return n ? [track.arrangeFor(level)(n)] : []
}

export const notesAt = (song: Song, level: Level, step: Steps) =>
  activeTracks(song, level).flatMap(noteStartingAt(level, step))

export const valueAt = (curve: LevelCurve) => (level: Level) => {
  const [first] = curve
  const nextIndex = curve.findIndex(([at]) => level <= at)
  const previous = curve[nextIndex - 1]
  const next = curve[nextIndex]
  if (!next) return R.last(curve)[1]
  if (!previous) return first[1]
  return mapToNewRange(level, previous[0], next[0], previous[1], next[1])
}

export const fullCharacterFrom = (curve: LevelCurve) => R.last(curve)[0]

const peakVolumeOf = (level: Level) => (track: Track) =>
  track.notes
    .filter(R.isNotNil)
    .map(R.pipe(track.arrangeFor(level), noteAt.volume.view))
    .reduce(R.max<number>, 0)

export const voicePeakAt = (song: Song, level: Level) =>
  R.sum(activeTracks(song, level).map(peakVolumeOf(level)))

export const createDistortionCurve = (amount: number) => {
  const samples = 44100
  const curve = new Float32Array(samples)
  for (let i = 0; i < samples; ++i) {
    const x = (i * 2) / samples - 1
    curve[i] = Math.max(-1, Math.min(1, amount * x))
  }
  return curve
}
