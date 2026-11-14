import type { Level } from '../logic/logic.model'
import type { NonEmpty } from '../util/fp'

export const NOTE_NAMES = [
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
export const OCTAVES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const

export type NoteName = (typeof NOTE_NAMES)[number]
export type Octave = (typeof OCTAVES)[number]
export type Pitch = `${NoteName}${Octave}`

export type PlayMode = 'normal' | 'decay' | 'attack' | 'both'
export type Instrument = 'pulse' | 'triangle' | 'noise' | 'sine' | 'square' | 'sawtooth'
export type Seconds = number
export type Steps = number
export type Volume = number

export type Note = Readonly<{
  pitch: Pitch
  length: Steps
  volume: Volume
  mode: PlayMode
  instrument: Instrument
}>

export type Rest = null
export type NoteOrRest = Note | Rest
export type NoteTransformer = (note: Note) => Note

export type Bus = 'driven' | 'clean'

export type Track = Readonly<{
  bus: Bus
  joinsAt: Level
  notes: readonly NoteOrRest[]
  arrangeFor: (level: Level) => NoteTransformer
}>

export type Song = readonly Track[]

export type LevelCurve = NonEmpty<readonly [Level, number]>
