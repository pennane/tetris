import * as D from '../util/decode'
import { isNonEmpty } from '../util/fp'
import { BOARD_HEIGHT, BOARD_WIDTH, TETROMINOES } from './logic.constants'
import { FRESH_LOCK, fits } from './logic.lib'
import { EMPTY_CELL } from './logic.model'
import type { Board, Piece, State, TetrominoCell } from './logic.model'

export const SAVE_STORAGE_KEY = 'persisted-game-state'
const SAVE_VERSION = 3
const UINT32_RANGE = 2 ** 32

const tetromino = D.oneOf(TETROMINOES)
const cell = D.oneOf([EMPTY_CELL, ...TETROMINOES])
const row = D.refine(D.arrayOf(cell), D.hasLength(BOARD_WIDTH))
const board = D.refine(D.arrayOf(row), D.hasLength(BOARD_HEIGHT))
const sequence = D.refine(D.arrayOf(tetromino), isNonEmpty<TetrominoCell>)
const seed = D.refine(D.count, (n) => n < UINT32_RANGE)

const piece = D.struct({
  type: tetromino,
  col: D.int,
  row: D.int,
  rotation: D.oneOf([0, 1, 2, 3])
})

const save = D.struct({
  version: D.literal(SAVE_VERSION),
  board,
  piece,
  sequence,
  nextFall: D.count,
  score: D.count,
  linesCleared: D.count,
  seed
})

export type Save = NonNullable<ReturnType<typeof save>>

export const toSave = ({ lock: _, ...state }: State): Save => ({
  version: SAVE_VERSION,
  ...state
})

const pieceFits = (s: { board: Board; piece: Piece }) => fits(s.board, s.piece)

const toState = ({ version: _, ...state }: Save): State => ({
  ...state,
  lock: FRESH_LOCK
})

export const fromSave = D.map(toState)(D.refine(save, pieceFits))
