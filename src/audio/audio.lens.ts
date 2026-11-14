import { prop } from '../util/accessor'
import type { Note } from './audio.model'

const note = prop<Note>()

export const noteAt = {
  pitch: note('pitch'),
  length: note('length'),
  volume: note('volume'),
  mode: note('mode'),
  instrument: note('instrument')
} as const
