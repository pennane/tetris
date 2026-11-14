import * as R from 'ramda'
import { rotate90, rotate180, rotate270 } from '../util/matrix'
import { Action, TetrominoCell } from './logic.model'
import type { Rotation, Score, Shape, Speed } from './logic.model'

export const EXECUTE_INTERVAL_MS = 16

export const BOARD_WIDTH = 10
export const BOARD_HEIGHT = 20
export const SPAWN_COLUMN = 4

export const MIN_LEVEL = 1
export const MAX_LEVEL = 15
export const LINES_CLEARED_PER_LEVEL = 10

export const DEFAULT_SPEED: Speed = 65
export const MAX_SPEED: Speed = 3
export const SPEED_INCREASE_PER_LEVEL =
  (DEFAULT_SPEED - MAX_SPEED) / (MAX_LEVEL - MIN_LEVEL)

export const TETROMINOES = [
  TetrominoCell.I,
  TetrominoCell.J,
  TetrominoCell.L,
  TetrominoCell.O,
  TetrominoCell.S,
  TetrominoCell.T,
  TetrominoCell.Z
] as const

const BASE_SHAPES: Readonly<Record<TetrominoCell, Shape>> = {
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

export const SHAPES: Readonly<
  Record<Rotation, Readonly<Record<TetrominoCell, Shape>>>
> = {
  0: BASE_SHAPES,
  1: R.map((s: Shape) => rotate90(s), BASE_SHAPES),
  2: R.map((s: Shape) => rotate180(s), BASE_SHAPES),
  3: R.map((s: Shape) => rotate270(s), BASE_SHAPES)
}

export const KEY_TO_ACTION: Readonly<Partial<Record<string, Action>>> = {
  a: Action.LEFT,
  ArrowLeft: Action.LEFT,
  d: Action.RIGHT,
  ArrowRight: Action.RIGHT,
  s: Action.DOWN,
  ArrowDown: Action.DOWN,
  ' ': Action.JUMP,
  r: Action.ROTATE,
  ArrowUp: Action.ROTATE
}

export const LINES_CLEARED_TO_SCORE: Readonly<Partial<Record<number, Score>>> =
  {
    1: 40,
    2: 100,
    3: 300,
    4: 1200
  }

const countCells = (shape: Shape): Score =>
  shape.flat().filter((cell) => cell === 1).length

export const INSTANT_DROP_SCORE: Readonly<Record<TetrominoCell, Score>> =
  R.map(countCells, BASE_SHAPES)
