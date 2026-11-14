import { describe, expect, it } from 'vitest'
import * as R from 'ramda'
import { MAX_LEVEL, MIN_LEVEL } from '../../logic/logic.constants'
import {
  addLength,
  fullCharacterFrom,
  hz,
  notesAt,
  peakInputAt,
  songLength,
  stepSecondsFor,
  transposePitch,
  valueAt
} from '../audio.lib'
import { DRIVE_BY_LEVEL, LEAD, SONG, driveFor } from '../audio.song'
import type { Instrument, LevelCurve, Note, PlayMode, Pitch } from '../audio.model'

describe('pitch', () => {
  it('tunes A4 to 440 and octaves by doubling', () => {
    expect(hz('A4')).toBe(440)
    expect(hz('A5')).toBeCloseTo(880)
    expect(hz('C4')).toBeCloseTo(261.63, 2)
  })

  it('transposes across octave boundaries', () => {
    expect(transposePitch(1)('B4')).toBe('C5')
    expect(transposePitch(-1)('C5')).toBe('B4')
    expect(transposePitch(-24)('E5')).toBe('E3')
  })

  it('clamps at the edges of the range', () => {
    expect(transposePitch(-5)('C0')).toBe('C0')
    expect(transposePitch(5)('B9')).toBe('B9')
  })
})

describe('melody arrangement', () => {
  const melodyNote: Note = {
    pitch: 'E3',
    length: 1,
    volume: 1,
    mode: 'decay',
    instrument: 'pulse'
  }

  it('keeps the pulse wave through the early levels', () => {
    R.range(MIN_LEVEL, fullCharacterFrom(DRIVE_BY_LEVEL)).forEach((level) =>
      expect(LEAD.arrangeFor(level)(melodyNote).instrument).toBe('pulse')
    )
  })

  const legacy: readonly [number, Pitch, number, PlayMode, Instrument][] = [
    [6, 'E3', 1.42, 'decay', 'sawtooth'],
    [7, 'F#3', 1.42, 'decay', 'sawtooth'],
    [9, 'F#3', 1.52, 'decay', 'sawtooth'],
    [10, 'G#3', 1.52, 'decay', 'sawtooth'],
    [11, 'G#3', 1.52, 'both', 'sawtooth'],
    [12, 'G#2', 1.52, 'both', 'sawtooth'],
    [13, 'G#2', 1.52, 'both', 'square'],
    [15, 'G#2', 1.52, 'both', 'square']
  ]

  it.each(legacy.filter(([level]) => level >= fullCharacterFrom(DRIVE_BY_LEVEL)))(
    'matches the legacy arrangement at level %i',
    (level, pitch, volume, mode, instrument) => {
      const n = LEAD.arrangeFor(level)(melodyNote)
      expect(n.pitch).toBe(pitch)
      expect(n.volume).toBeCloseTo(volume)
      expect(n.mode).toBe(mode)
      expect(n.instrument).toBe(instrument)
    }
  )
})

describe('tempo', () => {
  it('keeps the legacy tempo curve', () => {
    expect(stepSecondsFor(MIN_LEVEL)).toBeCloseTo(0.3125)
    expect(stepSecondsFor(MAX_LEVEL)).toBeCloseTo(0.025)
  })
})

describe('drive', () => {
  it('interpolates a level curve and clamps at its ends', () => {
    const curve: LevelCurve = [
      [2, 10],
      [4, 30]
    ]
    expect(valueAt(curve)(1)).toBe(10)
    expect(valueAt(curve)(3)).toBe(20)
    expect(valueAt(curve)(9)).toBe(30)
  })

  it('reaches the legacy drive at full character', () => {
    expect(driveFor(fullCharacterFrom(DRIVE_BY_LEVEL))).toBe(20)
    expect(driveFor(MAX_LEVEL)).toBe(20)
  })

  const isCleanLevel = R.pipe(driveFor, R.equals(1))

  it('has clean levels', () => {
    expect(isCleanLevel(MIN_LEVEL)).toBe(true)
  })

  it('never clips the shaper input while drive is clean', () => {
    R.range(MIN_LEVEL, MAX_LEVEL + 1)
      .filter(isCleanLevel)
      .forEach((level) => expect(peakInputAt(SONG, level)).toBeLessThanOrEqual(1))
  })
})

describe('song grid', () => {
  it('lays every track over the same number of steps', () => {
    SONG.forEach((track) =>
      expect(track.notes.reduce(addLength, 0)).toBe(songLength(SONG))
    )
  })

  it('starts the opening melody note and bass note on step 0', () => {
    expect(notesAt(SONG, MIN_LEVEL, 0).map(R.prop('instrument'))).toEqual([
      'pulse',
      'triangle'
    ])
  })

  it('arranges the notes it returns for the level', () => {
    const [lead] = notesAt(SONG, 13, 0)
    expect(lead?.instrument).toBe('square')
  })
})
