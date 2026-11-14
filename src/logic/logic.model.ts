import type { NonEmpty } from '../util/fp'
import type { Matrix } from '../util/matrix'
import type { Seed } from '../util/random'
import type { WithEvents } from '../util/events'

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

export type Board = Matrix<Cell>

export type GhostCell = Readonly<{ ghostOf: TetrominoCell }>
export type RenderCell = Cell | GhostCell
export type RenderBoard = Matrix<RenderCell>

export type ShapeCell = 0 | 1
export type Shape = Matrix<ShapeCell>

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
export type Ticks = number
export type NextFall = Ticks
export type Speed = Ticks
export type Score = number
export type LinesCleared = number
export type Level = number
export type Timestamp = number

export type Lock = Readonly<{
  timer: Ticks
  resets: number
  lowestRow: Row
}>

export type State = Readonly<{
  board: Board
  piece: Piece
  sequence: Sequence
  nextFall: NextFall
  lock: Lock
  score: Score
  linesCleared: LinesCleared
  seed: Seed
}>

export type GameEvent =
  | Readonly<{ type: 'pieceLocked' }>
  | Readonly<{ type: 'linesCleared'; count: number }>
  | Readonly<{ type: 'levelUp'; level: Level }>
  | Readonly<{ type: 'gameOver'; finalScore: Score }>

export type Msg = Readonly<{ type: 'input'; action: Action }> | Readonly<{ type: 'tick' }>

export type Outcome = WithEvents<State, GameEvent>
export type GameStep = (state: State) => Outcome

export type StateTransformation = (state: State) => State
export type StatePredicate = (state: State) => boolean
