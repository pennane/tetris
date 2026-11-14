import type { GameEvent } from '../logic/logic.model'
import { CUE_STEP_SECONDS } from './audio.constants'
import { addLength } from './audio.lib'
import type { Instrument, Note, NoteOrRest, Pitch, Steps, Volume } from './audio.model'

export type Cue = readonly NoteOrRest[]

const voice =
  (instrument: Instrument, volume: Volume, length: Steps) =>
  (pitch: Pitch): Note => ({ pitch, length, volume, mode: 'decay', instrument })

const tick = voice('pulse', 0.25, 1)
const chirp = voice('pulse', 0.25, 1)
const thud = voice('noise', 0.5, 3)
const thunk = voice('triangle', 1, 3)
const sparkle = voice('pulse', 0.4, 2)
const fanfare = voice('pulse', 0.4, 3)
const fall = voice('pulse', 0.4, 4)
const toll = voice('triangle', 0.6, 12)

const phrase = (play: (pitch: Pitch) => Note, ...pitches: Pitch[]) =>
  pitches.map(play)

const LINE_CLEAR_ARPEGGIO: readonly Pitch[] = ['A5', 'C6', 'E6', 'A6', 'C7']

type CueTable = {
  [K in GameEvent['type']]: K extends 'linesCleared' ? (count: number) => Cue : Cue
}

const CUES: CueTable = {
  moved: [tick('C6')],
  rotated: phrase(chirp, 'E6', 'A6'),
  hardDropped: [thud('C4')],
  pieceLocked: [thunk('G4')],
  linesCleared: (count) => LINE_CLEAR_ARPEGGIO.slice(0, count + 1).map(sparkle),
  levelUp: phrase(fanfare, 'C6', 'E6', 'G6', 'C7'),
  gameOver: [...phrase(fall, 'E5', 'D5', 'C5', 'B4', 'A4', 'G#4'), toll('A3')]
}

export const cueFor = (event: GameEvent): Cue =>
  event.type === 'linesCleared' ? CUES.linesCleared(event.count) : CUES[event.type]

export const cueSeconds = (cue: Cue) =>
  cue.reduce(addLength, 0) * CUE_STEP_SECONDS
