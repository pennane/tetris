import { describe, expect, it } from 'vitest'
import { createInitialState, levelOf, renderBoard, startAtLevel } from '../logic.lib'
import { MAX_LEVEL, MIN_LEVEL } from '../logic.constants'
import { TetrominoCell as T } from '../logic.model'
import { makeState } from './harness'

describe('renderBoard', () => {
  it('draws the piece over its ghost at the landing row', () => {
    const s = makeState({ piece: { type: T.O, col: 0, row: 0, rotation: 0 } })
    const board = renderBoard(s)
    expect(board[0]?.[0]).toBe(T.O)
    expect(board[18]?.[0]).toEqual({ ghostOf: T.O })
    expect(board[19]?.[1]).toEqual({ ghostOf: T.O })
    expect(board[19]?.[2]).toBe('E')
  })
})

describe('createInitialState', () => {
  it('is deterministic for a seed and never has an empty preview', () => {
    expect(createInitialState(5)).toEqual(createInitialState(5))
    expect(createInitialState(5).sequence.length).toBeGreaterThan(0)
  })

  it('deals different bags for different seeds', () => {
    const first = (seed: number) => [
      createInitialState(seed).piece.type,
      ...createInitialState(seed).sequence
    ]
    expect(first(1)).not.toEqual(first(2))
    expect([...first(1)].sort()).toEqual([...first(2)].sort())
  })
})

describe('startAtLevel', () => {
  it.each([MIN_LEVEL, 6, MAX_LEVEL])('starts a fresh game at level %i', (level) => {
    expect(levelOf(startAtLevel(level)(createInitialState(1)))).toBe(level)
  })
})
