import { ACTION_TO_TRANSFORMATION, LINES_CLEARED_TO_SCORE } from './constants'
import {
  viewBoard,
  viewTetronimo,
  setBoard,
  viewNextFall,
  viewSequence,
  setTetronimo,
  setSequence,
  overScoreAndBoard
} from './logic.lens'
import {
  createInitialState,
  decreaseMoveTimer,
  createEmptyRow,
  createSequence,
  isFailState,
  isValidState,
  mergeTetronimoToBoard,
  moveDown,
  shouldPlaceDown
} from './logic.lib'
import { EMPTY_CELL, State, Action, StateTransformation } from './model'
import './style.css'
import * as R from 'ramda'

const placeDown: StateTransformation = (state) => {
  const mergedBoard = R.converge(mergeTetronimoToBoard, [
    viewBoard,
    viewTetronimo
  ])(state)

  return setBoard(mergedBoard, state)
}

const clearFullRows = overScoreAndBoard((score, board) => {
  const filtered = board.filter((row) =>
    row.some((cell) => cell === EMPTY_CELL)
  )

  const amountCleared = board.length - filtered.length
  const additionalScore = LINES_CLEARED_TO_SCORE[amountCleared] ?? 0

  return [
    score + additionalScore,
    R.repeat(createEmptyRow(), amountCleared).concat(filtered)
  ]
})

const nextTetronimo: StateTransformation = (state) => {
  const [head, ...tail] = viewSequence(state)
  return R.pipe(
    setTetronimo([head, 4, 0, 0]),
    setSequence(R.isEmpty(tail) ? createSequence() : tail)
  )(state)
}

const checkGameOver = R.when(isFailState, createInitialState)

const handleFall = R.when(
  R.pipe(viewNextFall, R.equals(0)),
  R.ifElse(
    shouldPlaceDown,
    R.pipe(placeDown, nextTetronimo, clearFullRows, checkGameOver),
    moveDown
  )
)

const handleInput = (state: State, action: Action | null): State => {
  if (!action) return state
  const actionFunction = ACTION_TO_TRANSFORMATION[action]
  if (!actionFunction) return state
  const modifiedState = actionFunction(state)
  if (!isValidState(modifiedState)) return state
  return modifiedState
}

export const nextState = R.pipe(handleInput, decreaseMoveTimer, handleFall)
