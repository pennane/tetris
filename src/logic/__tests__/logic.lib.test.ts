import { describe, expect, it } from 'vitest'
import { createInitialState, renderBoard } from '../logic.lib'
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
  it('is deterministic for a given random source and never has an empty preview', () => {
    const rng = () => 0.5
    expect(createInitialState(rng)).toEqual(createInitialState(rng))
    expect(createInitialState(rng).sequence.length).toBeGreaterThan(0)
  })
})
