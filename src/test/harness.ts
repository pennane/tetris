// Only file that knows the State shape, so refactors don't touch tests.
import { DEFAULT_SPEED, BOARD_HEIGHT } from '../logic/logic.constants'
import {
  Action,
  Board,
  Cell,
  EMPTY_CELL,
  Rotation,
  State,
  TetrominoCell
} from '../logic/logic.model'
import { nextState } from '../logic/logic'

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
  sequence?: TetrominoCell[]
  nextFall?: number
  score?: number
  linesCleared?: number
}): State => ({
  board: boardFrom(o.board),
  tetronimo: [o.piece.type, o.piece.col, o.piece.row, o.piece.rotation],
  speed: DEFAULT_SPEED,
  sequence: o.sequence ?? [TetrominoCell.T, TetrominoCell.S],
  nextFall: o.nextFall ?? 30,
  score: o.score ?? 0,
  linesCleared: o.linesCleared ?? 0,
  lastExecuted: 0,
  timestamp: 0
})

export const step = (s: State, action: Action | null, ts: number): State =>
  nextState(s, action, ts)

export const pieceOf = (s: State): PieceSpec => {
  const [type, col, row, rotation] = s.tetronimo
  return { type, col, row, rotation }
}

export const boardRows = (s: State): string[] =>
  s.board.map((r) => r.map((c) => (c === EMPTY_CELL ? '.' : c)).join(''))

export const scoreOf = (s: State) => s.score
export const linesOf = (s: State) => s.linesCleared
export const nextFallOf = (s: State) => s.nextFall
export const sequenceOf = (s: State) => s.sequence
