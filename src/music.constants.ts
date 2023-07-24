import { createNote, increaseStepBy } from './music.lib'
import * as R from 'ramda'
import { Note, NoteWithOctave } from './music.model'
import { Level } from './logic.model'

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

export const LEVEL_TO_NOTE_TRANSFORMER = (
  level: Level
): ((note: Note, index: number) => Note) => {
  if (level === 1) {
    return R.identity
  } else if (level === 2) {
    return (n) => [n[0], n[1], n[2] * 1.1, n[3], 'sawtooth']
  } else if (level === 3) {
    return (n) => [n[0], n[1], n[2], n[3], 'sawtooth']
  } else if (level <= 5) {
    return (n, i) => [
      n[0],
      n[1],
      n[2] * Math.sin(Math.sin(i)) + 0.01,
      n[3],
      'sawtooth'
    ]
  } else if (level === 6) {
    return (n, i) => [
      n[0],
      n[1],
      Math.sin(i + n[2]) + 0.01,
      'normal',
      'sawtooth'
    ]
  } else if (level <= 8) {
    return R.pipe(
      (n: Note, i: number): Note => [
        n[0],
        n[1],
        n[2] + Math.sin(i) + 0.01,
        'normal',
        'sawtooth'
      ],
      increaseStepBy(2)
    )
  }
  return R.pipe(
    (n: Note, i: number): Note => [
      n[0],
      n[1],
      Math.min(n[2] + Math.tan(i) + 0.01, 2),
      'decay',
      'sawtooth'
    ],
    increaseStepBy(14)
  )
}
