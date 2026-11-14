// Only file that knows the State shape, so refactors don't touch tests.
import { BOARD_HEIGHT } from '../logic.constants'
import { EMPTY_CELL, TetrominoCell } from '../logic.model'
import type {
  Action,
  Board,
  Cell,
  Outcome,
  Rotation,
  Sequence,
  State
} from '../logic.model'
import { nextState } from '../logic'

export type PieceSpec = {
  type: TetrominoCell
  col: number
  row: number
  rotation: Rotation
}

const toCell = (c: string): Cell =>
  c === '.' ? EMPTY_CELL : (c as TetrominoCell)

/** Bottom-aligned rows; '.' is empty, letters are locked cells. */
export const boardFrom = (bottomRows: string[] = []): Board => {
  const empty = '.'.repeat(10)
  const rows = [
    ...Array<string>(BOARD_HEIGHT - bottomRows.length).fill(empty),
    ...bottomRows
  ]
  return rows.map((r) => [...r].map(toCell))
}

export const makeState = (o: {
  piece: PieceSpec
  board?: string[]
  sequence?: Sequence
  nextFall?: number
  score?: number
  linesCleared?: number
}): State => ({
  board: boardFrom(o.board),
  piece: o.piece,
  sequence: o.sequence ?? [TetrominoCell.T, TetrominoCell.S],
  nextFall: o.nextFall ?? 30,
  score: o.score ?? 0,
  linesCleared: o.linesCleared ?? 0,
  lastTick: 0
})

export const advance = (
  s: State,
  action: Action | null,
  ts: number
): Outcome => nextState(s, action, ts)

export const step = (s: State, action: Action | null, ts: number): State =>
  advance(s, action, ts).state

export const pieceOf = (s: State): PieceSpec => ({ ...s.piece })

export const boardRows = (s: State): string[] =>
  s.board.map((r) => r.map((c) => (c === EMPTY_CELL ? '.' : c)).join(''))

export const scoreOf = (s: State) => s.score
export const linesOf = (s: State) => s.linesCleared
export const nextFallOf = (s: State) => s.nextFall
export const sequenceOf = (s: State) => s.sequence
