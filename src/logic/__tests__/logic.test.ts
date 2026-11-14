import { describe, expect, it } from 'vitest'
import * as R from 'ramda'
import { TICK, input, run, update } from '../logic'
import { createInitialState } from '../logic.lib'
import { Action, TetrominoCell as T } from '../logic.model'
import type { GameEvent, Msg, State } from '../logic.model'
import {
  send,
  boardRows,
  linesOf,
  makeState,
  nextFallOf,
  pieceOf,
  scoreOf,
  sequenceOf,
  step
} from './harness'

describe('input', () => {
  it('moves left, right and down', () => {
    const s = makeState({ piece: { type: T.T, col: 4, row: 5, rotation: 0 } })
    expect(pieceOf(step(s, input(Action.LEFT))).col).toBe(3)
    expect(pieceOf(step(s, input(Action.RIGHT))).col).toBe(5)
    expect(pieceOf(step(s, input(Action.DOWN))).row).toBe(6)
  })

  it('rotates through all four rotations', () => {
    let s = makeState({ piece: { type: T.T, col: 4, row: 5, rotation: 0 } })
    const seen: number[] = []
    for (let i = 0; i < 4; i++) {
      s = step(s, input(Action.ROTATE))
      seen.push(pieceOf(s).rotation)
    }
    expect(seen).toEqual([1, 2, 3, 0])
  })

  it('rejects moves into walls', () => {
    const s = makeState({ piece: { type: T.O, col: 0, row: 5, rotation: 0 } })
    expect(pieceOf(step(s, input(Action.LEFT))).col).toBe(0)
    const r = makeState({ piece: { type: T.O, col: 8, row: 5, rotation: 0 } })
    expect(pieceOf(step(r, input(Action.RIGHT))).col).toBe(8)
  })

  it('rejects moves into locked cells', () => {
    const s = makeState({
      piece: { type: T.O, col: 4, row: 17, rotation: 0 },
      board: ['...Z......', '..........']
    })
    expect(pieceOf(step(s, input(Action.LEFT))).col).toBe(4)
  })

  it('rejects a rotation that would collide', () => {
    const s = makeState({ piece: { type: T.I, col: 3, row: 18, rotation: 0 } })
    expect(pieceOf(step(s, input(Action.ROTATE))).rotation).toBe(0)
  })
})

describe('gravity', () => {
  it('advances the fall timer on ticks only', () => {
    const s = makeState({
      piece: { type: T.T, col: 4, row: 5, rotation: 0 },
      nextFall: 5
    })
    expect(nextFallOf(step(s, input(Action.LEFT)))).toBe(5)
    expect(nextFallOf(step(s, TICK))).toBe(4)
  })

  it('moves the piece down when the timer reaches zero, then resets it', () => {
    const s = makeState({
      piece: { type: T.T, col: 4, row: 5, rotation: 0 },
      nextFall: 1
    })
    const fell = step(s, TICK)
    expect(pieceOf(fell).row).toBe(6)
    const reset = step(fell, TICK)
    expect(pieceOf(reset).row).toBe(6)
    expect(nextFallOf(reset)).toBe(61)
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
    expect(send(lockable({ nextFall: 5 }), input(Action.LEFT), TICK).events).toEqual(
      []
    )
  })

  it('emits pieceLocked on lock', () => {
    expect(send(lockable(), TICK).events).toEqual([
      { type: 'pieceLocked' }
    ])
  })

  it('emits linesCleared and levelUp', () => {
    const { events } = send(
      lockable({ board: ['ZZZZZZ....'], linesCleared: 9 }),
      TICK
    )
    expect(events).toEqual([
      { type: 'pieceLocked' },
      { type: 'linesCleared', count: 1 },
      { type: 'levelUp', level: 2 }
    ])
  })

  it('emits gameOver with the score including the final lock', () => {
    const { events } = send(
      lockable({
        piece: { type: T.O, col: 0, row: 0, rotation: 0 },
        board: Array<string>(18).fill('ZZZZZZZZZ.'),
        score: 500
      }),
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
    const dropped = step(s, input(Action.JUMP))
    expect(pieceOf(dropped).row).toBe(18)
    expect(scoreOf(dropped)).toBe(4)
    expect(nextFallOf(dropped)).toBe(1)

    const locked = step(dropped, TICK)
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
    const locked = step(s, TICK)
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
    const locked = step(s, TICK)
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
    const locked = step(s, TICK)
    expect(scoreOf(locked)).toBe(100 * 2)
    expect(linesOf(locked)).toBe(12)
  })

  it('shifts rows above a cleared line down', () => {
    const s = makeState({
      piece: { type: T.I, col: 6, row: 18, rotation: 0 },
      board: ['S.........', 'ZZZZZZ....'],
      nextFall: 1
    })
    const locked = step(s, TICK)
    expect(boardRows(locked).slice(-1)).toEqual(['S.........'])
  })

  it('speeds up with level', () => {
    const at = (linesCleared: number) => {
      const s = makeState({
        piece: { type: T.O, col: 0, row: 18, rotation: 0 },
        linesCleared,
        nextFall: 1
      })
      return nextFallOf(step(s, TICK, TICK))
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
    const over = step(s, TICK)
    expect(scoreOf(over)).toBe(0)
    expect(linesOf(over)).toBe(0)
    expect(boardRows(over).every((r) => r === '..........')).toBe(true)
  })
})

describe('replay', () => {
  const ACTIONS = Object.values(Action)
  const session = (length: number): Msg[] =>
    R.times(
      (i) => (i % 7 === 0 ? input(ACTIONS[i % ACTIONS.length] ?? Action.DOWN) : TICK),
      length
    )

  it('reproduces the same game from the same seed and messages', () => {
    const msgs = session(20_000)
    const a = run(createInitialState(42), msgs)
    const b = run(createInitialState(42), msgs)
    expect(a).toEqual(b)
    expect(a.events.some((e) => e.type === 'gameOver')).toBe(true)
  })

  it('folding the log equals stepping one message at a time', () => {
    const msgs = session(3_000)
    const stepped = msgs.reduce<{ value: State; events: GameEvent[] }>(
      (acc, msg) => {
        const o = update(msg)(acc.value)
        return { value: o.value, events: [...acc.events, ...o.events] }
      },
      { value: createInitialState(7), events: [] }
    )
    expect(run(createInitialState(7), msgs)).toEqual(stepped)
  })

  it('leaves state referentially unchanged on a rejected move', () => {
    const s = makeState({ piece: { type: T.O, col: 0, row: 5, rotation: 0 } })
    expect(step(s, input(Action.LEFT))).toBe(s)
  })
})
