import { describe, expect, it } from 'vitest'
import { EXECUTE_INTERVAL_MS } from '../logic.constants'
import { Action, TetrominoCell as T } from '../logic.model'
import {
  advance,
  boardRows,
  linesOf,
  makeState,
  nextFallOf,
  pieceOf,
  scoreOf,
  sequenceOf,
  step
} from './harness'

const TICK = EXECUTE_INTERVAL_MS + 1
const WITHIN_TICK = 1

describe('input', () => {
  it('moves left, right and down', () => {
    const s = makeState({ piece: { type: T.T, col: 4, row: 5, rotation: 0 } })
    expect(pieceOf(step(s, Action.LEFT, WITHIN_TICK)).col).toBe(3)
    expect(pieceOf(step(s, Action.RIGHT, WITHIN_TICK)).col).toBe(5)
    expect(pieceOf(step(s, Action.DOWN, WITHIN_TICK)).row).toBe(6)
  })

  it('rotates through all four rotations', () => {
    let s = makeState({ piece: { type: T.T, col: 4, row: 5, rotation: 0 } })
    const seen: number[] = []
    for (let i = 0; i < 4; i++) {
      s = step(s, Action.ROTATE, WITHIN_TICK)
      seen.push(pieceOf(s).rotation)
    }
    expect(seen).toEqual([1, 2, 3, 0])
  })

  it('rejects moves into walls', () => {
    const s = makeState({ piece: { type: T.O, col: 0, row: 5, rotation: 0 } })
    expect(pieceOf(step(s, Action.LEFT, WITHIN_TICK)).col).toBe(0)
    const r = makeState({ piece: { type: T.O, col: 8, row: 5, rotation: 0 } })
    expect(pieceOf(step(r, Action.RIGHT, WITHIN_TICK)).col).toBe(8)
  })

  it('rejects moves into locked cells', () => {
    const s = makeState({
      piece: { type: T.O, col: 4, row: 17, rotation: 0 },
      board: ['...Z......', '..........']
    })
    expect(pieceOf(step(s, Action.LEFT, WITHIN_TICK)).col).toBe(4)
  })

  it('rejects a rotation that would collide', () => {
    const s = makeState({ piece: { type: T.I, col: 3, row: 18, rotation: 0 } })
    expect(pieceOf(step(s, Action.ROTATE, WITHIN_TICK)).rotation).toBe(0)
  })
})

describe('gravity', () => {
  it('does not advance the fall timer on non-tick frames', () => {
    const s = makeState({
      piece: { type: T.T, col: 4, row: 5, rotation: 0 },
      nextFall: 5
    })
    expect(nextFallOf(step(s, null, WITHIN_TICK))).toBe(5)
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
    expect(nextFallOf(reset)).toBe(61)
  })

  it('falls once per tick, not once per frame', () => {
    const s = makeState({
      piece: { type: T.T, col: 4, row: 5, rotation: 0 },
      nextFall: 1
    })
    const fell = step(s, null, TICK)
    expect(pieceOf(step(fell, null, TICK + WITHIN_TICK)).row).toBe(6)
  })
})

describe('events', () => {
  const lockable = (o: Partial<Parameters<typeof makeState>[0]> = {}) =>
    makeState({
      piece: { type: T.I, col: 6, row: 18, rotation: 0 },
      nextFall: 1,
      ...o
    })

  it('emits nothing on ordinary frames', () => {
    expect(advance(lockable({ nextFall: 5 }), Action.LEFT, TICK).events).toEqual(
      []
    )
  })

  it('emits pieceLocked on lock', () => {
    expect(advance(lockable(), null, TICK).events).toEqual([
      { type: 'pieceLocked' }
    ])
  })

  it('emits linesCleared and levelUp', () => {
    const { events } = advance(
      lockable({ board: ['ZZZZZZ....'], linesCleared: 9 }),
      null,
      TICK
    )
    expect(events).toEqual([
      { type: 'pieceLocked' },
      { type: 'linesCleared', count: 1 },
      { type: 'levelUp', level: 2 }
    ])
  })

  it('emits gameOver with the score including the final lock', () => {
    const { events } = advance(
      lockable({
        piece: { type: T.O, col: 0, row: 0, rotation: 0 },
        board: Array<string>(18).fill('ZZZZZZZZZ.'),
        score: 500
      }),
      null,
      TICK
    )
    expect(events[events.length - 1]).toEqual({ type: 'gameOver', finalScore: 500 })
  })
})

describe('locking', () => {
  it('instant drop scores the piece cell count and locks on the next tick', () => {
    const s = makeState({
      piece: { type: T.O, col: 0, row: 0, rotation: 0 },
      sequence: [T.L, T.J]
    })
    const dropped = step(s, Action.JUMP, WITHIN_TICK)
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
    expect(scoreOf(locked)).toBe(100 * 2)
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
