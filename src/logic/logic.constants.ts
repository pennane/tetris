import { rotate90, rotate180, rotate270 } from '../util/matrix'
import { rotate, moveLeft, moveRight, moveDown, instantDrop } from './logic.lib'
import {
  TetrominoCell,
  Matrix,
  Action,
  StateTransformation,
  Score
} from './logic.model'
import * as R from 'ramda'

export const EXECUTE_INTERVAL_MS = 16

export const PERSISTED_STATE_STORAGE_KEY = 'persisted-game-state'

export const BOARD_WIDTH = 10
export const BOARD_HEIGHT = 20

export const DEFAULT_SPEED = 65
export const DEFAULT_SCORE = 0
export const DEFAULT_CLEARED_LINES = 0

export const MIN_LEVEL = 1
export const MAX_LEVEL = 15
export const MAX_SPEED = 3

export const LINES_CLEARED_PER_LEVEL = 10

export const SPEED_INCREASE_PER_LEVEL =
  (DEFAULT_SPEED - MAX_SPEED) / (MAX_LEVEL - MIN_LEVEL)

const BASE_TETRONIMO_MATRICES: Record<TetrominoCell, Matrix> = {
  [TetrominoCell.I]: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0]
  ],
  [TetrominoCell.J]: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0]
  ],
  [TetrominoCell.L]: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0]
  ],
  [TetrominoCell.O]: [
    [1, 1],
    [1, 1]
  ],
  [TetrominoCell.S]: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0]
  ],
  [TetrominoCell.Z]: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0]
  ],
  [TetrominoCell.T]: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0]
  ]
}

export const TETRONIMO_MATRICES = {
  0: R.map(R.identity, BASE_TETRONIMO_MATRICES),
  1: R.map(rotate90, BASE_TETRONIMO_MATRICES),
  2: R.map(rotate180, BASE_TETRONIMO_MATRICES),
  3: R.map(rotate270, BASE_TETRONIMO_MATRICES)
} as const

export const KEY_TO_ACTION: Record<string, Action> = {
  a: Action.LEFT,
  ArrowLeft: Action.LEFT,
  d: Action.RIGHT,
  ArrowRight: Action.RIGHT,
  s: Action.DOWN,
  ArrowDown: Action.DOWN,
  ' ': Action.JUMP,
  r: Action.ROTATE
}

export const ACTION_TO_TRANSFORMATION: Record<Action, StateTransformation> = {
  [Action.ROTATE]: rotate,
  [Action.LEFT]: moveLeft,
  [Action.RIGHT]: moveRight,
  [Action.DOWN]: moveDown,
  [Action.JUMP]: instantDrop
}

export const LINES_CLEARED_TO_SCORE: Record<number, number> = {
  1: 40,
  2: 100,
  3: 300,
  4: 1200
}

const countMatrixCells = (matrix: Matrix) =>
  matrix.flatMap((row) => row.filter((cell) => cell === 1)).length

export const TETRONIMO_TO_INSTANT_DROP_SCORE: Record<TetrominoCell, Score> = {
  [TetrominoCell.I]: countMatrixCells(BASE_TETRONIMO_MATRICES[TetrominoCell.I]),
  [TetrominoCell.J]: countMatrixCells(BASE_TETRONIMO_MATRICES[TetrominoCell.J]),
  [TetrominoCell.L]: countMatrixCells(BASE_TETRONIMO_MATRICES[TetrominoCell.L]),
  [TetrominoCell.O]: countMatrixCells(BASE_TETRONIMO_MATRICES[TetrominoCell.O]),
  [TetrominoCell.S]: countMatrixCells(BASE_TETRONIMO_MATRICES[TetrominoCell.S]),
  [TetrominoCell.T]: countMatrixCells(BASE_TETRONIMO_MATRICES[TetrominoCell.T]),
  [TetrominoCell.Z]: countMatrixCells(BASE_TETRONIMO_MATRICES[TetrominoCell.Z])
}
