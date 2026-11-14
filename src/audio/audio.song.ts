import * as R from 'ramda'
import {
  ARPEGGIO_VOLUME,
  BASS_VOLUME,
  HAT_VOLUME,
  KICK_VOLUME,
  SNARE_VOLUME
} from './audio.constants'
import { transpose, transposePitch, valueAt } from './audio.lib'
import { noteAt } from './audio.lens'
import type { Level } from '../logic/logic.model'
import type {
  Instrument,
  LevelCurve,
  Note,
  NoteOrRest,
  NoteTransformer,
  Pitch,
  Song,
  Steps,
  Track,
  Volume
} from './audio.model'

const note = (pitch: Pitch, length: Steps = 1): Note => ({
  pitch,
  length,
  volume: 1,
  mode: 'normal',
  instrument: 'pulse'
})

const _ = null

const MELODY: readonly NoteOrRest[] = [
  note('E5'), _, note('B4'), note('C5'), note('D5'), _, note('C5'), note('B4'),
  note('A4'), _, note('A4'), note('C5'), note('E5'), _, note('D5'), note('C5'),
  note('B4', 2), _, note('C5'), note('D5'), _, note('E5'), _,
  note('C5'), _, note('A4'), _, note('A4', 3), _,
  note('D5', 2), _, note('F5'), note('A5'), _, note('G5'), note('F5'),
  note('E5', 2), _, note('C5'), note('E5'), _, note('D5'), note('C5'),
  note('B4'), _, note('B4'), note('C5'), note('D5'), _, note('E5'), _,
  note('C5'), _, note('A4'), _, note('A4', 3), _
]

const quarter = (pitch: Pitch) => note(pitch, 2)

const bassNote = R.pipe(
  quarter,
  noteAt.instrument.set('triangle'),
  noteAt.volume.set(BASS_VOLUME),
  noteAt.mode.set('decay')
)

const octaveUp = transposePitch(12)

const bassBar = (root: Pitch) =>
  [root, octaveUp(root), root, octaveUp(root)].map(bassNote)

const BASS_ROOTS: readonly Pitch[] = ['E2', 'A2', 'E2', 'A2', 'D2', 'C2', 'E2', 'A2']

const CHORDS: readonly (readonly [Pitch, Pitch, Pitch])[] = [
  ['E4', 'G#4', 'B4'],
  ['A4', 'C5', 'E5'],
  ['E4', 'G#4', 'B4'],
  ['A4', 'C5', 'E5'],
  ['D4', 'F4', 'A4'],
  ['C4', 'E4', 'G4'],
  ['E4', 'G#4', 'B4'],
  ['A4', 'C5', 'E5']
]

const arpeggioNote = R.pipe(
  R.unary(note),
  noteAt.volume.set(ARPEGGIO_VOLUME),
  noteAt.mode.set('decay')
)

const arpeggioBar = ([root, third, fifth]: readonly [Pitch, Pitch, Pitch]) =>
  [root, third, fifth, third, root, third, fifth, third].map(arpeggioNote)

const percussion =
  (instrument: Instrument, pitch: Pitch, volume: Volume): Note => ({
    pitch,
    length: 1,
    volume,
    mode: 'decay',
    instrument
  })

const KICK = percussion('triangle', 'A1', KICK_VOLUME)
const SNARE = percussion('noise', 'C6', SNARE_VOLUME)
const HAT = percussion('noise', 'C8', HAT_VOLUME)

const HAT_BAR: readonly NoteOrRest[] = [_, HAT, _, HAT, _, HAT, _, HAT]
const DRUM_BAR: readonly NoteOrRest[] = [KICK, _, SNARE, _, KICK, _, SNARE, _]
const BARS = BASS_ROOTS.length

const everyBar = (bar: readonly NoteOrRest[]) => R.flatten(R.repeat(bar, BARS))

const unchanged = R.always<NoteTransformer>(R.identity)

type LevelChanges = ReadonlyArray<readonly [Level, NoteTransformer]>

const KEY_FROM_LEVEL: LevelChanges = [
  [7, transpose(2)],
  [10, transpose(2)]
]

const MELODY_FROM_LEVEL: LevelChanges = [
  [2, noteAt.volume.over(R.multiply(1.1))],
  [3, noteAt.volume.over(R.multiply(1.2))],
  [5, noteAt.volume.over(R.add(0.1))],
  [6, noteAt.instrument.set('sawtooth')],
  [8, noteAt.mode.set('decay')],
  [9, noteAt.volume.over(R.add(0.1))],
  [11, noteAt.mode.set('both')],
  [12, transpose(-12)],
  [13, noteAt.instrument.set('square')]
]

const andThen = (f: NoteTransformer, g: NoteTransformer) => R.pipe(f, g)

const changesUpTo = (changes: LevelChanges) => (level: Level) =>
  changes
    .filter(([from]) => level >= from)
    .map(([, transform]) => transform)
    .reduce(andThen, R.identity)

const keyFor = changesUpTo(KEY_FROM_LEVEL)

const melodyArrangementFor = (level: Level) =>
  R.pipe(keyFor(level), changesUpTo(MELODY_FROM_LEVEL)(level))

const leadVoice = R.pipe(transpose(-24), noteAt.mode.set('decay'))

const voiceLead = (n: NoteOrRest) => n && leadVoice(n)

export const LEAD: Track = {
  bus: 'driven',
  joinsAt: 1,
  notes: MELODY.map(voiceLead),
  arrangeFor: melodyArrangementFor
}

export const BASS: Track = {
  bus: 'clean',
  joinsAt: 1,
  notes: BASS_ROOTS.flatMap(bassBar),
  arrangeFor: keyFor
}

export const HATS: Track = {
  bus: 'clean',
  joinsAt: 2,
  notes: everyBar(HAT_BAR),
  arrangeFor: unchanged
}

export const DRUMS: Track = {
  bus: 'clean',
  joinsAt: 3,
  notes: everyBar(DRUM_BAR),
  arrangeFor: unchanged
}

export const ARPEGGIO: Track = {
  bus: 'clean',
  joinsAt: 4,
  notes: CHORDS.flatMap(arpeggioBar),
  arrangeFor: keyFor
}

const GAP_TONE: Note = { ...leadVoice(note('A4')), volume: 0 }

const gapsAround = (n: NoteOrRest): readonly NoteOrRest[] =>
  n ? R.repeat(null, n.length) : [GAP_TONE]

export const GAPS: Track = {
  bus: 'driven',
  joinsAt: 6,
  notes: MELODY.flatMap(gapsAround),
  arrangeFor: melodyArrangementFor
}

export const SONG: Song = [LEAD, BASS, HATS, DRUMS, ARPEGGIO, GAPS]

export const DRIVE_BY_LEVEL: LevelCurve = [
  [4, 0.5],
  [6, 20]
]

export const driveFor = valueAt(DRIVE_BY_LEVEL)

export const DRIVEN_GAIN_BY_LEVEL: LevelCurve = [
  [4, 1],
  [5, 0.35]
]

export const drivenGainFor = valueAt(DRIVEN_GAIN_BY_LEVEL)

export const STEP_SECONDS_BY_LEVEL: LevelCurve = [
  [1, 0.3125],
  [6, 0.2],
  [15, 0.11]
]

export const stepSecondsFor = valueAt(STEP_SECONDS_BY_LEVEL)
