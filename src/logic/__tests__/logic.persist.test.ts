import { describe, expect, it } from 'vitest'
import { createInitialState } from '../logic.lib'
import { fromSave, toSave } from '../logic.persist'
import { TetrominoCell as T } from '../logic.model'
import { makeState } from './harness'

const roundTrip = (v: unknown) => fromSave(JSON.parse(JSON.stringify(v)))

describe('save format', () => {
  it('round-trips through JSON', () => {
    const state = { ...createInitialState(3), score: 120 }
    expect(roundTrip(toSave(state))).toEqual(state)
  })

  it('rejects the legacy unversioned tuple format', () => {
    const legacy = {
      board: createInitialState(0).board,
      tetronimo: ['T', 4, 0, 0],
      speed: 65,
      sequence: ['I'],
      nextFall: 3,
      score: 0,
      linesCleared: 0,
      timestamp: 0,
      lastExecuted: 0
    }
    expect(roundTrip(legacy)).toBeNull()
  })

  it.each([
    ['wrong version', { version: 2 }],
    ['missing seed', { seed: undefined }],
    ['seed out of range', { seed: 2 ** 32 }],
    ['short board', { board: [] }],
    ['unknown cell', { board: createInitialState(0).board.map((r) => r.map(() => 'X')) }],
    ['bad rotation', { piece: { type: 'T', col: 4, row: 0, rotation: 4 } }],
    ['empty sequence', { sequence: [] }],
    ['negative score', { score: -1 }],
    ['fractional lines', { linesCleared: 1.5 }]
  ])('rejects %s', (_, patch) => {
    expect(roundTrip({ ...toSave(createInitialState(0)), ...patch })).toBeNull()
  })

  it('rejects a piece overlapping locked cells', () => {
    const state = makeState({
      piece: { type: T.O, col: 0, row: 18, rotation: 0 },
      board: ['Z.........']
    })
    expect(roundTrip(toSave(state))).toBeNull()
  })

  it('rejects non-objects', () => {
    expect(fromSave(null)).toBeNull()
    expect(fromSave('state')).toBeNull()
    expect(fromSave([])).toBeNull()
  })
})
