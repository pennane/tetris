import * as R from 'ramda'
import {
  State,
  Row,
  Rotation,
  Column,
  Matrix,
  TetrominoCell,
  LinesCleared
} from './logic.model'
import {
  LINES_CLEARED_PER_LEVEL,
  MAX_LEVEL,
  MIN_LEVEL,
  TETRONIMO_MATRICES
} from './logic.constants'
import { Lens } from 'ramda'

const tetronimoLens = R.lensProp<State, 'tetronimo'>('tetronimo')
export const viewTetronimo = R.view(tetronimoLens)
export const overTetronimo = R.over(tetronimoLens)
export const setTetronimo = R.set(tetronimoLens)

const tetronimoTypeLens = R.lensPath<State, TetrominoCell>(['tetronimo', 0])
export const viewTetronimoType = R.view(tetronimoTypeLens)
export const overTetronimoType = R.over(tetronimoTypeLens)
export const setTetronimoType = R.set(tetronimoTypeLens)

const tetronimoRowLens = R.lensPath<State, Row>(['tetronimo', 2])
export const viewTetronimoRow = R.view(tetronimoRowLens)
export const overTetronimoRow = R.over(tetronimoRowLens)
export const setTetronimoRow = R.set(tetronimoRowLens)

const tetronimoColumnLens = R.lensPath<State, Column>(['tetronimo', 1])
export const viewTetronimoColumn = R.view(tetronimoColumnLens)
export const overTetronimoColumn = R.over(tetronimoColumnLens)
export const setTetronimoColumn = R.set(tetronimoColumnLens)

const rotationLens = R.lensPath<State, Rotation>(['tetronimo', 3])
export const viewRotation = R.view(rotationLens)
export const overRotation = R.over(rotationLens)
export const setRotation = R.set(rotationLens)

export const viewTetronimoMatrix = (state: State): Matrix => {
  const tetronimo = viewTetronimo(state)
  return TETRONIMO_MATRICES[tetronimo[3]][tetronimo[0]]
}

const nextFallLens = R.lensProp<State, 'nextFall'>('nextFall')
export const viewNextFall = R.view(nextFallLens)
export const overNextFall = R.over(nextFallLens)
export const setNextFall = R.set(nextFallLens)

const boardLens = R.lensProp<State, 'board'>('board')
export const viewBoard = R.view(boardLens)
export const overBoard = R.over(boardLens)
export const setBoard = R.set(boardLens)

const sequenceLens = R.lensProp<State, 'sequence'>('sequence')
export const viewSequence = R.view(sequenceLens)
export const overSequence = R.over(sequenceLens)
export const setSequence = R.set(sequenceLens)

const speedLens = R.lensProp<State, 'speed'>('speed')
export const viewSpeed = R.view(speedLens)
export const overSpeed = R.over(speedLens)
export const setSpeed = R.set(speedLens)

const scoreLens = R.lensProp<State, 'score'>('score')
export const viewScore = R.view(scoreLens)
export const overScore = R.over(scoreLens)
export const setSScore = R.set(scoreLens)

const linesClearedLens = R.lensProp<State, 'linesCleared'>('linesCleared')
export const viewLinesCleared = R.view(linesClearedLens)
export const overLinesCleared = R.over(linesClearedLens)
export const setLinesCleared = R.set(linesClearedLens)

const timestampLens = R.lensProp<State, 'timestamp'>('timestamp')
export const viewTimestamp = R.view(timestampLens)
export const overTimestamp = R.over(timestampLens)
export const setTimestamp = R.set(timestampLens)

const lastExecutedLens = R.lensProp<State, 'lastExecuted'>('lastExecuted')
export const viewLastExecuted = R.view(lastExecutedLens)
export const overLastExecuted = R.over(lastExecutedLens)
export const setLastExecuted = R.set(lastExecutedLens)

export const linesClearedToLevel = (linesCleared: LinesCleared) =>
  Math.min(
    Math.floor(linesCleared / LINES_CLEARED_PER_LEVEL) + MIN_LEVEL,
    MAX_LEVEL
  )
export const viewLevel = R.pipe(viewLinesCleared, linesClearedToLevel)

const overAandBandC =
  <A>(a: Lens<State, A>) =>
  <B>(b: Lens<State, B>) =>
  <C>(c: Lens<State, C>) =>
  (f: (a: A, b: B, c: C) => [a: A, b: B, c: C]) =>
  (state: State) => {
    const aInitial = R.view(a, state)
    const bInitial = R.view(b, state)
    const cInitial = R.view(c, state)
    const [aAfter, bAfter, cAfter] = f(aInitial, bInitial, cInitial)
    return R.pipe(R.set(a, aAfter), R.set(b, bAfter), R.set(c, cAfter))(state)
  }

const overScoreAnd = overAandBandC(scoreLens)
const overScoreAndBoard = overScoreAnd(boardLens)
export const overScoreAndBoardAndLinesCleared =
  overScoreAndBoard(linesClearedLens)
