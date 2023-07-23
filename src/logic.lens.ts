import * as R from 'ramda'
import {
  State,
  Row,
  Rotation,
  Column,
  Matrix,
  Board,
  Score,
  TetrominoCell
} from './model'
import { TETRONIMO_MATRICES } from './constants'
import { Lens } from 'ramda'

const tetronimoLens = R.lensIndex<State, 1>(1)
export const viewTetronimo = R.view(tetronimoLens)
export const overTetronimo = R.over(tetronimoLens)
export const setTetronimo = R.set(tetronimoLens)

const tetronimoTypeLens = R.lensPath<State, TetrominoCell>([1, 0])
export const viewTetronimoType = R.view(tetronimoTypeLens)
export const overTetronimoType = R.over(tetronimoTypeLens)
export const setTetronimoType = R.set(tetronimoTypeLens)

const tetronimoRowLens = R.lensPath<State, Row>([1, 2])
export const viewTetronimoRow = R.view(tetronimoRowLens)
export const overTetronimoRow = R.over(tetronimoRowLens)
export const setTetronimoRow = R.set(tetronimoRowLens)

const tetronimoColumnLens = R.lensPath<State, Column>([1, 1])
export const viewTetronimoColumn = R.view(tetronimoColumnLens)
export const overTetronimoColumn = R.over(tetronimoColumnLens)
export const setTetronimoColumn = R.set(tetronimoColumnLens)

export const viewTetronimoMatrix = (state: State): Matrix => {
  const tetronimo = viewTetronimo(state)
  return TETRONIMO_MATRICES[tetronimo[3]][tetronimo[0]]
}

const nextFallLens = R.lensIndex<State, 2>(2)
export const viewNextFall = R.view(nextFallLens)
export const overNextFall = R.over(nextFallLens)
export const setNextFall = R.set(nextFallLens)

const boardLens = R.lensIndex<State, 0>(0)
export const viewBoard = R.view(boardLens)
export const overBoard = R.over(boardLens)
export const setBoard = R.set(boardLens)

const rotationLens = R.lensPath<State, Rotation>([1, 3])
export const viewRotation = R.view(rotationLens)
export const overRotation = R.over(rotationLens)
export const setRotation = R.set(rotationLens)

const sequenceLens = R.lensIndex<State, 3>(3)
export const viewSequence = R.view(sequenceLens)
export const overSequence = R.over(sequenceLens)
export const setSequence = R.set(sequenceLens)

const speedLens = R.lensIndex<State, 4>(4)
export const viewSpeed = R.view(speedLens)
export const overSpeed = R.over(speedLens)
export const setSpeed = R.set(speedLens)

const scoreLens = R.lensIndex<State, 5>(5)
export const viewScore = R.view(scoreLens)
export const overScore = R.over(scoreLens)
export const setSScore = R.set(scoreLens)

const overAandB =
  <A>(a: Lens<State, A>) =>
  <B>(b: Lens<State, B>) =>
  (f: (a: A, b: B) => [a: A, b: B]) =>
  (state: State) => {
    const aInitial = R.view(a, state)
    const bInitial = R.view(b, state)
    const [aAfter, bAfter] = f(aInitial, bInitial)
    return R.pipe(R.set(a, aAfter), R.set(b, bAfter))(state)
  }

const overScoreAnd = overAandB(scoreLens)
export const overScoreAndBoard = overScoreAnd(boardLens)
