import { prop } from '../util/accessor'
import type { Note } from './audio.model'

const note = prop<Note>()

export const noteAt = {
  pitch: note('pitch'),
  duration: note('duration'),
  volume: note('volume'),
  mode: note('mode'),
  waveform: note('waveform')
} as const
