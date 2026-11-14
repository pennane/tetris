import { describe, expect, it } from 'vitest'
import { Action, TetrominoCell as T } from './logic.model'
import {
  boardRows,
  linesOf,
  makeState,
  nextFallOf,
  pieceOf,
  scoreOf,
  sequenceOf,
  step
} from '../test/harness'

// Timestamps: the harness state starts with its last tick at 0.
// A frame at ts > 16ms after the last tick is a tick; anything closer is not.
const TICK = 20
const NO_TICK = 5

describe('input', () => {
  it('moves left, right and down', () => {
    const s = makeState({ piece: { type: T.T, col: 4, row: 5, rotation: 0 } })
    expect(pieceOf(step(s, Action.LEFT, NO_TICK)).col).toBe(3)
    expect(pieceOf(step(s, Action.RIGHT, NO_TICK)).col).toBe(5)
    expect(pieceOf(step(s, Action.DOWN, NO_TICK)).row).toBe(6)
  })

  it('rotates through all four rotations', () => {
    let s = makeState({ piece: { type: T.T, col: 4, row: 5, rotation: 0 } })
    const seen: number[] = []
    for (let i = 0; i < 4; i++) {
      s = step(s, Action.ROTATE, NO_TICK)
      seen.push(pieceOf(s).rotation)
    }
    expect(seen).toEqual([1, 2, 3, 0])
  })

  it('rejects moves into walls', () => {
    const s = makeState({ piece: { type: T.O, col: 0, row: 5, rotation: 0 } })
    expect(pieceOf(step(s, Action.LEFT, NO_TICK)).col).toBe(0)
    const r = makeState({ piece: { type: T.O, col: 8, row: 5, rotation: 0 } })
    expect(pieceOf(step(r, Action.RIGHT, NO_TICK)).col).toBe(8)
  })

  it('rejects moves into locked cells', () => {
    // O at cols 4-5, rows 17-18; a block sits directly left of it.
    const s = makeState({
      piece: { type: T.O, col: 4, row: 17, rotation: 0 },
      board: ['...Z......', '..........']
    })
    expect(pieceOf(step(s, Action.LEFT, NO_TICK)).col).toBe(4)
  })

  it('rejects a rotation that would collide', () => {
    // Horizontal I on row 19 (matrix row 1). Rotating makes it vertical in
    // matrix column 2, which would extend below the board.
    const s = makeState({ piece: { type: T.I, col: 3, row: 18, rotation: 0 } })
    expect(pieceOf(step(s, Action.ROTATE, NO_TICK)).rotation).toBe(0)
  })
})

describe('gravity', () => {
  it('does not advance the fall timer on non-tick frames', () => {
    const s = makeState({
      piece: { type: T.T, col: 4, row: 5, rotation: 0 },
      nextFall: 5
    })
    expect(nextFallOf(step(s, null, NO_TICK))).toBe(5)
    expect(nextFallOf(step(s, null, TICK))).toBe(4)
  })

  it('moves the piece down when the timer reaches zero, then resets it', () => {
    const s = makeState({
      piece: { type: T.T, col: 4, row: 5, rotation: 0 },
      nextFall: 1
    })
    const fell = step(s, null, TICK)
    expect(pieceOf(fell).row).toBe(6)
    const reset = step(fell, null, 2 * TICK)
    expect(pieceOf(reset).row).toBe(6)
    expect(nextFallOf(reset)).toBe(65) // stored speed; level 1 derives 61
  })
})

describe('locking', () => {
  it('instant drop scores the piece cell count and locks on the next tick', () => {
    const s = makeState({
      piece: { type: T.O, col: 0, row: 0, rotation: 0 },
      sequence: [T.L, T.J]
    })
    const dropped = step(s, Action.JUMP, NO_TICK)
    expect(pieceOf(dropped).row).toBe(18)
    expect(scoreOf(dropped)).toBe(4)
    expect(nextFallOf(dropped)).toBe(1)

    const locked = step(dropped, null, TICK)
    expect(boardRows(locked).slice(-2)).toEqual(['OO........', 'OO........'])
    expect(pieceOf(locked)).toEqual({ type: T.L, col: 4, row: 0, rotation: 0 })
    expect(sequenceOf(locked)).toEqual([T.J])
  })

  it('refills the sequence with a full bag when it runs out', () => {
    const s = makeState({
      piece: { type: T.O, col: 0, row: 18, rotation: 0 },
      sequence: [T.L],
      nextFall: 1
    })
    const locked = step(s, null, TICK)
    expect(pieceOf(locked).type).toBe(T.L)
    expect([...sequenceOf(locked)].sort()).toEqual(
      [T.I, T.J, T.L, T.O, T.S, T.T, T.Z].sort()
    )
  })

  it('clears a full line and scores 40 at level 1', () => {
    const s = makeState({
      piece: { type: T.I, col: 6, row: 18, rotation: 0 },
      board: ['ZZZZZZ....'],
      nextFall: 1
    })
    const locked = step(s, null, TICK)
    expect(boardRows(locked).every((r) => r === '..........')).toBe(true)
    expect(scoreOf(locked)).toBe(40)
    expect(linesOf(locked)).toBe(1)
  })

  it('multiplies line score by the level before the clear', () => {
    const s = makeState({
      piece: { type: T.O, col: 8, row: 18, rotation: 0 },
      board: ['ZZZZZZZZ..', 'ZZZZZZZZ..'],
      linesCleared: 10,
      nextFall: 1
    })
    const locked = step(s, null, TICK)
    expect(scoreOf(locked)).toBe(200) // 100 for a double * level 2
    expect(linesOf(locked)).toBe(12)
  })

  it('shifts rows above a cleared line down', () => {
    const s = makeState({
      piece: { type: T.I, col: 6, row: 18, rotation: 0 },
      board: ['S.........', 'ZZZZZZ....'],
      nextFall: 1
    })
    const locked = step(s, null, TICK)
    expect(boardRows(locked).slice(-1)).toEqual(['S.........'])
  })

  it('speeds up with level', () => {
    const at = (linesCleared: number) => {
      const s = makeState({
        piece: { type: T.O, col: 0, row: 18, rotation: 0 },
        linesCleared,
        nextFall: 1
      })
      return nextFallOf(step(step(s, null, TICK), null, 2 * TICK))
    }
    expect(at(0)).toBe(61)
    expect(at(10)).toBe(56)
    expect(at(140)).toBe(3)
  })

  it('resets the game when locked cells reach the top row', () => {
    const filler = 'ZZZZZZZZZ.'
    const s = makeState({
      piece: { type: T.O, col: 0, row: 0, rotation: 0 },
      board: Array<string>(18).fill(filler),
      score: 500,
      linesCleared: 3,
      nextFall: 1
    })
    const over = step(s, null, TICK)
    expect(scoreOf(over)).toBe(0)
    expect(linesOf(over)).toBe(0)
    expect(boardRows(over).every((r) => r === '..........')).toBe(true)
  })
})
