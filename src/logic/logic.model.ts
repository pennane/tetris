import type { NonEmpty } from '../util/fp'
import type { Matrix } from '../util/matrix'

export enum Action {
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
  DOWN = 'DOWN',
  ROTATE = 'ROTATE',
  JUMP = 'JUMP'
}

export enum TetrominoCell {
  I = 'I',
  J = 'J',
  L = 'L',
  O = 'O',
  S = 'S',
  T = 'T',
  Z = 'Z'
}

export const EMPTY_CELL = 'E'
export type EmptyCell = typeof EMPTY_CELL
export type Cell = TetrominoCell | EmptyCell

/** Board as stored: only locked cells. */
export type Board = Matrix<Cell>

/** Board as drawn: also the falling piece and its landing preview. */
export type GhostCell = Readonly<{ ghostOf: TetrominoCell }>
export type RenderCell = Cell | GhostCell
export type RenderBoard = Matrix<RenderCell>

export type Shape = Matrix<0 | 1>

export type Column = number
export type Row = number
export type Rotation = 0 | 1 | 2 | 3

export type Piece = Readonly<{
  type: TetrominoCell
  col: Column
  row: Row
  rotation: Rotation
}>

export type Sequence = NonEmpty<TetrominoCell>
/** Ticks until the next gravity step. */
export type NextFall = number
/** Ticks between gravity steps. */
export type Speed = number
export type Score = number
export type LinesCleared = number
export type Level = number
export type Timestamp = number

export type State = Readonly<{
  board: Board
  piece: Piece
  sequence: Sequence
  nextFall: NextFall
  score: Score
  linesCleared: LinesCleared
  lastTick: Timestamp
}>

export type GameEvent =
  | Readonly<{ type: 'pieceLocked' }>
  | Readonly<{ type: 'linesCleared'; count: number }>
  | Readonly<{ type: 'levelUp'; level: Level }>
  | Readonly<{ type: 'gameOver'; finalScore: Score }>

export type Outcome = Readonly<{ state: State; events: readonly GameEvent[] }>

export type StateTransformation = (state: State) => State
export type StatePredicate = (state: State) => boolean
