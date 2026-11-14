import { describe, expect, it } from 'vitest'
import { toastFor } from '../toast.messages'

describe('toast messages', () => {
  it('announces the new level', () => {
    expect(toastFor({ type: 'levelUp', level: 5 })).toBe('level 5')
  })

  it.each([
    [3, 'triple'],
    [4, 'tetris!']
  ] as const)('celebrates clearing %i lines', (count, text) => {
    expect(toastFor({ type: 'linesCleared', count })).toBe(text)
  })

  it.each([1, 2])('stays quiet for %i lines', (count) => {
    expect(toastFor({ type: 'linesCleared', count })).toBeNull()
  })

  it.each(['moved', 'rotated', 'hardDropped', 'pieceLocked'] as const)(
    'stays quiet when %s',
    (type) => {
      expect(toastFor({ type })).toBeNull()
    }
  )

  it('stays quiet on game over', () => {
    expect(toastFor({ type: 'gameOver', finalScore: 10 })).toBeNull()
  })
})
