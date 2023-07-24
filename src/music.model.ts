import { NOTE_BASES } from './music.constants'

export type NoteWithOctave = `${(typeof NOTE_BASES)[number]}${
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7}`

export type PlayMode = 'normal' | 'decay' | 'attack'
export type Duration = number
export type Volume = number
export type Note = [NoteWithOctave, Duration, Volume, PlayMode, OscillatorType]
