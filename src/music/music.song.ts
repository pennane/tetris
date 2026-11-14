import * as R from 'ramda'
import { transpose } from './music.lib'
import { noteAt } from './music.lens'
import type { Level } from '../logic/logic.model'
import type { Note, Pitch } from './music.model'

const note = (pitch: Pitch, duration: number): Note => ({
  pitch,
  duration,
  volume: 1,
  mode: 'normal',
  waveform: 'sine'
})

const REST: Note = { ...note('A4', 0.25), volume: 0 }

const MELODY: readonly Note[] = [
  note('E5', 0.25),
  REST,
  note('B4', 0.25),
  note('C5', 0.25),
  note('D5', 0.25),
  REST,
  note('C5', 0.25),
  note('B4', 0.25),
  note('A4', 0.25),
  REST,
  note('A4', 0.25),
  note('C5', 0.25),
  note('E5', 0.25),
  REST,
  note('D5', 0.25),
  note('C5', 0.25),
  note('B4', 0.5),
  REST,
  note('C5', 0.25),
  note('D5', 0.25),
  REST,
  note('E5', 0.25),
  REST,
  note('C5', 0.25),
  REST,
  note('A4', 0.25),
  REST,
  note('A4', 0.75),
  REST,
  note('D5', 0.5),
  REST,
  note('F5', 0.25),
  note('A5', 0.25),
  REST,
  note('G5', 0.25),
  note('F5', 0.25),
  note('E5', 0.5),
  REST,
  note('C5', 0.25),
  note('E5', 0.25),
  REST,
  note('D5', 0.25),
  note('C5', 0.25),
  note('B4', 0.25),
  REST,
  note('B4', 0.25),
  note('C5', 0.25),
  note('D5', 0.25),
  REST,
  note('E5', 0.25),
  REST,
  note('C5', 0.25),
  REST,
  note('A4', 0.25),
  REST,
  note('A4', 0.75),
  REST
]

export const SOUNDTRACK: readonly Note[] = MELODY.map(
  R.pipe(transpose(-24), noteAt.mode.set('decay'), noteAt.waveform.set('sine'))
)

type NoteTransformer = (n: Note) => Note

/** Cumulative: every entry at or below the current level applies, in order. */
const LEVEL_NOTE_TRANSFORMERS: ReadonlyArray<readonly [Level, NoteTransformer]> = [
  [2, noteAt.volume.over(R.multiply(1.1))],
  [3, R.pipe(noteAt.volume.over(R.multiply(1.2)), noteAt.waveform.set('square'))],
  [5, R.pipe(noteAt.volume.over(R.add(0.1)), noteAt.waveform.set('sine'))],
  [6, noteAt.waveform.set('sawtooth')],
  [7, transpose(2)],
  [8, noteAt.mode.set('decay')],
  [9, noteAt.volume.over(R.add(0.1))],
  [10, transpose(2)],
  [11, noteAt.mode.set('both')],
  [12, transpose(-12)],
  [13, noteAt.waveform.set('square')]
]

export const noteTransformerFor = (level: Level): NoteTransformer =>
  LEVEL_NOTE_TRANSFORMERS.filter(([from]) => level >= from)
    .map(([, transform]) => transform)
    .reduce<NoteTransformer>((acc, f) => (n) => f(acc(n)), R.identity)
