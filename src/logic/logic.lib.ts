import * as R from 'ramda'
import { asLongAs, isNonEmpty } from '../util/fp'
import { cellAt, overlay, type Matrix } from '../util/matrix'
import { shuffle, type Seed } from '../util/random'
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
  GhostCell,
  Level,
  LinesCleared,
  Piece,
  Rotation,
  Score,
  State,
  TetrominoCell
} from './logic.model'

export const shapeOf = (piece: Piece) => SHAPES[piece.rotation][piece.type]

export const linesClearedToLevel = (linesCleared: LinesCleared) =>
  Math.min(
    Math.floor(linesCleared / LINES_CLEARED_PER_LEVEL) + MIN_LEVEL,
    MAX_LEVEL
  )

export const levelToSpeed = (level: Level) =>
  Math.round(
    Math.max(DEFAULT_SPEED - level * SPEED_INCREASE_PER_LEVEL, MAX_SPEED)
  )

export const levelOf = R.pipe(at.linesCleared.view, linesClearedToLevel)
export const speedOf = R.pipe(levelOf, levelToSpeed)

const isLocked = R.complement(R.equals<Cell>(EMPTY_CELL))
const hasGap = R.includes<Cell>(EMPTY_CELL)

export const fits = (board: Board, piece: Piece) =>
  shapeOf(piece).every((row, y) =>
    row.every(
      (solid, x) =>
        !solid || cellAt(board, piece.row + y, piece.col + x) === EMPTY_CELL
    )
  )

export const isValidState = (state: State) =>
  fits(at.board.view(state), at.piece.view(state))

export const isFailState = (state: State) =>
  at.board.view(state)[0]?.some(isLocked) ?? false

const nextRotation = (r: Rotation) => ((r + 1) % 4) as Rotation

export const rotate = at.pieceRotation.over(nextRotation)
export const moveDown = at.pieceRow.over(R.inc)
export const moveLeft = at.pieceCol.over(R.dec)
export const moveRight = at.pieceCol.over(R.inc)

export const shouldPlaceDown = R.complement(R.pipe(moveDown, isValidState))

export const dropToBottom = asLongAs(isValidState, moveDown)

export const addScore = (points: Score) => at.score.over(R.add(points))

const dropScoreOf = R.pipe(at.pieceType.view, R.prop(R.__, INSTANT_DROP_SCORE))

const addDropScore = (state: State) => addScore(dropScoreOf(state))(state)

const lockOnNextTick = at.nextFall.set(1)

export const instantDrop = R.pipe(lockOnNextTick, dropToBottom, addDropScore)

const overlayPiece = <A, C>(
  board: Matrix<A>,
  piece: Piece,
  paint: (piece: Piece) => C
) =>
  overlay(board, shapeOf(piece), piece.row, piece.col, (cell, solid) =>
    solid ? paint(piece) : cell
  )

const typeOf = (piece: Piece) => piece.type
const ghostOf = (piece: Piece): GhostCell => ({ ghostOf: piece.type })

export const mergePiece = (board: Board, piece: Piece) =>
  overlayPiece(board, piece, typeOf)

const ghostPieceOf = R.pipe(dropToBottom, at.piece.view)

export const renderBoard = (state: State) =>
  overlayPiece(
    overlayPiece(at.board.view(state), ghostPieceOf(state), ghostOf),
    at.piece.view(state),
    typeOf
  )

export const createEmptyRow = () => R.repeat<Cell>(EMPTY_CELL, BOARD_WIDTH)

export const createEmptyBoard = () => R.times(createEmptyRow, BOARD_HEIGHT)

export const clearFullRows = (board: Board) => {
  const kept = board.filter(hasGap)
  const cleared = board.length - kept.length
  return { board: [...R.times(createEmptyRow, cleared), ...kept], cleared }
}

export const lineClearScore = (cleared: number, level: Level) =>
  (LINES_CLEARED_TO_SCORE[cleared] ?? 0) * level

export const spawn = (type: TetrominoCell): Piece => ({
  type,
  col: SPAWN_COLUMN,
  row: 0,
  rotation: 0
})

export const createSequence = (seed: Seed) => {
  const { value: bag, seed: next } = shuffle(TETROMINOES, seed)
  return { value: isNonEmpty(bag) ? bag : TETROMINOES, seed: next }
}

const refill = (state: State) => {
  const { value, seed } = createSequence(at.seed.view(state))
  return R.pipe(at.sequence.set(value), at.seed.set(seed))(state)
}

export const spawnNext = (state: State) => {
  const [head, ...tail] = at.sequence.view(state)
  return R.pipe(
    at.piece.set(spawn(head)),
    isNonEmpty(tail) ? at.sequence.set(tail) : refill
  )(state)
}

export const createInitialState = (seed: Seed) => {
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
