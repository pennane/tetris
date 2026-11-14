import { describe, expect, it } from 'vitest'
import { cueFor, cueSeconds } from '../audio.cues'

describe('cues', () => {
  it.each(['moved', 'rotated', 'hardDropped', 'pieceLocked'] as const)(
    'gives %s a sound',
    (type) => {
      expect(cueFor({ type }).length).toBeGreaterThan(0)
    }
  )

  it('grows the line-clear cue with the number of lines', () => {
    const seconds = [1, 2, 3, 4].map((count) =>
      cueSeconds(cueFor({ type: 'linesCleared', count }))
    )
    expect(seconds).toEqual([...seconds].sort((a, b) => a - b))
    expect(new Set(seconds).size).toBe(4)
  })

  it('gives level-up and game-over a sound', () => {
    expect(cueFor({ type: 'levelUp', level: 2 }).length).toBeGreaterThan(0)
    expect(cueFor({ type: 'gameOver', finalScore: 0 }).length).toBeGreaterThan(0)
  })

  it('counts rests toward the cue length', () => {
    const withRest = cueFor({ type: 'gameOver', finalScore: 0 })
    expect(cueSeconds([...withRest, null])).toBeGreaterThan(cueSeconds(withRest))
  })
})
