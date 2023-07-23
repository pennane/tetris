import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  DEFAULT_SCORE,
  DEFAULT_SPEED,
  TETRONIMO_MATRICES,
  TETRONIMO_TO_INSTANT_DROP_SCORE
} from './constants'
import {
  Board,
  Cell,
  EMPTY_CELL,
  Rotation,
  Sequence,
  State,
  StatePredicate,
  StateTransformation,
  TetrominoCell,
  Tetronimo
} from './model'
import * as R from 'ramda'
import { mergeMatrices, shuffle, randomInt, asLongAs } from './util'
import {
  overNextFall,
  overRotation,
  overScore,
  overTetronimoColumn,
  overTetronimoRow,
  setNextFall,
  viewBoard,
  viewNextFall,
  viewSequence,
  viewSpeed,
  viewTetronimo,
  viewTetronimoColumn,
  viewTetronimoMatrix,
  viewTetronimoRow,
  viewTetronimoType
} from './logic.lens'

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
    DEFAULT_SCORE
  ]
}

export const createEmptyRow = (): Cell[] => R.repeat(EMPTY_CELL, BOARD_WIDTH)

export const createEmptyBoard = (): Board =>
  R.times(() => createEmptyRow(), BOARD_HEIGHT)

export const createSequence = (): Sequence =>
  shuffle(Object.values(TetrominoCell))

export const createRotation = (): Rotation => randomInt(0, 3) as Rotation
