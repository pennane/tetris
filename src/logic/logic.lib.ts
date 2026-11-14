import * as R from 'ramda'
import { asLongAs, isNonEmpty } from '../util/fp'
import { cellAt, overlay } from '../util/matrix'
import { shuffle, type Seed, type WithSeed } from '../util/random'
import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  DEFAULT_SPEED,
  INSTANT_DROP_SCORE,
  LINES_CLEARED_PER_LEVEL,
  LINES_CLEARED_TO_SCORE,
  MAX_LEVEL,
  MAX_SPEED,
  MIN_LEVEL,
  SHAPES,
  SPAWN_COLUMN,
  SPEED_INCREASE_PER_LEVEL,
  TETROMINOES
} from './logic.constants'
import { at } from './logic.lens'
import { EMPTY_CELL } from './logic.model'
import type {
  Board,
  Cell,
  Level,
  LinesCleared,
  Piece,
  RenderBoard,
  RenderCell,
  Rotation,
  Score,
  Sequence,
  Shape,
  Speed,
  State,
  StatePredicate,
  StateTransformation,
  TetrominoCell
} from './logic.model'

export const shapeOf = (piece: Piece): Shape =>
  SHAPES[piece.rotation][piece.type]

export const linesClearedToLevel = (linesCleared: LinesCleared): Level =>
  Math.min(
    Math.floor(linesCleared / LINES_CLEARED_PER_LEVEL) + MIN_LEVEL,
    MAX_LEVEL
  )

export const levelToSpeed = (level: Level): Speed =>
  Math.round(
    Math.max(DEFAULT_SPEED - level * SPEED_INCREASE_PER_LEVEL, MAX_SPEED)
  )

export const levelOf = (state: State): Level =>
  linesClearedToLevel(at.linesCleared.view(state))

export const speedOf = (state: State): Speed => levelToSpeed(levelOf(state))

export const fits = (board: Board, piece: Piece): boolean =>
  shapeOf(piece).every((row, y) =>
    row.every(
      (solid, x) =>
        !solid || cellAt(board, piece.row + y, piece.col + x) === EMPTY_CELL
    )
  )

export const isValidState: StatePredicate = (state) =>
  fits(at.board.view(state), at.piece.view(state))

export const isFailState: StatePredicate = (state) =>
  at.board.view(state)[0]?.some((cell) => cell !== EMPTY_CELL) ?? false

const nextRotation = (r: Rotation): Rotation => ((r + 1) % 4) as Rotation

export const rotate = at.pieceRotation.over(nextRotation)
export const moveDown = at.pieceRow.over(R.inc)
export const moveLeft = at.pieceCol.over(R.dec)
export const moveRight = at.pieceCol.over(R.inc)

export const shouldPlaceDown: StatePredicate = R.complement(
  R.pipe(moveDown, isValidState)
)

export const dropToBottom: StateTransformation = asLongAs(
  isValidState,
  moveDown
)

const addDropScore: StateTransformation = (state) =>
  at.score.over(R.add(INSTANT_DROP_SCORE[at.pieceType.view(state)]))(state)

const lockOnNextTick = at.nextFall.set(1)

export const instantDrop: StateTransformation = R.pipe(
  lockOnNextTick,
  dropToBottom,
  addDropScore
)

export const mergePiece = (board: Board, piece: Piece): Board =>
  overlay(board, shapeOf(piece), piece.row, piece.col, (cell, solid) =>
    solid ? piece.type : cell
  )

export const renderBoard = (state: State): RenderBoard => {
  const piece = at.piece.view(state)
  const ghost = at.piece.view(dropToBottom(state))
  const withGhost = overlay(
    at.board.view(state),
    shapeOf(ghost),
    ghost.row,
    ghost.col,
    (cell, solid): RenderCell => (solid ? { ghostOf: ghost.type } : cell)
  )
  return overlay(withGhost, shapeOf(piece), piece.row, piece.col, (cell, solid) =>
    solid ? piece.type : cell
  )
}

export const createEmptyRow = (): readonly Cell[] =>
  R.repeat<Cell>(EMPTY_CELL, BOARD_WIDTH)

export const createEmptyBoard = (): Board =>
  R.times(createEmptyRow, BOARD_HEIGHT)

export const clearFullRows = (
  board: Board
): { board: Board; cleared: number } => {
  const kept = board.filter((row) => row.includes(EMPTY_CELL))
  const cleared = board.length - kept.length
  return { board: [...R.times(createEmptyRow, cleared), ...kept], cleared }
}

export const lineClearScore = (cleared: number, level: Level): Score =>
  (LINES_CLEARED_TO_SCORE[cleared] ?? 0) * level

export const spawn = (type: TetrominoCell): Piece => ({
  type,
  col: SPAWN_COLUMN,
  row: 0,
  rotation: 0
})

export const createSequence = (seed: Seed): WithSeed<Sequence> => {
  const { value: bag, seed: next } = shuffle(TETROMINOES, seed)
  return { value: isNonEmpty(bag) ? bag : TETROMINOES, seed: next }
}

const refill = (state: State): State => {
  const { value, seed } = createSequence(at.seed.view(state))
  return R.pipe(at.sequence.set(value), at.seed.set(seed))(state)
}

export const spawnNext: StateTransformation = (state) => {
  const [head, ...tail] = at.sequence.view(state)
  const spawned = at.piece.set(spawn(head))(state)
  return isNonEmpty(tail) ? at.sequence.set(tail)(spawned) : refill(spawned)
}

export const createInitialState = (seed: Seed): State => {
  const { value: sequence, seed: next } = createSequence(seed)
  return spawnNext({
    board: createEmptyBoard(),
    piece: spawn(sequence[0]),
    sequence,
    nextFall: levelToSpeed(MIN_LEVEL),
    score: 0,
    linesCleared: 0,
    seed: next
  })
}
