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
/** Seconds. */
export type Duration = number
export type Volume = number

export type Note = Readonly<{
  pitch: Pitch
  duration: Duration
  volume: Volume
  mode: PlayMode
  waveform: OscillatorType
}>
