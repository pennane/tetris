import { createNote, increaseStepBy } from './music.lib'
import * as R from 'ramda'
import { Note, NoteWithOctave } from './music.model'
import { Level } from '../logic/logic.model'
import { overVolume, setPlaymode, setWaveform } from './music.lens'

export const SLOWEST_MUSIC = 1.25
export const FASTEST_MUSIC = 0.1

export const GAP_FOURTH: Note = ['A4', 0.25, 0, 'normal', 'sine']

export const A4 = 440
export const TWELTH_ROOT_OF_2 = 2 ** (1 / 12)

export const NOTE_BASES = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B'
] as const

const allNotesWithOctave: NoteWithOctave[] = R.repeat(NOTE_BASES, 10)
  .flat()
  .map(
    (note, i): NoteWithOctave =>
      `${note}${Math.floor(i / NOTE_BASES.length)}` as NoteWithOctave
  )
const a4Index = allNotesWithOctave.findIndex((n) => n === 'A4')

export const NOTE_TO_HZ = new Map(
  allNotesWithOctave.map((note, i) => [note, createNote(i - a4Index)])
)

export const TETRIS_NOTES: Note[] = [
  ['E5', 0.25, 1, 'normal', 'sine'],
  GAP_FOURTH,
  ['B4', 0.25, 1, 'normal', 'sine'],
  ['C5', 0.25, 1, 'normal', 'sine'],
  ['D5', 0.25, 1, 'normal', 'sine'],
  GAP_FOURTH,
  ['C5', 0.25, 1, 'normal', 'sine'],
  ['B4', 0.25, 1, 'normal', 'sine'],
  ['A4', 0.25, 1, 'normal', 'sine'],
  GAP_FOURTH,
  ['A4', 0.25, 1, 'normal', 'sine'],
  ['C5', 0.25, 1, 'normal', 'sine'],
  ['E5', 0.25, 1, 'normal', 'sine'],
  GAP_FOURTH,
  ['D5', 0.25, 1, 'normal', 'sine'],
  ['C5', 0.25, 1, 'normal', 'sine'],
  ['B4', 0.5, 1, 'normal', 'sine'],
  GAP_FOURTH,
  ['C5', 0.25, 1, 'normal', 'sine'],
  ['D5', 0.25, 1, 'normal', 'sine'],
  GAP_FOURTH,
  ['E5', 0.25, 1, 'normal', 'sine'],
  GAP_FOURTH,
  ['C5', 0.25, 1, 'normal', 'sine'],
  GAP_FOURTH,
  ['A4', 0.25, 1, 'normal', 'sine'],
  GAP_FOURTH,
  ['A4', 0.75, 1, 'normal', 'sine'],
  GAP_FOURTH,
  ['D5', 0.5, 1, 'normal', 'sine'],
  GAP_FOURTH,
  ['F5', 0.25, 1, 'normal', 'sine'],
  ['A5', 0.25, 1, 'normal', 'sine'],
  GAP_FOURTH,
  ['G5', 0.25, 1, 'normal', 'sine'],
  ['F5', 0.25, 1, 'normal', 'sine'],
  ['E5', 0.5, 1, 'normal', 'sine'],
  GAP_FOURTH,
  ['C5', 0.25, 1, 'normal', 'sine'],
  ['E5', 0.25, 1, 'normal', 'sine'],
  GAP_FOURTH,
  ['D5', 0.25, 1, 'normal', 'sine'],
  ['C5', 0.25, 1, 'normal', 'sine'],
  ['B4', 0.25, 1, 'normal', 'sine'],
  GAP_FOURTH,
  ['B4', 0.25, 1, 'normal', 'sine'],
  ['C5', 0.25, 1, 'normal', 'sine'],
  ['D5', 0.25, 1, 'normal', 'sine'],
  GAP_FOURTH,
  ['E5', 0.25, 1, 'normal', 'sine'],
  GAP_FOURTH,
  ['C5', 0.25, 1, 'normal', 'sine'],
  GAP_FOURTH,
  ['A4', 0.25, 1, 'normal', 'sine'],
  GAP_FOURTH,
  ['A4', 0.75, 1, 'normal', 'sine'],
  GAP_FOURTH
]

export const LEVEL_ONE_TETRIS_NOTES = TETRIS_NOTES.map(
  R.pipe(increaseStepBy(-24), setPlaymode('decay'), setWaveform('sine'))
)

type NoteTransformer = (n: Note) => Note
const LEVEL_NOTE_TRANSFORMERS: Array<[Level, NoteTransformer]> = [
  [2, overVolume(R.multiply(1.1))],
  [3, R.pipe(overVolume(R.multiply(1.1)), setWaveform('triangle'))],
  [5, R.pipe(overVolume(R.add(0.05)), setWaveform('sine'))],
  [6, setWaveform('sawtooth')],
  [7, increaseStepBy(2)],
  [8, setPlaymode('decay')],
  [9, overVolume(R.add(0.1))],
  [10, increaseStepBy(2)],
  [11, setPlaymode('both')],
  [12, increaseStepBy(-12)],
  [13, setWaveform('square')]
]

export const LEVEL_TO_NOTE_TRANSFORMER = (level: number) =>
  R.reduce(
    (composed, [target, transformer]) => {
      if (level >= target) return R.pipe(composed, transformer)
      else return R.reduced(composed)
    },
    R.identity as NoteTransformer,
    LEVEL_NOTE_TRANSFORMERS
  )
