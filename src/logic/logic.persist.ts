import { isNonEmpty } from '../util/fp'
import { BOARD_HEIGHT, BOARD_WIDTH, TETROMINOES } from './logic.constants'
import { fits } from './logic.lib'
import { EMPTY_CELL } from './logic.model'
import type {
  Board,
  Cell,
  Piece,
  Rotation,
  Sequence,
  State,
  TetrominoCell
} from './logic.model'

export const SAVE_STORAGE_KEY = 'persisted-game-state'
const SAVE_VERSION = 2

/** Persisted shape: sources of truth only. Bump SAVE_VERSION on change. */
export type Save = Readonly<{
  version: typeof SAVE_VERSION
  board: Board
  piece: Piece
  sequence: Sequence
  nextFall: number
  score: number
  linesCleared: number
}>

export const toSave = (state: State): Save => ({
  version: SAVE_VERSION,
  board: state.board,
  piece: state.piece,
  sequence: state.sequence,
  nextFall: state.nextFall,
  score: state.score,
  linesCleared: state.linesCleared
})

type Decoder<T> = (v: unknown) => T | null

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

const count: Decoder<number> = (v) =>
  typeof v === 'number' && Number.isInteger(v) && v >= 0 ? v : null

const int: Decoder<number> = (v) =>
  typeof v === 'number' && Number.isInteger(v) ? v : null

const tetromino: Decoder<TetrominoCell> = (v) =>
  TETROMINOES.find((t) => t === v) ?? null

const cell: Decoder<Cell> = (v) => (v === EMPTY_CELL ? EMPTY_CELL : tetromino(v))

const rotation: Decoder<Rotation> = (v) =>
  v === 0 || v === 1 || v === 2 || v === 3 ? v : null

const arrayOf =
  <T>(item: Decoder<T>, length?: number): Decoder<T[]> =>
  (v) => {
    if (!Array.isArray(v)) return null
    if (length !== undefined && v.length !== length) return null
    const out: T[] = []
    for (const x of v) {
      const decoded = item(x)
      if (decoded === null) return null
      out.push(decoded)
    }
    return out
  }

const board: Decoder<Board> = arrayOf(
  arrayOf(cell, BOARD_WIDTH),
  BOARD_HEIGHT
)

const sequence: Decoder<Sequence> = (v) => {
  const xs = arrayOf(tetromino)(v)
  return xs && isNonEmpty(xs) ? xs : null
}

const piece: Decoder<Piece> = (v) => {
  if (!isRecord(v)) return null
  const type = tetromino(v['type'])
  const col = int(v['col'])
  const row = int(v['row'])
  const rot = rotation(v['rotation'])
  if (type === null || col === null || row === null || rot === null)
    return null
  return { type, col, row, rotation: rot }
}

/** Returns null for anything that isn't a playable current-version save. */
export const fromSave: Decoder<State> = (v) => {
  if (!isRecord(v) || v['version'] !== SAVE_VERSION) return null
  const b = board(v['board'])
  const p = piece(v['piece'])
  const s = sequence(v['sequence'])
  const nextFall = count(v['nextFall'])
  const score = count(v['score'])
  const linesCleared = count(v['linesCleared'])
  if (b === null || p === null || s === null) return null
  if (nextFall === null || score === null || linesCleared === null) return null
  if (!fits(b, p)) return null
  return {
    board: b,
    piece: p,
    sequence: s,
    nextFall,
    score,
    linesCleared,
    lastTick: 0
  }
}
