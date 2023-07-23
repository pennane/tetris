import { rotate, moveLeft, moveRight, moveDown, instantDrop } from './logic.lib'
import { TetrominoCell, Matrix, Action, StateTransformation } from './model'
import * as R from 'ramda'
import { rotate90, rotate180, rotate270 } from './util'

export const BOARD_WIDTH = 10
export const BOARD_HEIGHT = 20

export const DEFAULT_SPEED = 15

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