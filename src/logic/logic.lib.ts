import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  DEFAULT_CLEARED_LINES,
  DEFAULT_SCORE,
  DEFAULT_SPEED,
  MAX_SPEED,
  SPEED_INCREASE_PER_LEVEL,
  TETRONIMO_MATRICES,
  TETRONIMO_TO_INSTANT_DROP_SCORE
} from './logic.constants'
import {
  Board,
  Cell,
  EMPTY_CELL,
  Level,
  Rotation,
  Sequence,
  Speed,
  State,
  StatePredicate,
  StateTransformation,
  TetrominoCell,
  Tetronimo
} from './logic.model'
import * as R from 'ramda'
import {
  overNextFall,
  overRotation,
  overScore,
  overTetronimoColumn,
  overTetronimoRow,
  setNextFall,
  viewBoard,
  viewSpeed,
  viewTetronimoColumn,
  viewTetronimoMatrix,
  viewTetronimoRow,
  viewTetronimoType
} from './logic.lens'
import { asLongAs } from '../util/fp'
import { mergeMatrices } from '../util/matrix'
import { shuffle, randomInt } from '../util/random'

export const isFailState = R.pipe(
  viewBoard,
  R.head,
  R.any(R.pipe(R.equals(EMPTY_CELL), R.not))
)

export const isValidState: StatePredicate = (state) => {
  const board = viewBoard(state)
  const tetronimoColumn = viewTetronimoColumn(state)
  const tetronimoRow = viewTetronimoRow(state)
  const matrix = viewTetronimoMatrix(state)

  for (let i = 0; i < matrix.length; i++) {
    for (let j = 0; j < matrix[0].length; j++) {
      if (!matrix[i]?.[j]) continue

      const cell = board?.[tetronimoRow + i]?.[tetronimoColumn + j]
      if (cell !== EMPTY_CELL) {
        return false
      }
    }
  }

  return true
}

export const shouldPlaceDown: StatePredicate = (state) => {
  const board = viewBoard(state)
  const row = viewTetronimoRow(state)
  const col = viewTetronimoColumn(state)
  const matrix = viewTetronimoMatrix(state)

  for (let y = row; y < row + matrix.length; y++) {
    for (let x = col; x < col + matrix.length; x++) {
      const isCurrentSolid = R.path([y - row, x - col], matrix)
      if (!isCurrentSolid) continue

      const nextInMatrix = R.path([y + 1, x], board)

      if (nextInMatrix !== EMPTY_CELL) {
        return true
      }
    }
  }
  return false
}

const toRotation = (n: number): Rotation => (n % 4) as Rotation

export const rotate = overRotation(R.pipe(R.inc, toRotation))
export const moveDown = overTetronimoRow(R.inc)
export const moveLeft = overTetronimoColumn(R.dec)
export const moveRight = overTetronimoColumn(R.inc)
export const instantDrop = R.pipe(
  setNextFall(1),
  asLongAs(isValidState, moveDown),
  (state: State) => {
    const tetronimo = viewTetronimoType(state)
    return overScore(R.add(TETRONIMO_TO_INSTANT_DROP_SCORE[tetronimo]), state)
  }
)

export const decreaseMoveTimer: StateTransformation = (state) => {
  const speed = viewSpeed(state)
  return overNextFall(R.ifElse(R.gt(R.__, 0), R.dec, R.always(speed)), state)
}

export const levelToSpeed = (levels: Level): Speed => {
  const speed = Math.round(
    Math.max(DEFAULT_SPEED - levels * SPEED_INCREASE_PER_LEVEL, MAX_SPEED)
  )
  return speed
}

export const mergeTetronimoToBoard = (
  board: Board,
  tetronimo: Tetronimo
): Board => {
  const [x, y] = [tetronimo[1], tetronimo[2]]
  const matrix = TETRONIMO_MATRICES[tetronimo[3]][tetronimo[0]]

  return mergeMatrices(board, matrix, x, y, (boardItem, tetronimoItem) =>
    tetronimoItem ? tetronimo[0] : boardItem
  )
}

export const createInitialState = (): State => {
  const [tetronimo, ...tail] = createSequence()

  return [
    createEmptyBoard(),
    [tetronimo, 4, 0, createRotation()],
    DEFAULT_SPEED,
    tail,
    DEFAULT_SPEED,
    DEFAULT_SCORE,
    DEFAULT_CLEARED_LINES
  ]
}

export const createEmptyRow = (): Cell[] => R.repeat(EMPTY_CELL, BOARD_WIDTH)

export const createEmptyBoard = (): Board =>
  R.times(() => createEmptyRow(), BOARD_HEIGHT)

export const createSequence = (): Sequence =>
  shuffle(Object.values(TetrominoCell))

export const createRotation = (): Rotation => randomInt(0, 3) as Rotation
