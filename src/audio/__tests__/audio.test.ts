import { describe, expect, it } from 'vitest'
import { hz, transposePitch } from '../audio.lib'
import { noteTransformerFor } from '../audio.song'
import type { Note } from '../audio.model'

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

describe('level transformers', () => {
  const base: Note = {
    pitch: 'A4',
    duration: 0.25,
    volume: 1,
    mode: 'normal',
    waveform: 'sine'
  }

  it('is identity at level 1', () => {
    expect(noteTransformerFor(1)(base)).toEqual(base)
  })

  it('accumulates every transformer up to the level', () => {
    const n = noteTransformerFor(7)(base)
    expect(n.pitch).toBe('B4')
    expect(n.waveform).toBe('sawtooth')
    expect(n.volume).toBeCloseTo(1 * 1.1 * 1.2 + 0.1)
  })
})
