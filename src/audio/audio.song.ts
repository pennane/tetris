import * as R from 'ramda'
import { BASS_VOLUME } from './audio.constants'
import { transpose, transposePitch, valueAt } from './audio.lib'
import { noteAt } from './audio.lens'
import type { Level } from '../logic/logic.model'
import type {
  LevelCurve,
  Note,
  NoteOrRest,
  NoteTransformer,
  Pitch,
  Song,
  Steps,
  Track
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

const BASS_ROOTS: readonly Pitch[] = ['E1', 'A1', 'E1', 'A1', 'D1', 'C1', 'E1', 'A1']

const MELODY_FROM_LEVEL: ReadonlyArray<readonly [Level, NoteTransformer]> = [
  [2, noteAt.volume.over(R.multiply(1.1))],
  [3, noteAt.volume.over(R.multiply(1.2))],
  [5, noteAt.volume.over(R.add(0.1))],
  [6, noteAt.instrument.set('sawtooth')],
  [7, transpose(2)],
  [8, noteAt.mode.set('decay')],
  [9, noteAt.volume.over(R.add(0.1))],
  [10, transpose(2)],
  [11, noteAt.mode.set('both')],
  [12, transpose(-12)],
  [13, noteAt.instrument.set('square')]
]

const andThen = (f: NoteTransformer, g: NoteTransformer) => R.pipe(f, g)

const melodyArrangementFor = (level: Level) =>
  MELODY_FROM_LEVEL.filter(([from]) => level >= from)
    .map(([, transform]) => transform)
    .reduce(andThen, R.identity)

const leadVoice = R.pipe(transpose(-24), noteAt.mode.set('decay'))

const voiceLead = (n: NoteOrRest) => n && leadVoice(n)

export const LEAD: Track = {
  joinsAt: 1,
  notes: MELODY.map(voiceLead),
  arrangeFor: melodyArrangementFor
}

export const BASS: Track = {
  joinsAt: 1,
  notes: BASS_ROOTS.flatMap(bassBar),
  arrangeFor: R.always(R.identity)
}

export const SONG: Song = [LEAD, BASS]

export const DRIVE_BY_LEVEL: LevelCurve = [
  [4, 1],
  [6, 20]
]

export const driveFor = valueAt(DRIVE_BY_LEVEL)
