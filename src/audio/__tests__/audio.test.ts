import { describe, expect, it } from 'vitest'
import * as R from 'ramda'
import { MAX_LEVEL, MIN_LEVEL } from '../../logic/logic.constants'
import {
  activeTracks,
  addLength,
  fullCharacterFrom,
  hz,
  loudnessThroughShaper,
  notesAt,
  onBus,
  semitoneOf,
  songLength,
  transposePitch,
  valueAt,
  voicePeakAt
} from '../audio.lib'
import {
  ARPEGGIO,
  BASS,
  DRIVE_BY_LEVEL,
  GAPS,
  LEAD,
  SONG,
  driveFor,
  drivenGainFor,
  leadLoudnessAt,
  stepSecondsFor
} from '../audio.song'
import type { Instrument, LevelCurve, Note, PlayMode, Pitch, Track } from '../audio.model'

const [[cleanLevelsEnd]] = DRIVE_BY_LEVEL

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

  it('keeps the pulse wave through the clean levels', () => {
    R.range(MIN_LEVEL, cleanLevelsEnd + 1).forEach((level) =>
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

  it.each(legacy.filter(([level]) => level > cleanLevelsEnd))(
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
  it('never slows down as levels rise', () => {
    R.range(MIN_LEVEL, MAX_LEVEL).forEach((level) =>
      expect(stepSecondsFor(level + 1)).toBeLessThanOrEqual(stepSecondsFor(level))
    )
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

  const isCleanLevel = R.gte(cleanLevelsEnd)

  it('routes only the lead voices through the shaper', () => {
    expect(activeTracks(SONG, MAX_LEVEL).filter(onBus('driven'))).toEqual([LEAD, GAPS])
  })

  it('never clips the shaper input while drive is clean', () => {
    R.range(MIN_LEVEL, MAX_LEVEL + 1)
      .filter(isCleanLevel)
      .forEach((level) =>
        expect(voicePeakAt(SONG, level, 'driven') * driveFor(level)).toBeLessThanOrEqual(1)
      )
  })

  it('gets louder through the shaper as drive rises', () => {
    expect(loudnessThroughShaper(2, 1)).toBeGreaterThan(loudnessThroughShaper(1, 1))
    expect(loudnessThroughShaper(20, 1)).toBeGreaterThan(loudnessThroughShaper(2, 1))
  })

  it('raises drive gradually after the clean levels', () => {
    R.range(cleanLevelsEnd, MAX_LEVEL).forEach((level) =>
      expect(driveFor(level + 1)).toBeLessThanOrEqual(driveFor(level) * 3)
    )
  })

  it('leaves the lead at full gain through the clean levels', () => {
    R.range(MIN_LEVEL, cleanLevelsEnd + 1).forEach((level) =>
      expect(drivenGainFor(level)).toBe(1)
    )
  })

  it('keeps the driven lead as loud as the last clean level', () => {
    const cleanLoudness = leadLoudnessAt(cleanLevelsEnd)
    R.range(cleanLevelsEnd + 1, MAX_LEVEL + 1).forEach((level) =>
      expect(leadLoudnessAt(level) * drivenGainFor(level)).toBeCloseTo(cleanLoudness)
    )
  })

  it('never clips the clean bus', () => {
    R.range(MIN_LEVEL, MAX_LEVEL + 1).forEach((level) =>
      expect(voicePeakAt(SONG, level, 'clean')).toBeLessThanOrEqual(1)
    )
  })
})

describe('harmony', () => {
  const probe: Note = { pitch: 'A2', length: 1, volume: 1, mode: 'decay', instrument: 'pulse' }
  const offsetOf = (track: Track, level: number) =>
    semitoneOf(track.arrangeFor(level)(probe).pitch) - semitoneOf(probe.pitch)

  it.each(R.range(MIN_LEVEL, MAX_LEVEL + 1))(
    'keeps every voice in the lead key at level %i',
    (level) => {
      [BASS, ARPEGGIO].forEach((track) =>
        expect(R.mathMod(offsetOf(LEAD, level) - offsetOf(track, level), 12)).toBe(0)
      )
    }
  )
})

describe('melody gaps', () => {
  const startsIn = (track: Track, level: number, step: number) =>
    notesAt([track], level, step).length > 0
  const restCount = LEAD.notes.filter(R.isNil).length

  it('sounds a gap note in every melody rest and nowhere else', () => {
    const steps = R.range(0, songLength(SONG))
    const gapSteps = steps.filter((step) => startsIn(GAPS, MAX_LEVEL, step))
    expect(gapSteps).toHaveLength(restCount)
    gapSteps.forEach((step) => expect(startsIn(LEAD, MAX_LEVEL, step)).toBe(false))
  })

  it('stays out of the clean levels', () => {
    expect(GAPS.joinsAt).toBeGreaterThan(cleanLevelsEnd)
  })

  it.each([
    [6, 'A2', 0.1, 'decay', 'sawtooth'],
    [11, 'C#3', 0.2, 'both', 'sawtooth'],
    [13, 'C#2', 0.2, 'both', 'square']
  ] as const)('matches the legacy rest tone at level %i', (level, pitch, volume, mode, instrument) => {
    const [gap] = GAPS.notes.filter(R.isNotNil)
    const n = gap && GAPS.arrangeFor(level)(gap)
    expect(n?.pitch).toBe(pitch)
    expect(n?.volume).toBeCloseTo(volume)
    expect(n?.mode).toBe(mode)
    expect(n?.instrument).toBe(instrument)
  })
})

describe('layers', () => {
  it('adds a layer at every clean level', () => {
    R.range(MIN_LEVEL, cleanLevelsEnd).forEach((level) =>
      expect(activeTracks(SONG, level + 1).length).toBeGreaterThan(
        activeTracks(SONG, level).length
      )
    )
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
