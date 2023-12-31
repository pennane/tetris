import { CELL_TO_GHOST_CELL_MAP } from './logic.constants'

export type GenericMatrix<T> = T[][]
export type Matrix = GenericMatrix<0 | 1>

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

export type GhostCell =
  (typeof CELL_TO_GHOST_CELL_MAP)[keyof typeof CELL_TO_GHOST_CELL_MAP]
export type EmptyCell = 'E'
export const EMPTY_CELL = 'E'

export type Cell = TetrominoCell | EmptyCell

export type Board = GenericMatrix<Cell>

export type Column = number
export type Row = number
export type Rotation = 0 | 1 | 2 | 3

export type Tetronimo = [TetrominoCell, Column, Row, Rotation]

export type NextFall = number
export type Sequence = TetrominoCell[]
export type Speed = number
export type Score = number
export type LinesCleared = number
export type Level = number
export type Timestamp = number

export type State = {
  board: Board
  tetronimo: Tetronimo
  nextFall: NextFall
  sequence: Sequence
  speed: Speed
  score: Score
  linesCleared: LinesCleared
  timestamp: Timestamp
  lastExecuted: Timestamp
}

export type StateTransformation = (state: State) => State
export type StatePredicate = (state: State) => boolean
