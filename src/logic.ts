import { ACTION_TO_TRANSFORMATION } from './constants'
import {
  viewBoard,
  viewTetronimo,
  setBoard,
  viewNextFall,
  viewSequence,
  setTetronimo,
  setSequence,
  overBoard
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

const clearFullRows = overBoard((board) => {
  const filtered = board.filter((row) =>
    row.some((cell) => cell === EMPTY_CELL)
  )
  return R.repeat(createEmptyRow(), board.length - filtered.length).concat(
    filtered
  )
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
